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
// Removed drag-and-drop imports - events now sort automatically by time

// Table row for event - events display in table format
function EventTableRow({ event, onDelete, onEdit }: { event: any; onDelete: (id: number) => void; onEdit: (event: any) => void }) {
  return (
    <tr className="border-b hover:bg-gray-50 transition-colors">
      <td className="px-4 py-2 text-sm font-semibold text-primary whitespace-nowrap">{event.time}</td>
      <td className="px-4 py-2 text-sm font-bold">{event.title}</td>
      <td className="px-4 py-2 text-sm text-muted-foreground max-w-xs truncate">{event.description || "-"}</td>
      <td className="px-4 py-2 text-sm whitespace-nowrap">{event.assignedTo || "-"}</td>
      <td className="px-4 py-2 text-sm text-muted-foreground max-w-xs truncate">{event.notes || "-"}</td>
      <td className="px-4 py-2 flex gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(event)}
          className="h-6 w-6 p-0"
        >
          <Edit className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(event.id)}
          className="h-6 w-6 p-0"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </td>
    </tr>
  );
}

export default function TimelineEnhanced() {
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
      toast.success("Event updated successfully!");
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

  // Removed sensors - events now sort automatically by time

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
    if (confirm("Are you sure you want to delete this day? All events on this day will also be deleted.")) {
      deleteDayMutation.mutate({ id: dayId });
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDayId) return;

    const selectedDay = days?.find(d => d.id === selectedDayId);
    const eventCount = selectedDay?.events?.length || 0;

    createEventMutation.mutate({
      timelineDayId: selectedDayId,
      ...newEvent,
      orderIndex: eventCount,
    });
  };

  const handleDeleteEvent = (eventId: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate({ id: eventId });
    }
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setIsEditEventDialogOpen(true);
  };

  const handleUpdateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    updateEventMutation.mutate({
      id: editingEvent.id,
      time: editingEvent.time,
      title: editingEvent.title,
      description: editingEvent.description || null,
      assignedTo: editingEvent.assignedTo || null,
      notes: editingEvent.notes || null,
    });
  };

  // Removed handleDragEnd - events now sort automatically by time

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
              <div className="flex gap-1 flex-shrink-0">
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
                    <div className="flex items-center justify-between">
                      <CardTitle>{format(new Date(day.date), "EEEE, MMMM d, yyyy")}</CardTitle>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingDay({
                              id: day.id,
                              title: day.title,
                              date: format(new Date(day.date), "yyyy-MM-dd"),
                            });
                            setIsEditDayDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDay(day.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {day.events && day.events.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-gray-100 border-b-2 border-gray-300">
                            <tr>
                              <th className="px-4 py-2 text-xs font-semibold text-gray-700">Time</th>
                              <th className="px-4 py-2 text-xs font-semibold text-gray-700">Title</th>
                              <th className="px-4 py-2 text-xs font-semibold text-gray-700">Description</th>
                              <th className="px-4 py-2 text-xs font-semibold text-gray-700">Assigned To</th>
                              <th className="px-4 py-2 text-xs font-semibold text-gray-700">Notes</th>
                              <th className="px-4 py-2 text-xs font-semibold text-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {day.events.map((evt) => (
                              <EventTableRow
                                key={evt.id}
                                event={evt}
                                onDelete={handleDeleteEvent}
                                onEdit={handleEditEvent}
                              />
                            ))}
                          </tbody>
                        </table>
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
            <CardContent className="py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No timeline days yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first day to the timeline
                </p>
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Day Dialog */}
        <Dialog open={isEditDayDialogOpen} onOpenChange={setIsEditDayDialogOpen}>
          <DialogContent>
            <form onSubmit={handleEditDay}>
              <DialogHeader>
                <DialogTitle>Edit Timeline Day</DialogTitle>
                <DialogDescription>Modify the day title and date</DialogDescription>
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
                <Button type="submit">Update Day</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog open={isEditEventDialogOpen} onOpenChange={setIsEditEventDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Modify the event details. Events will automatically reorder by time.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateEvent}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-event-time">Time *</Label>
                    <Input
                      id="edit-event-time"
                      type="time"
                      value={editingEvent?.time || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-event-title">Title *</Label>
                    <Input
                      id="edit-event-title"
                      value={editingEvent?.title || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-event-description">Description</Label>
                  <Textarea
                    id="edit-event-description"
                    value={editingEvent?.description || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-event-assigned">Assigned To</Label>
                  <Input
                    id="edit-event-assigned"
                    value={editingEvent?.assignedTo || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, assignedTo: e.target.value })}
                    placeholder="Person or team responsible"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-event-notes">Notes</Label>
                  <Textarea
                    id="edit-event-notes"
                    value={editingEvent?.notes || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, notes: e.target.value })}
                    rows={2}
                    placeholder="Additional notes or instructions"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Update Event</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </EmployeeLayout>
  );
}
