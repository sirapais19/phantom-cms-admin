import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MoreHorizontal, Plus, Upload, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  UploadDropzone,
  EmptyState,
} from "@/components/common";
import { useToast } from "@/hooks/use-toast";
import { playersApi } from "@/api";
import type { Player } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const playerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  jerseyNumber: z.coerce.number().min(0).max(99),
  roleTag: z.enum(["Captain", "Coach", "Player"]),
  position: z.string().min(1, "Position is required"),
  tagline: z.string().optional(),
  bio: z.string().optional(),
  photoUrl: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  socials: z.object({
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
  }).optional(),
});

type PlayerFormData = z.infer<typeof playerSchema>;

export default function Roster() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [positionFilter, setPositionFilter] = useState<string>("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players = [], isLoading } = useQuery({
    queryKey: ["players"],
    queryFn: playersApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: playersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast({ title: "Player added successfully" });
      setIsModalOpen(false);
      reset();
    },
    onError: () => {
      toast({ title: "Failed to add player", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Player> }) =>
      playersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast({ title: "Player updated successfully" });
      setIsModalOpen(false);
      setSelectedPlayer(null);
      reset();
    },
    onError: () => {
      toast({ title: "Failed to update player", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: playersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast({ title: "Player deleted successfully" });
      setIsDeleteOpen(false);
      setSelectedPlayer(null);
    },
    onError: () => {
      toast({ title: "Failed to delete player", variant: "destructive" });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      status: "active",
      roleTag: "Player",
      socials: {},
    },
  });

  const photoUrl = watch("photoUrl");

  const handleEdit = (player: Player) => {
    setSelectedPlayer(player);
    setValue("fullName", player.fullName);
    setValue("jerseyNumber", player.jerseyNumber);
    setValue("roleTag", player.roleTag);
    setValue("position", player.position);
    setValue("tagline", player.tagline || "");
    setValue("bio", player.bio || "");
    setValue("photoUrl", player.photoUrl || "");
    setValue("status", player.status);
    setValue("socials", player.socials || {});
    setIsModalOpen(true);
  };

  const handleDelete = (player: Player) => {
    setSelectedPlayer(player);
    setIsDeleteOpen(true);
  };

  const onSubmit = (data: PlayerFormData) => {
    if (selectedPlayer) {
      updateMutation.mutate({ id: selectedPlayer.id, data });
    } else {
      createMutation.mutate(data as Omit<Player, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlayer(null);
    reset();
  };

  // Filter players
  const filteredPlayers = players.filter((player) => {
    if (roleFilter !== "all" && player.roleTag !== roleFilter) return false;
    if (positionFilter !== "all" && player.position !== positionFilter) return false;
    return true;
  });

  // Get unique positions
  const positions = [...new Set(players.map((p) => p.position))];

  const columns: ColumnDef<Player>[] = [
    {
      accessorKey: "jerseyNumber",
      header: "#",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          #{row.original.jerseyNumber}
        </span>
      ),
    },
    {
      accessorKey: "fullName",
      header: "Player",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={row.original.photoUrl} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {row.original.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{row.original.fullName}</p>
            {row.original.tagline && (
              <p className="text-xs text-muted-foreground">{row.original.tagline}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "roleTag",
      header: "Role",
      cell: ({ row }) => {
        const variant = row.original.roleTag === "Captain" ? "published" : 
                       row.original.roleTag === "Coach" ? "draft" : "default";
        return <StatusBadge status={row.original.roleTag} variant={variant} />;
      },
    },
    {
      accessorKey: "position",
      header: "Position",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          variant={row.original.status === "active" ? "active" : "inactive"}
        />
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
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
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
          <h1 className="text-2xl font-bold text-foreground">Roster</h1>
          <p className="text-muted-foreground">Manage team players and staff</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-border gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Player
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40 bg-secondary border-border">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Captain">Captain</SelectItem>
            <SelectItem value="Coach">Coach</SelectItem>
            <SelectItem value="Player">Player</SelectItem>
          </SelectContent>
        </Select>

        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-40 bg-secondary border-border">
            <SelectValue placeholder="Filter by position" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">All Positions</SelectItem>
            {positions.map((pos) => (
              <SelectItem key={pos} value={pos}>
                {pos}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredPlayers.length === 0 && !isLoading ? (
        <EmptyState
          title="No players found"
          description="Add your first player to get started"
          actionLabel="Add Player"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredPlayers}
          searchKey="fullName"
          searchPlaceholder="Search players..."
          isLoading={isLoading}
          emptyMessage="No players found"
        />
      )}

      {/* Add/Edit Modal */}
      <ModalForm
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        title={selectedPlayer ? "Edit Player" : "Add Player"}
        description={selectedPlayer ? "Update player information" : "Add a new player to the roster"}
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        submitLabel={selectedPlayer ? "Update" : "Add Player"}
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input
              {...register("fullName")}
              placeholder="John Doe"
              className="bg-secondary border-border"
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Jersey Number *</Label>
            <Input
              type="number"
              {...register("jerseyNumber")}
              placeholder="7"
              className="bg-secondary border-border"
            />
            {errors.jerseyNumber && (
              <p className="text-xs text-destructive">{errors.jerseyNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Role *</Label>
            <Select
              value={watch("roleTag")}
              onValueChange={(value: "Captain" | "Coach" | "Player") =>
                setValue("roleTag", value)
              }
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="Captain">Captain</SelectItem>
                <SelectItem value="Coach">Coach</SelectItem>
                <SelectItem value="Player">Player</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Position *</Label>
            <Input
              {...register("position")}
              placeholder="Handler / Cutter"
              className="bg-secondary border-border"
            />
            {errors.position && (
              <p className="text-xs text-destructive">{errors.position.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tagline</Label>
          <Input
            {...register("tagline")}
            placeholder="Short description..."
            className="bg-secondary border-border"
          />
        </div>

        <div className="space-y-2">
          <Label>Bio</Label>
          <Textarea
            {...register("bio")}
            placeholder="Player biography..."
            rows={3}
            className="bg-secondary border-border resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label>Photo</Label>
          <UploadDropzone
            value={photoUrl}
            onChange={(value) => setValue("photoUrl", value || "")}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
          <div>
            <Label>Status</Label>
            <p className="text-xs text-muted-foreground">Player is currently active</p>
          </div>
          <Switch
            checked={watch("status") === "active"}
            onCheckedChange={(checked) =>
              setValue("status", checked ? "active" : "inactive")
            }
          />
        </div>

        <div className="space-y-4">
          <Label>Social Links (Optional)</Label>
          <div className="grid grid-cols-3 gap-4">
            <Input
              {...register("socials.instagram")}
              placeholder="@instagram"
              className="bg-secondary border-border"
            />
            <Input
              {...register("socials.twitter")}
              placeholder="@twitter"
              className="bg-secondary border-border"
            />
            <Input
              {...register("socials.linkedin")}
              placeholder="LinkedIn URL"
              className="bg-secondary border-border"
            />
          </div>
        </div>
      </ModalForm>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Player"
        description={`Are you sure you want to delete ${selectedPlayer?.fullName}? This action cannot be undone.`}
        onConfirm={() => selectedPlayer && deleteMutation.mutate(selectedPlayer.id)}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
