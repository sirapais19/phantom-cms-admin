import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Ghost,
  LayoutDashboard,
  Users,
  Trophy,
  Calendar,
  Images,
  Video,
  Newspaper,
  Handshake,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Roster", href: "/dashboard/roster", icon: Users },
  { name: "Achievements", href: "/dashboard/achievements", icon: Trophy },

  // ✅ HIDDEN: Team Media
  // { name: "Team Media", href: "/dashboard/team-media", icon: Image },

  { name: "Schedule", href: "/dashboard/schedule", icon: Calendar },
  { name: "Gallery", href: "/dashboard/gallery", icon: Images },
  { name: "Videos", href: "/dashboard/videos", icon: Video },
  { name: "News", href: "/dashboard/news", icon: Newspaper },
  { name: "Sponsors", href: "/dashboard/sponsors", icon: Handshake },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <Ghost className="h-8 w-8 text-primary" />
            <span className="font-bold text-lg text-foreground">Phantom</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("hover:bg-sidebar-accent", isCollapsed && "mx-auto")}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/dashboard" &&
                location.pathname.startsWith(item.href));

            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive && "text-primary"
                    )}
                  />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Version info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground">Phantom CMS v1.0.0</p>
        </div>
      )}
    </aside>
  );
}
