import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, LogIn, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
import { VehicleType } from "../backend";
import type { ParkingSpot } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAvailableSpots, useCreateBooking } from "../hooks/useQueries";

const SPOT_SKELETON_KEYS = Array.from({ length: 32 }, (_, i) => `ss-${i}`);

const HOURS = Array.from({ length: 24 }, (_, i) => i);
function fmt(h: number) {
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:00 ${ampm}`;
}

interface BookSlotPageProps {
  onNavigate: (page: Page) => void;
}

export default function BookSlotPage({ onNavigate }: BookSlotPageProps) {
  const { identity, login } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const userId = identity?.getPrincipal();

  const [level, setLevel] = useState("L1");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startHour, setStartHour] = useState("8");
  const [endHour, setEndHour] = useState("10");
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    VehicleType.standard,
  );
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [searched, setSearched] = useState(false);

  const { data: availableSpots, isLoading, refetch } = useAvailableSpots(level);
  const createBooking = useCreateBooking();

  function handleSearch() {
    setSearched(true);
    setSelectedSpot(null);
    refetch();
  }

  async function handleBook() {
    if (!selectedSpot || !userId) return;
    const start = Number.parseInt(startHour);
    const end = Number.parseInt(endHour);
    if (end <= start) {
      toast.error("End time must be after start time");
      return;
    }
    try {
      await createBooking.mutateAsync({
        spotId: selectedSpot.id,
        userId,
        vehicleType,
        date: new Date(date),
        startHour: start,
        endHour: end,
      });
      toast.success(`Spot ${selectedSpot.spotNumber} on ${level} booked!`);
      setSelectedSpot(null);
      setSearched(false);
      onNavigate("bookings");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Booking failed");
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display font-700 text-3xl text-foreground mb-1">
          Book a Parking Slot
        </h1>
        <p className="text-muted-foreground mb-8">
          Select your preferences and reserve a spot in seconds.
        </p>

        {!isAuthenticated && (
          <div className="mb-6 flex items-center gap-4 p-4 rounded-xl border border-primary/30 bg-primary/5">
            <LogIn className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Sign in to complete your booking
              </p>
              <p className="text-xs text-muted-foreground">
                You can browse availability without signing in.
              </p>
            </div>
            <Button data-ocid="book.login.button" size="sm" onClick={login}>
              Sign In
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1 space-y-5">
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-foreground">Search Criteria</h2>

              <div className="space-y-2">
                <Label>Parking Level</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger data-ocid="book.level.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L1">Level 1 (Ground)</SelectItem>
                    <SelectItem value="L2">Level 2</SelectItem>
                    <SelectItem value="L3">Level 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  data-ocid="book.date.input"
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select value={startHour} onValueChange={setStartHour}>
                    <SelectTrigger data-ocid="book.start.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {fmt(h)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Select value={endHour} onValueChange={setEndHour}>
                    <SelectTrigger data-ocid="book.end.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {fmt(h)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <Select
                  value={vehicleType}
                  onValueChange={(v) => setVehicleType(v as VehicleType)}
                >
                  <SelectTrigger data-ocid="book.vehicle.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={VehicleType.standard}>
                      Standard
                    </SelectItem>
                    <SelectItem value={VehicleType.ev}>
                      Electric (EV)
                    </SelectItem>
                    <SelectItem value={VehicleType.disabled}>
                      Accessible
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                data-ocid="book.search.primary_button"
                className="w-full"
                onClick={handleSearch}
              >
                Check Availability
              </Button>
            </div>

            {/* Selected spot summary */}
            {selectedSpot && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-primary/40 rounded-xl p-5 space-y-3"
              >
                <h3 className="font-semibold text-foreground">Selected Spot</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Spot No.</p>
                    <p className="font-semibold">
                      {selectedSpot.spotNumber.toString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Level</p>
                    <p className="font-semibold">{selectedSpot.level}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Type</p>
                    <p className="font-semibold capitalize">
                      {selectedSpot.vehicleType}
                    </p>
                  </div>
                </div>
                <Button
                  data-ocid="book.submit_button"
                  className="w-full shadow-glow"
                  onClick={handleBook}
                  disabled={createBooking.isPending || !isAuthenticated}
                >
                  {createBooking.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {!isAuthenticated
                    ? "Sign in to Book"
                    : createBooking.isPending
                      ? "Booking..."
                      : "Confirm Booking"}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Spots grid */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">
                  Available Spots — {level}
                </h2>
                {availableSpots && (
                  <span className="text-xs text-muted-foreground">
                    {availableSpots.length} available
                  </span>
                )}
              </div>

              {!searched ? (
                <div
                  data-ocid="book.empty_state"
                  className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                >
                  <MapPin className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">
                    Click "Check Availability" to see open spots
                  </p>
                </div>
              ) : isLoading ? (
                <div
                  data-ocid="book.loading_state"
                  className="grid grid-cols-8 gap-2"
                >
                  {SPOT_SKELETON_KEYS.map((k) => (
                    <Skeleton key={k} className="aspect-square rounded-md" />
                  ))}
                </div>
              ) : availableSpots && availableSpots.length > 0 ? (
                <div className="grid grid-cols-8 gap-2">
                  {availableSpots
                    .sort((a, b) => Number(a.spotNumber) - Number(b.spotNumber))
                    .map((spot, idx) => (
                      <motion.button
                        key={spot.id}
                        data-ocid={`book.item.${idx + 1}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.01 }}
                        onClick={() => setSelectedSpot(spot)}
                        className={`aspect-square rounded-md flex flex-col items-center justify-center text-xs font-semibold border transition-all ${
                          selectedSpot?.id === spot.id
                            ? "bg-primary border-primary text-primary-foreground scale-105"
                            : "bg-success/20 border-success/60 text-success hover:bg-success/30 hover:scale-105"
                        }`}
                      >
                        <span className="text-[10px]">
                          {spot.spotNumber.toString()}
                        </span>
                      </motion.button>
                    ))}
                </div>
              ) : (
                <div
                  data-ocid="book.empty_state"
                  className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                >
                  <MapPin className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">
                    No available spots on {level} right now.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
