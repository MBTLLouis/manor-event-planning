import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import CoupleLayout from "@/components/CoupleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, CheckCircle2, Clock, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CoupleGuests() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Get couple's event
  const { data: events = [] } = trpc.events.list.useQuery();
  const coupleEvent = events[0];

  const { data: guests = [] } = trpc.guests.list.useQuery(
    { eventId: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );

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
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2">Guest List</h1>
          <p className="text-gray-600">View your guest list and RSVP status</p>
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
                  <TableHead>Dietary Restrictions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                      <TableCell>{guest.mealSelection || "-"}</TableCell>
                      <TableCell>{guest.dietaryRestrictions || "-"}</TableCell>
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
