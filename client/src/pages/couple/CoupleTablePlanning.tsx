import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";

export default function CoupleTablePlanning() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

  // Get couple's event
  const { data: events, isLoading: eventsLoading } = trpc.events.list.useQuery();
  const coupleEvent = events?.[0];
  const eventId = coupleEvent?.id || 0;

  // Queries
  const { data: tablesData, isLoading: tablesLoading, refetch: refetchTables } = trpc.tablePlanning.getEventTablesWithGuests.useQuery(
    { eventId },
    { enabled: eventId > 0 }
  );

  const { data: unassignedGuests, isLoading: unassignedLoading } = trpc.tablePlanning.getUnassignedGuests.useQuery(
    { eventId },
    { enabled: eventId > 0 }
  );

  const { data: searchResults, isLoading: searchLoading } = trpc.tablePlanning.searchGuests.useQuery(
    { eventId, query: searchQuery },
    { enabled: eventId > 0 && searchQuery.length > 0 }
  );

  // Mutations
  const assignGuestMutation = trpc.tablePlanning.assignGuestToTable.useMutation({
    onSuccess: () => {
      toast.success("Guest assigned successfully");
      refetchTables();
      setSearchQuery("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to assign guest");
    },
  });

  const unassignGuestMutation = trpc.tablePlanning.unassignGuestFromTable.useMutation({
    onSuccess: () => {
      toast.success("Guest unassigned successfully");
      refetchTables();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unassign guest");
    },
  });

  // Get guests to display (search results or unassigned)
  const guestsToDisplay = useMemo(() => {
    if (searchQuery.length > 0 && searchResults) {
      return searchResults;
    }
    return unassignedGuests || [];
  }, [searchQuery, searchResults, unassignedGuests]);

  const handleAssignGuest = (guestId: number, tableId: number) => {
    assignGuestMutation.mutate({ guestId, tableId });
  };

  const handleUnassignGuest = (guestId: number) => {
    unassignGuestMutation.mutate({ guestId });
  };

  if (eventsLoading || tablesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!coupleEvent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No event found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Seating Arrangements</h1>
        <p className="text-muted-foreground">
          Organize your guests by assigning them to tables
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tables Section */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Tables ({tablesData?.length || 0})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tablesData && tablesData.length > 0 ? (
              tablesData.map((table: any) => (
                <Card
                  key={table.id}
                  className={`cursor-pointer transition-all ${
                    selectedTableId === table.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedTableId(table.id)}
                >
                  <CardHeader className="pb-3">
                    <div>
                      <CardTitle className="text-lg">{table.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {table.filledSeats}/{table.seatCount} seats
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${(table.filledSeats / table.seatCount) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {table.assignedGuests.map((guest: any) => (
                          <Badge
                            key={guest.id}
                            variant="secondary"
                            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnassignGuest(guest.id);
                            }}
                          >
                            {guest.firstName}
                            <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="lg:col-span-2">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No tables created yet
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Guest Assignment Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Assign Guests</h2>

          {selectedTableId ? (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search guests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <ScrollArea className="h-[500px] border rounded-lg p-4">
                {searchLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : guestsToDisplay.length > 0 ? (
                  <div className="space-y-2">
                    {guestsToDisplay.map((guest: any) => (
                      <Button
                        key={guest.id}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => handleAssignGuest(guest.id, selectedTableId)}
                        disabled={assignGuestMutation.isPending}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {guest.firstName} {guest.lastName}
                          </span>
                          {guest.email && (
                            <span className="text-xs text-muted-foreground">{guest.email}</span>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {searchQuery ? "No guests found" : "No unassigned guests"}
                  </p>
                )}
              </ScrollArea>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Select a table to assign guests
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
