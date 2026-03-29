import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Principal } from "@icp-sdk/core/principal";
import { Car, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ParkingSpot } from "../backend";
import { VehicleType } from "../backend";
import { useCreateBooking } from "../hooks/useQueries";

interface BookingModalProps {
  spot: ParkingSpot | null;
  userId: Principal | undefined;
  onClose: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function fmt(h: number) {
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:00 ${ampm}`;
}

export default function BookingModal({
  spot,
  userId,
  onClose,
}: BookingModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startHour, setStartHour] = useState("8");
  const [endHour, setEndHour] = useState("10");
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    VehicleType.standard,
  );
  const createBooking = useCreateBooking();

  async function handleSubmit() {
    if (!spot || !userId) return;
    const start = Number.parseInt(startHour);
    const end = Number.parseInt(endHour);
    if (end <= start) {
      toast.error("End time must be after start time");
      return;
    }
    try {
      await createBooking.mutateAsync({
        spotId: spot.id,
        userId,
        vehicleType,
        date: new Date(date),
        startHour: start,
        endHour: end,
      });
      toast.success(`Spot ${spot.spotNumber} booked successfully!`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Booking failed");
    }
  }

  return (
    <Dialog open={!!spot} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-ocid="booking.dialog" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            Book Parking Spot {spot?.spotNumber?.toString()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground">Level</p>
              <p className="font-semibold text-sm">{spot?.level}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Spot Type</p>
              <p className="font-semibold text-sm capitalize">
                {spot?.vehicleType}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="booking-date">Date</Label>
            <Input
              data-ocid="booking.input"
              id="booking-date"
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
                <SelectTrigger data-ocid="booking.start.select">
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
                <SelectTrigger data-ocid="booking.end.select">
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
              <SelectTrigger data-ocid="booking.vehicle.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={VehicleType.standard}>Standard</SelectItem>
                <SelectItem value={VehicleType.ev}>
                  Electric Vehicle (EV)
                </SelectItem>
                <SelectItem value={VehicleType.disabled}>
                  Disabled/Accessible
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            data-ocid="booking.cancel_button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            data-ocid="booking.submit_button"
            onClick={handleSubmit}
            disabled={createBooking.isPending}
          >
            {createBooking.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {createBooking.isPending ? "Booking..." : "Confirm Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
