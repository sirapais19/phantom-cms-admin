const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

export type DashboardStats = {
  activePlayers: number;
  achievements: number;
  upcomingTournaments: number;
  publishedNews: number;
};

export type DashboardActivity = {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
};

export type DashboardResponse = {
  stats: DashboardStats;
  recentActivity: DashboardActivity[];
};

async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch(`${API_BASE_URL}/dashboard`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to load dashboard (${res.status}) ${text}`);
  }

  return res.json();
}

export const dashboardApi = {
  // Your Dashboard.tsx expects these 2 functions:
  getStats: async () => {
    const data = await fetchDashboard();
    return data.stats;
  },

  getRecentActivity: async () => {
    const data = await fetchDashboard();
    return data.recentActivity;
  },
};
