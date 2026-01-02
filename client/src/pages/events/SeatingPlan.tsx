'use client';

import { useState, useMemo, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import EmployeeLayout from '@/components/EmployeeLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Users, Trash2, Search } from 'lucide-react';
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

const DroppableTable = ({ table, guests, onDrop, onRemoveGuest }: {
  table: TableAssignment;
  guests: any[];
  onDrop: (guestId: number) => void;
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

export default function SeatingPlan() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const eventId = parseInt(params.id!);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTableDialogOpen, setIsAddTableDialogOpen] = useState(false);
  const [newTable, setNewTable] = useState({
    name: '',
    tableType: 'round' as 'round' | 'rectangular',
    capacity: 8,
  });

  const { data: event } = trpc.events.getById.useQuery({ id: eventId });
  const { data: guests = [] } = trpc.guests.list.useQuery({ eventId });
  const { data: floorPlans = [] } = trpc.floorPlans.list.useQuery({ eventId });

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
        // Find or create a seat for this guest
        const existingSeat = table.seats?.find((s: any) => s.guestId === guest.id);
        if (!existingSeat) {
          // Create a new seat assignment
          toast.success(`${guest.firstName} assigned to ${table.name}`);
          // TODO: Call mutation to assign guest to table
        }
      }
    }
  };

  const handleRemoveGuest = (guestId: number, tableId: number) => {
    toast.success('Guest removed from table');
    // TODO: Call mutation to remove guest from table
  };

  const handleAddTable = () => {
    if (!newTable.name) {
      toast.error('Please enter a table name');
      return;
    }
    // TODO: Call mutation to create table
    setIsAddTableDialogOpen(false);
    setNewTable({ name: '', tableType: 'round', capacity: 8 });
  };

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <Button variant="ghost" className="mb-4" onClick={() => setLocation(`/events/${eventId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Event
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Seating Plan</h1>
          <p className="text-muted-foreground">{event?.title}</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main tables area */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Tables</h2>
              <Dialog open={isAddTableDialogOpen} onOpenChange={setIsAddTableDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Table
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Table</DialogTitle>
                    <DialogDescription>Create a new table for seating</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="table-name">Table Name</Label>
                      <Input
                        id="table-name"
                        placeholder="e.g., Table 1"
                        value={newTable.name}
                        onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="table-type">Table Type</Label>
                      <Select value={newTable.tableType} onValueChange={(v: any) => setNewTable({ ...newTable, tableType: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="round">Round</SelectItem>
                          <SelectItem value="rectangular">Rectangular</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacity</Label>
                      <Input
                        id="capacity"
                        type="number"
                        min="1"
                        max="20"
                        value={newTable.capacity}
                        onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddTable}>Add Table</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tableAssignments.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="p-12 text-center">
                      <p className="text-muted-foreground">No tables yet. Create one to get started!</p>
                    </CardContent>
                  </Card>
                ) : (
                  tableAssignments.map((table) => (
                    <DroppableTable
                      key={table.tableId}
                      table={table}
                      guests={table.guests}
                      onDrop={() => {}}
                      onRemoveGuest={(guestId) => handleRemoveGuest(guestId, table.tableId)}
                    />
                  ))
                )}
              </div>
            </DndContext>
          </div>

          {/* Unassigned guests sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Unassigned Guests</CardTitle>
                <CardDescription>{unassignedGuests.length} guests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search guests..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredUnassignedGuests.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {unassignedGuests.length === 0 ? 'All guests assigned!' : 'No matching guests'}
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
        </div>
      </div>
    </EmployeeLayout>
  );
}
