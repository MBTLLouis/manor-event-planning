import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Calendar, MoreVertical, Trash2, Edit, Eye, EyeOff } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import EmployeeLayout from "@/components/EmployeeLayout";
import { format } from "date-fns";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { LoginDetailsModal } from "@/components/LoginDetailsModal";
import PermissionsModal from "@/components/PermissionsModal";
import { Key, Lock } from "lucide-react";

export default function EventsList() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoginDetailsOpen, setIsLoginDetailsOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    coupleName1: "",
    coupleName2: "",
    eventDate: "",
    eventCode: "",
  });

  const { data: upcomingEvents } = trpc.events.upcoming.useQuery();
  const { data: pastEvents } = trpc.events.past.useQuery();
  const { data: searchResults } = trpc.events.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const utils = trpc.useUtils();
  const createEventMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      toast.success("Event created successfully!");
      setIsCreateDialogOpen(false);
      setNewEvent({ title: "", coupleName1: "", coupleName2: "", eventDate: "", eventCode: "" });
      utils.events.upcoming.invalidate();
      utils.events.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create event");
    },
  });

  const updateEventMutation = trpc.events.update.useMutation({
    onSuccess: () => {
      toast.success("Event updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
      utils.events.upcoming.invalidate();
      utils.events.past.invalidate();
      utils.events.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update event");
    },
  });

  const deleteEventMutation = trpc.events.delete.useMutation({
    onSuccess: () => {
      toast.success("Event deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedEvent(null);
      utils.events.upcoming.invalidate();
      utils.events.past.invalidate();
      utils.events.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete event");
    },
  });

  const toggleVisibilityMutation = trpc.events.toggleCoupleVisibility.useMutation({
    onSuccess: () => {
      toast.success("Visibility updated!");
      utils.events.upcoming.invalidate();
      utils.events.past.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update visibility");
    },
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    createEventMutation.mutate({
      ...newEvent,
      status: "planning",
    });
  };

  const handleEditEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    updateEventMutation.mutate({
      id: selectedEvent.id,
      title: selectedEvent.title,
      coupleName1: selectedEvent.coupleName1,
      coupleName2: selectedEvent.coupleName2,
      eventDate: selectedEvent.eventDate,
      eventCode: selectedEvent.eventCode,
    });
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    deleteEventMutation.mutate({ id: selectedEvent.id });
  };

  const handleToggleVisibility = (eventId: number, currentVisibility: boolean) => {
    toggleVisibilityMutation.mutate({ 
      id: eventId, 
      coupleCanView: !currentVisibility 
    });
  };

  const displayEvents = searchQuery.length > 0 ? searchResults : upcomingEvents;

  const EventCard = ({ event }: { event: any }) => (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => setLocation(`/events/${event.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(event.eventDate), "EEEE, MMMM d, yyyy")}</span>
            </div>
            {event.eventCode && (
              <p className="text-xs text-muted-foreground">Code: {event.eventCode}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                setSelectedEvent(event);
                setIsEditDialogOpen(true);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Event
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleToggleVisibility(event.id, event.coupleCanView);
              }}>
                {event.coupleCanView ? (
                  <><EyeOff className="w-4 h-4 mr-2" />Hide from Couple</>
                ) : (
                  <><Eye className="w-4 h-4 mr-2" />Show to Couple</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                setSelectedEvent(event);
                setIsLoginDetailsOpen(true);
              }}>
                <Key className="w-4 h-4 mr-2" />
                Login Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                setSelectedEvent(event);
                setIsPermissionsOpen(true);
              }}>
                <Lock className="w-4 h-4 mr-2" />
                Permissions
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                  setIsDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Event
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className={`status-${event.status} px-3 py-1 rounded-full text-xs font-medium`}>
            {event.status}
          </span>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <EmployeeLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Events</h1>
            <p className="text-muted-foreground">Manage all your wedding and event bookings</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-5 h-5 mr-2" />
                New Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateEvent}>
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>
                    Add a new wedding or event to your planning calendar
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Sarah & John's Wedding"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coupleName1">Partner 1 Name</Label>
                      <Input
                        id="coupleName1"
                        placeholder="First name"
                        value={newEvent.coupleName1}
                        onChange={(e) => setNewEvent({ ...newEvent, coupleName1: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coupleName2">Partner 2 Name</Label>
                      <Input
                        id="coupleName2"
                        placeholder="Second name"
                        value={newEvent.coupleName2}
                        onChange={(e) => setNewEvent({ ...newEvent, coupleName2: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Event Date</Label>
                    <Input
                      id="eventDate"
                      type="datetime-local"
                      value={newEvent.eventDate}
                      onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventCode">Event Code (Optional)</Label>
                    <Input
                      id="eventCode"
                      placeholder="e.g., SJ2024"
                      value={newEvent.eventCode}
                      onChange={(e) => setNewEvent({ ...newEvent, eventCode: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createEventMutation.isPending}>
                    {createEventMutation.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by event name, partner names, or date..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming Events ({upcomingEvents?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past Events ({pastEvents?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {searchQuery.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults && searchResults.length > 0 ? (
                  searchResults.map((event) => <EventCard key={event.id} event={event} />)
                ) : (
                  <p className="col-span-full text-center text-muted-foreground py-12">
                    No events found matching "{searchQuery}"
                  </p>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents && upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)
                ) : (
                  <p className="col-span-full text-center text-muted-foreground py-12">
                    No upcoming events
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents && pastEvents.length > 0 ? (
                pastEvents.map((event) => <EventCard key={event.id} event={event} />)
              ) : (
                <p className="col-span-full text-center text-muted-foreground py-12">
                  No past events
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Event Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <form onSubmit={handleEditEvent}>
              <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogDescription>
                  Update event details
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Event Title</Label>
                  <Input
                    id="edit-title"
                    placeholder="e.g., Sarah & John's Wedding"
                    value={selectedEvent?.title || ""}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-coupleName1">Partner 1 Name</Label>
                    <Input
                      id="edit-coupleName1"
                      placeholder="First name"
                      value={selectedEvent?.coupleName1 || ""}
                      onChange={(e) => setSelectedEvent({ ...selectedEvent, coupleName1: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-coupleName2">Partner 2 Name</Label>
                    <Input
                      id="edit-coupleName2"
                      placeholder="Second name"
                      value={selectedEvent?.coupleName2 || ""}
                      onChange={(e) => setSelectedEvent({ ...selectedEvent, coupleName2: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-eventDate">Event Date</Label>
                  <Input
                    id="edit-eventDate"
                    type="datetime-local"
                    value={selectedEvent?.eventDate ? new Date(selectedEvent.eventDate).toISOString().slice(0, 16) : ""}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, eventDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-eventCode">Event Code (Optional)</Label>
                  <Input
                    id="edit-eventCode"
                    placeholder="e.g., SJ2024"
                    value={selectedEvent?.eventCode || ""}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, eventCode: e.target.value })}
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{selectedEvent?.title}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteEvent}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteEventMutation.isPending ? "Deleting..." : "Delete Event"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Login Details Modal */}
        {selectedEvent && (
          <LoginDetailsModal
            eventId={selectedEvent.id}
            isOpen={isLoginDetailsOpen}
            onClose={() => setIsLoginDetailsOpen(false)}
          />
        )}

        {/* Permissions Modal */}
        {selectedEvent && (
          <PermissionsModal
            eventId={selectedEvent.id}
            eventTitle={selectedEvent.title}
            isOpen={isPermissionsOpen}
            onClose={() => setIsPermissionsOpen(false)}
          />
        )}
      </div>
    </EmployeeLayout>
  );
}
