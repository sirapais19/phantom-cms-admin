import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, differenceInDays } from "date-fns";
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  MapPin,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { tournamentsApi } from "@/api";
import type { Tournament } from "@/types";

const tournamentSchema = z.object({
  name: z.string().min(2, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  location: z.string().min(1, "Location is required"),
  division: z.enum(["Open", "Mixed"]),
  status: z.enum(["Upcoming", "Past"]),
  featuredNextTournament: z.boolean(),
});

type TournamentFormData = z.infer<typeof tournamentSchema>;

export default function Schedule() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: tournamentsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: tournamentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      toast({ title: "Tournament added successfully" });
      setIsModalOpen(false);
      reset();
    },
    onError: () => {
      toast({ title: "Failed to add tournament", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tournament> }) =>
      tournamentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      toast({ title: "Tournament updated successfully" });
      setIsModalOpen(false);
      setSelectedTournament(null);
      reset();
    },
    onError: () => {
      toast({ title: "Failed to update tournament", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tournamentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      toast({ title: "Tournament deleted successfully" });
      setIsDeleteOpen(false);
      setSelectedTournament(null);
    },
    onError: () => {
      toast({ title: "Failed to delete tournament", variant: "destructive" });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      division: "Open",
      status: "Upcoming",
      featuredNextTournament: false,
    },
  });

  const handleEdit = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setValue("name", tournament.name);
    setValue("startDate", tournament.startDate);
    setValue("endDate", tournament.endDate);
    setValue("location", tournament.location);
    setValue("division", tournament.division);
    setValue("status", tournament.status);
    setValue("featuredNextTournament", tournament.featuredNextTournament);
    setIsModalOpen(true);
  };

  const handleDelete = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setIsDeleteOpen(true);
  };

  const onSubmit = (data: TournamentFormData) => {
    if (selectedTournament) {
      updateMutation.mutate({ id: selectedTournament.id, data });
    } else {
      createMutation.mutate(data as Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTournament(null);
    reset();
  };

  const upcomingTournaments = tournaments.filter((t) => t.status === "Upcoming");
  const pastTournaments = tournaments.filter((t) => t.status === "Past");
  const nextTournament = tournaments.find((t) => t.featuredNextTournament);

  const columns: ColumnDef<Tournament>[] = [
    {
      accessorKey: "name",
      header: "Tournament",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CalendarIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">{row.original.name}</p>
              {row.original.featuredNextTournament && (
                <Star className="h-3 w-3 text-warning fill-warning" />
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {row.original.location}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "startDate",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {format(new Date(row.original.startDate), "MMM d")} -{" "}
          {format(new Date(row.original.endDate), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      accessorKey: "division",
      header: "Division",
      cell: ({ row }) => (
        <StatusBadge status={row.original.division} variant="default" />
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          variant={row.original.status === "Upcoming" ? "active" : "inactive"}
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
          <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
          <p className="text-muted-foreground">Manage tournaments and events</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Tournament
        </Button>
      </div>

      {/* Next Tournament Card */}
      {nextTournament && (
        <Card className="bg-card border-border overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Star className="h-5 w-5 text-warning fill-warning" />
              Next Tournament
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {nextTournament.name}
                </h3>
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />
                  {nextTournament.location}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(nextTournament.startDate), "MMMM d")} -{" "}
                  {format(new Date(nextTournament.endDate), "d, yyyy")}
                </p>
              </div>
              <div className="text-center md:text-right">
                <div className="text-3xl font-bold text-primary">
                  {differenceInDays(new Date(nextTournament.startDate), new Date())}
                </div>
                <p className="text-sm text-muted-foreground">days to go</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingTournaments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past Results ({pastTournaments.length})
          </TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingTournaments.length === 0 && !isLoading ? (
            <EmptyState
              icon={CalendarIcon}
              title="No upcoming tournaments"
              description="Add a tournament to show here"
              actionLabel="Add Tournament"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <DataTable
              columns={columns}
              data={upcomingTournaments}
              searchKey="name"
              searchPlaceholder="Search tournaments..."
              isLoading={isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastTournaments.length === 0 && !isLoading ? (
            <EmptyState
              icon={CalendarIcon}
              title="No past tournaments"
              description="Completed tournaments will appear here"
            />
          ) : (
            <DataTable
              columns={columns}
              data={pastTournaments}
              searchKey="name"
              isLoading={isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Calendar view coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modal */}
      <ModalForm
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        title={selectedTournament ? "Edit Tournament" : "Add Tournament"}
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        submitLabel={selectedTournament ? "Update" : "Add"}
        size="lg"
      >
        <div className="space-y-2">
          <Label>Tournament Name *</Label>
          <Input
            {...register("name")}
            placeholder="Northeast Regionals 2025"
            className="bg-secondary border-border"
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date *</Label>
            <Input
              type="date"
              {...register("startDate")}
              className="bg-secondary border-border"
            />
            {errors.startDate && (
              <p className="text-xs text-destructive">{errors.startDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>End Date *</Label>
            <Input
              type="date"
              {...register("endDate")}
              className="bg-secondary border-border"
            />
            {errors.endDate && (
              <p className="text-xs text-destructive">{errors.endDate.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Location *</Label>
          <Input
            {...register("location")}
            placeholder="Boston, MA"
            className="bg-secondary border-border"
          />
          {errors.location && (
            <p className="text-xs text-destructive">{errors.location.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Division</Label>
            <Select
              value={watch("division")}
              onValueChange={(value: "Open" | "Mixed" ) => setValue("division", value)}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={watch("status")}
              onValueChange={(value: "Upcoming" | "Past") => setValue("status", value)}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="Upcoming">Upcoming</SelectItem>
                <SelectItem value="Past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
          <div>
            <Label>Featured Next Tournament</Label>
            <p className="text-xs text-muted-foreground">Show as the countdown tournament</p>
          </div>
          <Switch
            checked={watch("featuredNextTournament")}
            onCheckedChange={(checked) => setValue("featuredNextTournament", checked)}
          />
        </div>
      </ModalForm>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Tournament"
        description={`Are you sure you want to delete "${selectedTournament?.name}"?`}
        onConfirm={() => selectedTournament && deleteMutation.mutate(selectedTournament.id)}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
