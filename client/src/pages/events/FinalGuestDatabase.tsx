import { useParams } from "wouter";
import EmployeeLayout from "@/components/EmployeeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Search, Eye, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function FinalGuestDatabase() {
  const params = useParams();
  const eventId = parseInt(params.id || "0");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<any>(null);

  const { data: event } = trpc.events.getById.useQuery({ id: eventId });
  const { data: guests = [] } = trpc.guests.list.useQuery({ eventId });

  // Filter guests in Stage 3
  const stage3Guests = guests.filter((g: any) => g.stage === 3);
  const filteredGuests = stage3Guests.filter((g: any) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.email && g.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: stage3Guests.length,
    withDietary: stage3Guests.filter((g: any) => g.dietaryRestrictions).length,
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ["Name", "Email", "Starter", "Main Course", "Dessert", "Dietary Restrictions"];
    const rows = stage3Guests.map((g: any) => [
      g.name,
      g.email || "",
      g.starterSelection || "",
      g.mainSelection || "",
      g.dessertSelection || "",
      g.dietaryRestrictions || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `final-guest-list-${event?.eventCode || eventId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Guest list exported successfully");
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
            Stage 3: Final Guest Database
          </h1>
          <p className="text-gray-600">
            {event.coupleName1} & {event.coupleName2} - Complete guest records with meal selections
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Confirmed</p>
                  <div className="text-3xl font-bold text-green-600">{stats.total}</div>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">With Dietary Restrictions</p>
                  <div className="text-3xl font-bold">{stats.withDietary}</div>
                </div>
                <Eye className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
                  <div className="text-3xl font-bold">
                    {guests.length > 0 ? Math.round((stats.total / guests.length) * 100) : 0}%
                  </div>
                </div>
                <CheckCircle2 className="w-8 h-8 text-gray-400" />
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

              <Button
                onClick={handleExport}
                className="bg-[#2C5F5D] hover:bg-[#234a48]"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Guests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Final Guest List ({filteredGuests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Starter</TableHead>
                  <TableHead>Main Course</TableHead>
                  <TableHead>Dessert</TableHead>
                  <TableHead>Dietary Restrictions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No guests have completed their RSVP yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGuests.map((guest: any) => (
                    <TableRow key={guest.id}>
                      <TableCell className="font-medium">{guest.name}</TableCell>
                      <TableCell>{guest.email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{guest.starterSelection || "-"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{guest.mainSelection || "-"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{guest.dessertSelection || "-"}</Badge>
                      </TableCell>
                      <TableCell>
                        {guest.dietaryRestrictions ? (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Yes
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedGuest(guest)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Guest Details</DialogTitle>
                            </DialogHeader>
                            {selectedGuest && (
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                                  <p className="text-lg">{selectedGuest.name}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                                  <p>{selectedGuest.email || "Not provided"}</p>
                                </div>
                                <div className="border-t pt-4">
                                  <p className="text-sm font-medium text-muted-foreground mb-2">Meal Selections</p>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm text-muted-foreground">Starter:</span>
                                      <span className="font-medium">{selectedGuest.starterSelection}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-muted-foreground">Main Course:</span>
                                      <span className="font-medium">{selectedGuest.mainSelection}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-muted-foreground">Dessert:</span>
                                      <span className="font-medium">{selectedGuest.dessertSelection}</span>
                                    </div>
                                  </div>
                                </div>
                                {selectedGuest.dietaryRestrictions && (
                                  <div className="border-t pt-4">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">
                                      Dietary Restrictions
                                    </p>
                                    <p className="text-sm bg-yellow-50 border border-yellow-200 rounded p-3">
                                      {selectedGuest.dietaryRestrictions}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
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
