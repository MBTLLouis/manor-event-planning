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

  const [isAddMenuDialogOpen, setIsAddMenuDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    description: "",
  });

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

  const createMenuItemMutation = trpc.menu.create.useMutation({
    onSuccess: () => {
      toast.success("Menu choice added successfully!");
      setIsAddMenuDialogOpen(false);
      setSelectedCourse("");
      setNewMenuItem({ name: "", description: "" });
      utils.menu.list.invalidate({ eventId: coupleEvent?.id });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add menu choice");
    },
  });

  const deleteMenuItemMutation = trpc.menu.delete.useMutation({
    onSuccess: () => {
      toast.success("Menu choice removed successfully!");
      utils.menu.list.invalidate({ eventId: coupleEvent?.id });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove menu choice");
    },
  });

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
    onError: (error: any) => {
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
    onError: (error: any) => {
      toast.error(error.message || "Failed to update drink");
    },
  });

  const deleteDrinkMutation = trpc.drinks.delete.useMutation({
    onSuccess: () => {
      toast.success("Drink deleted successfully!");
      utils.drinks.list.invalidate({ eventId: coupleEvent?.id });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete drink");
    },
  });

  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuItem.name.trim()) {
      toast.error("Please enter a menu choice name");
      return;
    }
    if (!selectedCourse) {
      toast.error("Please select a course");
      return;
    }

    createMenuItemMutation.mutate({
      eventId: coupleEvent?.id || 0,
      course: selectedCourse,
      name: newMenuItem.name,
      description: newMenuItem.description || undefined,
    });
  };

  const handleDeleteMenuItem = (id: number) => {
    if (confirm("Are you sure you want to remove this menu choice?")) {
      deleteMenuItemMutation.mutate({ id });
    }
  };

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

  // Get default courses from menu items (these are created when event is initialized)
  const courses = Array.from(new Set(menuItems.map(item => item.course))).sort();
  
  // If no courses exist, show default course names
  const availableCourses = courses.length > 0 ? courses : ['Starter', 'Main', 'Dessert'];

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
            <div className="flex justify-end">
              <Dialog open={isAddMenuDialogOpen} onOpenChange={setIsAddMenuDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#2C5F5D] hover:bg-[#1e4441]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Menu Choice
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddMenuItem}>
                    <DialogHeader>
                      <DialogTitle>Add Menu Choice</DialogTitle>
                      <DialogDescription>Add your menu selection to a course</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Course</Label>
                        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCourses.map((course) => (
                              <SelectItem key={course} value={course}>
                                {course}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="menuName">Menu Choice Name</Label>
                        <Input
                          id="menuName"
                          placeholder="e.g., Grilled Salmon"
                          value={newMenuItem.name}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="menuDescription">Description (Optional)</Label>
                        <Textarea
                          id="menuDescription"
                          placeholder="e.g., Pan-seared salmon with lemon butter sauce"
                          value={newMenuItem.description}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="bg-[#2C5F5D] hover:bg-[#1e4441]">
                        Add Choice
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {menuItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 mb-2">No menu items yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add your menu choices to each course
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
                        <div className="space-y-3">
                          {courseItems.map((item) => (
                            <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-lg mb-1">{item.name}</h3>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                )}
                                {!item.isAvailable && (
                                  <Badge variant="secondary" className="text-xs">Unavailable</Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMenuItem(item.id)}
                                className="ml-2"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
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
                        </>
                      )}

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

                      <div className="space-y-2">
                        <Label htmlFor="totalQuantity">Total Quantity</Label>
                        <Input
                          id="totalQuantity"
                          type="number"
                          min="1"
                          value={newDrink.totalQuantity}
                          onChange={(e) => setNewDrink({ ...newDrink, totalQuantity: parseInt(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                          id="description"
                          value={newDrink.description}
                          onChange={(e) => setNewDrink({ ...newDrink, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="bg-[#2C5F5D] hover:bg-[#1e4441]">
                        Add Drink
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
                  <p className="text-lg text-gray-600 mb-2">No drinks yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add beverages for your wedding
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drinks.map((drink) => (
                  <Card key={drink.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-lg">
                            {drink.cocktailName || drink.brandProducer || "Drink"}
                          </h3>
                          {drink.subType && (
                            <p className="text-sm text-gray-600">{drink.subType}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDrink(drink.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Type:</span> {drink.drinkType === 'soft' ? 'Soft Drink' : 'Alcoholic'}</p>
                        <p><span className="font-medium">Corkage:</span> {drink.corkage === 'venue_provides' ? 'Venue Provides' : 'Client Brings'}</p>
                        <p><span className="font-medium">Quantity:</span> {drink.totalQuantity}</p>
                        {drink.description && (
                          <p><span className="font-medium">Notes:</span> {drink.description}</p>
                        )}
                      </div>
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
