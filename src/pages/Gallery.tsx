import { Images, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common";

export default function Gallery() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gallery</h1>
          <p className="text-muted-foreground">Manage team photos and albums</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Upload Images
        </Button>
      </div>
      <EmptyState icon={Images} title="No images yet" description="Upload photos to build your gallery" />
    </div>
  );
}
