import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Utensils } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import EmployeeLayout from "@/components/EmployeeLayout";
import { toast } from "sonner";

export default function FoodChoices() {
  const [, params] = useRoute("/events/:id/food-choices");
  const [, setLocation] = useLocation();
  const eventId = params?.id ? parseInt(params.id) : 0;

  const [isAddOptionDialogOpen, setIsAddOptionDialogOpen] = useState(false);
  const [newOption, setNewOption] = useState({
    category: "starter" as "starter" | "main" | "dessert",
    name: "",
    description: "",
  });

  const { data: event } = trpc.events.getById.useQuery({ id: eventId });
  const { data: foodOptions } = trpc.foodOptions.list.useQuery({ eventId });
  const { data: guests } = trpc.guests.list.useQuery({ eventId });

  const utils = trpc.useUtils();
  const createOptionMutation = trpc.foodOptions.create.useMutation({
    onSuccess: () => {
      toast.success("Food option added!");
      setIsAddOptionDialogOpen(false);
      setNewOption({ category: "starter", name: "", description: "" });
      utils.foodOptions.list.invalidate({ eventId });
    },
  });

  const deleteOptionMutation = trpc.foodOptions.delete.useMutation({
    onSuccess: () => {
      toast.success("Food option deleted!");
      utils.foodOptions.list.invalidate({ eventId });
    },
  });

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    createOptionMutation.mutate({ eventId, ...newOption });
  };

  const handleDeleteOption = (id: number) => {
    if (confirm("Are you sure you want to delete this food option?")) {
      deleteOptionMutation.mutate({ id });
    }
  };

  const starters = foodOptions?.filter((opt) => opt.category === "starter") || [];
  const mains = foodOptions?.filter((opt) => opt.category === "main") || [];
  const desserts = foodOptions?.filter((opt) => opt.category === "dessert") || [];

  // Calculate meal statistics
  const guestsWithMeals = guests?.filter((g) => g.mealSelection) || [];
  const mealCounts: Record<string, number> = {};
  guestsWithMeals.forEach((guest) => {
    if (guest.mealSelection) {
      mealCounts[guest.mealSelection] = (mealCounts[guest.mealSelection] || 0) + 1;
    }
  });

  const dietaryRestrictions = guests?.filter((g) => g.dietaryRestrictions).map((g) => g.dietaryRestrictions) || [];
  const uniqueDietary = Array.from(new Set(dietaryRestrictions.filter((d): d is string => d !== null)));

  return (
    <EmployeeLayout>
      <div className="p-8">
        <Button variant="ghost" className="mb-6" onClick={() => setLocation(`/events/${eventId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{event?.title}</h1>
          <p className="text-lg text-muted-foreground">Food Choices & Menu Configuration</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Selections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{guestsWithMeals.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                out of {guests?.length || 0} guests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Menu Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{foodOptions?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {starters.length} starters, {mains.length} mains, {desserts.length} desserts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Dietary Restrictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{uniqueDietary.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                unique restrictions
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Menu Configuration</h2>
          <Dialog open={isAddOptionDialogOpen} onOpenChange={setIsAddOptionDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Food Option
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddOption}>
                <DialogHeader>
                  <DialogTitle>Add Food Option</DialogTitle>
                  <DialogDescription>Add a new menu item to the event</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newOption.category}
                      onValueChange={(value: any) => setNewOption({ ...newOption, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="main">Main Course</SelectItem>
                        <SelectItem value="dessert">Dessert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Grilled Salmon"
                      value={newOption.name}
                      onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the dish..."
                      value={newOption.description}
                      onChange={(e) => setNewOption({ ...newOption, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Add Option</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Starters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                Starters
              </CardTitle>
            </CardHeader>
            <CardContent>
              {starters.length > 0 ? (
                <div className="space-y-3">
                  {starters.map((option) => (
                    <div key={option.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{option.name}</h4>
                          {option.description && (
                            <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteOption(option.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No starters added</p>
              )}
            </CardContent>
          </Card>

          {/* Mains */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                Main Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mains.length > 0 ? (
                <div className="space-y-3">
                  {mains.map((option) => (
                    <div key={option.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{option.name}</h4>
                          {option.description && (
                            <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteOption(option.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No mains added</p>
              )}
            </CardContent>
          </Card>

          {/* Desserts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                Desserts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {desserts.length > 0 ? (
                <div className="space-y-3">
                  {desserts.map((option) => (
                    <div key={option.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{option.name}</h4>
                          {option.description && (
                            <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteOption(option.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No desserts added</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Meal Selection Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Meal Selection Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(mealCounts).length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(mealCounts).map(([meal, count]) => (
                  <div key={meal} className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">{meal}</h4>
                    <p className="text-2xl font-bold text-primary">{count}</p>
                    <p className="text-sm text-muted-foreground">
                      {guests?.length ? Math.round((count / guests.length) * 100) : 0}% of guests
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No meal selections recorded yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Dietary Restrictions */}
        {uniqueDietary.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Dietary Restrictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {uniqueDietary.map((restriction, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                  >
                    {restriction}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </EmployeeLayout>
  );
}
