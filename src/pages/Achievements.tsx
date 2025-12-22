import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MoreHorizontal, Plus, Pencil, Trash2, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DataTable,
  ModalForm,
  ConfirmDialog,
  StatusBadge,
  EmptyState,
} from "@/components/common";
import { useToast } from "@/hooks/use-toast";
import { achievementsApi } from "@/api";
import type { Achievement } from "@/types";

const achievementSchema = z.object({
  year: z.coerce.number().min(2000).max(2100),
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  featured: z.boolean(),
});

type AchievementFormData = z.infer<typeof achievementSchema>;

export default function Achievements() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: achievementsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: achievementsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      toast({ title: "Achievement added successfully" });
      setIsModalOpen(false);
      reset();
    },
    onError: () => {
      toast({ title: "Failed to add achievement", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Achievement> }) =>
      achievementsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      toast({ title: "Achievement updated successfully" });
      setIsModalOpen(false);
      setSelectedAchievement(null);
      reset();
    },
    onError: () => {
      toast({ title: "Failed to update achievement", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: achievementsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      toast({ title: "Achievement deleted successfully" });
      setIsDeleteOpen(false);
      setSelectedAchievement(null);
    },
    onError: () => {
      toast({ title: "Failed to delete achievement", variant: "destructive" });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AchievementFormData>({
    resolver: zodResolver(achievementSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      featured: false,
    },
  });

  const handleEdit = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setValue("year", achievement.year);
    setValue("title", achievement.title);
    setValue("description", achievement.description || "");
    setValue("category", achievement.category);
    setValue("featured", achievement.featured);
    setIsModalOpen(true);
  };

  const handleDelete = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setIsDeleteOpen(true);
  };

  const onSubmit = (data: AchievementFormData) => {
    if (selectedAchievement) {
      updateMutation.mutate({ id: selectedAchievement.id, data });
    } else {
      createMutation.mutate(data as Omit<Achievement, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAchievement(null);
    reset();
  };

  const columns: ColumnDef<Achievement>[] = [
    {
      accessorKey: "year",
      header: "Year",
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground">{row.original.year}</span>
      ),
    },
    {
      accessorKey: "title",
      header: "Achievement",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">{row.original.title}</p>
              {row.original.featured && (
                <Star className="h-3 w-3 text-warning fill-warning" />
              )}
            </div>
            {row.original.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {row.original.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <StatusBadge status={row.original.category} variant="default" />
      ),
    },
    {
      accessorKey: "featured",
      header: "Featured",
      cell: ({ row }) => (
        <span className={row.original.featured ? "text-warning" : "text-muted-foreground"}>
          {row.original.featured ? "Yes" : "No"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(row.original)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Achievements</h1>
          <p className="text-muted-foreground">Manage team accomplishments</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Achievement
        </Button>
      </div>

      {/* Table */}
      {achievements.length === 0 && !isLoading ? (
        <EmptyState
          icon={Trophy}
          title="No achievements yet"
          description="Add your team's first achievement"
          actionLabel="Add Achievement"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={achievements}
          searchKey="title"
          searchPlaceholder="Search achievements..."
          isLoading={isLoading}
        />
      )}

      {/* Add/Edit Modal */}
      <ModalForm
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        title={selectedAchievement ? "Edit Achievement" : "Add Achievement"}
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        submitLabel={selectedAchievement ? "Update" : "Add"}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Year *</Label>
            <Input
              type="number"
              {...register("year")}
              className="bg-secondary border-border"
            />
            {errors.year && (
              <p className="text-xs text-destructive">{errors.year.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Category *</Label>
            <Input
              {...register("category")}
              placeholder="Championship, Spirit, etc."
              className="bg-secondary border-border"
            />
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Title *</Label>
          <Input
            {...register("title")}
            placeholder="Regional Champions"
            className="bg-secondary border-border"
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            {...register("description")}
            placeholder="Achievement details..."
            rows={3}
            className="bg-secondary border-border resize-none"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
          <div>
            <Label>Featured</Label>
            <p className="text-xs text-muted-foreground">Highlight this achievement</p>
          </div>
          <Switch
            checked={watch("featured")}
            onCheckedChange={(checked) => setValue("featured", checked)}
          />
        </div>
      </ModalForm>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Achievement"
        description={`Are you sure you want to delete "${selectedAchievement?.title}"?`}
        onConfirm={() => selectedAchievement && deleteMutation.mutate(selectedAchievement.id)}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
