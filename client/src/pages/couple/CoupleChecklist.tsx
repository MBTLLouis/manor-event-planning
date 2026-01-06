import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import CoupleLayout from "@/components/CoupleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Circle, Trash2, Plus, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function CoupleChecklist() {
  const { user } = useAuth();
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    dueDate: "",
  });

  // Get couple's event
  const { data: events = [] } = trpc.events.list.useQuery();
  const coupleEvent = events[0];

  // Get checklist items
  const { data: checklistItems = [], isLoading, refetch } = trpc.checklist.getByEvent.useQuery(
    { eventId: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );

  // Mutations
  const createMutation = trpc.checklist.create.useMutation({
    onSuccess: () => {
      refetch();
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
      });
      setNewTaskOpen(false);
    },
  });

  const toggleMutation = trpc.checklist.toggle.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteMutation = trpc.checklist.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleCreateTask = () => {
    if (!newTask.title.trim() || !coupleEvent) return;

    createMutation.mutate({
      eventId: coupleEvent.id,
      category: "general",
      title: newTask.title,
      description: newTask.description || undefined,
      priority: newTask.priority,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
    });
  };

  const handleToggleTask = (id: number, completed: boolean) => {
    toggleMutation.mutate({ id, completed: !completed });
  };

  const handleDeleteTask = (id: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteMutation.mutate({ id });
    }
  };

  if (!coupleEvent) {
    return (
      <CoupleLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading your checklist...</p>
        </div>
      </CoupleLayout>
    );
  }

  // Group items by category
  const categories = ["general", "venue", "catering", "photography", "flowers", "music", "invitations", "other"];
  const groupedItems = categories.reduce((acc, cat) => {
    acc[cat] = checklistItems.filter((item: any) => item.category === cat);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate progress
  const totalTasks = checklistItems.length;
  const completedTasks = checklistItems.filter((item: any) => item.completed).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      general: "📋",
      venue: "🏰",
      catering: "🍽️",
      photography: "📸",
      flowers: "🌸",
      music: "🎵",
      invitations: "📧",
      other: "✓",
    };
    return icons[category] || "✓";
  };

  return (
    <CoupleLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-[#2C5F5D] mb-2">Wedding Planning Checklist</h1>
          <p className="text-gray-600">Stay organized with your wedding planning tasks</p>
        </div>

        {/* Progress Card */}
        <Card className="mb-8 border-[#6B8E23]/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg text-[#2C5F5D]">Overall Progress</h3>
                <p className="text-sm text-gray-600">
                  {completedTasks} of {totalTasks} tasks completed
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#6B8E23]">{progressPercentage}%</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-[#6B8E23] h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Add New Task Button */}
        <div className="mb-8">
          <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#6B8E23] hover:bg-[#5a7a1f] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Task Title</label>
                  <Input
                    placeholder="Enter task title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description (optional)</label>
                  <Textarea
                    placeholder="Add details about this task"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value as any })}>
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

                  <div>
                    <label className="text-sm font-medium">Due Date (optional)</label>
                    <Input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setNewTaskOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTask}
                    disabled={!newTask.title.trim() || createMutation.isPending}
                    className="flex-1 bg-[#6B8E23] hover:bg-[#5a7a1f] text-white"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Task"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Checklist by Category */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading your tasks...</p>
          </div>
        ) : totalTasks === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-[#6B8E23] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No tasks yet</h3>
              <p className="text-gray-600">Start planning by adding your first task!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => {
              const items = groupedItems[category];
              if (items.length === 0) return null;

              const categoryCompleted = items.filter((item: any) => item.completed).length;
              const categoryTotal = items.length;

              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">{getCategoryIcon(category)}</span>
                    <h3 className="text-xl font-semibold text-[#2C5F5D] capitalize">
                      {category}
                    </h3>
                    <span className="text-sm text-gray-600 ml-auto">
                      {categoryCompleted}/{categoryTotal}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {items.map((item: any) => (
                      <Card
                        key={item.id}
                        className={`border-l-4 ${
                          item.completed
                            ? "border-l-green-500 bg-green-50/30"
                            : "border-l-[#6B8E23]"
                        }`}
                      >
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-start gap-4">
                            <button
                              onClick={() => handleToggleTask(item.id, item.completed)}
                              className="mt-1 flex-shrink-0"
                            >
                              {item.completed ? (
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                              ) : (
                                <Circle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h4
                                    className={`font-semibold ${
                                      item.completed
                                        ? "line-through text-gray-500"
                                        : "text-[#2C5F5D]"
                                    }`}
                                  >
                                    {item.title}
                                  </h4>
                                  {item.description && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {item.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 mt-2">
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getPriorityColor(
                                        item.priority
                                      )}`}
                                    >
                                      {item.priority} priority
                                    </span>
                                    {item.dueDate && (
                                      <span className="text-xs text-gray-600 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Due {format(new Date(item.dueDate), "MMM d, yyyy")}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleDeleteTask(item.id)}
                                  className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CoupleLayout>
  );
}
