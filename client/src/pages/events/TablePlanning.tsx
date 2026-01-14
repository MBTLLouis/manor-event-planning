import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, X, Plus, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

function CoupleTablePlanningContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState(8);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Get event from route params
  const eventIdParam = window.location.pathname.split('/')[2];
  const eventId = parseInt(eventIdParam) || 0;
  const { data: event, isLoading: eventLoading } = trpc.events.getById.useQuery(
    { id: eventId },
    { enabled: eventId > 0 }
  );

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

  // Mutations
  const createTableMutation = trpc.tables.create.useMutation({
    onSuccess: () => {
      toast.success("Table created successfully!");
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
      toast.success("Guest assigned to table");
      refetchTables();
      setSearchQuery("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to assign guest");
    },
  });

  const unassignGuestMutation = trpc.tablePlanning.unassignGuestFromTable.useMutation({
    onSuccess: () => {
      toast.success("Guest removed from table");
      refetchTables();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unassign guest");
    },
  });

  const deleteTableMutation = trpc.tables.delete.useMutation({
    onSuccess: () => {
      toast.success("Table deleted");
      setSelectedTableId(null);
      setDeleteConfirmId(null);
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

  // Calculate statistics
  const stats = useMemo(() => {
    const totalGuests = (unassignedGuests?.length || 0) + (tablesData?.reduce((sum: number, t: any) => sum + (t.filledSeats || 0), 0) || 0);
    const assignedGuests = tablesData?.reduce((sum: number, t: any) => sum + (t.filledSeats || 0), 0) || 0;
    const totalCapacity = tablesData?.reduce((sum: number, t: any) => sum + (t.seatCount || 0), 0) || 0;
    
    return {
      totalGuests,
      assignedGuests,
      unassignedCount: unassignedGuests?.length || 0,
      totalCapacity,
      utilizationPercent: totalCapacity > 0 ? Math.round((assignedGuests / totalCapacity) * 100) : 0,
    };
  }, [tablesData, unassignedGuests]);

  const handleCreateTable = () => {
    if (!newTableName.trim()) {
      toast.error("Please enter a table name");
      return;
    }
    if (newTableCapacity < 1) {
      toast.error("Capacity must be at least 1");
      return;
    }

    createTableMutation.mutate({
      eventId,
      name: newTableName,
      tableType: "round",
      seatCount: newTableCapacity,
      positionX: 0,
      positionY: 0,
      floorPlanId: null,
    });
  };

  const handleAssignGuest = (guestId: number, tableId: number) => {
    assignGuestMutation.mutate({ guestId, tableId });
  };

  const handleUnassignGuest = (guestId: number) => {
    unassignGuestMutation.mutate({ guestId });
  };

  const handleDeleteTable = (tableId: number) => {
    deleteTableMutation.mutate({ id: tableId });
  };

  const selectedTable = tablesData?.find((t: any) => t.id === selectedTableId);

  if (eventLoading || tablesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No event found. Please create an event first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Seating Arrangements</h1>
            <p className="text-gray-600 mt-2">
              Organize your {stats.totalGuests} guests by assigning them to tables
            </p>
          </div>
          <Dialog open={isAddingTable} onOpenChange={setIsAddingTable}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
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
                  <label className="text-sm font-medium text-gray-700">Table Name</label>
                  <Input
                    placeholder="e.g., Table 1, Head Table, Family Table"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Capacity (Seats)</label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleCreateTable}
                  disabled={createTableMutation.isPending}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {createTableMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Table"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Guests</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalGuests}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Assigned</p>
                <p className="text-3xl font-bold text-teal-600">{stats.assignedGuests}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Unassigned</p>
                <p className="text-3xl font-bold text-amber-600">{stats.unassignedCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Utilization</p>
                <p className="text-3xl font-bold text-blue-600">{stats.utilizationPercent}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tables Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Tables</h2>
              <span className="text-sm text-gray-600">{tablesData?.length || 0} tables</span>
            </div>

            {tablesData && tablesData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tablesData.map((table: any) => (
                  <Card
                    key={table.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedTableId === table.id
                        ? "ring-2 ring-rose-600 shadow-lg"
                        : "hover:border-rose-200"
                    }`}
                    onClick={() => setSelectedTableId(table.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-gray-900">{table.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="w-4 h-4 text-gray-500" />
                            <p className="text-sm text-gray-600">
                              {table.filledSeats}/{table.seatCount} seats
                            </p>
                          </div>
                        </div>
                        <AlertDialog>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(table.id);
                            }}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Capacity Bar */}
                        <div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-2.5 rounded-full transition-all ${
                                table.filledSeats === table.seatCount
                                  ? "bg-red-500"
                                  : table.filledSeats > table.seatCount * 0.75
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                              style={{
                                width: `${Math.min((table.filledSeats / table.seatCount) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Guest Badges */}
                        {table.assignedGuests && table.assignedGuests.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {table.assignedGuests.map((guest: any) => (
                              <Badge
                                key={guest.id}
                                className="bg-rose-100 text-rose-900 hover:bg-rose-200 cursor-pointer transition-colors"
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
                        ) : (
                          <p className="text-sm text-gray-500 italic">No guests assigned</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="pt-12 text-center pb-12">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 mb-4">No tables created yet</p>
                  <p className="text-sm text-gray-500">Click "Add Table" to create your first table</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Guest Assignment Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Assign Guests</h2>
              {selectedTable && (
                <span className="text-sm bg-rose-100 text-rose-900 px-2 py-1 rounded">
                  {selectedTable.name}
                </span>
              )}
            </div>

            {selectedTableId ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search guests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <ScrollArea className="h-[500px] border rounded-lg p-4 bg-white">
                  {searchLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
                    </div>
                  ) : guestsToDisplay.length > 0 ? (
                    <div className="space-y-2">
                      {guestsToDisplay.map((guest: any) => (
                        <Button
                          key={guest.id}
                          variant="outline"
                          className="w-full justify-start text-left h-auto py-3 px-3 hover:bg-rose-50 hover:border-rose-300"
                          onClick={() => handleAssignGuest(guest.id, selectedTableId)}
                          disabled={assignGuestMutation.isPending}
                        >
                          <div className="flex flex-col w-full">
                            <span className="font-medium text-gray-900">
                              {guest.firstName} {guest.lastName}
                            </span>
                            {guest.email && (
                              <span className="text-xs text-gray-500">{guest.email}</span>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-600">
                        {searchQuery ? "No guests found" : "No unassigned guests"}
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="pt-12 text-center pb-12">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">Select a table to assign guests</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the table and unassign all {tablesData?.find((t: any) => t.id === deleteConfirmId)?.filledSeats || 0} guests. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  handleDeleteTable(deleteConfirmId);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

export default function TablePlanning() {
  return <CoupleTablePlanningContent />;
}
