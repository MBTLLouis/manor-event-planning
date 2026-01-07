import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, X, Plus } from "lucide-react";
import { toast } from "sonner";
import CoupleLayout from "@/components/CoupleLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function CoupleTablePlanningContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState(8);

  // Get couple's event
  const { data: events, isLoading: eventsLoading } = trpc.events.list.useQuery();
  const coupleEvent = events?.[0];
  const eventId = coupleEvent?.id || 0;

  // Queries
  const { data: tablesData, isLoading: tablesLoading, refetch: refetchTables } = trpc.tablePlanning.getEventTablesWithGuests.useQuery(
    { eventId },
    { enabled: eventId > 0 }
  );

  const { data: unassignedGuests, isLoading: unassignedLoading } = trpc.tablePlanning.getUnassignedGuests.useQuery(
    { eventId },
    { enabled: eventId > 0 }
  );

  const { data: searchResults, isLoading: searchLoading } = trpc.tablePlanning.searchGuests.useQuery(
    { eventId, query: searchQuery },
    { enabled: eventId > 0 && searchQuery.length > 0 }
  );

  const { data: floorPlans } = trpc.floorPlans.list.useQuery(
    { eventId },
    { enabled: eventId > 0 }
  );

  // Mutations
  const createTableMutation = trpc.tables.create.useMutation({
    onSuccess: () => {
      toast.success("Table created successfully");
      setNewTableName("");
      setNewTableCapacity(8);
      setIsAddingTable(false);
      refetchTables();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create table");
    },
  });

  const assignGuestMutation = trpc.tablePlanning.assignGuestToTable.useMutation({
    onSuccess: () => {
      toast.success("Guest assigned successfully");
      refetchTables();
      setSearchQuery("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to assign guest");
    },
  });

  const unassignGuestMutation = trpc.tablePlanning.unassignGuestFromTable.useMutation({
    onSuccess: () => {
      toast.success("Guest unassigned successfully");
      refetchTables();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unassign guest");
    },
  });

  const deleteTableMutation = trpc.tables.delete.useMutation({
    onSuccess: () => {
      toast.success("Table deleted successfully");
      setSelectedTableId(null);
      refetchTables();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete table");
    },
  });

  // Get guests to display (search results or unassigned)
  const guestsToDisplay = useMemo(() => {
    if (searchQuery.length > 0 && searchResults) {
      return searchResults;
    }
    return unassignedGuests || [];
  }, [searchQuery, searchResults, unassignedGuests]);

  const handleCreateTable = async () => {
    if (!newTableName.trim()) {
      toast.error("Table name is required");
      return;
    }

    if (!floorPlans || floorPlans.length === 0) {
      toast.error("No floor plan found for this event");
      return;
    }

    const floorPlanId = floorPlans[0].id;

    createTableMutation.mutate({
      floorPlanId,
      name: newTableName,
      tableType: "round",
      seatCount: newTableCapacity,
      positionX: Math.random() * 500,
      positionY: Math.random() * 500,
    });
  };

  const handleAssignGuest = (guestId: number, tableId: number) => {
    assignGuestMutation.mutate({ guestId, tableId });
  };

  const handleUnassignGuest = (guestId: number) => {
    unassignGuestMutation.mutate({ guestId });
  };

  const handleDeleteTable = (tableId: number) => {
    if (confirm("Are you sure you want to delete this table? All guest assignments will be lost.")) {
      deleteTableMutation.mutate({ id: tableId });
    }
  };

  if (eventsLoading || tablesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!coupleEvent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No event found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Seating Arrangements</h1>
          <p className="text-muted-foreground">
            Organize your guests by assigning them to tables
          </p>
        </div>
        <Dialog open={isAddingTable} onOpenChange={setIsAddingTable}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-rose-600 hover:bg-rose-700">
              <Plus className="w-4 h-4" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Table</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Table Name</label>
                <Input
                  placeholder="e.g., Table 1, Head Table"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Capacity (Seats)</label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(parseInt(e.target.value))}
                />
              </div>
              <Button
                onClick={handleCreateTable}
                disabled={createTableMutation.isPending}
                className="w-full bg-rose-600 hover:bg-rose-700"
              >
                {createTableMutation.isPending ? "Creating..." : "Create Table"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tables Section */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Tables ({tablesData?.length || 0})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tablesData && tablesData.length > 0 ? (
              tablesData.map((table: any) => (
                <Card
                  key={table.id}
                  className={`cursor-pointer transition-all ${
                    selectedTableId === table.id ? "ring-2 ring-rose-500" : ""
                  }`}
                  onClick={() => setSelectedTableId(table.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{table.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {table.filledSeats}/{table.seatCount} seats
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTable(table.id);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-rose-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${(table.filledSeats / table.seatCount) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {table.assignedGuests.map((guest: any) => (
                          <Badge
                            key={guest.id}
                            className="cursor-pointer bg-rose-100 text-rose-900 hover:bg-rose-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnassignGuest(guest.id);
                            }}
                          >
                            {guest.firstName}
                            <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="lg:col-span-2">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No tables created yet. Click "Add Table" to get started.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Guest Assignment Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Assign Guests</h2>

          {selectedTableId ? (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search guests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <ScrollArea className="h-[500px] border rounded-lg p-4">
                {searchLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : guestsToDisplay.length > 0 ? (
                  <div className="space-y-2">
                    {guestsToDisplay.map((guest: any) => (
                      <Button
                        key={guest.id}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => handleAssignGuest(guest.id, selectedTableId)}
                        disabled={assignGuestMutation.isPending}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {guest.firstName} {guest.lastName}
                          </span>
                          {guest.email && (
                            <span className="text-xs text-muted-foreground">{guest.email}</span>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {searchQuery ? "No guests found" : "No unassigned guests"}
                  </p>
                )}
              </ScrollArea>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Select a table to assign guests
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CoupleTablePlanning() {
  return (
    <CoupleLayout>
      <CoupleTablePlanningContent />
    </CoupleLayout>
  );
}
