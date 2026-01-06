import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import EmployeeLayout from "@/components/EmployeeLayout";

interface Room {
  id: number;
  eventId: number;
  roomName: string;
  roomNumber: number | null;
  isAccessible: boolean;
  isBlocked: boolean;
  notes: string | null;
}

interface Allocation {
  id: number;
  roomId: number;
  guestId: number;
  eventId: number;
  notes: string | null;
}

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  dietaryRestrictions?: string | null;
  mildAllergies?: string | null;
  severeAllergies?: string | null;
}

export default function Accommodations() {
  const { id: eventId } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showAllocationDialog, setShowAllocationDialog] = useState(false);

  const eventIdNum = parseInt(eventId || "0");

  // Queries
  const { data: roomsData, isLoading: roomsLoading } = trpc.accommodations.getRooms.useQuery({ eventId: eventIdNum });
  const { data: allocationsData } = trpc.accommodations.getAllocations.useQuery({ eventId: eventIdNum });
  const { data: guestsData } = trpc.guests.list.useQuery({ eventId: eventIdNum });

  // Mutations
  const initializeRoomsMutation = trpc.accommodations.initializeRooms.useMutation();
  const updateRoomMutation = trpc.accommodations.updateRoom.useMutation();
  const allocateGuestMutation = trpc.accommodations.allocateGuest.useMutation();
  const removeAllocationMutation = trpc.accommodations.removeAllocation.useMutation();

  useEffect(() => {
    if (roomsData) setRooms(roomsData);
    if (allocationsData) setAllocations(allocationsData);
  }, [roomsData, allocationsData]);

  const handleInitializeRooms = async () => {
    try {
      await initializeRoomsMutation.mutateAsync({ eventId: eventIdNum });
      // Rooms will be updated via useQuery hook
    } catch (error) {
      console.error("Failed to initialize rooms:", error);
    }
  };

  const handleToggleBlockRoom = async (room: Room) => {
    try {
      const updated = await updateRoomMutation.mutateAsync({
        id: room.id,
        isBlocked: !room.isBlocked,
      });
      if (updated) {
        setRooms(rooms.map(r => r.id === room.id ? updated : r));
      }
    } catch (error) {
      console.error("Failed to update room:", error);
    }
  };

  const handleUpdateRoomNotes = async (room: Room, notes: string) => {
    try {
      const updated = await updateRoomMutation.mutateAsync({
        id: room.id,
        notes: notes || null,
      });
      if (updated) {
        setRooms(rooms.map(r => r.id === room.id ? updated : r));
      }
    } catch (error) {
      console.error("Failed to update room notes:", error);
    }
  };

  const handleAllocateGuest = async (guestId: number, notes: string) => {
    if (!selectedRoom) return;
    try {
      await allocateGuestMutation.mutateAsync({
        roomId: selectedRoom.id,
        guestId,
        eventId: eventIdNum,
        notes: notes || undefined,
      });
      // Allocations will be updated via useQuery hook
      setShowAllocationDialog(false);
    } catch (error) {
      console.error("Failed to allocate guest:", error);
    }
  };

  const handleRemoveAllocation = async (allocationId: number) => {
    try {
      await removeAllocationMutation.mutateAsync({ id: allocationId });
      // Allocations will be updated via useQuery hook
    } catch (error) {
      console.error("Failed to remove allocation:", error);
    }
  };

  const getRoomAllocations = (roomId: number) => {
    return allocations.filter(a => a.roomId === roomId);
  };

  const getGuestName = (guestId: number) => {
    const guest = guestsData?.find(g => g.id === guestId);
    return guest ? `${guest.firstName} ${guest.lastName}` : "Unknown Guest";
  };

  const getGuestDietaryInfo = (guestId: number) => {
    const guest = guestsData?.find(g => g.id === guestId);
    if (!guest) return null;
    return {
      hasDietaryRequirements: guest.hasDietaryRequirements,
      dietaryRestrictions: guest.dietaryRestrictions,
      allergySeverity: guest.allergySeverity,
    };
  };

  const getUnallocatedGuests = () => {
    const allocatedGuestIds = new Set(allocations.map(a => a.guestId));
    return (guestsData || []).filter(g => !allocatedGuestIds.has(g.id));
  };

  if (roomsLoading) {
    return <div className="p-6">Loading accommodations...</div>;
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation(`/events/${eventId}`)}>
            <ChevronLeft className="h-4 w-4" />
            Back to Event
          </Button>
          <h1 className="text-3xl font-bold">Accommodations</h1>
        </div>
      </div>

      {rooms.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="mb-4 text-gray-600">No accommodation rooms set up yet.</p>
          <Button onClick={handleInitializeRooms} disabled={initializeRoomsMutation.isPending}>
            {initializeRoomsMutation.isPending ? "Initializing..." : "Initialize Default Rooms"}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => {
            const roomAllocations = getRoomAllocations(room.id);
            const isFullyOccupied = roomAllocations.length >= 2;

            return (
              <Card key={room.id} className={`p-4 ${room.isBlocked ? "bg-gray-100 opacity-60" : ""}`}>
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{room.roomName}</h3>
                    {room.isAccessible && (
                      <p className="text-xs text-green-600">♿ Ground Floor Accessible</p>
                    )}
                  </div>
                  <Checkbox
                    checked={room.isBlocked}
                    onCheckedChange={() => handleToggleBlockRoom(room)}
                    disabled={roomAllocations.length > 0}
                  />
                </div>

                {room.isBlocked && (
                  <p className="mb-2 text-xs font-medium text-gray-500">BLOCKED</p>
                )}

                <div className="mb-3 space-y-2">
                  <label className="text-xs font-medium text-gray-600">Guests</label>
                  {roomAllocations.length > 0 ? (
                    <div className="space-y-2">
                      {roomAllocations.map((alloc) => {
                        const dietaryInfo = getGuestDietaryInfo(alloc.guestId);
                        return (
                          <div key={alloc.id} className="rounded bg-blue-50 px-2 py-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{getGuestName(alloc.guestId)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAllocation(alloc.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            {dietaryInfo?.hasDietaryRequirements && (
                              <div className="mt-1 space-y-0.5 text-xs text-gray-600">
                                {dietaryInfo?.dietaryRestrictions && (
                                  <p>Dietary: {dietaryInfo.dietaryRestrictions}</p>
                                )}
                                {dietaryInfo?.allergySeverity === "mild" && (
                                  <p className="text-yellow-600 font-medium">Mild Allergy</p>
                                )}
                                {dietaryInfo?.allergySeverity === "severe" && (
                                  <p className="text-red-600 font-medium">Severe Allergy</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No guests allocated</p>
                  )}
                </div>

                {!room.isBlocked && !isFullyOccupied && (
                  <Dialog open={showAllocationDialog && selectedRoom?.id === room.id} onOpenChange={(open) => {
                    setShowAllocationDialog(open);
                    if (open) setSelectedRoom(room);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedRoom(room)}>
                        <Plus className="mr-1 h-3 w-3" />
                        Add Guest
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Allocate Guest to {room.roomName}</DialogTitle>
                      </DialogHeader>
                      <AllocationForm
                        room={room}
                        unallocatedGuests={getUnallocatedGuests()}
                        onAllocate={handleAllocateGuest}
                        onClose={() => setShowAllocationDialog(false)}
                      />
                    </DialogContent>
                  </Dialog>
                )}

                <div className="mt-3 border-t pt-3">
                  <label className="text-xs font-medium text-gray-600">Additional Notes</label>
                  <Textarea
                    placeholder="Add notes for this room..."
                    defaultValue={room.notes || ""}
                    onBlur={(e) => handleUpdateRoomNotes(room, e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
      </div>
    </EmployeeLayout>
  );
}

interface AllocationFormProps {
  room: Room;
  unallocatedGuests: Guest[];
  onAllocate: (guestId: number, notes: string) => void;
  onClose: () => void;
}

function AllocationForm({ room, unallocatedGuests, onAllocate, onClose }: AllocationFormProps) {
  const [selectedGuestId, setSelectedGuestId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (selectedGuestId) {
      onAllocate(parseInt(selectedGuestId), notes);
      setSelectedGuestId("");
      setNotes("");
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Select Guest</Label>
        <Select value={selectedGuestId} onValueChange={setSelectedGuestId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a guest..." />
          </SelectTrigger>
          <SelectContent>
            {unallocatedGuests.map((guest) => (
              <SelectItem key={guest.id} value={guest.id.toString()}>
                {guest.firstName} {guest.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Notes (Optional)</Label>
        <Textarea
          placeholder="Add notes for this guest's stay..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={!selectedGuestId}>
          Allocate Guest
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
