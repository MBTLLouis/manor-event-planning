import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import CoupleLayout from '@/components/CoupleLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Users, Plus, Trash2, Search } from 'lucide-react';
import { DndContext, DragEndEvent, useDraggable, useDroppable, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

interface TableAssignment {
  tableId: number;
  tableName: string;
  tableType: 'round' | 'rectangular';
  capacity: number;
  guests: any[];
}

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
      className={`p-2 bg-teal-50 border border-teal-200 rounded cursor-grab active:cursor-grabbing text-sm ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-teal-900 truncate">{guest.firstName} {guest.lastName}</span>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

const DroppableTable = ({ table, guests, onRemoveGuest }: {
  table: TableAssignment;
  guests: any[];
  onRemoveGuest: (guestId: number) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `table-${table.tableId}`,
    data: { type: 'table', tableId: table.tableId }
  });

  const capacity = table.capacity;
  const occupancy = guests.length;
  const isFull = occupancy >= capacity;
  const capacityPercent = (occupancy / capacity) * 100;

  return (
    <Card
      ref={setNodeRef}
      className={`transition-all ${isOver ? 'ring-2 ring-teal-500 bg-teal-50' : ''} ${isFull ? 'border-orange-300' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{table.tableName}</CardTitle>
            <CardDescription className="text-sm">
              {table.tableType === 'round' ? 'Round Table' : 'Rectangular Table'}
            </CardDescription>
          </div>
          <Badge variant={isFull ? 'destructive' : 'outline'}>
            {occupancy}/{capacity}
          </Badge>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full transition-all ${
              capacityPercent >= 100 ? 'bg-red-500' : capacityPercent >= 80 ? 'bg-orange-500' : 'bg-teal-500'
            }`}
            style={{ width: `${Math.min(capacityPercent, 100)}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 min-h-[120px] max-h-[300px] overflow-y-auto">
          {guests.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Drag guests here</p>
            </div>
          ) : (
            guests.map((guest) => (
              <DraggableGuest
                key={guest.id}
                guest={guest}
                onRemove={() => onRemoveGuest(guest.id)}
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

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTableDialogOpen, setIsAddTableDialogOpen] = useState(false);
  const [newTable, setNewTable] = useState({
    name: '',
    tableType: 'round' as 'round' | 'rectangular',
    capacity: 8,
  });

  // Get all tables from all floor plans
  const tables = useMemo(() => {
    return floorPlans.flatMap((plan: any) => plan.tables || []);
  }, [floorPlans]);

  const utils = trpc.useUtils();

  // Get table assignments from all floor plans
  const tableAssignments = useMemo(() => {
    const assignments: TableAssignment[] = [];
    
    tables.forEach((table: any) => {
      const tableSeats = table.seats || [];
      const assignedGuests = guests.filter((g: any) =>
        tableSeats.some((s: any) => s.guestId === g.id)
      );

      assignments.push({
        tableId: table.id,
        tableName: table.name,
        tableType: table.tableType,
        capacity: table.seatCount || 8,
        guests: assignedGuests,
      });
    });

    return assignments;
  }, [tables, guests]);

  // Get unassigned guests
  const unassignedGuests = useMemo(() => {
    const assignedGuestIds = new Set(
      tableAssignments.flatMap(t => t.guests.map(g => g.id))
    );
    return guests.filter((g: any) => !assignedGuestIds.has(g.id));
  }, [guests, tableAssignments]);

  // Filter unassigned guests by search
  const filteredUnassignedGuests = useMemo(() => {
    return unassignedGuests.filter((g: any) =>
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [unassignedGuests, searchQuery]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  // Mutations for guest assignment
  const updateSeatMutation = trpc.seats.update.useMutation({
    onSuccess: () => {
      toast.success('Guest assigned to table');
      utils.floorPlans.list.invalidate({ eventId: coupleEvent?.id });
      utils.guests.list.invalidate({ eventId: coupleEvent?.id });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign guest');
    },
  });

  const createTableMutation = trpc.tables.create.useMutation({
    onSuccess: () => {
      toast.success('Table added');
      setIsAddTableDialogOpen(false);
      setNewTable({ name: '', tableType: 'round', capacity: 8 });
      utils.floorPlans.list.invalidate({ eventId: coupleEvent?.id });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create table');
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const data = active.data.current;
    if (data?.type !== 'guest') return;

    const guest = data.guest;
    const overData = over.data.current;

    if (overData?.type === 'table') {
      const tableId = overData.tableId;
      const table = tables.find((t: any) => t.id === tableId);

      if (table) {
        // Check if table is full
        const tableAssignment = tableAssignments.find(t => t.tableId === tableId);
        if (tableAssignment && tableAssignment.guests.length >= tableAssignment.capacity) {
          toast.error('This table is full');
          return;
        }

        // Check if guest is already assigned to this table
        if (tableAssignment?.guests.some(g => g.id === guest.id)) {
          toast.error('Guest is already at this table');
          return;
        }

        // Find the first available seat
        const availableSeat = table.seats?.find((s: any) => !s.guestId);
        if (availableSeat) {
          updateSeatMutation.mutate({
            id: availableSeat.id,
            guestId: guest.id,
          });
        } else {
          toast.error('No available seats at this table');
        }
      }
    }
  };

  const handleRemoveGuest = (guestId: number) => {
    // Find the seat this guest is assigned to
    const seat = tables
      .flatMap((t: any) => t.seats || [])
      .find((s: any) => s.guestId === guestId);

    if (seat) {
      updateSeatMutation.mutate({ id: seat.id, guestId: null });
    }
  };

  const handleAddTable = () => {
    if (!newTable.name) {
      toast.error('Please enter a table name');
      return;
    }
    if (!coupleEvent) {
      toast.error('Event not found');
      return;
    }

    // Use the first floor plan or create a default one
    const floorPlanId = floorPlans[0]?.id;
    if (!floorPlanId) {
      toast.error('No floor plan found. Please create one first.');
      return;
    }

    createTableMutation.mutate({
      floorPlanId,
      name: newTable.name,
      tableType: newTable.tableType,
      seatCount: newTable.capacity,
      positionX: 0,
      positionY: 0,
    });
  };

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
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2">Seating Arrangements</h1>
          <p className="text-gray-600">Arrange your guests at tables using drag and drop</p>
        </div>

        {floorPlans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-2">No floor plans yet</p>
              <p className="text-sm text-muted-foreground">
                Your event planner will create floor plans for your venue
              </p>
            </CardContent>
          </Card>
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Unassigned Guests */}
              <div className="lg:col-span-1">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Unassigned Guests</CardTitle>
                    <CardDescription>{unassignedGuests.length} remaining</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search guests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {filteredUnassignedGuests.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">
                            {searchQuery ? 'No guests found' : 'All guests assigned!'}
                          </p>
                        </div>
                      ) : (
                        filteredUnassignedGuests.map((guest) => (
                          <DraggableGuest key={guest.id} guest={guest} />
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tables */}
              <div className="lg:col-span-3 space-y-6">
                {floorPlans.map((floorPlan: any) => (
                  <div key={floorPlan.id}>
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-2xl font-serif text-[#2C5F5D]">{floorPlan.name}</h2>
                      <Dialog open={isAddTableDialogOpen} onOpenChange={setIsAddTableDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-[#2C5F5D] hover:bg-[#1e4441]">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Table
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Table</DialogTitle>
                            <DialogDescription>Create a new table for {floorPlan.name}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="tableName">Table Name *</Label>
                              <Input
                                id="tableName"
                                placeholder="e.g., Table 1, Sweetheart Table"
                                value={newTable.name}
                                onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tableType">Table Type</Label>
                              <Select value={newTable.tableType} onValueChange={(value: any) => setNewTable({ ...newTable, tableType: value })}>
                                <SelectTrigger id="tableType">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="round">Round Table</SelectItem>
                                  <SelectItem value="rectangular">Rectangular Table</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="capacity">Capacity *</Label>
                              <Input
                                id="capacity"
                                type="number"
                                min="1"
                                value={newTable.capacity}
                                onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) || 8 })}
                                required
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" onClick={handleAddTable} disabled={createTableMutation.isPending}>
                              {createTableMutation.isPending ? 'Adding...' : 'Add Table'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(floorPlan.tables || []).length === 0 ? (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                          <p>No tables in this floor plan. Add one to get started.</p>
                        </div>
                      ) : (
                        (floorPlan.tables || []).map((table: any) => {
                          const assignment = tableAssignments.find(t => t.tableId === table.id);
                          return (
                            <DroppableTable
                              key={table.id}
                              table={assignment || {
                                tableId: table.id,
                                tableName: table.name,
                                tableType: table.tableType,
                                capacity: table.seatCount || 8,
                                guests: [],
                              }}
                              guests={assignment?.guests || []}
                              onRemoveGuest={handleRemoveGuest}
                            />
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DndContext>
        )}
      </div>
    </CoupleLayout>
  );
}
