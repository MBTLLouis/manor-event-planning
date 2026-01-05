import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import CoupleLayout from '@/components/CoupleLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const [tableGuestAssignments, setTableGuestAssignments] = useState<Record<number, number[]>>({});

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
      }
      setTableGuestAssignments((prev) => {
        const newAssignments = { ...prev };
        delete newAssignments[editingTable?.id];
        return newAssignments;
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete table');
    },
  });

  const handleAddTable = () => {
    if (!newTableName.trim()) {
      toast.error('Please enter a table name');
      return;
    }

    if (!coupleEvent) {
      toast.error('Event not found');
      return;
    }

    const floorPlanId = floorPlans[0]?.id || 1;

    createTableMutation.mutate({
      floorPlanId,
      name: newTableName,
      tableType: 'round',
      seatCount: parseInt(newTableCapacity),
      positionX: 0,
      positionY: 0,
    });
  };

  const handleEditTable = () => {
    if (!newTableName.trim()) {
      toast.error('Please enter a table name');
      return;
    }

    updateTableMutation.mutate({
      id: editingTable.id,
      name: newTableName,
    });
  };

  const handleAddGuestToTable = () => {
    if (!selectedGuestId || !selectedTableForGuest) {
      toast.error('Please select a guest and table');
      return;
    }

    const guestId = parseInt(selectedGuestId);
    
    const isAlreadyAssigned = Object.values(tableGuestAssignments).some((guests) =>
      guests.includes(guestId)
    );

    if (isAlreadyAssigned) {
      toast.error('Guest is already assigned to a table');
      return;
    }

    setTableGuestAssignments((prev) => ({
      ...prev,
      [selectedTableForGuest]: [...(prev[selectedTableForGuest] || []), guestId],
    }));

    toast.success('Guest added to table');
    setIsAddGuestDialogOpen(false);
    setSelectedGuestId('');
    setSelectedTableForGuest(null);
  };

  const handleRemoveGuestFromTable = (tableId: number, guestId: number) => {
    setTableGuestAssignments((prev) => ({
      ...prev,
      [tableId]: prev[tableId]?.filter((id) => id !== guestId) || [],
    }));
    toast.success('Guest removed from table');
  };

  const openEditDialog = (table: any) => {
    setEditingTable(table);
    setNewTableName(table.name);
    setNewTableCapacity(table.seatCount?.toString() || '8');
    setIsEditTableDialogOpen(true);
  };

  const allTables = floorPlans.flatMap((plan: any) => 
    (plan.tables || []).map((table: any) => ({
      ...table,
      floorPlanName: plan.name,
    }))
  );

  const assignedGuestIds = new Set(Object.values(tableGuestAssignments).flat());
  const unassignedGuests = guests.filter((g: any) => !assignedGuestIds.has(g.id));

  if (!coupleEvent) {
    return (
      <CoupleLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </CoupleLayout>
    );
  }

  return (
    <CoupleLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2">Table Planning</h1>
            <p className="text-gray-600">Organize your seating arrangement</p>
          </div>
          <Dialog open={isAddTableDialogOpen} onOpenChange={setIsAddTableDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#2C5F5D] hover:bg-[#1e4441]">
                <Plus className="w-4 h-4 mr-2" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
                <DialogDescription>Create a new table for your event</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="tableName">Table Name</Label>
                  <Input
                    id="tableName"
                    placeholder="e.g., Table 1, VIP Table, Family Table"
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
                <Button onClick={handleAddTable} className="bg-[#2C5F5D] hover:bg-[#1e4441]">
                  Add Table
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {allTables.length === 0 ? (
          <Card className="bg-gray-50">
            <CardContent className="py-12 text-center">
              <p className="text-lg text-gray-600 mb-2">No tables yet</p>
              <p className="text-sm text-muted-foreground">Add tables to start planning your seating arrangement</p>
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
                  const tableGuests = (tableGuestAssignments[table.id] || [])
                    .map((guestId) => guests.find((g: any) => g.id === guestId))
                    .filter(Boolean);
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
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTableMutation.mutate({ id: table.id })}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className={`h-2 rounded-full transition-all ${isFull ? 'bg-red-500' : 'bg-teal-500'}`}
                            style={{ width: `${Math.min((occupancy / capacity) * 100, 100)}%` }}
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {tableGuests.length === 0 ? (
                            <p className="text-xs text-gray-500">No guests assigned</p>
                          ) : (
                            tableGuests.map((guest: any) => (
                              <div
                                key={guest.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                              >
                                <span className="text-sm">{guest.firstName} {guest.lastName}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveGuestFromTable(table.id, guest.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Unassigned Guests */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Unassigned Guests</h2>
                  <Badge variant="secondary">{unassignedGuests.length} guests</Badge>
                </div>

                <Dialog open={isAddGuestDialogOpen} onOpenChange={setIsAddGuestDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-[#2C5F5D] hover:bg-[#1e4441]">
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
                        <Label htmlFor="table">Select Table</Label>
                        <Select value={selectedTableForGuest?.toString() || ''} onValueChange={(value) => setSelectedTableForGuest(Number(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a table" />
                          </SelectTrigger>
                          <SelectContent>
                            {allTables.map((table: any) => {
                              const occupancy = (tableGuestAssignments[table.id] || []).length;
                              const capacity = table.seatCount || 8;
                              const isFull = occupancy >= capacity;
                              return (
                                <SelectItem key={table.id} value={table.id.toString()} disabled={isFull}>
                                  {table.name} ({occupancy}/{capacity})
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guest">Select Guest</Label>
                        <Select value={selectedGuestId} onValueChange={setSelectedGuestId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a guest" />
                          </SelectTrigger>
                          <SelectContent>
                            {unassignedGuests.map((guest: any) => (
                              <SelectItem key={guest.id} value={guest.id.toString()}>
                                {guest.firstName} {guest.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddGuestToTable} className="bg-[#2C5F5D] hover:bg-[#1e4441]">
                        Add Guest
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Card className="bg-gray-50">
                  <CardContent className="p-3 space-y-2 max-h-96 overflow-y-auto">
                    {unassignedGuests.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4">All guests seated!</p>
                    ) : (
                      unassignedGuests.map((guest: any) => (
                        <div
                          key={guest.id}
                          className="p-2 bg-white border border-gray-200 rounded text-sm hover:bg-gray-50"
                        >
                          {guest.firstName} {guest.lastName}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Edit Table Dialog */}
        <Dialog open={isEditTableDialogOpen} onOpenChange={setIsEditTableDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Table</DialogTitle>
              <DialogDescription>Update table details</DialogDescription>
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
            </div>
            <DialogFooter>
              <Button onClick={handleEditTable} className="bg-[#2C5F5D] hover:bg-[#1e4441]">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CoupleLayout>
  );
}
