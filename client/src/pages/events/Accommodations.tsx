import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import EmployeeLayout from "@/components/EmployeeLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Hotel, MapPin, Phone, Globe, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Accommodations() {
  const params = useParams();
  const eventId = Number(params.id);
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAccommodation, setEditingAccommodation] = useState<any>(null);

  const { data: accommodations = [], refetch } = trpc.accommodations.list.useQuery({ eventId });
  const { data: event } = trpc.events.getById.useQuery({ id: eventId });

  const createMutation = trpc.accommodations.create.useMutation({
    onSuccess: () => {
      toast.success("Accommodation added");
      refetch();
      setIsAddDialogOpen(false);
    },
  });

  const updateMutation = trpc.accommodations.update.useMutation({
    onSuccess: () => {
      toast.success("Accommodation updated");
      refetch();
      setEditingAccommodation(null);
    },
  });

  const deleteMutation = trpc.accommodations.delete.useMutation({
    onSuccess: () => {
      toast.success("Accommodation deleted");
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      eventId,
      hotelName: formData.get("hotelName") as string,
      address: formData.get("address") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      website: formData.get("website") as string || undefined,
      roomBlockCode: formData.get("roomBlockCode") as string || undefined,
      roomRate: formData.get("roomRate") ? Math.round(parseFloat(formData.get("roomRate") as string) * 100) : undefined,
      checkInDate: formData.get("checkInDate") ? new Date(formData.get("checkInDate") as string) : undefined,
      checkOutDate: formData.get("checkOutDate") ? new Date(formData.get("checkOutDate") as string) : undefined,
      notes: formData.get("notes") as string || undefined,
    };

    if (editingAccommodation) {
      updateMutation.mutate({ id: editingAccommodation.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <EmployeeLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="ghost" onClick={() => setLocation(`/events/${eventId}`)}>
              ← Back to Event
            </Button>
            <h1 className="text-3xl font-serif font-bold mt-2">Guest Accommodations</h1>
            <p className="text-muted-foreground">{event?.title}</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) setEditingAccommodation(null);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Hotel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingAccommodation ? "Edit Accommodation" : "Add Accommodation"}</DialogTitle>
                  <DialogDescription>Manage hotel and lodging information for guests</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="hotelName">Hotel Name *</Label>
                    <Input id="hotelName" name="hotelName" defaultValue={editingAccommodation?.hotelName} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea id="address" name="address" rows={2} defaultValue={editingAccommodation?.address} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" defaultValue={editingAccommodation?.phone} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input id="website" name="website" placeholder="https://" defaultValue={editingAccommodation?.website} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="roomBlockCode">Room Block Code</Label>
                      <Input id="roomBlockCode" name="roomBlockCode" defaultValue={editingAccommodation?.roomBlockCode} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roomRate">Room Rate ($)</Label>
                      <Input
                        id="roomRate"
                        name="roomRate"
                        type="number"
                        step="0.01"
                        defaultValue={editingAccommodation?.roomRate ? editingAccommodation.roomRate / 100 : ""}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="checkInDate">Check-In Date</Label>
                      <Input
                        id="checkInDate"
                        name="checkInDate"
                        type="date"
                        defaultValue={editingAccommodation?.checkInDate ? new Date(editingAccommodation.checkInDate).toISOString().split('T')[0] : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkOutDate">Check-Out Date</Label>
                      <Input
                        id="checkOutDate"
                        name="checkOutDate"
                        type="date"
                        defaultValue={editingAccommodation?.checkOutDate ? new Date(editingAccommodation.checkOutDate).toISOString().split('T')[0] : ""}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" rows={3} defaultValue={editingAccommodation?.notes} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingAccommodation ? "Update" : "Add Hotel"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {accommodations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Hotel className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No accommodations added yet. Click "Add Hotel" to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accommodations.map((accommodation) => (
              <Card key={accommodation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Hotel className="w-5 h-5 text-primary" />
                      <CardTitle>{accommodation.hotelName}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAccommodation(accommodation);
                          setIsAddDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Delete this accommodation?")) {
                            deleteMutation.mutate({ id: accommodation.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {accommodation.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span>{accommodation.address}</span>
                    </div>
                  )}
                  {accommodation.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${accommodation.phone}`} className="text-primary hover:underline">
                        {accommodation.phone}
                      </a>
                    </div>
                  )}
                  {accommodation.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a href={accommodation.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Visit Website
                      </a>
                    </div>
                  )}
                  {accommodation.roomBlockCode && (
                    <div className="bg-secondary rounded-lg p-3 mt-3">
                      <p className="text-xs text-muted-foreground mb-1">Room Block Code</p>
                      <p className="font-mono font-semibold">{accommodation.roomBlockCode}</p>
                    </div>
                  )}
                  {accommodation.roomRate && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Room Rate</span>
                      <span className="font-semibold">{formatCurrency(accommodation.roomRate)}/night</span>
                    </div>
                  )}
                  {(accommodation.checkInDate || accommodation.checkOutDate) && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Dates</span>
                      <span>
                        {accommodation.checkInDate && new Date(accommodation.checkInDate).toLocaleDateString()}
                        {accommodation.checkInDate && accommodation.checkOutDate && " - "}
                        {accommodation.checkOutDate && new Date(accommodation.checkOutDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {accommodation.notes && (
                    <div className="text-sm text-muted-foreground italic pt-2 border-t">
                      {accommodation.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}
