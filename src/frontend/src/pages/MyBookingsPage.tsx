import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import { Calendar, Car, Clock, Loader2, LogIn, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { Booking } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCancelBooking, useMyBookings } from "../hooks/useQueries";

function formatTime(ns: bigint) {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateBigInt: bigint) {
  const ms = Number(dateBigInt);
  return new Date(ms).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const SKELETON_KEYS = ["s1", "s2", "s3", "s4"];

export default function MyBookingsPage() {
  const { identity, login } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const userId = identity?.getPrincipal() as Principal | undefined;

  const { data: bookings, isLoading } = useMyBookings(userId);
  const cancelBooking = useCancelBooking();

  async function handleCancel(booking: Booking) {
    try {
      await cancelBooking.mutateAsync(booking.userId);
      toast.success("Booking cancelled successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cancellation failed");
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-20 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <Car className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display font-700 text-2xl text-foreground mb-2">
          Sign in to view bookings
        </h2>
        <p className="text-muted-foreground mb-6 max-w-xs">
          Please sign in to see your parking reservations.
        </p>
        <Button data-ocid="bookings.login.button" onClick={login}>
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display font-700 text-3xl text-foreground mb-1">
          My Bookings
        </h1>
        <p className="text-muted-foreground mb-8">
          Your parking reservations for the past and upcoming 90 days.
        </p>

        {isLoading ? (
          <div data-ocid="bookings.loading_state" className="space-y-3">
            {SKELETON_KEYS.map((k) => (
              <Skeleton key={k} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <div
            data-ocid="bookings.empty_state"
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground mb-1">
              No bookings yet
            </p>
            <p className="text-sm text-muted-foreground">
              Your reservations will appear here once you book a spot.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking, i) => (
              <motion.div
                key={`${booking.spotId}-${booking.startTime.toString()}`}
                data-ocid={`bookings.item.${i + 1}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-5 flex items-center gap-5 flex-wrap"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Spot</p>
                    <p className="font-semibold text-sm text-foreground">
                      {booking.spotId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-semibold text-sm text-foreground">
                      {formatDate(booking.date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-semibold text-sm text-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(booking.startTime)} –{" "}
                      {formatTime(booking.endTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vehicle</p>
                    <Badge variant="outline" className="capitalize text-xs">
                      {booking.vehicleType}
                    </Badge>
                  </div>
                </div>

                <Button
                  data-ocid={`bookings.delete_button.${i + 1}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancel(booking)}
                  disabled={cancelBooking.isPending}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                >
                  {cancelBooking.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span className="ml-1.5">Cancel</span>
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
