import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Principal } from "@icp-sdk/core/principal";
import {
  CheckCircle,
  Database,
  Loader2,
  LogIn,
  ShieldAlert,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAllBookings,
  useAssignRole,
  useIsAdmin,
  useOccupancyStats,
  useSeedParkingLot,
  useSpotsByLevel,
  useToggleMaintenance,
} from "../hooks/useQueries";

const LEVELS = ["L1", "L2", "L3"];

function formatTime(ns: bigint) {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LevelStatsCard({ levelId }: { levelId: string }) {
  const { data: stats, isLoading } = useOccupancyStats(levelId);
  if (isLoading) return <Skeleton className="h-28 rounded-xl" />;
  if (!stats) return null;
  const total = Number(stats.totalSpots);
  const occupied = Number(stats.occupiedSpots);
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">{levelId}</h3>
        <Badge
          variant="outline"
          className={
            pct > 80
              ? "border-destructive/60 text-destructive"
              : "border-success/60 text-success"
          }
        >
          {pct}% full
        </Badge>
      </div>
      <Progress value={pct} className="h-2 mb-3" />
      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div>{String(stats.availableSpots)} free</div>
        <div>{String(stats.occupiedSpots)} occupied</div>
        <div>{String(stats.spotsUnderMaintenance)} maint.</div>
      </div>
    </div>
  );
}

