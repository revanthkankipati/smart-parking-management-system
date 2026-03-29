import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Persistent state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type SpotId = Text;
  type LevelId = Text;
  type UserId = Principal;

  // Vehicle buisiness logic
  type BookingId = Principal;
  type VehicleType = { #standard; #ev; #disabled };
  type SpotStatus = { #free; #occupied; #maintenance };

  // Constants
  let levelIds : [LevelId] = ["L1", "L2", "L3"];
  let spotPrefix = "P";
  let spotsPerLevel = 48;

  // User Profile
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Persistent spot state
  public type ParkingSpot = {
    id : SpotId;
    level : LevelId;
    spotNumber : Nat;
    vehicleType : VehicleType;
    status : SpotStatus;
  };

  module ParkingSpot {
    public func compare(spot1 : ParkingSpot, spot2 : ParkingSpot) : Order.Order {
      Text.compare(spot1.id, spot2.id);
    };
  };

  let spots = Map.empty<SpotId, ParkingSpot>();
  var isParkingLotSeeded = false;

  // Booking state now includes user identification, spot and time details
  public type Booking = {
    userId : UserId;
    spotId : SpotId;
    date : Int; // ISO-8601 time representation
    startTime : Time.Time;
    endTime : Time.Time;
    vehicleType : VehicleType;
  };

  module Booking {
    public func compareByUserId(a : Booking, b : Booking) : Order.Order {
      Principal.compare(a.userId, b.userId);
    };

    public func compareByStartTime(a : Booking, b : Booking) : Order.Order {
      Int.compare(a.startTime, b.startTime);
    };
  };

  let bookings = Map.empty<BookingId, Booking>();

  // Hybrid Approach: In-memory cache updated on every booking change based on current time/day (best effort "real-time")
  var lastCacheUpdate : Time.Time = 0;
  var availableSpotsCache : ?[(SpotId, ParkingSpot)] = null;

  // Initialization of parking lot in persistent storage
  public shared ({ caller }) func seedParkingLot() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can seed the parking lot");
    };
    if (not isParkingLotSeeded) {
      for (level in levelIds.values()) {
        let newSpots = Array.tabulate(
          spotsPerLevel,
          func(i) {
            let spotId = level # spotPrefix # (i + 1).toText();
            (
              spotId,
              {
                id = spotId;
                level;
                spotNumber = i + 1;
                vehicleType = #standard;
                status = #free;
              },
            );
          },
        );
        newSpots.values().forEach(func((id, spot)) { spots.add(id, spot) });
      };
      isParkingLotSeeded := true;
    };
  };

  // Booking logic now fully includes user, spot, and time information
  public shared ({ caller }) func createBooking(bookingId : BookingId, booking : Booking) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create bookings");
    };
    switch (spots.get(booking.spotId)) {
      case (?spot) {
        switch (spot.status) {
          case (#occupied) { Runtime.trap("Spot already occupied") };
          case (#maintenance) { Runtime.trap("Spot under maintenance") };
          case (#free) {};
        };
        bookings.add(bookingId, booking);
        let createdSpot = {
          spot with
          status = #occupied;
        };
        spots.add(booking.spotId, createdSpot);
      };
      case (null) { Runtime.trap("Spot not found") };
    };
  };

  // Flexible booking cancellation with clear business logic
  public shared ({ caller }) func cancelBooking(bookingId : BookingId) : async () {
    switch (bookings.get(bookingId)) {
      case (?booking) {
        if (booking.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only owners or admins can cancel bookings");
        };
        bookings.remove(bookingId);
        switch (spots.get(booking.spotId)) {
          case (?spot) {
            let spotUpdate = {
              spot with
              status = #free;
            };
            spots.add(booking.spotId, spotUpdate);
          };
          case (null) {};
        };
      };
      case (null) { Runtime.trap("Booking not found") };
    };
  };

  public shared ({ caller }) func getUserBookingsRange(userId : UserId, startTime : Time.Time, endTime : Time.Time) : async [Booking] {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins and owner can access bookings");
    };
    bookings.values().toArray().filter(
      func(b) { b.userId == userId and b.startTime >= startTime and b.endTime <= endTime }
    ).sort(Booking.compareByStartTime);
  };

  public shared ({ caller }) func getAllBookingsBySpotAndTimeRange(spotId : SpotId, startTime : Time.Time, endTime : Time.Time) : async [Booking] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can access all bookings");
    };
    bookings.values().toArray().filter(
      func(b) { b.spotId == spotId and b.startTime >= startTime and b.endTime <= endTime }
    ).sort(Booking.compareByUserId);
  };

  public shared ({ caller }) func setSpotToUnavailable(spotId : SpotId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can set unavailability");
    };
    let spot = switch (spots.get(spotId)) {
      case (null) { Runtime.trap("Spot does not exist") };
      case (?spot) { spot };
    };
    let updatedSpot = {
      spot with
      status = #maintenance;
    };
    spots.add(spotId, updatedSpot);
  };

  public shared ({ caller }) func setSpotToOccupied(spotId : SpotId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can set spot state");
    };
    if (spots.get(spotId).isNull()) {
      Runtime.trap("Spot does not exist");
    };
    let spot = switch (spots.get(spotId)) {
      case (null) { Runtime.trap("Spot does not exist") };
      case (?spot) { spot };
    };
    let updatedSpot = {
      spot with
      status = #occupied;
    };
    spots.add(spotId, updatedSpot);
  };

  public shared ({ caller }) func setSpotToFree(spotId : SpotId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can set spot state");
    };
    if (spots.get(spotId).isNull()) {
      Runtime.trap("Spot does not exist!");
    };
    let spot = switch (spots.get(spotId)) {
      case (null) { Runtime.trap("Spot does not exist") };
      case (?spot) { spot };
    };
    let updatedSpot = {
      spot with
      status = #free;
    };
    spots.add(spotId, updatedSpot);
  };

  public query func getAvailableSpotsByLevel(levelId : LevelId) : async [ParkingSpot] {
    spots.values().toArray().filter(
      func(s) {
        s.level == levelId and (s.status == #free);
      }
    ).sort();
  };

  public query func getAllSpotsByLevelIncludingOccupied(levelId : LevelId) : async [ParkingSpot] {
    spots.values().toArray().filter(
      func(s) {
        s.level == levelId;
      }
    ).sort();
  };

  public query ({ caller }) func getSpotOccupancyLevelStats(levelId : LevelId) : async {
    totalSpots : Nat;
    availableSpots : Nat;
    occupiedSpots : Nat;
    spotsUnderMaintenance : Nat;
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can access full occupancy stats");
    };
    let totalSpots = spots.values().toList<ParkingSpot>().filter(
      func(s) { s.level == levelId }
    ).size();

    let availableSpots = spots.values().toList<ParkingSpot>().filter(
      func(s) { s.level == levelId and (s.status == #free) }
    ).size();

    let occupiedSpots = spots.values().toList<ParkingSpot>().filter(
      func(s) { s.level == levelId and (s.status == #occupied) }
    ).size();

    let spotsUnderMaintenance = spots.values().toList<ParkingSpot>().filter(
      func(s) { s.level == levelId and (s.status == #maintenance) }
    ).size();

    {
      totalSpots;
      availableSpots;
      occupiedSpots;
      spotsUnderMaintenance;
    };
  };
};
