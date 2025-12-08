import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import EmployeeLayout from "@/components/EmployeeLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Mail, Phone, Globe, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Vendors() {
  const params = useParams();
  const eventId = Number(params.id);
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);

  const { data: vendors = [], refetch } = trpc.vendors.list.useQuery({ eventId });
  const { data: event } = trpc.events.getById.useQuery({ id: eventId });

  const createMutation = trpc.vendors.create.useMutation({
    onSuccess: () => {
      toast.success("Vendor added");
      refetch();
      setIsAddDialogOpen(false);
    },
  });

  const updateMutation = trpc.vendors.update.useMutation({
    onSuccess: () => {
      toast.success("Vendor updated");
      refetch();
      setEditingVendor(null);
    },
  });

  const deleteMutation = trpc.vendors.delete.useMutation({
    onSuccess: () => {
      toast.success("Vendor deleted");
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      eventId,
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      contactName: formData.get("contactName") as string || undefined,
      email: formData.get("email") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      website: formData.get("website") as string || undefined,
      status: (formData.get("status") as any) || "pending",
      contractSigned: formData.get("contractSigned") === "on",
      depositPaid: formData.get("depositPaid") === "on",
      notes: formData.get("notes") as string || undefined,
    };

    if (editingVendor) {
      updateMutation.mutate({ id: editingVendor.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const groupedVendors = vendors.reduce((acc, vendor) => {
    if (!acc[vendor.category]) {
      acc[vendor.category] = [];
    }
    acc[vendor.category].push(vendor);
    return acc;
  }, {} as Record<string, typeof vendors>);

  return (
    <EmployeeLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="ghost" onClick={() => setLocation(`/events/${eventId}`)}>
              ← Back to Event
            </Button>
            <h1 className="text-3xl font-serif font-bold mt-2">Vendor Management</h1>
            <p className="text-muted-foreground">{event?.title}</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) setEditingVendor(null);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingVendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
                  <DialogDescription>Manage vendor information for this event</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Vendor Name *</Label>
                      <Input id="name" name="name" defaultValue={editingVendor?.name} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Input id="category" name="category" placeholder="e.g., Catering, Photography" defaultValue={editingVendor?.category} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input id="contactName" name="contactName" defaultValue={editingVendor?.contactName} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" defaultValue={editingVendor?.email} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" defaultValue={editingVendor?.phone} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" name="website" placeholder="https://" defaultValue={editingVendor?.website} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={editingVendor?.status || "pending"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="contractSigned" name="contractSigned" defaultChecked={editingVendor?.contractSigned} />
                      <Label htmlFor="contractSigned" className="font-normal">Contract Signed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="depositPaid" name="depositPaid" defaultChecked={editingVendor?.depositPaid} />
                      <Label htmlFor="depositPaid" className="font-normal">Deposit Paid</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" defaultValue={editingVendor?.notes} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingVendor ? "Update Vendor" : "Add Vendor"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {Object.keys(groupedVendors).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No vendors added yet. Click "Add Vendor" to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedVendors).map(([category, categoryVendors]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                  <CardDescription>{categoryVendors.length} vendor(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryVendors.map((vendor) => (
                      <div key={vendor.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{vendor.name}</h3>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  vendor.status === "confirmed"
                                    ? "bg-green-100 text-green-800"
                                    : vendor.status === "booked"
                                    ? "bg-blue-100 text-blue-800"
                                    : vendor.status === "contacted"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : vendor.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {vendor.status}
                              </span>
                            </div>
                            {vendor.contactName && (
                              <p className="text-sm text-muted-foreground mb-2">Contact: {vendor.contactName}</p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm">
                              {vendor.email && (
                                <a href={`mailto:${vendor.email}`} className="flex items-center gap-1 text-primary hover:underline">
                                  <Mail className="w-4 h-4" />
                                  {vendor.email}
                                </a>
                              )}
                              {vendor.phone && (
                                <a href={`tel:${vendor.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                                  <Phone className="w-4 h-4" />
                                  {vendor.phone}
                                </a>
                              )}
                              {vendor.website && (
                                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                                  <Globe className="w-4 h-4" />
                                  Website
                                </a>
                              )}
                            </div>
                            <div className="flex gap-4 mt-2 text-sm">
                              {vendor.contractSigned && (
                                <span className="text-green-600">✓ Contract Signed</span>
                              )}
                              {vendor.depositPaid && (
                                <span className="text-green-600">✓ Deposit Paid</span>
                              )}
                            </div>
                            {vendor.notes && (
                              <p className="text-sm text-muted-foreground mt-2 italic">{vendor.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingVendor(vendor);
                                setIsAddDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Delete this vendor?")) {
                                  deleteMutation.mutate({ id: vendor.id });
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}
