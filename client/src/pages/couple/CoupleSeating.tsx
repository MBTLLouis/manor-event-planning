import { trpc } from "@/lib/trpc";
import CoupleLayout from "@/components/CoupleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users } from "lucide-react";

export default function CoupleSeating() {
  // Get couple's event
  const { data: events = [] } = trpc.events.list.useQuery();
  const coupleEvent = events[0];

  const { data: floorPlans = [] } = trpc.floorPlans.list.useQuery(
    { eventId: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );

  const { data: tables = [] } = trpc.floorPlans.getTables.useQuery(
    { eventId: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );

  // Group tables by floor plan
  const floorPlansWithTables = floorPlans.map((plan) => ({
    ...plan,
    tables: tables.filter((t) => t.floorPlanId === plan.id),
  }));

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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2">Seating Arrangements</h1>
          <p className="text-gray-600">View your floor plans and table assignments</p>
        </div>

        {floorPlansWithTables.length === 0 ? (
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {floorPlansWithTables.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <Badge variant="outline">{plan.tables.length} tables</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {plan.tables.map((table: any) => {
                      const assignedSeats = table.seats.filter((s: any) => s.guestName).length;
                      const totalSeats = table.seats.length;
                      const fillPercentage = (assignedSeats / totalSeats) * 100;

                      return (
                        <div key={table.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#6B8E23]/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-[#6B8E23]">
                                  {table.tableNumber}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">Table {table.tableNumber}</p>
                                <p className="text-sm text-gray-600">
                                  {table.shape} • {totalSeats} seats
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-[#2C5F5D]">
                                {assignedSeats}/{totalSeats}
                              </p>
                              <p className="text-xs text-gray-600">assigned</p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div
                              className="bg-[#6B8E23] h-2 rounded-full transition-all"
                              style={{ width: `${fillPercentage}%` }}
                            />
                          </div>

                          {/* Guest list */}
                          {assignedSeats > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-600 mb-2">Guests:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {table.seats
                                  .filter((s: any) => s.guestName)
                                  .map((seat: any) => (
                                    <div
                                      key={seat.id}
                                      className="flex items-center gap-2 text-sm"
                                    >
                                      <Users className="w-3 h-3 text-gray-400" />
                                      <span>{seat.guestName}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CoupleLayout>
  );
}
