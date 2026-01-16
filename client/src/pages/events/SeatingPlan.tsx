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
import { useParams } from "wouter";

export default function SeatingPlan() {
  const { user } = useAuth();
  const params = useParams();
  const eventId = params?.id ? Number(params.id) : 0;

  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState(8);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "table" | "guest"; id: number } | null>(null);

  // Get utils at top level (required for hooks)
  const utils = trpc.useUtils();

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
      utils.tablePlanning.getEventTablesWithGuests.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to create table: ${error.message}`);
    },
  });

  const deleteTableMutation = trpc.tables.delete.useMutation({
    onSuccess: () => {
      setDeleteConfirm(null);
      toast.success("Table deleted successfully");
      utils.tablePlanning.getEventTablesWithGuests.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete table: ${error.message}`);
    },
  });

  const assignGuestMutation = trpc.tablePlanning.assignGuestToTable.useMutation({
    onSuccess: () => {
      setSearchQuery("");
      toast.success("Guest assigned to table");
      utils.tablePlanning.getEventTablesWithGuests.invalidate();
      utils.tablePlanning.getUnassignedGuests.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to assign guest: ${error.message}`);
    },
  });

  const unassignGuestMutation = trpc.tablePlanning.unassignGuestFromTable.useMutation({
    onSuccess: () => {
      setDeleteConfirm(null);
      toast.success("Guest unassigned from table");
      utils.tablePlanning.getEventTablesWithGuests.invalidate();
      utils.tablePlanning.getUnassignedGuests.invalidate();
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
    const totalGuests = (tablesWithGuests.reduce((sum, t) => sum + (t.assignedGuests?.length || 0), 0) || 0) + unassignedGuests.length;
    const assignedGuests = tablesWithGuests.reduce((sum, t) => sum + (t.assignedGuests?.length || 0), 0) || 0;
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
  const selectedTableGuests = selectedTable?.assignedGuests || [];
  const selectedTableCapacity = selectedTable?.seatCount || 0;
  const selectedTableUtilization = selectedTableCapacity > 0 ? Math.round((selectedTableGuests.length / selectedTableCapacity) * 100) : 0;
  const selectedTableAvailableSeats = Math.max(0, selectedTableCapacity - selectedTableGuests.length);

  // Filter search results
  const filteredSearchResults = useMemo(() => {
    if (!searchQuery) return [];
    return searchResults.filter((g: any) => !selectedTableGuests.some((sg: any) => sg.id === g.id));
  }, [searchQuery, searchResults, selectedTableGuests]);

  if (!eventId) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading event details...</p>
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
                      <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
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
                          className="bg-teal-600 hover:bg-teal-700"
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
                  <p className="text-center text-gray-500 py-8">No tables yet. Create one to get started!</p>
                ) : (
                  <Tabs value={String(selectedTableId || tablesWithGuests[0]?.id)} onValueChange={(val) => setSelectedTableId(Number(val))}>
                    <TabsList className="w-full justify-start overflow-x-auto">
                      {tablesWithGuests.map((table) => (
                        <TabsTrigger key={table.id} value={String(table.id)} className="text-xs">
                          {table.name}
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {table.assignedGuests?.length || 0}/{table.seatCount}
                          </Badge>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {tablesWithGuests.map((table) => (
                      <TabsContent key={table.id} value={String(table.id)} className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold">{table.name}</h3>
                            <p className="text-sm text-gray-600">
                              {table.assignedGuests?.length || 0} of {table.seatCount} seats filled
                            </p>
                          </div>
                          <AlertDialog>
                            <AlertDialogAction asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirm({ type: "table", id: table.id })}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </AlertDialogAction>
                            {deleteConfirm?.type === "table" && deleteConfirm?.id === table.id && (
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Table</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this table? All guest assignments will be lost.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTable(table.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogContent>
                            )}
                          </AlertDialog>
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
                                selectedTableUtilization <= 75
                                  ? "bg-green-500"
                                  : selectedTableUtilization <= 90
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min(selectedTableUtilization, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Assigned guests */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Assigned Guests ({selectedTableGuests.length})</h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {selectedTableGuests.length === 0 ? (
                              <p className="text-sm text-gray-500">No guests assigned yet</p>
                            ) : (
                              selectedTableGuests.map((guest: any) => (
                                <div key={guest.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                  <span className="text-sm">{guest.firstName} {guest.lastName}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUnassignGuest(guest.id)}
                                  >
                                    <Trash2 className="w-3 h-3 text-gray-400" />
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
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
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-teal-600" />
                  Unassigned Guests ({unassignedGuests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTableId && selectedTableAvailableSeats > 0 ? (
                  <>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search guests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>

                    {filteredSearchResults.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredSearchResults.map((guest) => (
                          <div key={guest.id} className="flex items-center justify-between bg-teal-50 p-2 rounded">
                            <span className="text-sm">{guest.firstName} {guest.lastName}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAssignGuest(guest.id)}
                              disabled={assignGuestMutation.isPending}
                            >
                              Assign
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : searchQuery ? (
                      <p className="text-sm text-gray-500 text-center py-4">No matching guests found</p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {unassignedGuests.map((guest) => (
                          <div key={guest.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm">{guest.firstName} {guest.lastName}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAssignGuest(guest.id)}
                              disabled={assignGuestMutation.isPending}
                            >
                              Assign
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    {!selectedTableId ? (
                      <>
                        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Select a table to assign guests</p>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Table is full</p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
