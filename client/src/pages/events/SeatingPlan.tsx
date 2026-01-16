import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Plus, Trash2, Users, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function SeatingPlan() {
  const { user } = useAuth();
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState(8);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "table" | "guest"; id: number } | null>(null);

  // Get couple's event
  const { data: events = [] } = trpc.events.list.useQuery();
  const coupleEvent = events[0];
  const eventId = coupleEvent?.id || 0;

  // Queries
  const { data: tablesWithGuests = [] } = trpc.tablePlanning.getEventTablesWithGuests.useQuery(
    { eventId },
    { enabled: !!eventId }
  );

  const { data: unassignedGuests = [] } = trpc.tablePlanning.getUnassignedGuests.useQuery(
    { eventId },
    { enabled: !!eventId }
  );

  const { data: searchResults = [] } = trpc.tablePlanning.searchGuests.useQuery(
    { eventId, query: searchQuery },
    { enabled: !!eventId && searchQuery.length > 0 }
  );

  // Mutations
  const createTableMutation = trpc.tables.create.useMutation({
    onSuccess: () => {
      setNewTableName("");
      setNewTableCapacity(8);
      toast.success("Table created successfully");
      trpc.useUtils().tablePlanning.getEventTablesWithGuests.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to create table: ${error.message}`);
    },
  });

  const deleteTableMutation = trpc.tables.delete.useMutation({
    onSuccess: () => {
      setDeleteConfirm(null);
      toast.success("Table deleted successfully");
      trpc.useUtils().tablePlanning.getEventTablesWithGuests.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete table: ${error.message}`);
    },
  });

  const assignGuestMutation = trpc.tablePlanning.assignGuestToTable.useMutation({
    onSuccess: () => {
      setSearchQuery("");
      toast.success("Guest assigned to table");
      trpc.useUtils().tablePlanning.getEventTablesWithGuests.invalidate();
      trpc.useUtils().tablePlanning.getUnassignedGuests.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to assign guest: ${error.message}`);
    },
  });

  const unassignGuestMutation = trpc.tablePlanning.unassignGuestFromTable.useMutation({
    onSuccess: () => {
      setDeleteConfirm(null);
      toast.success("Guest unassigned from table");
      trpc.useUtils().tablePlanning.getEventTablesWithGuests.invalidate();
      trpc.useUtils().tablePlanning.getUnassignedGuests.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to unassign guest: ${error.message}`);
    },
  });

  // Handlers
  const handleCreateTable = () => {
    if (!newTableName.trim()) {
      toast.error("Please enter a table name");
      return;
    }
    if (newTableCapacity < 1) {
      toast.error("Table capacity must be at least 1");
      return;
    }
    createTableMutation.mutate({
      eventId,
      name: newTableName,
      tableType: "round",
      seatCount: newTableCapacity,
      positionX: 0,
      positionY: 0,
    });
  };

  const handleDeleteTable = (tableId: number) => {
    deleteTableMutation.mutate({ id: tableId });
  };

  const handleAssignGuest = (guestId: number) => {
    if (!selectedTableId) {
      toast.error("Please select a table first");
      return;
    }
    assignGuestMutation.mutate({ guestId, tableId: selectedTableId });
  };

  const handleUnassignGuest = (guestId: number) => {
    unassignGuestMutation.mutate({ guestId });
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalGuests = (tablesWithGuests.reduce((sum, t) => sum + (t.guests?.length || 0), 0) || 0) + unassignedGuests.length;
    const assignedGuests = tablesWithGuests.reduce((sum, t) => sum + (t.guests?.length || 0), 0) || 0;
    const totalCapacity = tablesWithGuests.reduce((sum, t) => sum + (t.seatCount || 0), 0) || 0;
    const utilization = totalCapacity > 0 ? Math.round((assignedGuests / totalCapacity) * 100) : 0;

    return {
      totalGuests,
      assignedGuests,
      unassignedGuests: unassignedGuests.length,
      totalCapacity,
      utilization,
    };
  }, [tablesWithGuests, unassignedGuests]);

  // Get selected table
  const selectedTable = selectedTableId ? tablesWithGuests.find(t => t.id === selectedTableId) : null;
  const selectedTableGuests = selectedTable?.guests || [];
  const selectedTableCapacity = selectedTable?.seatCount || 0;
  const selectedTableUtilization = selectedTableCapacity > 0 ? Math.round((selectedTableGuests.length / selectedTableCapacity) * 100) : 0;
  const selectedTableAvailableSeats = Math.max(0, selectedTableCapacity - selectedTableGuests.length);

  // Filter search results
  const filteredSearchResults = useMemo(() => {
    if (!searchQuery) return [];
    return searchResults.filter((g: any) => !selectedTableGuests.some((sg: any) => sg.id === g.id));
  }, [searchQuery, searchResults, selectedTableGuests]);

  if (!coupleEvent) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading your wedding details...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Seating Plan</h1>
            <p className="text-gray-600 mt-1">Organize your guests by assigning them to tables</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Guests</p>
                <p className="text-2xl font-bold text-teal-600">{stats.totalGuests}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-green-600">{stats.assignedGuests}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold text-amber-600">{stats.unassignedGuests}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Utilization</p>
                <p className="text-2xl font-bold text-blue-600">{stats.utilization}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Tables */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tables ({tablesWithGuests.length})</span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-teal-600 hover:bg-rose-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Table
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Table</DialogTitle>
                        <DialogDescription>Add a new table to your seating plan</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="tableName">Table Name</Label>
                          <Input
                            id="tableName"
                            placeholder="e.g., Table 1, Family Table"
                            value={newTableName}
                            onChange={(e) => setNewTableName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="capacity">Seat Capacity</Label>
                          <Input
                            id="capacity"
                            type="number"
                            min="1"
                            value={newTableCapacity}
                            onChange={(e) => setNewTableCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleCreateTable}
                          disabled={createTableMutation.isPending}
                          className="bg-teal-600 hover:bg-rose-700"
                        >
                          {createTableMutation.isPending ? "Creating..." : "Create Table"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tablesWithGuests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No tables yet. Create one to get started.</p>
                ) : (
                  <Tabs value={selectedTableId?.toString() || ""} onValueChange={(v) => setSelectedTableId(v ? parseInt(v) : null)}>
                    <TabsList className="grid w-full grid-cols-auto gap-2 mb-4">
                      {tablesWithGuests.map((table) => (
                        <TabsTrigger key={table.id} value={table.id.toString()} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span>{table.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {table.guests?.length || 0}/{table.seatCount}
                            </Badge>
                          </div>
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {tablesWithGuests.map((table) => (
                      <TabsContent key={table.id} value={table.id.toString()} className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{table.name}</h3>
                            <p className="text-sm text-gray-600">
                              {table.guests?.length || 0} of {table.seatCount} seats occupied
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteConfirm({ type: "table", id: table.id })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Capacity bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Capacity</span>
                            <span className="font-semibold">{selectedTableUtilization}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                selectedTableUtilization >= 100 ? "bg-red-500" :
                                selectedTableUtilization >= 80 ? "bg-amber-500" :
                                "bg-green-500"
                              }`}
                              style={{ width: `${Math.min(selectedTableUtilization, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Guests at table */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Assigned Guests ({selectedTableGuests.length})</h4>
                          {selectedTableGuests.length === 0 ? (
                            <p className="text-sm text-gray-500">No guests assigned yet</p>
                          ) : (
                            <div className="space-y-2">
                              {selectedTableGuests.map((guest: any) => (
                                <div key={guest.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <span className="text-sm">{guest.firstName} {guest.lastName}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteConfirm({ type: "guest", id: guest.id })}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Available seats warning */}
                        {selectedTableAvailableSeats > 0 && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                            {selectedTableAvailableSeats} seat{selectedTableAvailableSeats !== 1 ? 's' : ''} available
                          </div>
                        )}
                        {selectedTableAvailableSeats === 0 && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Table is at full capacity
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Guest Assignment */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Assign Guests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTableId ? (
                  <>
                    <div className="p-3 bg-teal-50 border border-rose-200 rounded text-sm text-rose-800">
                      Assigning to: <span className="font-semibold">{selectedTable?.name}</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guestSearch">Search Guests</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="guestSearch"
                          placeholder="Search by name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Search results */}
                    {searchQuery && (
                      <div className="border rounded-lg max-h-96 overflow-y-auto">
                        {filteredSearchResults.length === 0 ? (
                          <p className="text-sm text-gray-500 p-3">No unassigned guests found</p>
                        ) : (
                          <div className="space-y-1">
                            {filteredSearchResults.map((guest: any) => (
                              <button
                                key={guest.id}
                                onClick={() => handleAssignGuest(guest.id)}
                                disabled={assignGuestMutation.isPending || selectedTableAvailableSeats === 0}
                                className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <div className="font-medium">{guest.firstName} {guest.lastName}</div>
                                {guest.email && <div className="text-xs text-gray-500">{guest.email}</div>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Unassigned guests list */}
                    {!searchQuery && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Unassigned Guests ({unassignedGuests.length})</h4>
                        <div className="border rounded-lg max-h-96 overflow-y-auto">
                          {unassignedGuests.length === 0 ? (
                            <p className="text-sm text-gray-500 p-3">All guests are assigned!</p>
                          ) : (
                            <div className="space-y-1">
                              {unassignedGuests.slice(0, 10).map((guest: any) => (
                                <button
                                  key={guest.id}
                                  onClick={() => handleAssignGuest(guest.id)}
                                  disabled={assignGuestMutation.isPending || selectedTableAvailableSeats === 0}
                                  className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <div className="font-medium">{guest.firstName} {guest.lastName}</div>
                                </button>
                              ))}
                              {unassignedGuests.length > 10 && (
                                <p className="text-xs text-gray-500 p-3">
                                  +{unassignedGuests.length - 10} more guests (use search to find)
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">Select a table to assign guests</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete confirmation dialogs */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteConfirm?.type === "table" ? "Delete Table?" : "Unassign Guest?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteConfirm?.type === "table"
                  ? "This will delete the table and unassign all guests. This action cannot be undone."
                  : "This will remove the guest from the table."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm?.type === "table") {
                  handleDeleteTable(deleteConfirm.id);
                } else {
                  handleUnassignGuest(deleteConfirm!.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteConfirm?.type === "table" ? "Delete Table" : "Unassign Guest"}
            </AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
