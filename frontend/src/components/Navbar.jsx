import { Button } from "@/components/ui/button";
import { Activity, LayoutDashboard, CalendarDays, UserRound } from "lucide-react";

export const Navbar = ({ identity, view, setView, onEditIdentity }) => {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button onClick={() => setView("events")} className="flex items-center gap-2" data-testid="nav-logo">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-extrabold uppercase tracking-tight">Running<span className="text-primary">Coach</span></span>
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant={view === "events" ? "secondary" : "ghost"} size="sm" onClick={() => setView("events")} data-testid="nav-events-btn" className="font-semibold">
            <CalendarDays className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Tréningy</span>
          </Button>
          <Button variant={view === "dashboard" ? "secondary" : "ghost"} size="sm" onClick={() => setView("dashboard")} data-testid="nav-dashboard-btn" className="font-semibold">
            <LayoutDashboard className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Moja účasť</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onEditIdentity} data-testid="nav-identity-btn" className="font-semibold border-border">
            <UserRound className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">{identity?.name || "Profil"}</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};
