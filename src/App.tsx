import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Roster from "./pages/Roster";
import Achievements from "./pages/Achievements";
// ✅ remove TeamMedia import (optional, but cleaner)
import Schedule from "./pages/Schedule";
import Gallery from "./pages/Gallery";
import Videos from "./pages/Videos";
import News from "./pages/News";
import Sponsors from "./pages/Sponsors";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="roster" element={<Roster />} />
            <Route path="achievements" element={<Achievements />} />

            {/* ✅ BLOCK Team Media page (redirect away) */}
            <Route
              path="team-media"
              element={<Navigate to="/dashboard" replace />}
            />

            <Route path="schedule" element={<Schedule />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="videos" element={<Videos />} />
            <Route path="news" element={<News />} />
            <Route path="sponsors" element={<Sponsors />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
