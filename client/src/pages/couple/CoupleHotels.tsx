import { useEffect, useState } from "react";
import CoupleLayout from "@/components/CoupleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

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
          <p className="text-gray-600">Your guest room assignments and accommodation details</p>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => {
              const roomAllocations = getRoomAllocations(room.id);

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
        )}
      </div>
    </CoupleLayout>
  );
}
