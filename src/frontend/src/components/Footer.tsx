import { Car, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import type { Page } from "../App";

interface FooterProps {
  onNavigate: (page: Page) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const year = new Date().getFullYear();
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;

  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Car className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-700 text-lg text-foreground">
                Smart<span className="text-primary">Park</span> Management
              </span>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs">
              Intelligent parking slot booking for modern facilities. Real-time
              availability, instant booking.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">Navigation</p>
            <div className="flex flex-col gap-2">
              {(
                [
                  ["About", "home"],
                  ["Dashboard", "dashboard"],
                  ["Book a Slot", "book"],
                  ["My Bookings", "bookings"],
                ] as [string, Page][]
              ).map(([label, page]) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => onNavigate(page)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">Follow Us</p>
            <div className="flex items-center gap-3">
              {[
                { Icon: Facebook, label: "Facebook" },
                { Icon: Twitter, label: "Twitter" },
                { Icon: Instagram, label: "Instagram" },
                { Icon: Youtube, label: "YouTube" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="https://smartpark.example.com"
                  aria-label={label}
                  className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; {year} SmartPark Management. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with ❤️ using{" "}
            <a
              href={caffeineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
