import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type BookingId = Principal;
export type UserId = Principal;
export type Time = bigint;
export type SpotId = string;
export interface ParkingSpot {
    id: SpotId;
    status: SpotStatus;
    vehicleType: VehicleType;
    spotNumber: bigint;
    level: LevelId;
}
export type LevelId = string;
export interface Booking {
    startTime: Time;
    vehicleType: VehicleType;
    endTime: Time;
    userId: UserId;
    date: bigint;
    spotId: SpotId;
}
export interface UserProfile {
    name: string;
}
export enum SpotStatus {
    occupied = "occupied",
    free = "free",
    maintenance = "maintenance"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VehicleType {
    ev = "ev",
    disabled = "disabled",
    standard = "standard"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelBooking(bookingId: BookingId): Promise<void>;
    createBooking(bookingId: BookingId, booking: Booking): Promise<void>;
    getAllBookingsBySpotAndTimeRange(spotId: SpotId, startTime: Time, endTime: Time): Promise<Array<Booking>>;
    getAllSpotsByLevelIncludingOccupied(levelId: LevelId): Promise<Array<ParkingSpot>>;
    getAvailableSpotsByLevel(levelId: LevelId): Promise<Array<ParkingSpot>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getSpotOccupancyLevelStats(levelId: LevelId): Promise<{
        totalSpots: bigint;
        occupiedSpots: bigint;
        availableSpots: bigint;
        spotsUnderMaintenance: bigint;
    }>;
    getUserBookingsRange(userId: UserId, startTime: Time, endTime: Time): Promise<Array<Booking>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    seedParkingLot(): Promise<void>;
    setSpotToFree(spotId: SpotId): Promise<void>;
    setSpotToOccupied(spotId: SpotId): Promise<void>;
    setSpotToUnavailable(spotId: SpotId): Promise<void>;
}
