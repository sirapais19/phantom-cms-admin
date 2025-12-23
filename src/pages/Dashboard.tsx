import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  Trophy,
  Calendar,
  Newspaper,
  Plus,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard, LoadingState } from "@/components/common";
import { dashboardApi } from "@/api";
import { formatDistanceToNow } from "date-fns";

const quickActions = [
  { label: "Add Player", href: "/dashboard/roster", icon: Users },
  { label: "Add Tournament", href: "/dashboard/schedule", icon: Calendar },
  { label: "Add News", href: "/dashboard/news", icon: Newspaper },
];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardApi.getStats,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: dashboardApi.getRecentActivity,
  });

  if (statsLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with Phantom.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Players"
          value={stats?.activePlayers || 0}
          icon={Users}
          description="Roster members"
        />
        <StatsCard
          title="Achievements"
          value={stats?.achievements || 0}
          icon={Trophy}
          description="All time"
        />
        <StatsCard
          title="Upcoming Tournaments"
          value={stats?.upcomingTournaments || 0}
          icon={Calendar}
          description="This season"
        />
        <StatsCard
          title="Published News"
          value={stats?.publishedNews || 0}
          icon={Newspaper}
          description="Articles live"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} to={action.href}>
              <Button variant="outline" className="gap-2 border-border">
                <Plus className="h-4 w-4" />
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Activity
          </h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {activitiesLoading ? (
          <LoadingState message="Loading activity..." />
        ) : activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.slice(0, 5).map((activity) => (
              <div
                key={`${activity.type}-${activity.id}-${activity.timestamp}`}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{activity.title}</p>
                  {activity.subtitle ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.subtitle}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </p>
        )}
      </div>
    </div>
  );
}
