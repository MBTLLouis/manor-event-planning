import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import EmployeeLayout from "@/components/EmployeeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Plus, Trash2, Users, AlertTriangle, Edit2, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useParams, useLocation } from "wouter";

export default function SeatingPlan() {
  const { user } = useAuth();
  const params = useParams();
  const eventId = params?.id ? Number(params.id) : 0;
  const [, setLocation] = useLocation();

  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState(8);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTableId, setEditingTableId] = useState<number | null>(null);
  const [editTableName, setEditTableName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get utils at top level (required for hooks)
  const utils = trpc.useUtils();

  // Get event details
  const { data: event } = trpc.events.getById.useQuery({ id: eventId }, { enabled: !!eventId });

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
      setDialogOpen(false);
      toast.success("Table created successfully");
      utils.tablePlanning.getEventTablesWithGuests.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to create table: ${error.message}`);
    },
  });

  const updateTableMutation = trpc.tables.update.useMutation({
    onSuccess: () => {
      setEditingTableId(null);
      setEditTableName("");
      toast.success("Table updated successfully");
      utils.tablePlanning.getEventTablesWithGuests.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update table: ${error.message}`);
    },
  });

  const deleteTableMutation = trpc.tables.delete.useMutation({
    onSuccess: () => {
      setDeleteConfirm(null);
      if (selectedTableId === deleteConfirm) {
        setSelectedTableId(null);
      }
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

  const handleUpdateTableName = (tableId: number) => {
    if (!editTableName.trim()) {
      toast.error("Please enter a table name");
      return;
    }
    updateTableMutation.mutate({
      id: tableId,
      name: editTableName,
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
      <EmployeeLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Button variant="ghost" className="mb-4" onClick={() => setLocation(`/events/${eventId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {event?.coupleName1 || 'Event'}
        </Button>
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
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Tables ({tablesWithGuests.length})</h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-teal-600 hover:bg-teal-700">
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
            </div>

            {tablesWithGuests.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500 py-8">No tables yet. Create one to get started!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tablesWithGuests.map((table) => {
                  const isSelected = selectedTableId === table.id;
                  const utilization = table.seatCount > 0 ? Math.round(((table.assignedGuests?.length || 0) / table.seatCount) * 100) : 0;
                  
                  return (
                    <Card
                      key={table.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? "ring-2 ring-teal-600 bg-teal-50" : "hover:shadow-lg"
                      }`}
                      onClick={() => setSelectedTableId(table.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {editingTableId === table.id ? (
                              <div className="flex gap-2">
                                <Input
                                  value={editTableName}
                                  onChange={(e) => setEditTableName(e.target.value)}
                                  className="h-8"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateTableName(table.id)}
                                  disabled={updateTableMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingTableId(null)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <CardTitle className="text-lg">{table.name}</CardTitle>
                            )}
                          </div>
                          {editingTableId !== table.id && (
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTableId(table.id);
                                  setEditTableName(table.name);
                                }}
                              >
                                <Edit2 className="w-4 h-4 text-blue-600" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogAction asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirm(table.id);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </AlertDialogAction>
                                {deleteConfirm === table.id && (
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Table</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{table.name}"? All guest assignments will be lost.
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
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            {table.assignedGuests?.length || 0} of {table.seatCount} seats
                          </span>
                          <Badge variant="secondary">{utilization}%</Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              utilization <= 75
                                ? "bg-green-500"
                                : utilization <= 90
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Guests ({table.assignedGuests?.length || 0})</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {(table.assignedGuests?.length || 0) === 0 ? (
                              <p className="text-xs text-gray-500">No guests assigned</p>
                            ) : (
                              table.assignedGuests?.map((guest: any) => (
                                <div key={guest.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                                  <span>{guest.firstName} {guest.lastName}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUnassignGuest(guest.id);
                                    }}
                                  >
                                    <X className="w-3 h-3 text-gray-400" />
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
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
                          <div key={guest.id} className="flex items-center justify-between bg-teal-50 p-2 rounded text-sm">
                            <span>{guest.firstName} {guest.lastName}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAssignGuest(guest.id)}
                              disabled={assignGuestMutation.isPending}
                              className="h-7 text-xs"
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
                          <div key={guest.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                            <span>{guest.firstName} {guest.lastName}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAssignGuest(guest.id)}
                              disabled={assignGuestMutation.isPending}
                              className="h-7 text-xs"
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
    </EmployeeLayout>
  );
}
