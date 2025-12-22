import { Video, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common";

export default function Videos() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Videos</h1>
          <p className="text-muted-foreground">Manage team video content</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Video
        </Button>
      </div>
      <EmptyState icon={Video} title="No videos yet" description="Add video links from YouTube, Instagram, or TikTok" />
    </div>
  );
}
