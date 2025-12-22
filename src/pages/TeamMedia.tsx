import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadDropzone, LoadingState } from "@/components/common";
import { useToast } from "@/hooks/use-toast";
import { teamMediaApi } from "@/api";
import type { TeamMedia } from "@/types";

const mediaTypes = [
  {
    type: "team-photo" as const,
    title: "Team Photo",
    description: "Main team photo displayed on the about page",
  },
  {
    type: "hero-banner" as const,
    title: "Hero Banner",
    description: "Homepage hero section background image",
  },
  {
    type: "logo" as const,
    title: "Team Logo",
    description: "Primary team logo used across the site",
  },
];

export default function TeamMediaPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: media = [], isLoading } = useQuery({
    queryKey: ["team-media"],
    queryFn: teamMediaApi.getAll,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, imageUrl }: { id: string; imageUrl: string }) =>
      teamMediaApi.update(id, { imageUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-media"] });
      toast({ title: "Media updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update media", variant: "destructive" });
    },
  });

  const getMediaItem = (type: TeamMedia["type"]) => {
    return media.find((m) => m.type === type);
  };

  if (isLoading) {
    return <LoadingState message="Loading team media..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team Media</h1>
        <p className="text-muted-foreground">
          Manage team photo, hero banner, and logo
        </p>
      </div>

      {/* Media Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {mediaTypes.map(({ type, title, description }) => {
          const item = getMediaItem(type);
          const isUpdating = updateMutation.isPending;

          return (
            <Card key={type} className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Image className="h-5 w-5 text-primary" />
                  {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {item?.imageUrl ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                      <img
                        src={item.imageUrl}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-border"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                if (item) {
                                  updateMutation.mutate({
                                    id: item.id,
                                    imageUrl: e.target?.result as string,
                                  });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Replace
                      </Button>
                    </div>
                  </div>
                ) : (
                  <UploadDropzone
                    onChange={(value) => {
                      if (value && item) {
                        updateMutation.mutate({ id: item.id, imageUrl: value });
                      }
                    }}
                    placeholder={`Upload ${title.toLowerCase()}`}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tips */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Image Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>Team Photo:</strong> Recommended size 1200x800px, landscape orientation</li>
            <li>• <strong>Hero Banner:</strong> Recommended size 1920x1080px, high contrast for text overlay</li>
            <li>• <strong>Logo:</strong> Square format recommended, PNG with transparency supported</li>
            <li>• Maximum file size: 5MB per image</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
