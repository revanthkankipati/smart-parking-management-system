import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Booking, ParkingSpot } from "../backend";
import type { VehicleType } from "../backend";
import { UserRole } from "../backend";
import { useActor } from "./useActor";

export function useSpotsByLevel(levelId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<ParkingSpot[]>({
    queryKey: ["spots", levelId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSpotsByLevelIncludingOccupied(levelId);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useAvailableSpots(levelId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<ParkingSpot[]>({
    queryKey: ["spots", "available", levelId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAvailableSpotsByLevel(levelId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyBookings(userId: Principal | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Booking[]>({
    queryKey: ["bookings", "mine", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return [];
      const now = BigInt(Date.now()) * BigInt(1_000_000);
      const past = now - BigInt(90) * BigInt(24) * BigInt(3_600_000_000_000);
      const future = now + BigInt(90) * BigInt(24) * BigInt(3_600_000_000_000);
      return actor.getUserBookingsRange(userId, past, future);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useAllBookings(spotId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Booking[]>({
    queryKey: ["bookings", "all", spotId],
    queryFn: async () => {
      if (!actor) return [];
      const now = BigInt(Date.now()) * BigInt(1_000_000);
      const past = now - BigInt(90) * BigInt(24) * BigInt(3_600_000_000_000);
      const future = now + BigInt(90) * BigInt(24) * BigInt(3_600_000_000_000);
      return actor.getAllBookingsBySpotAndTimeRange(spotId, past, future);
    },
    enabled: !!actor && !isFetching && !!spotId,
  });
}

export function useOccupancyStats(levelId: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["occupancy", levelId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSpotOccupancyLevelStats(levelId);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateBooking() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      spotId: string;
      userId: Principal;
      vehicleType: VehicleType;
      date: Date;
      startHour: number;
      endHour: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      const randomBytes = crypto.getRandomValues(new Uint8Array(29));
      const bookingId = Principal.fromUint8Array(randomBytes);
      const dateMs = params.date.setHours(0, 0, 0, 0);
      const startTime =
        BigInt(dateMs + params.startHour * 3600000) * BigInt(1_000_000);
      const endTime =
        BigInt(dateMs + params.endHour * 3600000) * BigInt(1_000_000);
      await actor.createBooking(bookingId, {
        spotId: params.spotId,
        userId: params.userId,
        vehicleType: params.vehicleType,
        date: BigInt(dateMs),
        startTime,
        endTime,
      });
      return bookingId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spots"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["occupancy"] });
    },
  });
}

export function useCancelBooking() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: Principal) => {
      if (!actor) throw new Error("Not connected");
      await actor.cancelBooking(bookingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["spots"] });
      queryClient.invalidateQueries({ queryKey: ["occupancy"] });
    },
  });
}

export function useToggleMaintenance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      spotId,
      currentStatus,
    }: { spotId: string; currentStatus: string }) => {
      if (!actor) throw new Error("Not connected");
      if (currentStatus === "maintenance") {
        await actor.setSpotToFree(spotId);
      } else {
        await actor.setSpotToUnavailable(spotId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spots"] });
      queryClient.invalidateQueries({ queryKey: ["occupancy"] });
    },
  });
}

export function useSeedParkingLot() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.seedParkingLot();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principalText,
      role,
    }: { principalText: string; role: string }) => {
      if (!actor) throw new Error("Not connected");
      const principal = Principal.fromText(principalText); // throws if invalid
      const roleVariant = role === "admin" ? UserRole.admin : UserRole.user;
      await actor.assignCallerUserRole(principal, roleVariant);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
    },
  });
}
