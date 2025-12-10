import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Search, Edit, Trash2, Mail, Copy, CheckCircle2, Clock, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import EmployeeLayout from "@/components/EmployeeLayout";
import { toast } from "sonner";

export default function GuestList() {
  const [, params] = useRoute("/events/:id/guests");
  const [, setLocation] = useLocation();
  const eventId = params?.id ? parseInt(params.id) : 0;

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [newGuest, setNewGuest] = useState({
    name: "",
    email: "",
    groupName: "",
    rsvpStatus: "pending" as "confirmed" | "pending" | "declined",
  });

  const { data: guests = [] } = trpc.guests.list.useQuery({ eventId });
  const { data: stats } = trpc.guests.getStats.useQuery({ eventId });
  const { data: event } = trpc.events.getById.useQuery({ id: eventId });
  const { data: foodOptions = [] } = trpc.foodOptions.list.useQuery({ eventId });

  const utils = trpc.useUtils();
  
  const createGuestMutation = trpc.guests.create.useMutation({
    onSuccess: () => {
      toast.success("Guest added successfully!");
      setIsAddDialogOpen(false);
      setNewGuest({ name: "", email: "", groupName: "", rsvpStatus: "pending" });
      utils.guests.list.invalidate({ eventId });
      utils.guests.getStats.invalidate({ eventId });
    },
  });

  const updateGuestMutation = trpc.guests.update.useMutation({
    onSuccess: () => {
      toast.success("Guest updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedGuest(null);
      utils.guests.list.invalidate({ eventId });
      utils.guests.getStats.invalidate({ eventId });
    },
  });

  const deleteGuestMutation = trpc.guests.delete.useMutation({
    onSuccess: () => {
      toast.success("Guest deleted successfully!");
      utils.guests.list.invalidate({ eventId });
      utils.guests.getStats.invalidate({ eventId });
    },
  });

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    createGuestMutation.mutate({ 
      eventId, 
      ...newGuest,
      stage: 1,
      saveTheDateResponse: "pending"
    });
  };

  const handleUpdateGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGuest) {
      updateGuestMutation.mutate({ 
        id: selectedGuest.id, 
        name: selectedGuest.name,
        email: selectedGuest.email,
        groupName: selectedGuest.groupName,
        rsvpStatus: selectedGuest.rsvpStatus,
        starterSelection: selectedGuest.starterSelection,
        mainSelection: selectedGuest.mainSelection,
        dessertSelection: selectedGuest.dessertSelection,
        dietaryRestrictions: selectedGuest.dietaryRestrictions,
      });
    }
  };

  const handleDeleteGuest = (id: number) => {
    if (confirm("Are you sure you want to delete this guest?")) {
      deleteGuestMutation.mutate({ id });
    }
  };

  const handleCopyRSVPLink = (token: string) => {
    const link = `${window.location.origin}/rsvp?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success("RSVP link copied to clipboard!");
  };

  const handleSendRSVP = (guest: any) => {
    // Generate RSVP token if not exists
    if (!guest.rsvpToken) {
      const token = `rsvp_${Math.random().toString(36).substring(2, 15)}`;
      updateGuestMutation.mutate({
        id: guest.id,
        rsvpToken: token,
      });
    }
    // In a real app, this would send an email
    toast.success(`RSVP invitation sent to ${guest.name}`);
  };

  const filteredGuests = guests.filter((guest: any) =>
    guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (guest.email && guest.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const confirmedGuests = filteredGuests.filter((g: any) => g.rsvpStatus === "confirmed");
  const pendingGuests = filteredGuests.filter((g: any) => g.rsvpStatus === "pending");
  const declinedGuests = filteredGuests.filter((g: any) => g.rsvpStatus === "declined");

  // Check if food options are configured
  const hasStarters = foodOptions.some((f: any) => f.category === "starter");
  const hasMains = foodOptions.some((f: any) => f.category === "main");
  const hasDesserts = foodOptions.some((f: any) => f.category === "dessert");
  const foodOptionsConfigured = hasStarters && hasMains && hasDesserts;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "declined":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <EmployeeLayout>
      <div className="p-8">
        <Button variant="ghost" className="mb-6" onClick={() => setLocation(`/events/${eventId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Event Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2">Guest List</h1>
          <p className="text-gray-600">
            {event?.coupleName1} & {event?.coupleName2} - Manage all wedding guests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Guests</p>
                  <div className="text-3xl font-bold">{stats?.total || 0}</div>
                </div>
                <Mail className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Confirmed</p>
                  <div className="text-3xl font-bold text-green-600">{stats?.confirmed || 0}</div>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <div className="text-3xl font-bold text-yellow-600">{stats?.pending || 0}</div>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Declined</p>
                  <div className="text-3xl font-bold text-red-600">{stats?.declined || 0}</div>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Food Options Warning */}
        {!foodOptionsConfigured && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600">⚠️</div>
                <div>
                  <p className="font-medium text-yellow-900">Food Options Not Configured</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Guests cannot select meals until you configure at least one starter, main course, and dessert in the{" "}
                    <button 
                      onClick={() => setLocation(`/events/${eventId}/food-choices`)}
                      className="underline font-medium"
                    >
                      Food Choices
                    </button> module.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search guests by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#2C5F5D] hover:bg-[#234a48]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Guest
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Guest</DialogTitle>
                    <DialogDescription>Add a guest to the wedding invitation list</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddGuest}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={newGuest.name}
                          onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newGuest.email}
                          onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="group">Group/Category</Label>
                        <Input
                          id="group"
                          placeholder="e.g., Family, Friends, Colleagues"
                          value={newGuest.groupName}
                          onChange={(e) => setNewGuest({ ...newGuest, groupName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="rsvpStatus">RSVP Status</Label>
                        <Select
                          value={newGuest.rsvpStatus}
                          onValueChange={(value: any) => setNewGuest({ ...newGuest, rsvpStatus: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter className="mt-6">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-[#2C5F5D] hover:bg-[#234a48]">
                        Add Guest
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Guest List Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>All Guests ({filteredGuests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All ({filteredGuests.length})</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed ({confirmedGuests.length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({pendingGuests.length})</TabsTrigger>
                <TabsTrigger value="declined">Declined ({declinedGuests.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <GuestTable 
                  guests={filteredGuests} 
                  onEdit={(guest) => { setSelectedGuest(guest); setIsEditDialogOpen(true); }}
                  onDelete={handleDeleteGuest}
                  onCopyLink={handleCopyRSVPLink}
                  onSendRSVP={handleSendRSVP}
                  getStatusBadge={getStatusBadge}
                  foodOptionsConfigured={foodOptionsConfigured}
                />
              </TabsContent>

              <TabsContent value="confirmed">
                <GuestTable 
                  guests={confirmedGuests} 
                  onEdit={(guest) => { setSelectedGuest(guest); setIsEditDialogOpen(true); }}
                  onDelete={handleDeleteGuest}
                  onCopyLink={handleCopyRSVPLink}
                  onSendRSVP={handleSendRSVP}
                  getStatusBadge={getStatusBadge}
                  foodOptionsConfigured={foodOptionsConfigured}
                />
              </TabsContent>

              <TabsContent value="pending">
                <GuestTable 
                  guests={pendingGuests} 
                  onEdit={(guest) => { setSelectedGuest(guest); setIsEditDialogOpen(true); }}
                  onDelete={handleDeleteGuest}
                  onCopyLink={handleCopyRSVPLink}
                  onSendRSVP={handleSendRSVP}
                  getStatusBadge={getStatusBadge}
                  foodOptionsConfigured={foodOptionsConfigured}
                />
              </TabsContent>

              <TabsContent value="declined">
                <GuestTable 
                  guests={declinedGuests} 
                  onEdit={(guest) => { setSelectedGuest(guest); setIsEditDialogOpen(true); }}
                  onDelete={handleDeleteGuest}
                  onCopyLink={handleCopyRSVPLink}
                  onSendRSVP={handleSendRSVP}
                  getStatusBadge={getStatusBadge}
                  foodOptionsConfigured={foodOptionsConfigured}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Edit Guest Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Guest</DialogTitle>
              <DialogDescription>Update guest information and meal selections</DialogDescription>
            </DialogHeader>
            {selectedGuest && (
              <form onSubmit={handleUpdateGuest}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-name">Name *</Label>
                      <Input
                        id="edit-name"
                        value={selectedGuest.name}
                        onChange={(e) => setSelectedGuest({ ...selectedGuest, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={selectedGuest.email || ""}
                        onChange={(e) => setSelectedGuest({ ...selectedGuest, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-group">Group/Category</Label>
                      <Input
                        id="edit-group"
                        value={selectedGuest.groupName || ""}
                        onChange={(e) => setSelectedGuest({ ...selectedGuest, groupName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-rsvpStatus">RSVP Status</Label>
                      <Select
                        value={selectedGuest.rsvpStatus}
                        onValueChange={(value: any) => setSelectedGuest({ ...selectedGuest, rsvpStatus: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Meal Selections - Only show if confirmed and food options configured */}
                  {selectedGuest.rsvpStatus === "confirmed" && foodOptionsConfigured && (
                    <>
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Meal Selections</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="edit-starter">Starter</Label>
                            <Select
                              value={selectedGuest.starterSelection || ""}
                              onValueChange={(value) => setSelectedGuest({ ...selectedGuest, starterSelection: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select starter" />
                              </SelectTrigger>
                              <SelectContent>
                                {foodOptions
                                  .filter((f: any) => f.category === "starter")
                                  .map((option: any) => (
                                    <SelectItem key={option.id} value={option.name}>
                                      {option.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="edit-main">Main Course</Label>
                            <Select
                              value={selectedGuest.mainSelection || ""}
                              onValueChange={(value) => setSelectedGuest({ ...selectedGuest, mainSelection: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select main" />
                              </SelectTrigger>
                              <SelectContent>
                                {foodOptions
                                  .filter((f: any) => f.category === "main")
                                  .map((option: any) => (
                                    <SelectItem key={option.id} value={option.name}>
                                      {option.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="edit-dessert">Dessert</Label>
                            <Select
                              value={selectedGuest.dessertSelection || ""}
                              onValueChange={(value) => setSelectedGuest({ ...selectedGuest, dessertSelection: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select dessert" />
                              </SelectTrigger>
                              <SelectContent>
                                {foodOptions
                                  .filter((f: any) => f.category === "dessert")
                                  .map((option: any) => (
                                    <SelectItem key={option.id} value={option.name}>
                                      {option.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="edit-dietary">Dietary Restrictions</Label>
                        <Input
                          id="edit-dietary"
                          placeholder="e.g., Vegetarian, Gluten-free, Nut allergy"
                          value={selectedGuest.dietaryRestrictions || ""}
                          onChange={(e) => setSelectedGuest({ ...selectedGuest, dietaryRestrictions: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {selectedGuest.rsvpStatus === "confirmed" && !foodOptionsConfigured && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                      Meal selections will be available once food options are configured.
                    </div>
                  )}
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#2C5F5D] hover:bg-[#234a48]">
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </EmployeeLayout>
  );
}

function GuestTable({ 
  guests, 
  onEdit, 
  onDelete, 
  onCopyLink, 
  onSendRSVP, 
  getStatusBadge,
  foodOptionsConfigured 
}: {
  guests: any[];
  onEdit: (guest: any) => void;
  onDelete: (id: number) => void;
  onCopyLink: (token: string) => void;
  onSendRSVP: (guest: any) => void;
  getStatusBadge: (status: string) => React.ReactElement;
  foodOptionsConfigured: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Group</TableHead>
          <TableHead>RSVP Status</TableHead>
          <TableHead>Meal Selections</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {guests.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No guests found
            </TableCell>
          </TableRow>
        ) : (
          guests.map((guest: any) => (
            <TableRow key={guest.id}>
              <TableCell className="font-medium">{guest.name}</TableCell>
              <TableCell>{guest.email || "-"}</TableCell>
              <TableCell>{guest.groupName || "-"}</TableCell>
              <TableCell>{getStatusBadge(guest.rsvpStatus)}</TableCell>
              <TableCell>
                {guest.rsvpStatus === "confirmed" && foodOptionsConfigured ? (
                  <div className="text-sm space-y-1">
                    {guest.starterSelection && <div>S: {guest.starterSelection}</div>}
                    {guest.mainSelection && <div>M: {guest.mainSelection}</div>}
                    {guest.dessertSelection && <div>D: {guest.dessertSelection}</div>}
                    {!guest.starterSelection && !guest.mainSelection && !guest.dessertSelection && (
                      <span className="text-muted-foreground">Not selected</span>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {guest.rsvpToken && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCopyLink(guest.rsvpToken)}
                      title="Copy RSVP Link"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSendRSVP(guest)}
                    title="Send RSVP Invitation"
                  >
                    <Mail className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(guest)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(guest.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
