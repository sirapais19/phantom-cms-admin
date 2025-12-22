import { useAuthStore } from "@/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/common";
import { API_BASE_URL, USE_MOCK_DATA } from "@/api/config";

export default function Settings() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and API configuration</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {user?.name?.split(" ").map(n => n[0]).join("") || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-medium text-foreground">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label>Role:</Label>
            <StatusBadge status={user?.role || "Editor"} variant="published" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>Backend connection settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API Base URL</Label>
            <Input value={API_BASE_URL} readOnly className="bg-secondary border-border font-mono text-sm" />
            <p className="text-xs text-muted-foreground">Set via VITE_API_BASE_URL environment variable</p>
          </div>
          <div className="flex items-center gap-2">
            <Label>Mock Data Mode:</Label>
            <StatusBadge status={USE_MOCK_DATA ? "Enabled" : "Disabled"} variant={USE_MOCK_DATA ? "active" : "inactive"} />
          </div>
          <p className="text-xs text-muted-foreground">Toggle USE_MOCK_DATA in src/api/config.ts to switch between mock and real API</p>
        </CardContent>
      </Card>
    </div>
  );
}
