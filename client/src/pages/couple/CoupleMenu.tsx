import { useState } from "react";
import { trpc } from "@/lib/trpc";
import CoupleLayout from "@/components/CoupleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Utensils, Wine, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CoupleMenu() {
  const { data: events = [] } = trpc.events.list.useQuery();
  const coupleEvent = events[0];

  const { data: menuItems = [] } = trpc.menu.list.useQuery(
    { eventId: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );

  const { data: drinks = [] } = trpc.drinks.list.useQuery(
    { eventId: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );

  const [isAddDrinkDialogOpen, setIsAddDrinkDialogOpen] = useState(false);
  const [editingDrink, setEditingDrink] = useState<any>(null);
  const [isEditDrinkDialogOpen, setIsEditDrinkDialogOpen] = useState(false);
  const [newDrink, setNewDrink] = useState({
    drinkType: "soft" as "soft" | "alcoholic",
    subType: "",
    brandProducer: "",
    cocktailName: "",
    corkage: "venue_provides" as "venue_provides" | "client_brings",
    totalQuantity: 0,
    description: "",
  });

  const utils = trpc.useUtils();

  const createDrinkMutation = trpc.drinks.create.useMutation({
    onSuccess: () => {
      toast.success("Drink added successfully!");
      setIsAddDrinkDialogOpen(false);
      setNewDrink({
        drinkType: "soft",
        subType: "",
        brandProducer: "",
        cocktailName: "",
        corkage: "venue_provides",
        totalQuantity: 0,
        description: "",
      });
      utils.drinks.list.invalidate({ eventId: coupleEvent?.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add drink");
    },
  });

  const updateDrinkMutation = trpc.drinks.update.useMutation({
    onSuccess: () => {
      toast.success("Drink updated successfully!");
      setIsEditDrinkDialogOpen(false);
      setEditingDrink(null);
      utils.drinks.list.invalidate({ eventId: coupleEvent?.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update drink");
    },
  });

  const deleteDrinkMutation = trpc.drinks.delete.useMutation({
    onSuccess: () => {
      toast.success("Drink deleted successfully!");
      utils.drinks.list.invalidate({ eventId: coupleEvent?.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete drink");
    },
  });

  const handleAddDrink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrink.brandProducer && !newDrink.cocktailName) {
      toast.error("Please enter a brand/producer or cocktail name");
      return;
    }
    if (newDrink.totalQuantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    createDrinkMutation.mutate({
      eventId: coupleEvent?.id || 0,
      ...newDrink,
    });
  };

  const handleEditDrink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDrink?.brandProducer && !editingDrink?.cocktailName) {
      toast.error("Please enter a brand/producer or cocktail name");
      return;
    }
    if (editingDrink?.totalQuantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    updateDrinkMutation.mutate({
      id: editingDrink.id,
      ...editingDrink,
    });
  };

  const handleDeleteDrink = (id: number) => {
    if (confirm("Are you sure you want to delete this drink?")) {
      deleteDrinkMutation.mutate({ id });
    }
  };

  // Extract unique courses
  const courses = Array.from(new Set(menuItems.map(item => item.course))).sort();

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
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2">Menu & Drinks</h1>
          <p className="text-gray-600">Manage your wedding menu and beverages</p>
        </div>

        <Tabs defaultValue="menu" className="space-y-6">
          <TabsList>
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <Utensils className="w-4 h-4" />
              Menu
            </TabsTrigger>
            <TabsTrigger value="drinks" className="flex items-center gap-2">
              <Wine className="w-4 h-4" />
              Drinks
            </TabsTrigger>
          </TabsList>

          {/* Menu Tab */}
          <TabsContent value="menu" className="space-y-6">
            {menuItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 mb-2">No menu items yet</p>
                  <p className="text-sm text-muted-foreground">
                    Your event planner will add menu options for you to review
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {courses.map((course) => {
                  const courseItems = menuItems.filter(item => item.course === course);
                  return (
                    <Card key={course}>
                      <CardHeader>
                        <CardTitle className="text-2xl font-serif text-[#2C5F5D]">{course}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {courseItems.map((item) => (
                            <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-medium text-lg mb-1">{item.name}</h3>
                                  {item.description && (
                                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                  )}
                                  {!item.isAvailable && (
                                    <Badge variant="secondary" className="text-xs">Unavailable</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Drinks Tab */}
          <TabsContent value="drinks" className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={isAddDrinkDialogOpen} onOpenChange={setIsAddDrinkDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#2C5F5D] hover:bg-[#1e4441]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Drink
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddDrink}>
                    <DialogHeader>
                      <DialogTitle>Add Drink</DialogTitle>
                      <DialogDescription>Add a beverage to your wedding</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Drink Type</Label>
                        <Select value={newDrink.drinkType} onValueChange={(value: any) => setNewDrink({ ...newDrink, drinkType: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="soft">Soft Drink</SelectItem>
                            <SelectItem value="alcoholic">Alcoholic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {newDrink.drinkType === "soft" && (
                        <div className="space-y-2">
                          <Label htmlFor="subType">Sub Type (e.g., Juice, Coffee)</Label>
                          <Input
                            id="subType"
                            value={newDrink.subType}
                            onChange={(e) => setNewDrink({ ...newDrink, subType: e.target.value })}
                          />
                        </div>
                      )}

                      {newDrink.drinkType === "alcoholic" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="subType">Sub Type (e.g., Wine, Beer, Spirits)</Label>
                            <Input
                              id="subType"
                              value={newDrink.subType}
                              onChange={(e) => setNewDrink({ ...newDrink, subType: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="brandProducer">Brand/Producer</Label>
                            <Input
                              id="brandProducer"
                              value={newDrink.brandProducer}
                              onChange={(e) => setNewDrink({ ...newDrink, brandProducer: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cocktailName">Cocktail Name (Optional)</Label>
                            <Input
                              id="cocktailName"
                              value={newDrink.cocktailName}
                              onChange={(e) => setNewDrink({ ...newDrink, cocktailName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Corkage</Label>
                            <Select value={newDrink.corkage} onValueChange={(value: any) => setNewDrink({ ...newDrink, corkage: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="venue_provides">Venue Provides</SelectItem>
                                <SelectItem value="client_brings">Client Brings</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="totalQuantity">Total Quantity *</Label>
                        <Input
                          id="totalQuantity"
                          type="number"
                          min="1"
                          value={newDrink.totalQuantity}
                          onChange={(e) => setNewDrink({ ...newDrink, totalQuantity: parseInt(e.target.value) || 0 })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                          id="description"
                          value={newDrink.description}
                          onChange={(e) => setNewDrink({ ...newDrink, description: e.target.value })}
                          placeholder="Any special notes about this drink..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createDrinkMutation.isPending}>
                        {createDrinkMutation.isPending ? "Adding..." : "Add Drink"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {drinks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Wine className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 mb-2">No drinks added yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add beverages for your wedding reception
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drinks.map((drink) => (
                  <Card key={drink.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {drink.drinkType === "alcoholic"
                              ? drink.brandProducer || drink.cocktailName
                              : `${drink.subType || "Soft Drink"}`}
                          </CardTitle>
                          {drink.drinkType === "alcoholic" && drink.subType && (
                            <p className="text-sm text-gray-600">{drink.subType}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Dialog open={isEditDrinkDialogOpen && editingDrink?.id === drink.id} onOpenChange={(open) => {
                            if (!open) setEditingDrink(null);
                            setIsEditDrinkDialogOpen(open);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingDrink(drink)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <form onSubmit={handleEditDrink}>
                                <DialogHeader>
                                  <DialogTitle>Edit Drink</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Drink Type</Label>
                                    <Select value={editingDrink?.drinkType || "soft"} onValueChange={(value: any) => setEditingDrink({ ...editingDrink, drinkType: value })}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="soft">Soft Drink</SelectItem>
                                        <SelectItem value="alcoholic">Alcoholic</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {editingDrink?.drinkType === "soft" && (
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-subType">Sub Type</Label>
                                      <Input
                                        id="edit-subType"
                                        value={editingDrink?.subType || ""}
                                        onChange={(e) => setEditingDrink({ ...editingDrink, subType: e.target.value })}
                                      />
                                    </div>
                                  )}

                                  {editingDrink?.drinkType === "alcoholic" && (
                                    <>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-subType2">Sub Type</Label>
                                        <Input
                                          id="edit-subType2"
                                          value={editingDrink?.subType || ""}
                                          onChange={(e) => setEditingDrink({ ...editingDrink, subType: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-brandProducer">Brand/Producer</Label>
                                        <Input
                                          id="edit-brandProducer"
                                          value={editingDrink?.brandProducer || ""}
                                          onChange={(e) => setEditingDrink({ ...editingDrink, brandProducer: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-cocktailName">Cocktail Name</Label>
                                        <Input
                                          id="edit-cocktailName"
                                          value={editingDrink?.cocktailName || ""}
                                          onChange={(e) => setEditingDrink({ ...editingDrink, cocktailName: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Corkage</Label>
                                        <Select value={editingDrink?.corkage || "venue_provides"} onValueChange={(value: any) => setEditingDrink({ ...editingDrink, corkage: value })}>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="venue_provides">Venue Provides</SelectItem>
                                            <SelectItem value="client_brings">Client Brings</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </>
                                  )}

                                  <div className="space-y-2">
                                    <Label htmlFor="edit-totalQuantity">Total Quantity</Label>
                                    <Input
                                      id="edit-totalQuantity"
                                      type="number"
                                      min="1"
                                      value={editingDrink?.totalQuantity || 0}
                                      onChange={(e) => setEditingDrink({ ...editingDrink, totalQuantity: parseInt(e.target.value) || 0 })}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea
                                      id="edit-description"
                                      value={editingDrink?.description || ""}
                                      onChange={(e) => setEditingDrink({ ...editingDrink, description: e.target.value })}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button type="submit" disabled={updateDrinkMutation.isPending}>
                                    {updateDrinkMutation.isPending ? "Updating..." : "Update Drink"}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDrink(drink.id)}
                            disabled={deleteDrinkMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Quantity: </span>
                        <span className="font-medium">{drink.totalQuantity}</span>
                      </div>
                      {drink.corkage && (
                        <div>
                          <span className="text-gray-600">Corkage: </span>
                          <span className="font-medium">
                            {drink.corkage === "venue_provides" ? "Venue Provides" : "Client Brings"}
                          </span>
                        </div>
                      )}
                      {drink.description && (
                        <div>
                          <span className="text-gray-600">Notes: </span>
                          <p className="text-gray-700 mt-1">{drink.description}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </CoupleLayout>
  );
}
