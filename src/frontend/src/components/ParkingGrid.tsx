import { Car, CheckCircle, Wrench } from "lucide-react";
import { motion } from "motion/react";
import type { ParkingSpot } from "../backend";
import { SpotStatus } from "../backend";

interface ParkingGridProps {
  spots: ParkingSpot[];
  onSpotClick?: (spot: ParkingSpot) => void;
  isAuthenticated?: boolean;
}

export default function ParkingGrid({
  spots,
  onSpotClick,
  isAuthenticated,
}: ParkingGridProps) {
  if (spots.length === 0) {
    return (
      <div
        data-ocid="parking.empty_state"
        className="flex flex-col items-center justify-center py-16 text-muted-foreground"
      >
        <Car className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-sm">No parking spots available for this level.</p>
      </div>
    );
  }

  const sorted = [...spots].sort(
    (a, b) => Number(a.spotNumber) - Number(b.spotNumber),
  );

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-success block" />
          Available
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-destructive block" />
          Occupied
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-muted block" />
          Maintenance
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-8 gap-2">
        {sorted.map((spot, idx) => {
          const isFree = spot.status === SpotStatus.free;
          const isOccupied = spot.status === SpotStatus.occupied;
          const isMaint = spot.status === SpotStatus.maintenance;
          const isClickable = isFree && isAuthenticated;
          const ocid = `parking.item.${idx + 1}`;

          return (
            <motion.button
              key={spot.id}
              data-ocid={ocid}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.01, duration: 0.2 }}
              onClick={() => isClickable && onSpotClick?.(spot)}
              disabled={!isClickable}
              title={`Spot ${spot.spotNumber} (${spot.vehicleType}) - ${spot.status}`}
              className={`
                relative aspect-square rounded-md flex flex-col items-center justify-center text-xs font-semibold
                border transition-all duration-200
                ${
                  isFree
                    ? isAuthenticated
                      ? "bg-success/20 border-success/60 text-success hover:bg-success/30 hover:border-success cursor-pointer hover:scale-105 hover:shadow-md"
                      : "bg-success/20 border-success/60 text-success cursor-default"
                    : isOccupied
                      ? "bg-destructive/20 border-destructive/60 text-destructive cursor-not-allowed"
                      : "bg-muted/40 border-border text-muted-foreground cursor-not-allowed"
                }
              `}
            >
              {isMaint ? (
                <Wrench className="w-3 h-3 mb-0.5" />
              ) : isOccupied ? (
                <Car className="w-3 h-3 mb-0.5" />
              ) : (
                <CheckCircle className="w-3 h-3 mb-0.5" />
              )}
              <span className="text-[10px]">{String(spot.spotNumber)}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
