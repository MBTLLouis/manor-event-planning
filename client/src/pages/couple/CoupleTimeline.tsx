import { trpc } from "@/lib/trpc";
import CoupleLayout from "@/components/CoupleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock } from "lucide-react";

export default function CoupleTimeline() {
  const { data: events = [] } = trpc.events.list.useQuery();
  const coupleEvent = events[0];

  const { data: days = [] } = trpc.timeline.listDays.useQuery(
    { eventId: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );

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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2">Wedding Timeline</h1>
          <p className="text-gray-600">Your wedding day schedule and events</p>
        </div>

        {days.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-2">No timeline events yet</p>
              <p className="text-sm text-muted-foreground">
                Your event planner will create the timeline for your wedding day
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={`day-${days[0]?.id}`} className="w-full">
            <TabsList className="grid w-full gap-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(120px, 1fr))` }}>
              {days.map((day) => (
                <TabsTrigger key={day.id} value={`day-${day.id}`} className="text-xs sm:text-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{day.title}</span>
                  <span className="sm:hidden">{day.title.split(" ")[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {days.map((day) => (
              <TabsContent key={day.id} value={`day-${day.id}`} className="space-y-4 mt-6">
                <Card className="border-[#2C5F5D]/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl text-[#2C5F5D]">{day.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(day.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[#2C5F5D]">
                        {day.events?.length || 0} events
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {day.events && day.events.length > 0 ? (
                      <div className="space-y-4">
                        {day.events.map((event: any) => (
                          <div key={event.id} className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex items-center gap-2 text-[#2C5F5D] font-semibold min-w-fit">
                                <Clock className="w-4 h-4" />
                                <span>{event.time}</span>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{event.title}</h3>
                                {event.description && (
                                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                )}
                                {event.assignedTo && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    <span className="font-medium">Assigned to:</span> {event.assignedTo}
                                  </p>
                                )}
                                {event.notes && (
                                  <p className="text-xs text-gray-500 mt-2 italic">
                                    <span className="font-medium">Notes:</span> {event.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No events scheduled for this day</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Note:</span> Your event planner manages the timeline. If you need to make changes, please contact your planner directly.
            </p>
          </CardContent>
        </Card>
      </div>
    </CoupleLayout>
  );
}
