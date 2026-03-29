import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  CheckCircle,
  Clock,
  MapPin,
  Shield,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Page } from "../App";

interface HomePageProps {
  onNavigate: (page: Page, level?: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("09:00");
  const [level, setLevel] = useState("L1");
  const [vehicleType, setVehicleType] = useState("standard");

  function handleCheckAvailability() {
    onNavigate("dashboard", level);
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[580px] flex items-center">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="/assets/generated/parking-hero.dim_1400x600.jpg"
            alt="Parking garage"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        </div>

        <div className="relative max-w-[1200px] mx-auto px-6 py-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
              <Zap className="w-3 h-3" />
              Real-time Parking Management
            </div>
            <h1 className="font-display font-800 text-5xl md:text-6xl leading-[1.05] text-foreground mb-6">
              Smart Parking
              <br />
              <span className="text-primary">Made Simple.</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Find and book available parking spots instantly. Real-time
              updates, seamless reservations, and effortless management — all in
              one place.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                data-ocid="hero.primary_button"
                size="lg"
                onClick={() => onNavigate("dashboard")}
                className="shadow-glow"
              >
                Explore Dashboard
              </Button>
              <Button
                data-ocid="hero.secondary_button"
                size="lg"
                variant="outline"
                onClick={() => onNavigate("book")}
              >
                Book a Slot
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats row */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Total Spots", value: "240+", icon: MapPin },
              { label: "Avg. Wait Time", value: "< 2 min", icon: Clock },
              { label: "Uptime", value: "99.9%", icon: Shield },
              { label: "Daily Bookings", value: "1,200+", icon: BarChart3 },
            ].map(({ label, value, icon: Icon }, i) => (
              <motion.div
                key={label}
                data-ocid={`stats.item.${i + 1}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i + 0.3 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-display font-700 text-xl text-foreground">
                    {value}
                  </p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Book */}
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display font-700 text-3xl text-foreground mb-2">
            Quick Book a Slot
          </h2>
          <p className="text-muted-foreground mb-8">
            Check availability and reserve your spot in seconds.
          </p>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Date
                </p>
                <Input
                  data-ocid="quickbook.input"
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Time
                </p>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Level
                </p>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger data-ocid="quickbook.level.select">
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Vehicle Type
                </p>
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger data-ocid="quickbook.type.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="ev">Electric (EV)</SelectItem>
                    <SelectItem value="disabled">Accessible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                data-ocid="quickbook.primary_button"
                className="w-full shadow-glow"
                onClick={handleCheckAvailability}
              >
                Check Availability
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-[1200px] mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display font-700 text-3xl text-foreground mb-2">
            Why SmartPark?
          </h2>
          <p className="text-muted-foreground mb-8">
            Everything you need for effortless parking management.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: Zap,
                title: "Real-Time Updates",
                desc: "Live spot availability refreshed every 30 seconds so you always have the latest picture.",
              },
              {
                icon: Shield,
                title: "Secure Bookings",
                desc: "Internet Identity authentication ensures only you can manage your reservations.",
              },
              {
                icon: BarChart3,
                title: "Smart Analytics",
                desc: "Occupancy stats and level-by-level insights help administrators optimise capacity.",
              },
              {
                icon: Clock,
                title: "Flexible Hours",
                desc: "Book by the hour — from a quick errand to a full-day stay.",
              },
              {
                icon: CheckCircle,
                title: "Instant Confirmation",
                desc: "Your booking is confirmed on-chain the moment you submit, with no middleman delays.",
              },
              {
                icon: MapPin,
                title: "Multi-Level Support",
                desc: "Browse and book across multiple parking levels from a single unified interface.",
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                data-ocid={`features.item.${i + 1}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
