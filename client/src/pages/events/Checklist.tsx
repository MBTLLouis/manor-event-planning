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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ChecklistEnhanced() {
  const params = useParams();
  const eventId = Number(params.id);
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"manor" | "couple">("manor");

  const { data: checklistItems = [], refetch } = trpc.checklist.list.useQuery({ eventId });
  const { data: event } = trpc.events.getById.useQuery({ id: eventId });

  const createMutation = trpc.checklist.create.useMutation({
    onSuccess: () => {
      toast.success("Task added");
      refetch();
      setIsAddDialogOpen(false);
    },
  });

  const updateMutation = trpc.checklist.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteMutation = trpc.checklist.delete.useMutation({
    onSuccess: () => {
      toast.success("Task deleted");
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      eventId,
      category: formData.get("category") as string,
      title: formData.get("title") as string,
      description: formData.get("description") as string || undefined,
      priority: (formData.get("priority") as "low" | "medium" | "high") || "medium",
      assignedTo: formData.get("assignedTo") as string, // "Manor" or "Couple"
      dueDate: formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : undefined,
    };

    createMutation.mutate(data);
  };

  const toggleComplete = (item: any) => {
    updateMutation.mutate({
      id: item.id,
      completed: !item.completed,
      completedAt: !item.completed ? new Date() : undefined,
    });
  };

  // Filter items by assignment
  const manorItems = checklistItems.filter(item => item.assignedTo === "Manor");
  const coupleItems = checklistItems.filter(item => item.assignedTo === "Couple");

  // Group items by category
  const groupItems = (items: typeof checklistItems) => {
    return items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof checklistItems>);
  };

  const groupedManorItems = groupItems(manorItems);
  const groupedCoupleItems = groupItems(coupleItems);

  // Calculate progress for each tab
  const manorCompleted = manorItems.filter(item => item.completed).length;
  const manorTotal = manorItems.length;
  const manorProgress = manorTotal > 0 ? Math.round((manorCompleted / manorTotal) * 100) : 0;

  const coupleCompleted = coupleItems.filter(item => item.completed).length;
  const coupleTotal = coupleItems.length;
  const coupleProgress = coupleTotal > 0 ? Math.round((coupleCompleted / coupleTotal) * 100) : 0;

  const renderTaskList = (groupedItems: Record<string, typeof checklistItems>) => {
    if (Object.keys(groupedItems).length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No tasks yet. Click "Add Task" to get started.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
              <CardDescription>
                {items.filter(i => i.completed).length} of {items.length} completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 transition-all ${
                      item.completed ? "bg-muted/50 opacity-75" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleComplete(item)}
                        className="mt-1 flex-shrink-0"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                            {item.title}
                          </h4>
                          {item.priority === "high" && (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          )}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              item.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : item.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {item.dueDate && (
                            <span>📅 Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                          )}
                          {item.completedAt && (
                            <span className="text-green-600">
                              ✓ Completed: {new Date(item.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Delete this task?")) {
                            deleteMutation.mutate({ id: item.id });
                          }
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <EmployeeLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="ghost" onClick={() => setLocation(`/events/${eventId}`)}>
              ← Back to Event
            </Button>
            <h1 className="text-3xl font-serif font-bold mt-2">Event Checklist</h1>
            <p className="text-muted-foreground">{event?.title}</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add Checklist Task</DialogTitle>
                  <DialogDescription>Create a new task for this event</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="assignedTo">Assigned To *</Label>
                    <Select name="assignedTo" defaultValue="Manor" required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manor">Manor By The Lake</SelectItem>
                        <SelectItem value="Couple">Couple</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" name="category" placeholder="e.g., Pre-Event, Day-Of, Post-Event" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Task Title</Label>
                    <Input id="title" name="title" placeholder="What needs to be done?" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" placeholder="Additional details..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select name="priority" defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input id="dueDate" name="dueDate" type="date" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Adding..." : "Add Task"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as "manor" | "couple")} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="manor">
              Manor By The Lake
              <span className="ml-2 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                {manorCompleted}/{manorTotal}
              </span>
            </TabsTrigger>
            <TabsTrigger value="couple">
              Couple
              <span className="ml-2 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                {coupleCompleted}/{coupleTotal}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manor" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manor By The Lake Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{manorCompleted} of {manorTotal} tasks completed</span>
                    <span className="font-semibold">{manorProgress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-300"
                      style={{ width: `${manorProgress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            {renderTaskList(groupedManorItems)}
          </TabsContent>

          <TabsContent value="couple" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Couple Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{coupleCompleted} of {coupleTotal} tasks completed</span>
                    <span className="font-semibold">{coupleProgress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-300"
                      style={{ width: `${coupleProgress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            {renderTaskList(groupedCoupleItems)}
          </TabsContent>
        </Tabs>
      </div>
    </EmployeeLayout>
  );
}
