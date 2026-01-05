import { useState } from "react";
import { trpc } from "@/lib/trpc";
import CoupleLayout from "@/components/CoupleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CoupleTimeline() {
  const { data: events = [] } = trpc.events.list.useQuery();
  const coupleEvent = events[0];

  const { data: days = [] } = trpc.timeline.listDays.useQuery(
    { eventId: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );

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

  const utils = trpc.useUtils();

  const createDayMutation = trpc.timeline.createDay.useMutation({
    onSuccess: (data) => {
      toast.success("Day added to timeline!");
      setIsAddDayDialogOpen(false);
      setNewDay({ title: "", date: "" });
      setSelectedDayId(data.id);
      utils.timeline.listDays.invalidate({ eventId: coupleEvent?.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add day");
    },
  });

  const updateDayMutation = trpc.timeline.updateDay.useMutation({
    onSuccess: () => {
      toast.success("Day updated!");
      setIsEditDayDialogOpen(false);
      setEditingDay(null);
      utils.timeline.listDays.invalidate({ eventId: coupleEvent?.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update day");
    },
  });

  const deleteDayMutation = trpc.timeline.deleteDay.useMutation({
    onSuccess: () => {
      toast.success("Day deleted!");
      utils.timeline.listDays.invalidate({ eventId: coupleEvent?.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete day");
    },
  });

  const createEventMutation = trpc.timeline.createEvent.useMutation({
    onSuccess: () => {
      toast.success("Event added to timeline!");
      setIsAddEventDialogOpen(false);
      setNewEvent({ time: "", title: "", description: "", assignedTo: "", notes: "" });
      utils.timeline.listDays.invalidate({ eventId: coupleEvent?.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add event");
    },
  });

  const updateEventMutation = trpc.timeline.updateEvent.useMutation({
    onSuccess: () => {
      toast.success("Event updated!");
      setIsEditEventDialogOpen(false);
      setEditingEvent(null);
      utils.timeline.listDays.invalidate({ eventId: coupleEvent?.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update event");
    },
  });

  const deleteEventMutation = trpc.timeline.deleteEvent.useMutation({
    onSuccess: () => {
      toast.success("Event deleted!");
      utils.timeline.listDays.invalidate({ eventId: coupleEvent?.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete event");
    },
  });

  const handleAddDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDay.title || !newDay.date) {
      toast.error("Please fill in all fields");
      return;
    }
    createDayMutation.mutate({
      eventId: coupleEvent?.id || 0,
      title: newDay.title,
      date: newDay.date,
    });
  };

  const handleEditDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDay?.title || !editingDay?.date) {
      toast.error("Please fill in all fields");
      return;
    }
    updateDayMutation.mutate({
      id: editingDay.id,
      title: editingDay.title,
      date: editingDay.date,
    });
  };

  const handleDeleteDay = (id: number) => {
    if (confirm("Are you sure you want to delete this day and all its events?")) {
      deleteDayMutation.mutate({ id });
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.time || !newEvent.title || !selectedDayId) {
      toast.error("Please fill in all required fields");
      return;
    }
    createEventMutation.mutate({
      timelineDayId: selectedDayId,
      ...newEvent,
    });
  };

  const handleEditEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent?.time || !editingEvent?.title) {
      toast.error("Please fill in all required fields");
      return;
    }
    updateEventMutation.mutate({
      id: editingEvent.id,
      time: editingEvent.time,
      title: editingEvent.title,
      description: editingEvent.description,
      assignedTo: editingEvent.assignedTo,
      notes: editingEvent.notes,
    });
  };

  const handleDeleteEvent = (id: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate({ id });
    }
  };

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2">Wedding Timeline</h1>
            <p className="text-gray-600">Plan your day-of schedule and events</p>
          </div>
          <Dialog open={isAddDayDialogOpen} onOpenChange={setIsAddDayDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#2C5F5D] hover:bg-[#1e4441]">
                <Plus className="w-4 h-4 mr-2" />
                Add Day
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddDay}>
                <DialogHeader>
                  <DialogTitle>Add Day to Timeline</DialogTitle>
                  <DialogDescription>Create a new day for your wedding timeline</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="dayTitle">Day Title *</Label>
                    <Input
                      id="dayTitle"
                      placeholder="e.g., Wedding Day, Rehearsal Dinner"
                      value={newDay.title}
                      onChange={(e) => setNewDay({ ...newDay, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dayDate">Date *</Label>
                    <Input
                      id="dayDate"
                      type="date"
                      value={newDay.date}
                      onChange={(e) => setNewDay({ ...newDay, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createDayMutation.isPending}>
                    {createDayMutation.isPending ? "Adding..." : "Add Day"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {days.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-2">No timeline yet</p>
              <p className="text-sm text-muted-foreground">
                Create days and add events to plan your wedding day schedule
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={days[0]?.id.toString()} className="w-full" onValueChange={(value) => setSelectedDayId(parseInt(value))}>
            <TabsList className="mb-6">
              {days.map((day) => (
                <TabsTrigger key={day.id} value={day.id.toString()}>
                  {day.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {days.map((day) => (
              <TabsContent key={day.id} value={day.id.toString()}>
                <div className="space-y-6">
                  {/* Day Header */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl">{day.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{new Date(day.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Dialog open={isEditDayDialogOpen && editingDay?.id === day.id} onOpenChange={(open) => {
                          if (!open) setEditingDay(null);
                          setIsEditDayDialogOpen(open);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingDay(day)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <form onSubmit={handleEditDay}>
                              <DialogHeader>
                                <DialogTitle>Edit Day</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="editDayTitle">Day Title</Label>
                                  <Input
                                    id="editDayTitle"
                                    value={editingDay?.title || ""}
                                    onChange={(e) => setEditingDay({ ...editingDay, title: e.target.value })}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="editDayDate">Date</Label>
                                  <Input
                                    id="editDayDate"
                                    type="date"
                                    value={editingDay?.date || ""}
                                    onChange={(e) => setEditingDay({ ...editingDay, date: e.target.value })}
                                    required
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="submit" disabled={updateDayMutation.isPending}>
                                  {updateDayMutation.isPending ? "Updating..." : "Update Day"}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDay(day.id)}
                          disabled={deleteDayMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Add Event Button */}
                  <div className="flex justify-end">
                    <Dialog open={isAddEventDialogOpen && selectedDayId === day.id} onOpenChange={setIsAddEventDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          className="bg-[#2C5F5D] hover:bg-[#1e4441]"
                          onClick={() => setSelectedDayId(day.id)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Event
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={handleAddEvent}>
                          <DialogHeader>
                            <DialogTitle>Add Event to {day.title}</DialogTitle>
                            <DialogDescription>Add a scheduled event for this day</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="eventTime">Time *</Label>
                              <Input
                                id="eventTime"
                                type="time"
                                value={newEvent.time}
                                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="eventTitle">Event Title *</Label>
                              <Input
                                id="eventTitle"
                                placeholder="e.g., Ceremony, Reception, Dinner"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="eventDescription">Description</Label>
                              <Textarea
                                id="eventDescription"
                                placeholder="Add details about this event..."
                                value={newEvent.description}
                                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="eventAssignedTo">Assigned To</Label>
                              <Input
                                id="eventAssignedTo"
                                placeholder="e.g., Photographer, DJ, Caterer"
                                value={newEvent.assignedTo}
                                onChange={(e) => setNewEvent({ ...newEvent, assignedTo: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="eventNotes">Notes</Label>
                              <Textarea
                                id="eventNotes"
                                placeholder="Any special notes..."
                                value={newEvent.notes}
                                onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={createEventMutation.isPending}>
                              {createEventMutation.isPending ? "Adding..." : "Add Event"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Events List */}
                  {day.events && day.events.length > 0 ? (
                    <div className="space-y-4">
                      {day.events
                        .sort((a: any, b: any) => a.time.localeCompare(b.time))
                        .map((event: any) => (
                          <Card key={event.id} className="border-l-4 border-l-[#2C5F5D]">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Clock className="w-5 h-5 text-[#2C5F5D]" />
                                    <span className="font-semibold text-lg">{event.time}</span>
                                  </div>
                                  <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                                  {event.description && (
                                    <p className="text-gray-600 mb-2">{event.description}</p>
                                  )}
                                  {event.assignedTo && (
                                    <p className="text-sm">
                                      <span className="font-medium">Assigned to:</span> {event.assignedTo}
                                    </p>
                                  )}
                                  {event.notes && (
                                    <p className="text-sm text-gray-600 mt-2">
                                      <span className="font-medium">Notes:</span> {event.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Dialog open={isEditEventDialogOpen && editingEvent?.id === event.id} onOpenChange={(open) => {
                                    if (!open) setEditingEvent(null);
                                    setIsEditEventDialogOpen(open);
                                  }}>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingEvent(event)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <form onSubmit={handleEditEvent}>
                                        <DialogHeader>
                                          <DialogTitle>Edit Event</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                          <div className="space-y-2">
                                            <Label htmlFor="editEventTime">Time</Label>
                                            <Input
                                              id="editEventTime"
                                              type="time"
                                              value={editingEvent?.time || ""}
                                              onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                                              required
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="editEventTitle">Event Title</Label>
                                            <Input
                                              id="editEventTitle"
                                              value={editingEvent?.title || ""}
                                              onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                                              required
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="editEventDescription">Description</Label>
                                            <Textarea
                                              id="editEventDescription"
                                              value={editingEvent?.description || ""}
                                              onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="editEventAssignedTo">Assigned To</Label>
                                            <Input
                                              id="editEventAssignedTo"
                                              value={editingEvent?.assignedTo || ""}
                                              onChange={(e) => setEditingEvent({ ...editingEvent, assignedTo: e.target.value })}
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="editEventNotes">Notes</Label>
                                            <Textarea
                                              id="editEventNotes"
                                              value={editingEvent?.notes || ""}
                                              onChange={(e) => setEditingEvent({ ...editingEvent, notes: e.target.value })}
                                            />
                                          </div>
                                        </div>
                                        <DialogFooter>
                                          <Button type="submit" disabled={updateEventMutation.isPending}>
                                            {updateEventMutation.isPending ? "Updating..." : "Update Event"}
                                          </Button>
                                        </DialogFooter>
                                      </form>
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteEvent(event.id)}
                                    disabled={deleteEventMutation.isPending}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        No events scheduled for this day
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </CoupleLayout>
  );
}
