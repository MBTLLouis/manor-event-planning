import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, RotateCw, Trash2, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import EmployeeLayout from "@/components/EmployeeLayout";
import { toast } from "sonner";
import { DndContext, DragEndEvent, useDraggable, useDroppable, DragOverlay, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

type SeatData = {
  id: number;
  positionX: number;
  positionY: number;
  guestId: number | null;
  tableId?: number | null;
  seatNumber?: number | null;
};

type TableData = {
  id: number;
  name: string;
  tableType: "round" | "rectangular";
  seatCount: number;
  positionX: number;
  positionY: number;
  rotation: number;
};

function DraggableSeat({ seat, guest, onClick }: { seat: SeatData; guest?: any; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `seat-${seat.id}`,
    data: { type: 'seat', seat }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: 'absolute',
        left: `${seat.positionX}px`,
        top: `${seat.positionY}px`,
      }}
      {...listeners}
      {...attributes}
    >
      <div
        onClick={onClick}
        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${
          guest ? 'bg-teal-100 border-teal-600' : 'bg-gray-100 border-gray-400'
        }`}
        title={guest ? guest.name : 'Click to assign guest'}
      >
        {guest ? (
          <span className="text-xs font-semibold text-teal-800">{guest.name.split(' ').map((n: string) => n.charAt(0)).join('')}</span>
        ) : (
          <span className="text-xs text-gray-500">?</span>
        )}
      </div>
    </div>
  );
}

function DraggableTable({ table, seats, guests, onSeatClick, onRotate, onDelete }: {
  table: TableData;
  seats: SeatData[];
  guests: any[];
  onSeatClick: (seatId: number) => void;
  onRotate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `table-${table.id}`,
    data: { type: 'table', table }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const isRound = table.tableType === "round";
  const tableWidth = isRound ? 120 : 160;
  const tableHeight = isRound ? 120 : 80;

  // Calculate seat positions around the table
  const seatPositions = useMemo(() => {
    const positions = [];
    const radius = isRound ? 70 : 60;
    const angleStep = (2 * Math.PI) / table.seatCount;

    for (let i = 0; i < table.seatCount; i++) {
      const angle = i * angleStep - Math.PI / 2; // Start from top
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      positions.push({ x, y });
    }
    return positions;
  }, [table.seatCount, isRound]);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: 'absolute',
        left: `${table.positionX}px`,
        top: `${table.positionY}px`,
        transform: `rotate(${table.rotation}deg)`,
      }}
    >
      <div className="relative">
        {/* Table */}
        <div
          {...listeners}
          {...attributes}
          className={`bg-amber-100 border-2 border-amber-600 shadow-lg cursor-move hover:shadow-xl transition-shadow ${
            isRound ? 'rounded-full' : 'rounded-lg'
          }`}
          style={{ width: `${tableWidth}px`, height: `${tableHeight}px` }}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-sm font-bold text-amber-900">{table.name}</p>
            <p className="text-xs text-amber-700">{table.seatCount} seats</p>
          </div>
        </div>

        {/* Seats around table */}
        {seats.map((seat, idx) => {
          const guest = guests.find(g => g.id === seat.guestId);
          const pos = seatPositions[idx] || { x: 0, y: 0 };
          return (
            <div
              key={seat.id}
              onClick={() => onSeatClick(seat.id)}
              className={`absolute w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${
                guest ? 'bg-teal-100 border-teal-600' : 'bg-gray-100 border-gray-400'
              }`}
              style={{
                left: `${tableWidth / 2 + pos.x - 20}px`,
                top: `${tableHeight / 2 + pos.y - 20}px`,
              }}
              title={guest ? guest.name : 'Click to assign guest'}
            >
              {guest ? (
                <span className="text-xs font-semibold text-teal-800">{guest.name.split(' ').map((n: string) => n.charAt(0)).join('')}</span>
              ) : (
                <span className="text-xs text-gray-500">?</span>
              )}
            </div>
          );
        })}

        {/* Control buttons */}
        <div className="absolute -top-10 left-0 flex gap-1">
          <Button size="sm" variant="outline" onClick={onRotate} className="h-7 px-2">
            <RotateCw className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={onDelete} className="h-7 px-2 text-red-600 hover:text-red-700">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DroppableCanvas({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: 'canvas' });

  return (
    <div
      ref={setNodeRef}
      className="border-2 border-dashed border-border rounded-lg bg-secondary/20 p-8 min-h-[600px] relative overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(circle, #ccc 1px, transparent 1px)', backgroundSize: '20px 20px' }}
    >
      {children}
    </div>
  );
}

export default function FloorPlans() {
  const [, params] = useRoute("/events/:id/floor-plans");
  const [, setLocation] = useLocation();
  const eventId = params?.id ? parseInt(params.id) : 0;

  const [isCreatePlanDialogOpen, setIsCreatePlanDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isAssignGuestDialogOpen, setIsAssignGuestDialogOpen] = useState(false);
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanMode, setNewPlanMode] = useState<"ceremony" | "reception">("reception");
  const [newTable, setNewTable] = useState({
    name: "",
    tableType: "round" as "round" | "rectangular",
    seatCount: 8,
  });

  const { data: event } = trpc.events.getById.useQuery({ id: eventId });
  const { data: floorPlans } = trpc.floorPlans.list.useQuery({ eventId });
  const { data: guests } = trpc.guests.list.useQuery({ eventId });
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const { data: selectedPlan } = trpc.floorPlans.getById.useQuery(
    { id: selectedPlanId! },
    { enabled: selectedPlanId !== null }
  );

  const utils = trpc.useUtils();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const createFloorPlanMutation = trpc.floorPlans.create.useMutation({
    onSuccess: (data) => {
      toast.success("Floor plan created!");
      setIsCreatePlanDialogOpen(false);
      setNewPlanName("");
      setSelectedPlanId(data.id);
      utils.floorPlans.list.invalidate({ eventId });
    },
  });

  const createTableMutation = trpc.tables.create.useMutation({
    onSuccess: async (data) => {
      toast.success("Table added!");
      
      // Create seats for the table
      const table = newTable;
      const isRound = table.tableType === "round";
      const radius = isRound ? 70 : 60;
      const angleStep = (2 * Math.PI) / table.seatCount;

      for (let i = 0; i < table.seatCount; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        await createSeatMutation.mutateAsync({
          floorPlanId: selectedPlanId!,
          tableId: data.id,
          seatNumber: i + 1,
          positionX: Math.round(300 + x), // Center of canvas
          positionY: Math.round(300 + y),
        });
      }

      setIsAddItemDialogOpen(false);
      setNewTable({ name: "", tableType: "round", seatCount: 8 });
      if (selectedPlanId) {
        utils.floorPlans.getById.invalidate({ id: selectedPlanId });
      }
    },
  });

  const createSeatMutation = trpc.seats.create.useMutation();

  const updateTableMutation = trpc.tables.update.useMutation({
    onSuccess: () => {
      if (selectedPlanId) {
        utils.floorPlans.getById.invalidate({ id: selectedPlanId });
      }
    },
  });

  const updateSeatMutation = trpc.seats.update.useMutation({
    onSuccess: () => {
      if (selectedPlanId) {
        utils.floorPlans.getById.invalidate({ id: selectedPlanId });
      }
    },
  });

  const deleteTableMutation = trpc.tables.delete.useMutation({
    onSuccess: () => {
      toast.success("Table deleted!");
      if (selectedPlanId) {
        utils.floorPlans.getById.invalidate({ id: selectedPlanId });
      }
    },
  });

  const deleteSeatMutation = trpc.seats.delete.useMutation({
    onSuccess: () => {
      toast.success("Seat deleted!");
      if (selectedPlanId) {
        utils.floorPlans.getById.invalidate({ id: selectedPlanId });
      }
    },
  });

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    createFloorPlanMutation.mutate({
      eventId,
      name: newPlanName,
      mode: newPlanMode,
      orderIndex: (floorPlans?.length || 0) + 1,
    });
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;

    createTableMutation.mutate({
      floorPlanId: selectedPlanId,
      ...newTable,
      positionX: 300,
      positionY: 300,
      rotation: 0,
    });
  };

  const handleAddSeat = () => {
    if (!selectedPlanId) return;

    createSeatMutation.mutate({
      floorPlanId: selectedPlanId,
      positionX: 300,
      positionY: 300,
    });

    setIsAddItemDialogOpen(false);
    setTimeout(() => {
      if (selectedPlanId) {
        utils.floorPlans.getById.invalidate({ id: selectedPlanId });
      }
    }, 100);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const data = active.data.current;

    if (!data) return;

    if (data.type === 'table') {
      const table = data.table as TableData;
      updateTableMutation.mutate({
        id: table.id,
        positionX: table.positionX + delta.x,
        positionY: table.positionY + delta.y,
      });
    } else if (data.type === 'seat') {
      const seat = data.seat as SeatData;
      updateSeatMutation.mutate({
        id: seat.id,
        positionX: seat.positionX + delta.x,
        positionY: seat.positionY + delta.y,
      });
    }
  };

  const handleRotateTable = (tableId: number, currentRotation: number) => {
    const newRotation = (currentRotation + 15) % 360;
    updateTableMutation.mutate({
      id: tableId,
      rotation: newRotation,
    });
  };

  const handleDeleteTable = (tableId: number) => {
    if (confirm("Delete this table and all its seats?")) {
      deleteTableMutation.mutate({ id: tableId });
    }
  };

  const handleSeatClick = (seatId: number) => {
    setSelectedSeatId(seatId);
    setIsAssignGuestDialogOpen(true);
  };

  const handleAssignGuest = (guestId: number | null) => {
    if (selectedSeatId) {
      updateSeatMutation.mutate({
        id: selectedSeatId,
        guestId,
      });
      setIsAssignGuestDialogOpen(false);
      setSelectedSeatId(null);
    }
  };

  // Auto-select first plan if available
  if (floorPlans && floorPlans.length > 0 && selectedPlanId === null) {
    setSelectedPlanId(floorPlans[0].id);
  }

  const isCeremonyMode = selectedPlan?.mode === "ceremony";
  const assignedGuests = useMemo(() => {
    if (!selectedPlan?.seats || !guests) return [];
    return guests.filter(g => selectedPlan.seats.some(s => s.guestId === g.id));
  }, [selectedPlan?.seats, guests]);

  const unassignedGuests = useMemo(() => {
    if (!guests) return [];
    return guests.filter(g => !assignedGuests.some(ag => ag.id === g.id));
  }, [guests, assignedGuests]);

  return (
    <EmployeeLayout>
      <div className="p-8">
        <Button variant="ghost" className="mb-6" onClick={() => setLocation(`/events/${eventId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{event?.title}</h1>
          <p className="text-lg text-muted-foreground">Seating Planner</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Canvas */}
          <div className="lg:col-span-3">
            {floorPlans && floorPlans.length > 0 ? (
              <Tabs value={selectedPlanId?.toString()} onValueChange={(v) => setSelectedPlanId(parseInt(v))}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    {floorPlans.map((plan) => (
                      <TabsTrigger key={plan.id} value={plan.id.toString()}>
                        {plan.name} ({plan.mode === "ceremony" ? "Ceremony" : "Reception"})
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="flex gap-2">
                    <Dialog open={isCreatePlanDialogOpen} onOpenChange={setIsCreatePlanDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          New Plan
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={handleCreatePlan}>
                          <DialogHeader>
                            <DialogTitle>Create Floor Plan</DialogTitle>
                            <DialogDescription>Add a new seating layout</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="plan-name">Plan Name</Label>
                              <Input
                                id="plan-name"
                                placeholder="e.g., Ceremony Seating"
                                value={newPlanName}
                                onChange={(e) => setNewPlanName(e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="plan-mode">Mode</Label>
                              <Select value={newPlanMode} onValueChange={(v: any) => setNewPlanMode(v)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ceremony">Ceremony (Individual Seats)</SelectItem>
                                  <SelectItem value="reception">Reception (Tables)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit">Create Plan</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          {isCeremonyMode ? "Add Seat" : "Add Table"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        {isCeremonyMode ? (
                          <div>
                            <DialogHeader>
                              <DialogTitle>Add Seat</DialogTitle>
                              <DialogDescription>Add an individual seat to the ceremony layout</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <p className="text-sm text-muted-foreground">A new seat will be added to the center of the canvas. You can drag it to position it.</p>
                            </div>
                            <DialogFooter>
                              <Button onClick={handleAddSeat}>Add Seat</Button>
                            </DialogFooter>
                          </div>
                        ) : (
                          <form onSubmit={handleAddTable}>
                            <DialogHeader>
                              <DialogTitle>Add Table</DialogTitle>
                              <DialogDescription>Add a new table to the reception layout</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="table-name">Table Name</Label>
                                <Input
                                  id="table-name"
                                  placeholder="e.g., Table 1"
                                  value={newTable.name}
                                  onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="table-type">Table Type</Label>
                                <Select
                                  value={newTable.tableType}
                                  onValueChange={(value: any) => setNewTable({ ...newTable, tableType: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="round">Round (8 seats)</SelectItem>
                                    <SelectItem value="rectangular">Rectangular (4 seats)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="seat-count">Seat Count</Label>
                                <Input
                                  id="seat-count"
                                  type="number"
                                  min="2"
                                  max="20"
                                  value={newTable.seatCount}
                                  onChange={(e) => setNewTable({ ...newTable, seatCount: parseInt(e.target.value) })}
                                  required
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit">Add Table</Button>
                            </DialogFooter>
                          </form>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {floorPlans.map((plan) => (
                  <TabsContent key={plan.id} value={plan.id.toString()}>
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {plan.mode === "ceremony" ? "Ceremony Seating" : "Reception Tables"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                          <DroppableCanvas>
                            {plan.mode === "ceremony" ? (
                              // Ceremony mode: individual seats
                              <>
                                {selectedPlan?.seats?.filter(s => !s.tableId).map((seat) => {
                                  const guest = guests?.find(g => g.id === seat.guestId);
                                  return (
                                    <DraggableSeat
                                      key={seat.id}
                                      seat={seat}
                                      guest={guest}
                                      onClick={() => handleSeatClick(seat.id)}
                                    />
                                  );
                                })}
                                {(!selectedPlan?.seats || selectedPlan.seats.filter(s => !s.tableId).length === 0) && (
                                  <div className="flex items-center justify-center h-full">
                                    <p className="text-muted-foreground">Click "Add Seat" to start placing ceremony seats</p>
                                  </div>
                                )}
                              </>
                            ) : (
                              // Reception mode: tables with seats
                              <>
                                {selectedPlan?.tables?.map((table) => {
                                  const tableSeats = selectedPlan.seats?.filter(s => s.tableId === table.id) || [];
                                  return (
                                    <DraggableTable
                                      key={table.id}
                                      table={table}
                                      seats={tableSeats}
                                      guests={guests || []}
                                      onSeatClick={handleSeatClick}
                                      onRotate={() => handleRotateTable(table.id, table.rotation)}
                                      onDelete={() => handleDeleteTable(table.id)}
                                    />
                                  );
                                })}
                                {(!selectedPlan?.tables || selectedPlan.tables.length === 0) && (
                                  <div className="flex items-center justify-center h-full">
                                    <p className="text-muted-foreground">Click "Add Table" to start designing your reception layout</p>
                                  </div>
                                )}
                              </>
                            )}
                          </DroppableCanvas>
                        </DndContext>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground mb-4">No floor plans yet. Create one to get started!</p>
                  <Dialog open={isCreatePlanDialogOpen} onOpenChange={setIsCreatePlanDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handleCreatePlan}>
                        <DialogHeader>
                          <DialogTitle>Create Floor Plan</DialogTitle>
                          <DialogDescription>Add a new seating layout</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="plan-name">Plan Name</Label>
                            <Input
                              id="plan-name"
                              placeholder="e.g., Ceremony Seating"
                              value={newPlanName}
                              onChange={(e) => setNewPlanName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="plan-mode">Mode</Label>
                            <Select value={newPlanMode} onValueChange={(v: any) => setNewPlanMode(v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ceremony">Ceremony (Individual Seats)</SelectItem>
                                <SelectItem value="reception">Reception (Tables)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Create Plan</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Guest Assignment Panels */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Assigned ({assignedGuests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {assignedGuests.map(guest => (
                    <div key={guest.id} className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                      {guest.name}
                    </div>
                  ))}
                  {assignedGuests.length === 0 && (
                    <p className="text-sm text-muted-foreground">No guests assigned yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  Unassigned ({unassignedGuests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {unassignedGuests.map(guest => (
                    <div key={guest.id} className="p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                      {guest.name}
                    </div>
                  ))}
                  {unassignedGuests.length === 0 && (
                    <p className="text-sm text-muted-foreground">All guests assigned!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Assign Guest Dialog */}
        <Dialog open={isAssignGuestDialogOpen} onOpenChange={setIsAssignGuestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Guest to Seat</DialogTitle>
              <DialogDescription>Select a guest or leave empty to unassign</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Guest</Label>
                <Select onValueChange={(v) => handleAssignGuest(v === "none" ? null : parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a guest" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Unassign Seat --</SelectItem>
                    {unassignedGuests.map(guest => (
                      <SelectItem key={guest.id} value={guest.id.toString()}>
                        {guest.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </EmployeeLayout>
  );
}
