import { useParams } from "wouter";
import EmployeeLayout from "@/components/EmployeeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Search, Send, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function SaveTheDate() {
  const params = useParams();
  const eventId = parseInt(params.id || "0");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestEmail, setNewGuestEmail] = useState("");

  const { data: event } = trpc.events.getById.useQuery({ id: eventId });
  const { data: guests = [] } = trpc.guests.list.useQuery({ eventId });
  const utils = trpc.useUtils();

  const addGuestMutation = trpc.guests.create.useMutation({
    onSuccess: () => {
      utils.guests.list.invalidate({ eventId });
      setIsAddDialogOpen(false);
      setNewGuestName("");
      setNewGuestEmail("");
      toast.success("Guest added to Save the Date list");
    },
  });

  const updateResponseMutation = trpc.guests.updateSaveTheDateResponse.useMutation({
    onSuccess: () => {
      utils.guests.list.invalidate({ eventId });
      toast.success("Response updated");
    },
  });

  const sendInvitationMutation = trpc.guests.sendSaveTheDate.useMutation({
    onSuccess: () => {
      utils.guests.list.invalidate({ eventId });
      toast.success("Save the Date invitation sent");
    },
  });

  // Filter guests in Stage 1
  const stage1Guests = guests.filter((g: any) => g.stage === 1);
  const filteredGuests = stage1Guests.filter((g: any) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.email && g.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: stage1Guests.length,
    yes: stage1Guests.filter((g: any) => g.saveTheDateResponse === "yes").length,
    no: stage1Guests.filter((g: any) => g.saveTheDateResponse === "no").length,
    pending: stage1Guests.filter((g: any) => g.saveTheDateResponse === "pending").length,
  };

  const handleAddGuest = () => {
    if (!newGuestName.trim()) {
      toast.error("Please enter a guest name");
      return;
    }

    addGuestMutation.mutate({
      eventId,
      name: newGuestName,
      email: newGuestEmail || undefined,
      stage: 1,
      saveTheDateResponse: "pending",
    });
  };

  const handleUpdateResponse = (guestId: number, response: "yes" | "no") => {
    updateResponseMutation.mutate({ guestId, response });
  };

  const handleSendInvitation = (guestId: number) => {
    sendInvitationMutation.mutate({ guestId });
  };

  if (!event) {
    return (
      <EmployeeLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Event not found</p>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2">
            Stage 1: Save the Date
          </h1>
          <p className="text-gray-600">
            {event.coupleName1} & {event.coupleName2} - Send initial invitations and collect availability
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Guests</p>
                  <div className="text-3xl font-bold">{stats.total}</div>
                </div>
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Yes Responses</p>
                  <div className="text-3xl font-bold text-green-600">{stats.yes}</div>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">No Responses</p>
                  <div className="text-3xl font-bold text-red-600">{stats.no}</div>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search guests by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                    <DialogTitle>Add Guest to Save the Date List</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Guest Name *</Label>
                      <Input
                        id="name"
                        value={newGuestName}
                        onChange={(e) => setNewGuestName(e.target.value)}
                        placeholder="Enter guest name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newGuestEmail}
                        onChange={(e) => setNewGuestEmail(e.target.value)}
                        placeholder="Enter email address"
                      />
                    </div>
                    <Button
                      onClick={handleAddGuest}
                      className="w-full bg-[#2C5F5D] hover:bg-[#234a48]"
                      disabled={addGuestMutation.isPending}
                    >
                      Add Guest
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Guests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Save the Date Guest List ({filteredGuests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invitation</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No guests in Stage 1. Add guests to begin sending Save the Date invitations.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGuests.map((guest: any) => (
                    <TableRow key={guest.id}>
                      <TableCell className="font-medium">{guest.name}</TableCell>
                      <TableCell>{guest.email || "-"}</TableCell>
                      <TableCell>
                        {guest.saveTheDateResponse === "yes" && (
                          <Badge className="bg-green-100 text-green-800">Yes</Badge>
                        )}
                        {guest.saveTheDateResponse === "no" && (
                          <Badge className="bg-red-100 text-red-800">No</Badge>
                        )}
                        {guest.saveTheDateResponse === "pending" && (
                          <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {guest.invitationSent ? (
                          <Badge variant="outline">Sent</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">Not Sent</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!guest.invitationSent && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendInvitation(guest.id)}
                              disabled={sendInvitationMutation.isPending}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Send
                            </Button>
                          )}
                          {guest.saveTheDateResponse === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleUpdateResponse(guest.id, "yes")}
                                disabled={updateResponseMutation.isPending}
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Yes
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleUpdateResponse(guest.id, "no")}
                                disabled={updateResponseMutation.isPending}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                No
                              </Button>
                            </>
                          )}
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
    </EmployeeLayout>
  );
}