function SpotManagementTable({ levelId }: { levelId: string }) {
  const { data: spots, isLoading } = useSpotsByLevel(levelId);
  const toggleMaintenance = useToggleMaintenance();

  async function handleToggle(spotId: string, status: string) {
    try {
      await toggleMaintenance.mutateAsync({ spotId, currentStatus: status });
      toast.success(`Spot ${spotId} updated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (!spots || spots.length === 0)
    return <p className="text-sm text-muted-foreground">No spots found.</p>;

  return (
    <div
      data-ocid="admin.table"
      className="border border-border rounded-xl overflow-hidden"
    >
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead>Spot #</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {spots.slice(0, 20).map((spot, i) => (
            <TableRow
              key={spot.id}
              data-ocid={`admin.row.${i + 1}`}
              className="border-border"
            >
              <TableCell className="font-mono text-sm">
                {spot.spotNumber.toString()}
              </TableCell>
              <TableCell className="capitalize text-sm">
                {spot.vehicleType}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`text-xs capitalize ${
                    spot.status === "free"
                      ? "border-success/60 text-success"
                      : spot.status === "occupied"
                        ? "border-destructive/60 text-destructive"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {spot.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  data-ocid={`admin.toggle.${i + 1}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggle(spot.id, spot.status)}
                  disabled={
                    toggleMaintenance.isPending || spot.status === "occupied"
                  }
                  className="text-xs gap-1.5"
                >
                  {spot.status === "maintenance" ? (
                    <>
                      <CheckCircle className="w-3 h-3" /> Mark Free
                    </>
                  ) : (
                    <>
                      <Wrench className="w-3 h-3" /> Maintenance
                    </>
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AllBookingsTable() {
  const { data: bookings, isLoading } = useAllBookings("L1-1");

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (!bookings || bookings.length === 0) {
    return (
      <div
        data-ocid="admin.bookings.empty_state"
        className="flex flex-col items-center justify-center py-10 text-muted-foreground"
      >
        <p className="text-sm">No bookings found for sample spot L1-1.</p>
      </div>
    );
  }
  return (
    <div
      data-ocid="admin.bookings.table"
      className="border border-border rounded-xl overflow-hidden"
    >
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead>Spot ID</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Vehicle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((b, i) => (
            <TableRow
              key={`${b.spotId}-${b.startTime.toString()}`}
              data-ocid={`admin.bookings.row.${i + 1}`}
              className="border-border"
            >
              <TableCell className="font-mono text-xs">{b.spotId}</TableCell>
              <TableCell className="text-sm">
                {formatTime(b.startTime)}
              </TableCell>
              <TableCell className="text-sm">{formatTime(b.endTime)}</TableCell>
              <TableCell className="capitalize text-sm">
                {b.vehicleType}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UserRoleManagement() {
  const [principalText, setPrincipalText] = useState("");
  const [role, setRole] = useState("user");
  const [principalError, setPrincipalError] = useState("");
  const assignRole = useAssignRole();

  function validatePrincipal(value: string): boolean {
    if (!value.trim()) {
      setPrincipalError("Principal ID is required.");
      return false;
    }
    try {
      Principal.fromText(value.trim());
      setPrincipalError("");
      return true;
    } catch {
      setPrincipalError("Invalid Principal ID format.");
      return false;
    }
  }

  async function handleAssign() {
    if (!validatePrincipal(principalText)) return;
    try {
      await assignRole.mutateAsync({
        principalText: principalText.trim(),
        role,
      });
      toast.success(`Role "${role}" assigned successfully!`);
      setPrincipalText("");
      setRole("user");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to assign role");
    }
  }

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-foreground">User Role Management</h2>
      </div>
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-sm text-muted-foreground mb-5">
          Assign admin or user roles to principals. The user must have logged in
          at least once before being assigned a role.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="principal-input">Principal ID</Label>
            <Input
              id="principal-input"
              data-ocid="admin.role.input"
              placeholder="e.g. aaaaa-aa or ryjl3-tyaaa-aaaaa-aaaba-cai"
              value={principalText}
              onChange={(e) => {
                setPrincipalText(e.target.value);
                if (principalError) validatePrincipal(e.target.value);
              }}
              className={principalError ? "border-destructive" : ""}
            />
            {principalError && (
              <p
                data-ocid="admin.role.error_state"
                className="text-xs text-destructive mt-1"
              >
                {principalError}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-select">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger
                id="role-select"
                data-ocid="admin.role.select"
                className="w-32"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            data-ocid="admin.role.submit_button"
            onClick={handleAssign}
            disabled={assignRole.isPending}
            className="gap-2"
          >
            {assignRole.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Assign Role
          </Button>
        </div>
      </div>
    </section>
  );
}

interface AdminPageProps {
  onNavigate: (page: Page) => void;
}

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const { identity, login } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const seedLot = useSeedParkingLot();
  const [activeLevel, setActiveLevel] = useState("L1");

  async function handleSeed() {
    try {
      await seedLot.mutateAsync();
      toast.success("Parking lot seeded successfully!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Seed failed");
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-20 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <ShieldAlert className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display font-700 text-2xl text-foreground mb-2">
          Admin Access Required
        </h2>
        <p className="text-muted-foreground mb-6">
          Please sign in with an admin account to access this area.
        </p>
        <Button data-ocid="admin.login.button" onClick={login}>
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </Button>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div
        data-ocid="admin.loading_state"
        className="max-w-[1200px] mx-auto px-6 py-20 flex justify-center"
      >
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        data-ocid="admin.error_state"
        className="max-w-[1200px] mx-auto px-6 py-20 flex flex-col items-center text-center"
      >
        <ShieldAlert className="w-12 h-12 text-destructive mb-4" />
        <h2 className="font-display font-700 text-2xl text-foreground mb-2">
          Access Denied
        </h2>
        <p className="text-muted-foreground mb-6">
          You don&apos;t have admin privileges.
        </p>
        <Button
          data-ocid="admin.secondary_button"
          variant="outline"
          onClick={() => onNavigate("home")}
        >
          Go Home
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
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display font-700 text-3xl text-foreground mb-1">
              Admin Panel
            </h1>
            <p className="text-muted-foreground">
              Manage parking spots and view all bookings.
            </p>
          </div>
          <Button
            data-ocid="admin.seed.primary_button"
            variant="outline"
            onClick={handleSeed}
            disabled={seedLot.isPending}
            className="gap-2"
          >
            {seedLot.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            Seed Parking Lot
          </Button>
        </div>

        {/* Occupancy Overview */}
        <section className="mb-10">
          <h2 className="font-semibold text-foreground mb-4">
            Occupancy by Level
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LEVELS.map((l) => (
              <LevelStatsCard key={l} levelId={l} />
            ))}
          </div>
        </section>

        {/* Spot Management */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-semibold text-foreground">Spot Management</h2>
            <div className="flex gap-2">
              {LEVELS.map((l) => (
                <button
                  type="button"
                  key={l}
                  data-ocid="admin.level.tab"
                  onClick={() => setActiveLevel(l)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeLevel === l
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <SpotManagementTable levelId={activeLevel} />
        </section>

        {/* All Bookings */}
        <section>
          <h2 className="font-semibold text-foreground mb-4">
            Recent Bookings (Spot L1-1)
          </h2>
          <AllBookingsTable />
        </section>

        {/* User Role Management */}
        <UserRoleManagement />
      </motion.div>
    </div>
  );
}
