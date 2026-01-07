import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import CoupleLayout from "@/components/CoupleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, CheckCircle2, Clock, XCircle, Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type RsvpStatus = "draft" | "invited" | "confirmed" | "declined";
type AllergySeverity = "none" | "mild" | "severe";

const GuestFormFields = ({ guest, setGuest, eventId }: { guest: any, setGuest: (g: any) => void, eventId: number }) => {
  const { data: menuItems = [] } = trpc.menu.list.useQuery({ eventId });
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
          value={guest.groupName || ""}
          onChange={(e) => setGuest({ ...guest, groupName: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>RSVP Status</Label>
        <Select value={guest.rsvpStatus || "draft"} onValueChange={(value) => setGuest({ ...guest, rsvpStatus: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Food Choices */}
      {courses.length > 0 && (
        <div className="space-y-3 border-t pt-4">
          <Label className="font-semibold">Food Choices</Label>
          {courses.map((course) => {
            const courseItems = menuItems.filter(item => item.course === course && item.name && item.name.trim());
            return (
              <div key={course} className="space-y-2">
                <Label htmlFor={`course-${course}`} className="text-sm">{course}</Label>
                <Select
                  value={guest.foodChoices?.[course] || ""}
                  onValueChange={(value) => setGuest({
                    ...guest,
                    foodChoices: { ...guest.foodChoices, [course]: value }
                  })}
                >
                  <SelectTrigger id={`course-${course}`}>
                    <SelectValue placeholder={`Select ${course}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {courseItems.map((item) => (
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
      )}

      {/* Dietary Requirements */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasDietary"
            checked={guest.hasDietaryRequirements || false}
            onCheckedChange={(checked) => setGuest({ ...guest, hasDietaryRequirements: checked })}
          />
          <Label htmlFor="hasDietary" className="font-semibold">Has Dietary Requirements</Label>
        </div>

        {guest.hasDietaryRequirements && (
          <div className="space-y-3 ml-6">
            <div className="space-y-2">
              <Label>Allergy Severity</Label>
              <RadioGroup value={guest.allergySeverity || "none"} onValueChange={(value) => setGuest({ ...guest, allergySeverity: value })}>
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
                  <Label htmlFor="severe">Severe</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="restrictions">Dietary Restrictions</Label>
              <Input
                id="restrictions"
                placeholder="e.g., Vegetarian, Gluten-free, Vegan"
                value={guest.dietaryRestrictions || ""}
                onChange={(e) => setGuest({ ...guest, dietaryRestrictions: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="canOthersConsume"
                checked={guest.canOthersConsumeAround || true}
                onCheckedChange={(checked) => setGuest({ ...guest, canOthersConsumeAround: checked })}
              />
              <Label htmlFor="canOthersConsume">Others can consume around me</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dietaryDetails">Additional Details</Label>
              <Textarea
                id="dietaryDetails"
                placeholder="Any additional dietary information..."
                value={guest.dietaryDetails || ""}
                onChange={(e) => setGuest({ ...guest, dietaryDetails: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function CoupleGuests() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newGuest, setNewGuest] = useState<any>({});
  const [selectedGuest, setSelectedGuest] = useState<any>(null);

  // Get couple's event
  const { data: events = [] } = trpc.events.list.useQuery();
  const coupleEvent = events[0];

  const { data: guests = [] } = trpc.guests.list.useQuery(
    { eventId: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );

  const { data: floorPlans = [] } = trpc.floorPlans.list.useQuery(
    { eventId: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );
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
      setNewGuest({});
      utils.guests.list.invalidate({ eventId: coupleEvent?.id });
      utils.guests.stats.invalidate({ eventId: coupleEvent?.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add guest");
    },
  });

  const updateGuestMutation = trpc.guests.update.useMutation({
    onSuccess: () => {
      toast.success("Guest updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedGuest(null);
      utils.guests.list.invalidate({ eventId: coupleEvent?.id });
      utils.guests.stats.invalidate({ eventId: coupleEvent?.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update guest");
    },
  });

  const deleteGuestMutation = trpc.guests.delete.useMutation({
    onSuccess: () => {
      toast.success("Guest deleted successfully!");
      utils.guests.list.invalidate({ eventId: coupleEvent?.id });
      utils.guests.stats.invalidate({ eventId: coupleEvent?.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete guest");
    },
  });

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuest.firstName || !newGuest.lastName) {
      toast.error("First and last name are required");
      return;
    }
    const fullName = `${newGuest.firstName} ${newGuest.lastName}`;
    const guestData = {
      eventId: coupleEvent?.id || 0,
      ...newGuest,
      name: fullName,
      // Map foodChoices to foodSelections for database
      foodSelections: newGuest.foodChoices || undefined,
    };
    // Remove foodChoices from the mutation data
    delete guestData.foodChoices;
    createGuestMutation.mutate(guestData);
  };

  const handleEditGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest?.firstName || !selectedGuest?.lastName) {
      toast.error("First and last name are required");
      return;
    }
    const fullName = `${selectedGuest.firstName} ${selectedGuest.lastName}`;
    const guestData = {
      id: selectedGuest.id,
      ...selectedGuest,
      name: fullName,
      // Map foodChoices to foodSelections for database
      foodSelections: selectedGuest.foodChoices || undefined,
    };
    // Remove foodChoices from the mutation data
    delete guestData.foodChoices;
    updateGuestMutation.mutate(guestData);
  };

  const handleDeleteGuest = (id: number) => {
    if (confirm("Are you sure you want to delete this guest?")) {
      deleteGuestMutation.mutate({ id });
    }
  };

  const filteredGuests = guests.filter(
    (guest) =>
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: guests.length,
    confirmed: guests.filter((g) => g.rsvpStatus === "confirmed").length,
    pending: guests.filter((g) => g.rsvpStatus === "invited" || g.rsvpStatus === "draft").length,
    declined: guests.filter((g) => g.rsvpStatus === "declined").length,
  };

  const getRsvpBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case "invited":
        return <Badge className="bg-yellow-500">Invited</Badge>;
      case "draft":
        return <Badge className="bg-gray-500">Draft</Badge>;
      case "declined":
        return <Badge className="bg-red-500">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2">Guest List</h1>
            <p className="text-gray-600">Manage your guests and RSVP status</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#2C5F5D] hover:bg-[#1e4441]">
                <Plus className="w-4 h-4 mr-2" />
                Add Guest
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddGuest}>
                <DialogHeader>
                  <DialogTitle>Add Guest</DialogTitle>
                  <DialogDescription>Add a new guest to your wedding</DialogDescription>
                </DialogHeader>
                <GuestFormFields guest={newGuest} setGuest={setNewGuest} eventId={coupleEvent?.id || 0} />
                <DialogFooter>
                  <Button type="submit" disabled={createGuestMutation.isPending}>
                    {createGuestMutation.isPending ? "Adding..." : "Add Guest"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Guests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#2C5F5D]">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Confirmed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.confirmed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                Declined
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.declined}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search guests by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Guest Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Guests ({filteredGuests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>RSVP Status</TableHead>
                  <TableHead>Meal Selection</TableHead>
                  <TableHead>Dietary</TableHead>
                  <TableHead>Table & Seat</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No guests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGuests.map((guest) => (
                    <TableRow key={guest.id}>
                      <TableCell className="font-medium">{guest.name}</TableCell>
                      <TableCell>{guest.email || "-"}</TableCell>
                      <TableCell>{guest.groupName || "-"}</TableCell>
                      <TableCell>{getRsvpBadge(guest.rsvpStatus)}</TableCell>
                      <TableCell className="text-sm">
                        {guest.foodSelections ? (
                          <div className="text-xs space-y-1">
                            {Object.entries(guest.foodSelections).map(([course, selection]) => (
                              <div key={course}>
                                <span className="font-semibold">{course}:</span> {selection}
                              </div>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {guest.allergySeverity === "severe" && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs">Severe</span>
                          </div>
                        )}
                        {guest.allergySeverity === "mild" && (
                          <span className="text-xs text-yellow-600">Mild</span>
                        )}
                        {!guest.allergySeverity && "-"}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          if (!guest.tableId) return "-";
                          const table = tables.find(t => t.id === guest.tableId);
                          const seatInfo = (guest as any).seatNumber ? `Seat ${(guest as any).seatNumber}` : "";
                          if (table && seatInfo) {
                            return <span className="text-sm font-medium">{table.name} - {seatInfo}</span>;
                          }
                          return table ? table.name : "-";
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog open={isEditDialogOpen && selectedGuest?.id === guest.id} onOpenChange={(open) => {
                            if (!open) setSelectedGuest(null);
                            setIsEditDialogOpen(open);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedGuest(guest)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <form onSubmit={handleEditGuest}>
                                <DialogHeader>
                                  <DialogTitle>Edit Guest</DialogTitle>
                                </DialogHeader>
                                <GuestFormFields guest={selectedGuest || {}} setGuest={setSelectedGuest} eventId={coupleEvent?.id || 0} />
                                <DialogFooter>
                                  <Button type="submit" disabled={updateGuestMutation.isPending}>
                                    {updateGuestMutation.isPending ? "Updating..." : "Update Guest"}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGuest(guest.id)}
                            disabled={deleteGuestMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </CoupleLayout>
  );
}
