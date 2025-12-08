import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Clock, Edit, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import EmployeeLayout from "@/components/EmployeeLayout";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Timeline() {
  const [, params] = useRoute("/events/:id/timeline");
  const [, setLocation] = useLocation();
  const eventId = params?.id ? parseInt(params.id) : 0;

  const [isAddDayDialogOpen, setIsAddDayDialogOpen] = useState(false);
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [newDay, setNewDay] = useState({ title: "", date: "" });
  const [newEvent, setNewEvent] = useState({
    time: "",
    title: "",
    description: "",
    assignedTo: "",
    notes: "",
  });

  const { data: event } = trpc.events.getById.useQuery({ id: eventId });
  const { data: days } = trpc.timeline.listDays.useQuery({ eventId });

  const utils = trpc.useUtils();
  const createDayMutation = trpc.timeline.createDay.useMutation({
    onSuccess: (data) => {
      toast.success("Day added to timeline!");
      setIsAddDayDialogOpen(false);
      setNewDay({ title: "", date: "" });
      setSelectedDayId(data.id);
      utils.timeline.listDays.invalidate({ eventId });
    },
  });

  const createEventMutation = trpc.timeline.createEvent.useMutation({
    onSuccess: () => {
      toast.success("Event added!");
      setIsAddEventDialogOpen(false);
      setNewEvent({ time: "", title: "", description: "", assignedTo: "", notes: "" });
      utils.timeline.listDays.invalidate({ eventId });
    },
  });

  const deleteEventMutation = trpc.timeline.deleteEvent.useMutation({
    onSuccess: () => {
      toast.success("Event deleted!");
      utils.timeline.listDays.invalidate({ eventId });
    },
  });

  const handleAddDay = (e: React.FormEvent) => {
    e.preventDefault();
    createDayMutation.mutate({
      eventId,
      ...newDay,
      orderIndex: (days?.length || 0) + 1,
    });
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDayId) return;

    createEventMutation.mutate({
      timelineDayId: selectedDayId,
      ...newEvent,
      orderIndex: 0,
    });
  };

  const handleDeleteEvent = (eventId: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate({ id: eventId });
    }
  };

  // Auto-select first day if available
  if (days && days.length > 0 && selectedDayId === null) {
    setSelectedDayId(days[0].id);
  }

  return (
    <EmployeeLayout>
      <div className="p-8">
        <Button variant="ghost" className="mb-6" onClick={() => setLocation(`/events/${eventId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{event?.title}</h1>
          <p className="text-lg text-muted-foreground">Event Timeline & Schedule</p>
        </div>

        {days && days.length > 0 ? (
          <Tabs value={selectedDayId?.toString()} onValueChange={(v) => setSelectedDayId(parseInt(v))}>
            <div className="flex items-center justify-between mb-6">
              <TabsList>
                {days.map((day) => (
                  <TabsTrigger key={day.id} value={day.id.toString()}>
                    {day.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="flex gap-2">
                <Dialog open={isAddDayDialogOpen} onOpenChange={setIsAddDayDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Day
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleAddDay}>
                      <DialogHeader>
                        <DialogTitle>Add Timeline Day</DialogTitle>
                        <DialogDescription>Create a new day in the event timeline</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="day-title">Day Title</Label>
                          <Input
                            id="day-title"
                            placeholder="e.g., Wedding Day, Rehearsal"
                            value={newDay.title}
                            onChange={(e) => setNewDay({ ...newDay, title: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="day-date">Date</Label>
                          <Input
                            id="day-date"
                            type="date"
                            value={newDay.date}
                            onChange={(e) => setNewDay({ ...newDay, date: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Add Day</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Dialog open={isAddEventDialogOpen} onOpenChange={setIsAddEventDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleAddEvent}>
                      <DialogHeader>
                        <DialogTitle>Add Timeline Event</DialogTitle>
                        <DialogDescription>Add a new event to the selected day</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="event-time">Time</Label>
                          <Input
                            id="event-time"
                            type="time"
                            value={newEvent.time}
                            onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="event-title">Title</Label>
                          <Input
                            id="event-title"
                            placeholder="e.g., Ceremony Begins"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="event-description">Description</Label>
                          <Textarea
                            id="event-description"
                            placeholder="Event details..."
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="event-assigned">Assigned To</Label>
                          <Input
                            id="event-assigned"
                            placeholder="Person responsible"
                            value={newEvent.assignedTo}
                            onChange={(e) => setNewEvent({ ...newEvent, assignedTo: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="event-notes">Notes</Label>
                          <Textarea
                            id="event-notes"
                            placeholder="Additional notes..."
                            value={newEvent.notes}
                            onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Add Event</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {days.map((day) => (
              <TabsContent key={day.id} value={day.id.toString()} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{format(new Date(day.date), "EEEE, MMMM d, yyyy")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {day.events && day.events.length > 0 ? (
                      <div className="space-y-4">
                        {day.events.map((evt) => (
                          <Card key={evt.id} className="border-l-4 border-l-primary">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Clock className="w-5 h-5 text-primary" />
                                    <span className="font-semibold text-lg">{evt.time}</span>
                                  </div>
                                  <h3 className="text-xl font-bold mb-2">{evt.title}</h3>
                                  {evt.description && (
                                    <p className="text-muted-foreground mb-2">{evt.description}</p>
                                  )}
                                  {evt.assignedTo && (
                                    <p className="text-sm">
                                      <span className="font-medium">Assigned to:</span> {evt.assignedTo}
                                    </p>
                                  )}
                                  {evt.notes && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                      <span className="font-medium">Notes:</span> {evt.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="icon">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteEvent(evt.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No events scheduled for this day
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground mb-4">No timeline days created yet</p>
              <Dialog open={isAddDayDialogOpen} onOpenChange={setIsAddDayDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Day
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddDay}>
                    <DialogHeader>
                      <DialogTitle>Add Timeline Day</DialogTitle>
                      <DialogDescription>Create a new day in the event timeline</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="day-title">Day Title</Label>
                        <Input
                          id="day-title"
                          placeholder="e.g., Wedding Day, Rehearsal"
                          value={newDay.title}
                          onChange={(e) => setNewDay({ ...newDay, title: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="day-date">Date</Label>
                        <Input
                          id="day-date"
                          type="date"
                          value={newDay.date}
                          onChange={(e) => setNewDay({ ...newDay, date: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Add Day</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </EmployeeLayout>
  );
}
