import { useEffect, useState } from "react";
import CoupleLayout from "@/components/CoupleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Home, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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
  hasDietaryRequirements?: boolean;
  dietaryRestrictions?: string | null;
  allergySeverity?: string | null;
}

export default function CoupleHotels() {
  const [, setLocation] = useLocation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showAllocationDialog, setShowAllocationDialog] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string>("");

  // Get couple's event
  const { data: events = [] } = trpc.events.list.useQuery();
  const coupleEvent = events[0]; // Assuming couple has one event

  // Queries
  const { data: roomsData, isLoading: roomsLoading } = trpc.accommodations.getRooms.useQuery(
    { eventId: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );
  const { data: allocationsData } = trpc.accommodations.getAllocations.useQuery(
    { eventId: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );
  const { data: guestsData } = trpc.guests.list.useQuery(
    { eventId: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );

  // Mutations
  const allocateGuestMutation = trpc.accommodations.allocateGuest.useMutation({
    onSuccess: () => {
      toast.success("Guest allocated to room!");
      setShowAllocationDialog(false);
      setSelectedGuestId("");
      setSelectedRoom(null);
      // Refetch allocations
      trpc.useUtils().accommodations.getAllocations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to allocate guest");
    },
  });

  const removeAllocationMutation = trpc.accommodations.removeAllocation.useMutation({
    onSuccess: () => {
      toast.success("Guest removed from room");
      // Refetch allocations
      trpc.useUtils().accommodations.getAllocations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove guest");
    },
  });

  useEffect(() => {
    if (roomsData) setRooms(roomsData);
    if (allocationsData) setAllocations(allocationsData);
  }, [roomsData, allocationsData]);

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

  const handleAllocateGuest = async () => {
    if (!selectedRoom || !selectedGuestId || !coupleEvent) return;

    try {
      await allocateGuestMutation.mutateAsync({
        roomId: selectedRoom.id,
        guestId: parseInt(selectedGuestId),
        eventId: coupleEvent.id,
      });
    } catch (error) {
      console.error("Failed to allocate guest:", error);
    }
  };

  const handleRemoveAllocation = async (allocationId: number) => {
    try {
      await removeAllocationMutation.mutateAsync({ id: allocationId });
    } catch (error) {
      console.error("Failed to remove allocation:", error);
    }
  };

  if (!coupleEvent) {
    return (
      <CoupleLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading your accommodation details...</p>
        </div>
      </CoupleLayout>
    );
  }

  if (roomsLoading) {
    return (
      <CoupleLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading accommodations...</p>
        </div>
      </CoupleLayout>
    );
  }

  return (
    <CoupleLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/couple/dashboard")}
            className="text-[#2C5F5D]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2 flex items-center gap-2">
            <Home className="w-8 h-8" />
            Accommodations
          </h1>
          <p className="text-gray-600">Assign your guests to rooms</p>
        </div>

        {rooms.length === 0 ? (
          <Card className="p-6 text-center">
            <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 mb-2">No accommodations set up yet</p>
            <p className="text-sm text-muted-foreground">
              Your event planner will add room assignments soon
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Unassigned Guests Summary */}
            {getUnallocatedGuests().length > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-lg text-amber-900">
                    Guests to Allocate ({getUnallocatedGuests().length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {getUnallocatedGuests().map((guest) => (
                      <div
                        key={guest.id}
                        className="bg-white border border-amber-300 rounded-full px-3 py-1 text-sm font-medium text-amber-900"
                      >
                        {guest.firstName} {guest.lastName}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Room Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => {
                const roomAllocations = getRoomAllocations(room.id);
                const isFullyOccupied = roomAllocations.length >= 2;

                return (
                  <Card
                    key={room.id}
                    className={`p-4 border-[#6B8E23]/20 ${
                      room.isBlocked ? "bg-gray-50 opacity-60" : ""
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-[#2C5F5D]">{room.roomName}</h3>
                        {room.isAccessible && (
                          <p className="text-xs text-green-600 font-medium">♿ Ground Floor Accessible</p>
                        )}
                      </div>
                    </div>

                    {room.isBlocked && (
                      <p className="mb-2 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">
                        BLOCKED
                      </p>
                    )}

                    {/* Occupancy Progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-gray-600">
                          Occupancy
                        </label>
                        <span className="text-xs text-gray-600">
                          {roomAllocations.length}/2
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            roomAllocations.length === 0
                              ? "bg-green-500"
                              : roomAllocations.length === 1
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${(roomAllocations.length / 2) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="mb-3 space-y-2">
                      <label className="text-xs font-medium text-gray-600">
                        Guests ({roomAllocations.length})
                      </label>
                      {roomAllocations.length > 0 ? (
                        <div className="space-y-2">
                          {roomAllocations.map((alloc) => {
                            const dietaryInfo = getGuestDietaryInfo(alloc.guestId);
                            return (
                              <div key={alloc.id} className="rounded bg-[#2C5F5D]/5 px-3 py-2 border border-[#2C5F5D]/10">
                                <div className="flex items-start justify-between">
                                  <span className="text-sm font-medium text-[#2C5F5D]">
                                    {getGuestName(alloc.guestId)}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveAllocation(alloc.id)}
                                    disabled={removeAllocationMutation.isPending}
                                  >
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                                {dietaryInfo?.hasDietaryRequirements && (
                                  <div className="mt-1 space-y-0.5 text-xs text-gray-600">
                                    {dietaryInfo?.dietaryRestrictions && (
                                      <p>Dietary: {dietaryInfo.dietaryRestrictions}</p>
                                    )}
                                    {dietaryInfo?.allergySeverity === "mild" && (
                                      <p className="text-yellow-600 font-medium">⚠️ Mild Allergy</p>
                                    )}
                                    {dietaryInfo?.allergySeverity === "severe" && (
                                      <p className="text-red-600 font-medium">🚨 Severe Allergy</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No guests assigned</p>
                      )}
                    </div>

                    {/* Add Guest Button */}
                    {!room.isBlocked && !isFullyOccupied && (
                      <Dialog open={showAllocationDialog && selectedRoom?.id === room.id} onOpenChange={(open) => {
                        setShowAllocationDialog(open);
                        if (open) {
                          setSelectedRoom(room);
                          setSelectedGuestId("");
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-[#2C5F5D] border-[#2C5F5D]/30 hover:bg-[#2C5F5D]/5"
                            onClick={() => setSelectedRoom(room)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add Guest
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Allocate Guest to {room.roomName}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Select Guest</label>
                              <Select value={selectedGuestId} onValueChange={setSelectedGuestId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a guest..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {getUnallocatedGuests().map((guest) => (
                                    <SelectItem key={guest.id} value={guest.id.toString()}>
                                      {guest.firstName} {guest.lastName}
                                      {guest.email && ` (${guest.email})`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowAllocationDialog(false);
                                  setSelectedGuestId("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleAllocateGuest}
                                disabled={!selectedGuestId || allocateGuestMutation.isPending}
                                className="bg-[#2C5F5D] hover:bg-[#2C5F5D]/90"
                              >
                                {allocateGuestMutation.isPending ? "Allocating..." : "Allocate Guest"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {room.notes && (
                      <div className="mt-3 border-t border-[#6B8E23]/10 pt-3">
                        <label className="text-xs font-medium text-gray-600">Notes</label>
                        <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                          {room.notes}
                        </p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </CoupleLayout>
  );
}
