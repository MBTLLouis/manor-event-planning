import { trpc } from "@/lib/trpc";
import CoupleLayout from "@/components/CoupleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CoupleTimeline() {
  // Get couple's event
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
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2">Wedding Timeline</h1>
          <p className="text-gray-600">Your day-of schedule and events</p>
        </div>

        {days.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-2">No timeline yet</p>
              <p className="text-sm text-muted-foreground">
                Your event planner will create a detailed timeline for your wedding day
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={days[0]?.id.toString()} className="w-full">
            <TabsList className="mb-6">
              {days.map((day) => (
                <TabsTrigger key={day.id} value={day.id.toString()}>
                  Day {day.orderIndex + 1}
                </TabsTrigger>
              ))}
            </TabsList>

            {days.map((day) => (
              <TabsContent key={day.id} value={day.id.toString()}>
                <TimelineDay dayId={day.id} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </CoupleLayout>
  );
}

function TimelineDay({ dayId }: { dayId: number }) {
  const { data: dayData } = trpc.timeline.listDays.useQuery({ eventId: 0 });
  const day = dayData?.find((d: any) => d.id === dayId);
  const events = day?.events || [];

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No events scheduled for this day
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-2 text-[#6B8E23] bg-[#6B8E23]/10 px-3 py-1 rounded-lg">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{event.time}</span>
                </div>
                <div>
                  <CardTitle className="text-xl mb-1">{event.title}</CardTitle>
                  {event.description && (
                    <p className="text-sm text-gray-600">{event.description}</p>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          {(event.assignedTo || event.notes) && (
            <CardContent>
              <div className="space-y-2">
                {event.assignedTo && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{event.assignedTo}</Badge>
                  </div>
                )}
                {event.notes && (
                  <p className="text-sm text-gray-600 italic">{event.notes}</p>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
