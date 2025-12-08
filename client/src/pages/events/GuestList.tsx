import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Search, Edit, Trash2, Mail } from "lucide-react";
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
    mealSelection: "",
    dietaryRestrictions: "",
  });

  const { data: guests } = trpc.guests.list.useQuery({ eventId });
  const { data: stats } = trpc.guests.stats.useQuery({ eventId });
  const { data: event } = trpc.events.getById.useQuery({ id: eventId });

  const utils = trpc.useUtils();
  const createGuestMutation = trpc.guests.create.useMutation({
    onSuccess: () => {
      toast.success("Guest added successfully!");
      setIsAddDialogOpen(false);
      setNewGuest({ name: "", email: "", groupName: "", rsvpStatus: "pending", mealSelection: "", dietaryRestrictions: "" });
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
    createGuestMutation.mutate({ eventId, ...newGuest });
  };

  const handleUpdateGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGuest) {
      updateGuestMutation.mutate({ id: selectedGuest.id, ...selectedGuest });
    }
  };

  const handleDeleteGuest = (id: number) => {
    if (confirm("Are you sure you want to delete this guest?")) {
      deleteGuestMutation.mutate({ id });
    }
  };

  const filteredGuests = guests?.filter((guest) =>
    guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const confirmedGuests = filteredGuests?.filter((g) => g.rsvpStatus === "confirmed");
  const initialGuests = filteredGuests?.filter((g) => g.rsvpStatus === "pending");

  return (
    <EmployeeLayout>
      <div className="p-8">
        <Button variant="ghost" className="mb-6" onClick={() => setLocation(`/events/${eventId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{event?.title}</h1>
          <p className="text-lg text-muted-foreground">Guest List & RSVP Management</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.confirmed || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats?.pending || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Declined</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats?.declined || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search guests..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Guest
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddGuest}>
                <DialogHeader>
                  <DialogTitle>Add New Guest</DialogTitle>
                  <DialogDescription>Add a guest to the event guest list</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newGuest.name}
                      onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newGuest.email}
                      onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group">Group</Label>
                    <Input
                      id="group"
                      placeholder="e.g., Family, Friends"
                      value={newGuest.groupName}
                      onChange={(e) => setNewGuest({ ...newGuest, groupName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rsvp">RSVP Status</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="dietary">Dietary Restrictions</Label>
                    <Input
                      id="dietary"
                      value={newGuest.dietaryRestrictions}
                      onChange={(e) => setNewGuest({ ...newGuest, dietaryRestrictions: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createGuestMutation.isPending}>
                    {createGuestMutation.isPending ? "Adding..." : "Add Guest"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            Invite Guest
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Guests ({filteredGuests?.length || 0})</TabsTrigger>
            <TabsTrigger value="initial">Initial Invitations ({initialGuests?.length || 0})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed Guests ({confirmedGuests?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>RSVP Status</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead>Invitation</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGuests && filteredGuests.length > 0 ? (
                      filteredGuests.map((guest) => (
                        <TableRow key={guest.id}>
                          <TableCell className="font-medium">{guest.name}</TableCell>
                          <TableCell>{guest.email || "-"}</TableCell>
                          <TableCell>{guest.groupName || "-"}</TableCell>
                          <TableCell>
                            <span className={`status-${guest.rsvpStatus} px-2 py-1 rounded-full text-xs font-medium`}>
                              {guest.rsvpStatus}
                            </span>
                          </TableCell>
                          <TableCell>{guest.mealSelection || "-"}</TableCell>
                          <TableCell>
                            {guest.invitationSent ? (
                              <span className="text-green-600 text-sm">Sent</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not sent</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
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
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No guests found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="initial">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>RSVP Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialGuests && initialGuests.length > 0 ? (
                      initialGuests.map((guest) => (
                        <TableRow key={guest.id}>
                          <TableCell className="font-medium">{guest.name}</TableCell>
                          <TableCell>{guest.email || "-"}</TableCell>
                          <TableCell>{guest.groupName || "-"}</TableCell>
                          <TableCell>
                            <span className="status-pending px-2 py-1 rounded-full text-xs font-medium">
                              {guest.rsvpStatus}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => { setSelectedGuest(guest); setIsEditDialogOpen(true); }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteGuest(guest.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No pending invitations
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="confirmed">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmedGuests && confirmedGuests.length > 0 ? (
                      confirmedGuests.map((guest) => (
                        <TableRow key={guest.id}>
                          <TableCell className="font-medium">{guest.name}</TableCell>
                          <TableCell>{guest.email || "-"}</TableCell>
                          <TableCell>{guest.groupName || "-"}</TableCell>
                          <TableCell>{guest.mealSelection || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => { setSelectedGuest(guest); setIsEditDialogOpen(true); }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteGuest(guest.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No confirmed guests yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <form onSubmit={handleUpdateGuest}>
              <DialogHeader>
                <DialogTitle>Edit Guest</DialogTitle>
                <DialogDescription>Update guest information</DialogDescription>
              </DialogHeader>
              {selectedGuest && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name *</Label>
                    <Input
                      id="edit-name"
                      value={selectedGuest.name}
                      onChange={(e) => setSelectedGuest({ ...selectedGuest, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={selectedGuest.email || ""}
                      onChange={(e) => setSelectedGuest({ ...selectedGuest, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-group">Group</Label>
                    <Input
                      id="edit-group"
                      value={selectedGuest.groupName || ""}
                      onChange={(e) => setSelectedGuest({ ...selectedGuest, groupName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-rsvp">RSVP Status</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="edit-meal">Meal Selection</Label>
                    <Input
                      id="edit-meal"
                      value={selectedGuest.mealSelection || ""}
                      onChange={(e) => setSelectedGuest({ ...selectedGuest, mealSelection: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-dietary">Dietary Restrictions</Label>
                    <Input
                      id="edit-dietary"
                      value={selectedGuest.dietaryRestrictions || ""}
                      onChange={(e) => setSelectedGuest({ ...selectedGuest, dietaryRestrictions: e.target.value })}
                    />
                  </div>
                </div>
              )}
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
