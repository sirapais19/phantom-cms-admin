import { Newspaper, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common";

export default function News() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">News</h1>
          <p className="text-muted-foreground">Manage team news and announcements</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Article
        </Button>
      </div>
      <EmptyState icon={Newspaper} title="No articles yet" description="Create your first news article" />
    </div>
  );
}
