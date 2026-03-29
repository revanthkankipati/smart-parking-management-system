import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Car, ChevronDown, Copy, LogIn, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import type { Page } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navLinks: { label: string; page: Page }[] = [
  { label: "Dashboard", page: "dashboard" },
  { label: "Book Slot", page: "book" },
  { label: "My Bookings", page: "bookings" },
  { label: "Admin", page: "admin" },
];

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const principalShort = identity
    ? `${identity.getPrincipal().toString().slice(0, 8)}...`
    : null;

  function handleCopyPrincipal() {
    if (!identity) return;
    const full = identity.getPrincipal().toString();
    navigator.clipboard.writeText(full).then(() => {
      toast.success("Principal ID copied!");
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md shadow-card">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <button
          type="button"
          data-ocid="nav.link"
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-glow group-hover:opacity-90 transition-opacity">
            <Car className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-700 text-lg text-foreground tracking-tight">
            Smart<span className="text-primary">Park</span>
          </span>
        </button>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              type="button"
              key={link.page}
              data-ocid={`nav.${link.page}.link`}
              onClick={() => onNavigate(link.page)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                currentPage === link.page
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
              {currentPage === link.page && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  data-ocid="nav.user.button"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border hover:border-primary/50 transition-colors"
                >
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      <User className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground font-mono">
                    {principalShort}
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  data-ocid="nav.copy_principal.button"
                  onClick={handleCopyPrincipal}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Principal ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  data-ocid="nav.bookings.link"
                  onClick={() => onNavigate("bookings")}
                >
                  My Bookings
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-ocid="nav.logout.button"
                  onClick={clear}
                  className="text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              data-ocid="nav.login.button"
              size="sm"
              onClick={login}
              disabled={isLoggingIn}
              className="gap-2"
            >
              <LogIn className="w-4 h-4" />
              {isLoggingIn ? "Signing in..." : "Sign In"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
