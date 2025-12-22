import { Handshake, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common";

export default function Sponsors() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sponsors</h1>
          <p className="text-muted-foreground">Manage team sponsors and partners</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Sponsor
        </Button>
      </div>
      <EmptyState icon={Handshake} title="No sponsors yet" description="Add your team sponsors and partners" />
    </div>
  );
}
