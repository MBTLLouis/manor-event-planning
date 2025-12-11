import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Clock, Edit, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import EmployeeLayout from "@/components/EmployeeLayout";
import { toast } from "sonner";
import { format } from "date-fns";

// Generate time options for dropdown (every 15 minutes)
const generateTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      times.push(`${h}:${m}`);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

export default function Timeline() {
  const [, params] = useRoute("/events/:id/timeline");
  const [, setLocation] = useLocation();
  const eventId = params?.id ? parseInt(params.id) : 0;

  const [isAddDayDialogOpen, setIsAddDayDialogOpen] = useState(false);
  const [isEditDayDialogOpen, setIsEditDayDialogOpen] = useState(false);
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [isEditEventDialogOpen, setIsEditEventDialogOpen] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [editingDay, setEditingDay] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
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

  const updateDayMutation = trpc.timeline.updateDay.useMutation({
    onSuccess: () => {
      toast.success("Day updated!");
      setIsEditDayDialogOpen(false);
      setEditingDay(null);
      utils.timeline.listDays.invalidate({ eventId });
    },
  });

  const deleteDayMutation = trpc.timeline.deleteDay.useMutation({
    onSuccess: () => {
      toast.success("Day deleted!");
      setSelectedDayId(null);
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

  const updateEventMutation = trpc.timeline.updateEvent.useMutation({
    onSuccess: () => {
      toast.success("Event updated!");
      setIsEditEventDialogOpen(false);
      setEditingEvent(null);
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

  const handleEditDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDay) return;
    updateDayMutation.mutate({
      id: editingDay.id,
      title: editingDay.title,
      date: editingDay.date,
    });
  };

  const handleDeleteDay = (dayId: number) => {
    if (confirm("Are you sure you want to delete this day? All events in this day will also be deleted.")) {
      deleteDayMutation.mutate({ id: dayId });
    }
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

  const handleEditEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    updateEventMutation.mutate({
      id: editingEvent.id,
      time: editingEvent.time,
      title: editingEvent.title,
      description: editingEvent.description,
      assignedTo: editingEvent.assignedTo,
      notes: editingEvent.notes,
    });
  };

  const handleDeleteEvent = (eventId: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate({ id: eventId });
    }
  };

  const openEditDay = (day: any) => {
    setEditingDay({ ...day });
    setIsEditDayDialogOpen(true);
  };

  const openEditEvent = (evt: any) => {
    setEditingEvent({ ...evt });
    setIsEditEventDialogOpen(true);
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
                  <DialogContent className="max-w-2xl">
                    <form onSubmit={handleAddEvent}>
                      <DialogHeader>
                        <DialogTitle>Add Timeline Event</DialogTitle>
                        <DialogDescription>Add a new event to the selected day</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="event-time">Time</Label>
                          <Select
                            value={newEvent.time}
                            onValueChange={(value) => setNewEvent({ ...newEvent, time: value })}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="event-title">Event Name</Label>
                          <Input
                            id="event-title"
                            placeholder="e.g., Ceremony Begins"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="event-assigned">Person Responsible (Optional)</Label>
                          <Input
                            id="event-assigned"
                            placeholder="Person responsible for this event"
                            value={newEvent.assignedTo}
                            onChange={(e) => setNewEvent({ ...newEvent, assignedTo: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="event-notes">Additional Information</Label>
                          <Textarea
                            id="event-notes"
                            placeholder="Any additional details or notes..."
                            value={newEvent.notes}
                            onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                            rows={4}
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
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{format(new Date(day.date), "EEEE, MMMM d, yyyy")}</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDay(day)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDay(day.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {day.events && day.events.length > 0 ? (
                      <div className="space-y-4">
                        {day.events.map((evt: any) => (
                          <Card key={evt.id} className="border-l-4 border-l-primary">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Clock className="w-5 h-5 text-primary" />
                                    <span className="font-semibold text-lg">{evt.time}</span>
                                  </div>
                                  <h3 className="text-xl font-bold mb-2">{evt.title}</h3>
                                  {evt.assignedTo && (
                                    <p className="text-sm mb-2">
                                      <span className="font-medium">Person Responsible:</span> {evt.assignedTo}
                                    </p>
                                  )}
                                  {evt.notes && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                      {evt.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => openEditEvent(evt)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(evt.id)}>
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
                        No events scheduled for this day. Click "Add Event" to create one.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No timeline days created yet.</p>
              <Dialog open={isAddDayDialogOpen} onOpenChange={setIsAddDayDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Day
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

        {/* Edit Day Dialog */}
        <Dialog open={isEditDayDialogOpen} onOpenChange={setIsEditDayDialogOpen}>
          <DialogContent>
            <form onSubmit={handleEditDay}>
              <DialogHeader>
                <DialogTitle>Edit Timeline Day</DialogTitle>
                <DialogDescription>Update day details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-day-title">Day Title</Label>
                  <Input
                    id="edit-day-title"
                    value={editingDay?.title || ""}
                    onChange={(e) => setEditingDay({ ...editingDay, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-day-date">Date</Label>
                  <Input
                    id="edit-day-date"
                    type="date"
                    value={editingDay?.date || ""}
                    onChange={(e) => setEditingDay({ ...editingDay, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog open={isEditEventDialogOpen} onOpenChange={setIsEditEventDialogOpen}>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleEditEvent}>
              <DialogHeader>
                <DialogTitle>Edit Timeline Event</DialogTitle>
                <DialogDescription>Update event details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-event-time">Time</Label>
                  <Select
                    value={editingEvent?.time || ""}
                    onValueChange={(value) => setEditingEvent({ ...editingEvent, time: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-event-title">Event Name</Label>
                  <Input
                    id="edit-event-title"
                    value={editingEvent?.title || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-event-assigned">Person Responsible (Optional)</Label>
                  <Input
                    id="edit-event-assigned"
                    value={editingEvent?.assignedTo || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, assignedTo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-event-notes">Additional Information</Label>
                  <Textarea
                    id="edit-event-notes"
                    value={editingEvent?.notes || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, notes: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </EmployeeLayout>
  );
}
