import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import CoupleLayout from '@/components/CoupleLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Users, Trash2, Search, X } from 'lucide-react';
import { DndContext, DragEndEvent, useDraggable, useDroppable, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

const DraggableGuest = ({ guest, onRemove }: { guest: any; onRemove?: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `guest-${guest.id}`,
    data: { type: 'guest', guest }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-2 bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded cursor-grab active:cursor-grabbing text-sm hover:shadow-md transition-shadow ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-teal-900 truncate">{guest.firstName} {guest.lastName}</span>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-teal-600 hover:text-teal-900"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const DroppableTable = ({ table, guests, onRemoveGuest }: any) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `table-${table.id}`,
    data: { type: 'table', table }
  });

  const capacity = table.capacity || 8;
  const occupancy = guests.length;
  const isFull = occupancy >= capacity;

  return (
    <Card
      ref={setNodeRef}
      className={`transition-all ${isOver ? 'ring-2 ring-teal-500 shadow-lg' : ''} ${isFull ? 'opacity-75' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{table.name}</CardTitle>
            <CardDescription className="text-xs mt-1">
              {occupancy}/{capacity} guests
            </CardDescription>
          </div>
          <Badge variant={isFull ? 'destructive' : 'secondary'}>
            {occupancy}/{capacity}
          </Badge>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full transition-all ${isFull ? 'bg-red-500' : 'bg-teal-500'}`}
            style={{ width: `${Math.min((occupancy / capacity) * 100, 100)}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 min-h-[100px] p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          {guests.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-6">Drag guests here</p>
          ) : (
            guests.map((guest: any) => (
              <DraggableGuest
                key={guest.id}
                guest={guest}
                onRemove={() => onRemoveGuest(table.id, guest.id)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

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
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('8');
  const [searchQuery, setSearchQuery] = useState('');
  const [tableAssignments, setTableAssignments] = useState<Record<number, any[]>>({});

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  // Create virtual tables from floor plans
  const tables = useMemo(() => {
    return floorPlans.flatMap((plan: any) => {
      return (plan.tables || []).map((table: any) => ({
        id: table.id,
        name: table.name || `Table ${table.id}`,
        capacity: table.seatCount || 8,
        floorPlanId: plan.id,
      }));
    });
  }, [floorPlans]);

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

  const deleteTableMutation = trpc.tables.delete.useMutation({
    onSuccess: () => {
      toast.success('Table deleted');
      if (coupleEvent) {
        utils.floorPlans.list.invalidate({ eventId: coupleEvent.id });
      }
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

    // Create a default floor plan if none exists
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const guestId = parseInt(active.id.toString().replace('guest-', ''));
    const tableId = parseInt(over.id.toString().replace('table-', ''));

    const guest = guests.find((g: any) => g.id === guestId);
    if (!guest) return;

    // Update local state
    setTableAssignments((prev) => {
      const newAssignments = { ...prev };
      
      // Remove from old table
      Object.keys(newAssignments).forEach((key) => {
        newAssignments[parseInt(key)] = newAssignments[parseInt(key)].filter(
          (g: any) => g.id !== guestId
        );
      });

      // Add to new table
      if (!newAssignments[tableId]) {
        newAssignments[tableId] = [];
      }
      newAssignments[tableId].push(guest);

      return newAssignments;
    });

    toast.success(`${guest.firstName} moved to table`);
  };

  const unassignedGuests = useMemo(() => {
    const assignedIds = new Set(
      Object.values(tableAssignments).flat().map((g: any) => g.id)
    );
    return guests.filter((g: any) => !assignedIds.has(g.id));
  }, [guests, tableAssignments]);

  const filteredUnassigned = useMemo(() => {
    return unassignedGuests.filter((g: any) =>
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [unassignedGuests, searchQuery]);

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
            <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2">Seating Plan</h1>
            <p className="text-gray-600">Arrange your guests at tables</p>
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
                <DialogDescription>Create a new seating table for your event</DialogDescription>
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

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Tables */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Tables</h2>
                <Badge variant="outline">{tables.length} tables</Badge>
              </div>

              {tables.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-600 mb-2">No tables yet</p>
                    <p className="text-sm text-muted-foreground">Add tables to start seating your guests</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tables.map((table: any) => (
                    <div key={table.id} className="relative">
                      <DroppableTable
                        table={table}
                        guests={tableAssignments[table.id] || []}
                        onRemoveGuest={(tableId: number, guestId: number) => {
                          setTableAssignments((prev) => ({
                            ...prev,
                            [tableId]: prev[tableId]?.filter((g: any) => g.id !== guestId) || [],
                          }));
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTableMutation.mutate({ id: table.id })}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Unassigned Guests */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Unassigned Guests</h2>
                  <Badge variant="secondary">{unassignedGuests.length} guests</Badge>
                </div>

                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search guests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <Card className="bg-gray-50">
                  <CardContent className="p-3 space-y-2 max-h-96 overflow-y-auto">
                    {filteredUnassigned.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4">
                        {unassignedGuests.length === 0 ? 'All guests seated!' : 'No guests match search'}
                      </p>
                    ) : (
                      filteredUnassigned.map((guest: any) => (
                        <DraggableGuest key={guest.id} guest={guest} />
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </DndContext>
      </div>
    </CoupleLayout>
  );
}
