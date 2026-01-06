'use client';

import { trpc } from '@/lib/trpc';
import CoupleLayout from '@/components/CoupleLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function CoupleSeating() {
  const { data: events = [] } = trpc.events.list.useQuery();
  const coupleEvent = events[0];

  const { data: guests = [] } = trpc.guests.list.useQuery(
    { eventId: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );

  const { data: floorPlans = [] } = trpc.floorPlans.list.useQuery(
    { eventId: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );

  const [isAddTableDialogOpen, setIsAddTableDialogOpen] = useState(false);
  const [isEditTableDialogOpen, setIsEditTableDialogOpen] = useState(false);
  const [isAddGuestDialogOpen, setIsAddGuestDialogOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('8');
  const [editingTable, setEditingTable] = useState<any>(null);
  const [selectedTableForGuest, setSelectedTableForGuest] = useState<number | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<string>('');
  const [guestSearchQuery, setGuestSearchQuery] = useState<string>('');
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');

  const utils = trpc.useUtils();

  const createTableMutation = trpc.tables.create.useMutation({
    onSuccess: () => {
      toast.success('Table added');
      setIsAddTableDialogOpen(false);
      setNewTableName('');
      setNewTableCapacity('8');
      if (coupleEvent) {
        utils.floorPlans.list.invalidate({ eventId: coupleEvent.id });
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add table');
    },
  });

  const updateTableMutation = trpc.tables.update.useMutation({
    onSuccess: () => {
      toast.success('Table updated');
      setIsEditTableDialogOpen(false);
      setEditingTable(null);
      setNewTableName('');
      setNewTableCapacity('8');
      if (coupleEvent) {
        utils.floorPlans.list.invalidate({ eventId: coupleEvent.id });
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update table');
    },
  });

  const deleteTableMutation = trpc.tables.delete.useMutation({
    onSuccess: () => {
      toast.success('Table deleted');
      if (coupleEvent) {
        utils.floorPlans.list.invalidate({ eventId: coupleEvent.id });
        utils.guests.list.invalidate({ eventId: coupleEvent.id });
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete table');
    },
  });

  const updateGuestMutation = trpc.guests.update.useMutation({
    onSuccess: () => {
      toast.success('Guest assigned to table');
      setIsAddGuestDialogOpen(false);
      setSelectedGuestId('');
      setSelectedTableForGuest(null);
      setGuestSearchQuery('');
      setTableSearchQuery('');
      if (coupleEvent) {
        utils.guests.list.invalidate({ eventId: coupleEvent.id });
        utils.floorPlans.list.invalidate({ eventId: coupleEvent.id });
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to assign guest');
    },
  });

  const handleAddTable = () => {
    if (!newTableName.trim()) {
      toast.error('Please enter a table name');
      return;
    }

    createTableMutation.mutate({
      floorPlanId: 1,
      name: newTableName,
      tableType: 'round',
      seatCount: parseInt(newTableCapacity),
      positionX: 0,
      positionY: 0,
    });
  };

  const handleUpdateTable = () => {
    if (!newTableName.trim() || !editingTable) {
      toast.error('Please enter a table name');
      return;
    }

    updateTableMutation.mutate({
      id: editingTable.id,
      name: newTableName,
      positionX: editingTable.positionX || 0,
      positionY: editingTable.positionY || 0,
    });
  };

  const handleDeleteTable = (tableId: number) => {
    if (confirm('Are you sure you want to delete this table?')) {
      deleteTableMutation.mutate({ id: tableId });
    }
  };

  const handleAddGuestToTable = () => {
    if (!selectedGuestId || !selectedTableForGuest) {
      toast.error('Please select a guest and table');
      return;
    }

    const guestId = parseInt(selectedGuestId);
    
    // Check if guest is already assigned to a table
    const guest = guests.find((g: any) => g.id === guestId);
    if (guest?.tableId) {
      toast.error('Guest is already assigned to a table');
      return;
    }

    updateGuestMutation.mutate({
      id: guestId,
      tableId: selectedTableForGuest,
    });
  };

  const handleRemoveGuestFromTable = (guestId: number) => {
    updateGuestMutation.mutate({
      id: guestId,
      tableId: null,
    });
  };

  const openEditDialog = (table: any) => {
    setEditingTable(table);
    setNewTableName(table.name);
    setNewTableCapacity(table.seatCount?.toString() || '8');
    setIsEditTableDialogOpen(true);
  };

  // Get all tables from all floor plans
  const allTables = floorPlans.flatMap((plan: any) => 
    (plan.tables || []).map((table: any) => ({
      ...table,
      floorPlanName: plan.name,
    }))
  );

  // Get unassigned guests
  const unassignedGuests = guests.filter((g: any) => !g.tableId);

  if (!coupleEvent) {
    return (
      <CoupleLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Unable to load your seating details. Please try logging in again.</p>
        </div>
      </CoupleLayout>
    );
  }

  return (
    <CoupleLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-rose-900 mb-2 flex items-center gap-2">
            Seating Arrangements
          </h1>
          <p className="text-gray-600">Organize your guests at tables</p>
        </div>

        <div className="flex gap-4 mb-8">
          <Dialog open={isAddTableDialogOpen} onOpenChange={setIsAddTableDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-rose-600 hover:bg-rose-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
                <DialogDescription>Create a new table for your reception</DialogDescription>
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
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    max="20"
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTable} className="bg-rose-600 hover:bg-rose-700">
                  Add Table
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {allTables.length === 0 ? (
          <Card className="bg-muted">
            <CardContent className="py-12 text-center">
              <p className="text-lg text-gray-600 mb-2">No tables yet</p>
              <p className="text-sm text-muted-foreground">Add tables to plan your seating arrangements</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tables List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Tables ({allTables.length})</h2>
              </div>

              <div className="space-y-3">
                {allTables.map((table: any) => {
                  const tableGuests = guests.filter((g: any) => g.tableId === table.id);
                  const capacity = table.seatCount || 8;
                  const occupancy = tableGuests.length;
                  const isFull = occupancy >= capacity;

                  return (
                    <Card key={table.id} className={isFull ? 'opacity-75' : ''}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{table.name}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {occupancy}/{capacity} guests
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={isFull ? 'destructive' : 'secondary'}>
                              {occupancy}/{capacity}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(table)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTable(table.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {tableGuests.length > 0 ? (
                          <div className="space-y-2">
                            {tableGuests.map((guest: any) => (
                              <div
                                key={guest.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                              >
                                <span className="text-sm font-medium">
                                  {guest.firstName} {guest.lastName}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveGuestFromTable(guest.id)}
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No guests assigned</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Add Guest Section */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assign Guests</CardTitle>
                  <Badge variant="secondary">{unassignedGuests.length} guests</Badge>
                </CardHeader>

                <Dialog open={isAddGuestDialogOpen} onOpenChange={setIsAddGuestDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-rose-600 hover:bg-rose-700 mx-4 mb-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Guest to Table
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Guest to Table</DialogTitle>
                      <DialogDescription>Assign a guest to a table</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="table">Search Table</Label>
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by table name..."
                            value={tableSearchQuery}
                            onChange={(e) => setTableSearchQuery(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                        {allTables.length > 0 ? (
                          <div className="border rounded-md max-h-64 overflow-y-auto">
                            {allTables
                              .filter((table: any) => {
                                const occupancy = guests.filter((g: any) => g.tableId === table.id).length;
                                const capacity = table.seatCount || 8;
                                const isFull = occupancy >= capacity;
                                return !isFull && (!tableSearchQuery || table.name.toLowerCase().includes(tableSearchQuery.toLowerCase()));
                              })
                              .map((table: any) => {
                                const occupancy = guests.filter((g: any) => g.tableId === table.id).length;
                                const capacity = table.seatCount || 8;
                                return (
                                  <button
                                    key={table.id}
                                    onClick={() => {
                                      setSelectedTableForGuest(table.id);
                                      setTableSearchQuery("");
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0 transition-colors"
                                  >
                                    <div className="font-medium text-sm">{table.name}</div>
                                    <div className="text-xs text-gray-500">{occupancy}/{capacity} guests</div>
                                  </button>
                                );
                              })}
                            {allTables.filter((table: any) => {
                              const occupancy = guests.filter((g: any) => g.tableId === table.id).length;
                              const capacity = table.seatCount || 8;
                              const isFull = occupancy >= capacity;
                              return !isFull && (!tableSearchQuery || table.name.toLowerCase().includes(tableSearchQuery.toLowerCase()));
                            }).length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-500">No available tables</div>
                            )}
                          </div>
                        ) : (
                          <div className="border rounded-md px-3 py-2 text-sm text-gray-500">No tables available</div>
                        )}
                        {selectedTableForGuest && (
                          <div className="text-sm text-green-600 font-medium">
                            Selected: {allTables.find((t: any) => t.id === selectedTableForGuest)?.name}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guest">Search Guest</Label>
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by name..."
                            value={guestSearchQuery}
                            onChange={(e) => setGuestSearchQuery(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                        {unassignedGuests.length > 0 ? (
                          <div className="border rounded-md max-h-64 overflow-y-auto">
                            {unassignedGuests
                              .filter((guest: any) =>
                                !guestSearchQuery || `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(guestSearchQuery.toLowerCase())
                              )
                              .map((guest: any) => (
                                <button
                                  key={guest.id}
                                  onClick={() => {
                                    setSelectedGuestId(guest.id.toString());
                                    setGuestSearchQuery("");
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0 transition-colors"
                                >
                                  <div className="font-medium text-sm">{guest.firstName} {guest.lastName}</div>
                                </button>
                              ))}
                            {guestSearchQuery && unassignedGuests.filter((guest: any) =>
                              `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(guestSearchQuery.toLowerCase())
                            ).length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-500">No guests found</div>
                            )}
                          </div>
                        ) : (
                          <div className="border rounded-md px-3 py-2 text-sm text-gray-500">All guests assigned</div>
                        )}
                        {selectedGuestId && (
                          <div className="text-sm text-green-600 font-medium">
                            Selected: {unassignedGuests.find((g: any) => g.id.toString() === selectedGuestId)?.firstName} {unassignedGuests.find((g: any) => g.id.toString() === selectedGuestId)?.lastName}
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddGuestToTable} className="bg-rose-600 hover:bg-rose-700">
                        Add Guest
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {unassignedGuests.length > 0 && (
                  <div className="space-y-2 px-4 pb-4">
                    <h3 className="text-sm font-medium">Guests to assign:</h3>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {unassignedGuests.map((guest: any) => (
                        <div
                          key={guest.id}
                          className="p-2 bg-gray-50 rounded border border-gray-200 text-sm"
                        >
                          {guest.firstName} {guest.lastName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Edit Table Dialog */}
        <Dialog open={isEditTableDialogOpen} onOpenChange={setIsEditTableDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Table</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editTableName">Table Name</Label>
                <Input
                  id="editTableName"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCapacity">Capacity</Label>
                <Input
                  id="editCapacity"
                  type="number"
                  min="1"
                  max="20"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateTable} className="bg-rose-600 hover:bg-rose-700">
                Update Table
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CoupleLayout>
  );
}
