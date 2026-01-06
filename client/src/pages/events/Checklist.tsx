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
import { Plus, CheckCircle2, Circle, AlertCircle, Edit2 } from "lucide-react";
import { toast } from "sonner";

export default function ChecklistEnhanced() {
  const params = useParams();
  const eventId = Number(params.id);
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"manor" | "couple">("manor");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    dueDate: "",
  });

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
      toast.success("Task updated");
      refetch();
      setIsEditDialogOpen(false);
      setEditingItem(null);
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
      assignedTo: formData.get("assignedTo") as string,
      dueDate: formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : undefined,
    };

    createMutation.mutate(data);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;

    updateMutation.mutate({
      id: editingItem.id,
      title: editFormData.title,
      description: editFormData.description || undefined,
      priority: editFormData.priority,
      dueDate: editFormData.dueDate ? new Date(editFormData.dueDate) : undefined,
    });
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setEditFormData({
      title: item.title,
      description: item.description || "",
      priority: item.priority,
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : "",
    });
    setIsEditDialogOpen(true);
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

  // Group items by priority
  const groupByPriority = (items: typeof checklistItems) => {
    const priorities = ["high", "medium", "low"];
    return priorities.reduce((acc, priority) => {
      acc[priority] = items.filter(item => item.priority === priority);
      return acc;
    }, {} as Record<string, typeof checklistItems>);
  };

  const groupedManorItems = groupByPriority(manorItems);
  const groupedCoupleItems = groupByPriority(coupleItems);

  // Calculate progress for each tab
  const manorCompleted = manorItems.filter(item => item.completed).length;
  const manorTotal = manorItems.length;
  const manorProgress = manorTotal > 0 ? Math.round((manorCompleted / manorTotal) * 100) : 0;

  const coupleCompleted = coupleItems.filter(item => item.completed).length;
  const coupleTotal = coupleItems.length;
  const coupleProgress = coupleTotal > 0 ? Math.round((coupleCompleted / coupleTotal) * 100) : 0;

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "🔴 High Priority";
      case "medium":
        return "🟡 Medium Priority";
      case "low":
        return "🟢 Low Priority";
      default:
        return priority;
    }
  };

  const renderTaskList = (groupedItems: Record<string, typeof checklistItems>) => {
    const priorities = ["high", "medium", "low"];
    const hasAnyTasks = priorities.some(p => groupedItems[p]?.length > 0);

    if (!hasAnyTasks) {
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
        {priorities.map((priority) => {
          const items = groupedItems[priority] || [];
          if (items.length === 0) return null;

          return (
            <Card key={priority}>
              <CardHeader>
                <CardTitle>{getPriorityLabel(priority)}</CardTitle>
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
                              {item.category}
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
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <EmployeeLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Wedding Planning Checklist</h1>
            <p className="text-muted-foreground">Manage tasks for the event</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="assignedTo">Assign to</Label>
                  <Select defaultValue="Manor">
                    <SelectTrigger name="assignedTo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manor">Manor</SelectItem>
                      <SelectItem value="Couple">Couple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select defaultValue="general">
                    <SelectTrigger name="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="venue">Venue</SelectItem>
                      <SelectItem value="catering">Catering</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                      <SelectItem value="flowers">Flowers</SelectItem>
                      <SelectItem value="music">Music</SelectItem>
                      <SelectItem value="invitations">Invitations</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Task Title</Label>
                  <Input name="title" placeholder="Enter task title" required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea name="description" placeholder="Enter task description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger name="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input name="dueDate" type="date" />
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

        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="manor">
              Manor Tasks ({manorTotal})
            </TabsTrigger>
            <TabsTrigger value="couple">
              Couple Tasks ({coupleTotal})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manor" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Progress</h3>
                    <p className="text-sm text-muted-foreground">
                      {manorCompleted} of {manorTotal} tasks completed
                    </p>
                  </div>
                  <div className="text-2xl font-bold">{manorProgress}%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${manorProgress}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
            {renderTaskList(groupedManorItems)}
          </TabsContent>

          <TabsContent value="couple" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Progress</h3>
                    <p className="text-sm text-muted-foreground">
                      {coupleCompleted} of {coupleTotal} tasks completed
                    </p>
                  </div>
                  <div className="text-2xl font-bold">{coupleProgress}%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${coupleProgress}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
            {renderTaskList(groupedCoupleItems)}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Task Title</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select value={editFormData.priority} onValueChange={(value) => setEditFormData({ ...editFormData, priority: value as any })}>
                    <SelectTrigger id="edit-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-dueDate">Due Date</Label>
                  <Input
                    id="edit-dueDate"
                    type="date"
                    value={editFormData.dueDate}
                    onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </EmployeeLayout>
  );
}
