import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Plus, Search, Edit, Trash2, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import EmployeeLayout from "@/components/EmployeeLayout";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type RsvpStatus = "draft" | "invited" | "confirmed" | "declined";
type AllergySeverity = "none" | "mild" | "severe";
type GuestType = "day" | "evening" | "both";

// Extract GuestFormFields component to prevent re-creation on each render
const GuestFormFields = ({ guest, setGuest, eventId }: { guest: any, setGuest: (g: any) => void, eventId: number }) => {
  const { data: menuItems = [] } = trpc.menu.list.useQuery({ eventId });
  
  // Extract unique courses from menu items, filtering out empty ones
  const courses = Array.from(new Set(menuItems.map(item => item.course).filter(c => c && c.trim()))).sort();
  
  return (
  <div className="space-y-4 py-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="firstName">First Name *</Label>
        <Input
          id="firstName"
          value={guest.firstName || ""}
          onChange={(e) => setGuest({ ...guest, firstName: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name *</Label>
        <Input
          id="lastName"
          value={guest.lastName || ""}
          onChange={(e) => setGuest({ ...guest, lastName: e.target.value })}
          required
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="email">Email (Optional)</Label>
      <Input
        id="email"
        type="email"
        value={guest.email || ""}
        onChange={(e) => setGuest({ ...guest, email: e.target.value })}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="groupName">Group (Optional)</Label>
      <Input
        id="groupName"
        placeholder="e.g., Bride's Family"
        value={guest.groupName || ""}
        onChange={(e) => setGuest({ ...guest, groupName: e.target.value })}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="rsvpStatus">RSVP Status *</Label>
      <Select 
        value={guest.rsvpStatus || "draft"} 
        onValueChange={(value) => setGuest({ ...guest, rsvpStatus: value })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="draft">Draft Invite</SelectItem>
          <SelectItem value="invited">Invited</SelectItem>
          <SelectItem value="confirmed">Attending</SelectItem>
          <SelectItem value="declined">Not Attending</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label htmlFor="guestType">Guest Type</Label>
      <Select 
        value={guest.guestType || "both"} 
        onValueChange={(value) => setGuest({ ...guest, guestType: value })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Day Guest</SelectItem>
          <SelectItem value="evening">Evening Guest</SelectItem>
          <SelectItem value="both">Day & Evening</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="border-t pt-4 space-y-4">
      <h4 className="font-semibold">Food Choices</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {courses.map((courseName) => {
          const courseItems = menuItems.filter(
            item => item.course === courseName && item.isAvailable && item.name && item.name.trim()
          );
          
          if (courseItems.length === 0) return null;
          
          const currentSelection = (guest.foodSelections as Record<string, string> || {})[courseName] || "__none__";
          
          return (
            <div key={courseName} className="space-y-2">
              <Label htmlFor={`food-${courseName}`} className="capitalize">
                {courseName}
              </Label>
              <Select
                value={currentSelection}
                onValueChange={(value) => {
                  const selections = { ...(guest.foodSelections as Record<string, string> || {}) };
                  if (value === "__none__") {
                    delete selections[courseName];
                  } else {
                    selections[courseName] = value;
                  }
                  setGuest({ ...guest, foodSelections: selections });
                }}
              >
                <SelectTrigger id={`food-${courseName}`}>
                  <SelectValue placeholder={`Select ${courseName}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {courseItems.map(item => (
                    <SelectItem key={item.id} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>

    <div className="border-t pt-4 space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="hasDietaryRequirements"
          checked={guest.hasDietaryRequirements || false}
          onCheckedChange={(checked) => setGuest({ ...guest, hasDietaryRequirements: checked })}
        />
        <Label htmlFor="hasDietaryRequirements" className="font-semibold">
          Has Dietary Requirements
        </Label>
      </div>

      {guest.hasDietaryRequirements && (
        <div className="ml-6 space-y-4 border-l-2 border-amber-300 pl-4">
          <div className="space-y-2">
            <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
            <Input
              id="dietaryRestrictions"
              placeholder="e.g., Vegetarian, Gluten-Free, Nut Allergy"
              value={guest.dietaryRestrictions || ""}
              onChange={(e) => setGuest({ ...guest, dietaryRestrictions: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple restrictions with commas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergySeverity">Allergy Severity</Label>
            <RadioGroup 
              value={guest.allergySeverity || "none"}
              onValueChange={(value) => setGuest({ ...guest, allergySeverity: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none">None</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mild" id="mild" />
                <Label htmlFor="mild">Mild</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="severe" id="severe" />
                <Label htmlFor="severe" className="flex items-center gap-2">
                  Severe <AlertTriangle className="w-4 h-4 text-red-500" />
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="canOthersConsume">Can others consume around you?</Label>
            <RadioGroup 
              value={guest.canOthersConsumeNearby ? "yes" : "no"}
              onValueChange={(value) => setGuest({ ...guest, canOthersConsumeNearby: value === "yes" })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no">No (airborne/contact risk)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dietaryDetails">Additional Details</Label>
            <Textarea
              id="dietaryDetails"
              placeholder="Any additional information about dietary requirements..."
              value={guest.dietaryDetails || ""}
              onChange={(e) => setGuest({ ...guest, dietaryDetails: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default function GuestListEnhanced() {
  const [, params] = useRoute("/events/:id/guests");
  const [, setLocation] = useLocation();
  const eventId = params?.id ? parseInt(params.id) : 0;

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [newGuest, setNewGuest] = useState({
    firstName: "",
    lastName: "",
    email: "",
    groupName: "",
    rsvpStatus: "draft" as RsvpStatus,
    guestType: "both" as GuestType,
    starterSelection: "",
    mainSelection: "",
    dessertSelection: "",
    hasDietaryRequirements: false,
    dietaryRestrictions: "",
    allergySeverity: "none" as AllergySeverity,
    canOthersConsumeNearby: true,
    dietaryDetails: "",
  });

  const { data: guests } = trpc.guests.list.useQuery({ eventId });
  const { data: stats } = trpc.guests.stats.useQuery({ eventId });
  const { data: event } = trpc.events.getById.useQuery({ id: eventId });
  const { data: floorPlans = [] } = trpc.floorPlans.list.useQuery({ eventId });
  const floorPlanId = floorPlans.length > 0 ? floorPlans[0].id : null;
  const { data: tables = [] } = trpc.tables.list.useQuery(
    { floorPlanId: floorPlanId || 0 },
    { enabled: !!floorPlanId }
  );

  const utils = trpc.useUtils();
  const createGuestMutation = trpc.guests.create.useMutation({
    onSuccess: () => {
      toast.success("Guest added successfully!");
      setIsAddDialogOpen(false);
      setNewGuest({
        firstName: "",
        lastName: "",
        email: "",
        groupName: "",
        rsvpStatus: "draft",
        guestType: "both",
        starterSelection: "",
        mainSelection: "",
        dessertSelection: "",
        hasDietaryRequirements: false,
        dietaryRestrictions: "",
        allergySeverity: "none",
        canOthersConsumeNearby: true,
        dietaryDetails: "",
      });
      utils.guests.list.invalidate({ eventId });
      utils.guests.stats.invalidate({ eventId });
    },
  });

  const updateGuestMutation = trpc.guests.update.useMutation({
    onSuccess: () => {
      toast.success("Guest updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedGuest(null);
      utils.guests.list.invalidate({ eventId });
      utils.guests.stats.invalidate({ eventId });
    },
  });

  const deleteGuestMutation = trpc.guests.delete.useMutation({
    onSuccess: () => {
      toast.success("Guest deleted successfully!");
      utils.guests.list.invalidate({ eventId });
      utils.guests.stats.invalidate({ eventId });
    },
  });

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${newGuest.firstName} ${newGuest.lastName}`;
    createGuestMutation.mutate({ 
      eventId, 
      ...newGuest,
      name: fullName,
    });
  };

  const handleUpdateGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGuest) {
      const fullName = `${selectedGuest.firstName} ${selectedGuest.lastName}`;
      updateGuestMutation.mutate({ 
        id: selectedGuest.id, 
        ...selectedGuest,
        name: fullName,
      });
    }
  };

  const handleDeleteGuest = (id: number) => {
    if (confirm("Are you sure you want to delete this guest?")) {
      deleteGuestMutation.mutate({ id });
    }
  };

  const filteredGuests = guests?.filter((guest) =>
    guest.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.groupName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter guests by different criteria
  const allGuests = filteredGuests || [];
  
  // Save The Date filters
  const saveTheDateInvited = allGuests.filter(g => g.saveTheDateResponse !== "pending");
  const saveTheDateAttending = allGuests.filter(g => g.saveTheDateResponse === "yes");
  const saveTheDateUnavailable = allGuests.filter(g => g.saveTheDateResponse === "no");

  // Food Choices filters
  const foodChoicesAwaiting = allGuests.filter(g => 
    g.rsvpStatus === "confirmed" && (!g.starterSelection || !g.mainSelection || !g.dessertSelection)
  );
  const foodChoicesConfirmed = allGuests.filter(g => 
    g.starterSelection && g.mainSelection && g.dessertSelection
  );

  // Table Assignment filters
  const tableUnallocated = allGuests.filter(g => !g.tableAssigned);
  const tableAllocated = allGuests.filter(g => g.tableAssigned);

  // Completed
  const completed = allGuests.filter(g => 
    g.rsvpStatus === "confirmed" && 
    g.starterSelection && 
    g.mainSelection && 
    g.dessertSelection && 
    g.tableAssigned
  );

  const getRsvpStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-200 text-gray-800";
      case "invited": return "bg-blue-200 text-blue-800";
      case "confirmed": return "bg-green-200 text-green-800";
      case "declined": return "bg-red-200 text-red-800";
      default: return "bg-gray-200 text-gray-800";
    }
  };


  const GuestTable = ({ guestList }: { guestList: any[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Group</TableHead>
          <TableHead>RSVP Status</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Food</TableHead>
          <TableHead>Dietary</TableHead>
          <TableHead>Table</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {guestList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
              No guests found
            </TableCell>
          </TableRow>
        ) : (
          guestList.map((guest) => (
            <TableRow key={guest.id}>
              <TableCell className="font-medium">{guest.name}</TableCell>
              <TableCell>{guest.email || "-"}</TableCell>
              <TableCell>{guest.groupName || "-"}</TableCell>
              <TableCell>
                <Badge className={getRsvpStatusColor(guest.rsvpStatus)}>
                  {guest.rsvpStatus}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{guest.guestType || "both"}</Badge>
              </TableCell>
              <TableCell>
                {(() => {
                  const foodSelections = guest.foodSelections as Record<string, string> || {};
                  const selections = Object.entries(foodSelections);
                  if (selections.length === 0) {
                    return <Badge variant="outline" className="bg-gray-50">-</Badge>;
                  }
                  return (
                    <div className="flex flex-col gap-1">
                      {selections.map(([course, item]) => (
                        <div key={course} className="text-xs">
                          <span className="font-medium capitalize">{course}:</span> {item}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </TableCell>
              <TableCell>
                {guest.hasDietaryRequirements ? (
                  <Badge 
                    variant="outline" 
                    className={guest.allergySeverity === "severe" ? "bg-red-100 text-red-800" : "bg-amber-50"}
                  >
                    {guest.allergySeverity === "severe" && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {guest.allergySeverity === "severe" ? "SEVERE" : "Yes"}
                  </Badge>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                {(() => {
                  if (!guest.tableId) return "-";
                  const table = tables.find(t => t.id === guest.tableId);
                  const seatInfo = guest.seatNumber ? `Seat ${guest.seatNumber}` : "";
                  if (table && seatInfo) {
                    return <span className="text-sm font-medium">{table.name} - {seatInfo}</span>;
                  }
                  return table ? table.name : "-";
                })()}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedGuest(guest);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteGuest(guest.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <EmployeeLayout>
      <div className="p-8">
        <Button variant="ghost" className="mb-6" onClick={() => setLocation(`/events/${eventId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Event Dashboard
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Guest List</h1>
            <p className="text-muted-foreground">{event?.title}</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Add Guest
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleAddGuest}>
                <DialogHeader>
                  <DialogTitle>Add New Guest</DialogTitle>
                  <DialogDescription>
                    Add a new guest to the event with detailed information
                  </DialogDescription>
                </DialogHeader>
                <GuestFormFields guest={newGuest} setGuest={setNewGuest} eventId={eventId} />
                <DialogFooter>
                  <Button type="submit" disabled={createGuestMutation.isPending}>
                    {createGuestMutation.isPending ? "Adding..." : "Add Guest"}
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
              placeholder="Search by name, email, or group..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Guests ({allGuests.length})</TabsTrigger>
            <TabsTrigger value="savethedate">Save The Date ({saveTheDateInvited.length})</TabsTrigger>
            <TabsTrigger value="foodchoices">Food Choices ({foodChoicesConfirmed.length})</TabsTrigger>
            <TabsTrigger value="tableassignment">Table Assignment ({tableAllocated.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Guests</CardTitle>
              </CardHeader>
              <CardContent>
                <GuestTable guestList={allGuests} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="savethedate">
            <Tabs defaultValue="invited" className="space-y-4">
              <TabsList>
                <TabsTrigger value="invited">Invited ({saveTheDateInvited.length})</TabsTrigger>
                <TabsTrigger value="attending">Attending ({saveTheDateAttending.length})</TabsTrigger>
                <TabsTrigger value="unavailable">Unavailable ({saveTheDateUnavailable.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="invited">
                <Card>
                  <CardHeader>
                    <CardTitle>Save The Date - Invited</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GuestTable guestList={saveTheDateInvited} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attending">
                <Card>
                  <CardHeader>
                    <CardTitle>Save The Date - Attending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GuestTable guestList={saveTheDateAttending} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="unavailable">
                <Card>
                  <CardHeader>
                    <CardTitle>Save The Date - Unavailable</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GuestTable guestList={saveTheDateUnavailable} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="foodchoices">
            <Tabs defaultValue="awaiting" className="space-y-4">
              <TabsList>
                <TabsTrigger value="awaiting">Awaiting Choices ({foodChoicesAwaiting.length})</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed ({foodChoicesConfirmed.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="awaiting">
                <Card>
                  <CardHeader>
                    <CardTitle>Food Choices - Awaiting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GuestTable guestList={foodChoicesAwaiting} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="confirmed">
                <Card>
                  <CardHeader>
                    <CardTitle>Food Choices - Confirmed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GuestTable guestList={foodChoicesConfirmed} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="tableassignment">
            <Tabs defaultValue="unallocated" className="space-y-4">
              <TabsList>
                <TabsTrigger value="unallocated">Un-Allocated ({tableUnallocated.length})</TabsTrigger>
                <TabsTrigger value="allocated">Allocated ({tableAllocated.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="unallocated">
                <Card>
                  <CardHeader>
                    <CardTitle>Table Assignment - Un-Allocated</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GuestTable guestList={tableUnallocated} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="allocated">
                <Card>
                  <CardHeader>
                    <CardTitle>Table Assignment - Allocated</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GuestTable guestList={tableAllocated} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Guests</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Guests with confirmed RSVP, food choices, and table assignment
                </p>
              </CardHeader>
              <CardContent>
                <GuestTable guestList={completed} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Guest Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleUpdateGuest}>
              <DialogHeader>
                <DialogTitle>Edit Guest</DialogTitle>
                <DialogDescription>
                  Update guest information
                </DialogDescription>
              </DialogHeader>
              <GuestFormFields guest={selectedGuest || {}} setGuest={setSelectedGuest} eventId={eventId} />
              <DialogFooter>
                <Button type="submit" disabled={updateGuestMutation.isPending}>
                  {updateGuestMutation.isPending ? "Updating..." : "Update Guest"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </EmployeeLayout>
  );
}
