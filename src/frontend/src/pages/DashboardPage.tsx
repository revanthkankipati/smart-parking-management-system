import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Car, CheckCircle, RefreshCw, Wrench } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Page } from "../App";
import type { ParkingSpot } from "../backend";
import BookingModal from "../components/BookingModal";
import ParkingGrid from "../components/ParkingGrid";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useOccupancyStats, useSpotsByLevel } from "../hooks/useQueries";

const GRID_SKELETON_KEYS = Array.from({ length: 40 }, (_, i) => `gs-${i}`);

const LEVELS = ["L1", "L2", "L3"];

interface DashboardPageProps {
  initialLevel?: string;
  onNavigate: (page: Page) => void;
}

export default function DashboardPage({
  initialLevel = "L1",
}: DashboardPageProps) {
  const [level, setLevel] = useState(initialLevel);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: spots,
    isLoading,
    refetch,
    isFetching,
  } = useSpotsByLevel(level);
  const { data: stats } = useOccupancyStats(level);

  const userId = identity?.getPrincipal();

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-700 text-3xl text-foreground mb-1">
              Real-time Parking Dashboard
            </h1>
            <p className="text-muted-foreground">
              Live spot availability — {level} grid
            </p>
          </div>
          <button
            type="button"
            data-ocid="dashboard.toggle"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total Spots",
                value: stats.totalSpots.toString(),
                icon: BarChart3,
                color: "text-foreground",
              },
              {
                label: "Available",
                value: stats.availableSpots.toString(),
                icon: CheckCircle,
                color: "text-success",
              },
              {
                label: "Occupied",
                value: stats.occupiedSpots.toString(),
                icon: Car,
                color: "text-destructive",
              },
              {
                label: "Maintenance",
                value: stats.spotsUnderMaintenance.toString(),
                icon: Wrench,
                color: "text-muted-foreground",
              },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <div
                key={label}
                data-ocid={`dashboard.stats.item.${i + 1}`}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <p className={`font-display font-700 text-2xl ${color}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Sidebar */}
          <div className="lg:w-48 shrink-0">
            <div className="bg-card border border-border rounded-xl p-4 sticky top-24">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Levels
              </p>
              <div className="flex flex-col gap-1">
                {LEVELS.map((l) => (
                  <button
                    type="button"
                    key={l}
                    data-ocid="dashboard.level.tab"
                    onClick={() => setLevel(l)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      level === l
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    {l === "L1"
                      ? "Level 1"
                      : l === "L2"
                        ? "Level 2"
                        : "Level 3"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className="flex-1">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-foreground">
                    Parking Spots
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAuthenticated
                      ? "Click a green spot to book"
                      : "Sign in to book a spot"}
                  </p>
                </div>
                <Tabs value={level} onValueChange={setLevel}>
                  <TabsList>
                    {LEVELS.map((l) => (
                      <TabsTrigger
                        key={l}
                        value={l}
                        data-ocid="dashboard.level.tab"
                      >
                        {l}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {isLoading ? (
                <div
                  data-ocid="dashboard.loading_state"
                  className="grid grid-cols-8 gap-2"
                >
                  {GRID_SKELETON_KEYS.map((k) => (
                    <Skeleton key={k} className="aspect-square rounded-md" />
                  ))}
                </div>
              ) : (
                <ParkingGrid
                  spots={spots ?? []}
                  onSpotClick={setSelectedSpot}
                  isAuthenticated={isAuthenticated}
                />
              )}

              {/* Recent Activity */}
              {spots && spots.length > 0 && (
                <div className="mt-6 pt-5 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Spot Summary
                  </h3>
                  <div className="space-y-2">
                    {spots.slice(0, 5).map((spot, i) => (
                      <div
                        key={spot.id}
                        data-ocid={`dashboard.row.${i + 1}`}
                        className="flex items-center justify-between py-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle
                            className={`w-4 h-4 ${
                              spot.status === "free"
                                ? "text-success"
                                : spot.status === "occupied"
                                  ? "text-destructive"
                                  : "text-muted-foreground"
                            }`}
                          />
                          <span className="text-sm text-muted-foreground">
                            Spot {spot.spotNumber.toString()} —{" "}
                            {spot.vehicleType}
                          </span>
                        </div>
                        <Badge
                          variant={
                            spot.status === "free" ? "outline" : "secondary"
                          }
                          className={`text-xs ${
                            spot.status === "free"
                              ? "border-success/60 text-success"
                              : spot.status === "occupied"
                                ? "border-destructive/60 text-destructive"
                                : ""
                          }`}
                        >
                          {spot.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <BookingModal
        spot={selectedSpot}
        userId={userId}
        onClose={() => setSelectedSpot(null)}
      />
    </div>
  );
}
