import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import EmployeeLayout from "@/components/EmployeeLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ChefHat, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from "sonner";

export default function FoodChoices() {
  const params = useParams();
  const eventId = parseInt(params.id!);
  
  const { data: event } = trpc.events.getById.useQuery({ id: eventId });
  const { data: menuItems = [], refetch: refetchMenu } = trpc.menu.list.useQuery({ eventId });
  const { data: guests = [] } = trpc.guests.list.useQuery({ eventId });
  
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newCourseName, setNewCourseName] = useState("");
  const [newItem, setNewItem] = useState({
    course: "",
    name: "",
    description: "",
    isAvailable: true,
    orderIndex: 0,
  });
  
  // Extract unique courses with their order
  const coursesWithOrder = Array.from(new Set(menuItems.map(item => item.course)))
    .map(courseName => {
      const courseItems = menuItems.filter(item => item.course === courseName);
      const minOrder = Math.min(...courseItems.map(item => item.orderIndex));
      return { name: courseName, orderIndex: minOrder };
    })
    .sort((a, b) => a.orderIndex - b.orderIndex);
  
  const courses = coursesWithOrder.map(c => c.name);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = courses.indexOf(active.id as string);
    const newIndex = courses.indexOf(over.id as string);
    
    const reorderedCourses = arrayMove(courses, oldIndex, newIndex);
    
    // Update orderIndex for all items in reordered courses
    reorderedCourses.forEach((courseName, index) => {
      const courseItems = menuItems.filter(item => item.course === courseName);
      courseItems.forEach(item => {
        updateItemMutation.mutate({
          id: item.id,
          name: item.name,
          description: item.description,
          isAvailable: item.isAvailable,
          orderIndex: index * 100, // Space out by 100 to allow insertions
        });
      });
    });
  };
  
  const createItemMutation = trpc.menu.create.useMutation({
    onSuccess: () => {
      toast.success("Menu item added");
      refetchMenu();
      setIsAddItemDialogOpen(false);
      setNewItem({ course: "", name: "", description: "", isAvailable: true, orderIndex: 0 });
    },
    onError: (error) => toast.error(error.message),
  });
  
  const updateItemMutation = trpc.menu.update.useMutation({
    onSuccess: () => {
      toast.success("Menu item updated");
      refetchMenu();
      setEditingItem(null);
    },
    onError: (error) => toast.error(error.message),
  });
  
  const deleteItemMutation = trpc.menu.delete.useMutation({
    onSuccess: () => {
      toast.success("Menu item deleted");
      refetchMenu();
    },
    onError: (error) => toast.error(error.message),
  });
  
  const deleteCourse = (courseName: string) => {
    if (!confirm(`Delete all items in "${courseName}" course?`)) return;
    
    const itemsToDelete = menuItems.filter(item => item.course === courseName);
    Promise.all(itemsToDelete.map(item => deleteItemMutation.mutateAsync({ id: item.id })))
      .then(() => toast.success(`Course "${courseName}" deleted`))
      .catch(() => toast.error("Failed to delete course"));
  };
  
  const handleAddCourse = () => {
    if (!newCourseName.trim()) {
      toast.error("Please enter a course name");
      return;
    }
    
    setNewItem({ ...newItem, course: newCourseName });
    setNewCourseName("");
    setIsAddCourseDialogOpen(false);
    setIsAddItemDialogOpen(true);
  };
  
  // Calculate guest food selections summary
  const getSelectionSummary = () => {
    const summary: Record<string, Record<string, number>> = {};
    
    guests.forEach(guest => {
      const selections = guest.foodSelections as Record<string, string> || {};
      Object.entries(selections).forEach(([course, dish]) => {
        if (!summary[course]) summary[course] = {};
        summary[course][dish] = (summary[course][dish] || 0) + 1;
      });
    });
    
    return summary;
  };
  
  const selectionSummary = getSelectionSummary();
  
  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Food Choices</h1>
          <p className="text-muted-foreground">{event?.title}</p>
        </div>
        
        <Tabs defaultValue="menu" className="space-y-4">
          <TabsList>
            <TabsTrigger value="menu">Menu Configuration</TabsTrigger>
            <TabsTrigger value="summary">Guest Selections Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="menu" className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => setIsAddCourseDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
              <Button 
                onClick={() => setIsAddItemDialogOpen(true)}
                disabled={courses.length === 0}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </div>
            
            {courses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No courses configured yet</p>
                  <p className="text-sm text-muted-foreground">Click "Add Course" to get started</p>
                </CardContent>
              </Card>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={courses}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid gap-4">
                    {courses.map((courseName) => {
                  const courseItems = menuItems.filter(item => item.course === courseName);
                  
                  return (
                    <SortableCourseCard
                      key={courseName}
                      courseName={courseName}
                      courseItems={courseItems}
                      deleteCourse={deleteCourse}
                      setEditingItem={setEditingItem}
                      deleteItemMutation={deleteItemMutation}
                    />
                  );
                })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </TabsContent>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => window.print()} variant="outline">
                <ChefHat className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
            {Object.keys(selectionSummary).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">No guest selections yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {Object.entries(selectionSummary).map(([courseName, dishes]) => (
                  <Card key={courseName}>
                    <CardHeader>
                      <CardTitle className="capitalize">{courseName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Dish</TableHead>
                            <TableHead>Dietary Warnings</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(dishes).map(([dish, count]) => {
                            // Find guests with this selection who have dietary restrictions
                            const guestsWithDietary = guests.filter(g => 
                              g.foodSelections && 
                              typeof g.foodSelections === 'object' && 
                              Object.values(g.foodSelections).includes(dish) && 
                              g.hasDietaryRequirements
                            );
                            
                            return (
                              <TableRow key={dish}>
                                <TableCell className="font-medium">{dish}</TableCell>
                                <TableCell>
                                  {guestsWithDietary.length > 0 ? (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="destructive" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                                        ⚠️ {guestsWithDietary.length} guest{guestsWithDietary.length > 1 ? 's' : ''}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {guestsWithDietary.map(g => `${g.firstName} ${g.lastName}`).join(', ')}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">None</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge>{count}</Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Course Dialog */}
      <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogDescription>
              Create a new course type (e.g., "Canapés", "Cheese Course")
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="courseName">Course Name</Label>
              <Input
                id="courseName"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="e.g., Canapés"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCourseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCourse}>Continue to Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add/Edit Menu Item Dialog */}
      <Dialog 
        open={isAddItemDialogOpen || !!editingItem} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddItemDialogOpen(false);
            setEditingItem(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <Input
                id="course"
                value={editingItem ? editingItem.course : newItem.course}
                onChange={(e) => editingItem 
                  ? setEditingItem({ ...editingItem, course: e.target.value })
                  : setNewItem({ ...newItem, course: e.target.value })
                }
                placeholder="e.g., Starter"
                list="courses-list"
              />
              <datalist id="courses-list">
                {courses.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Dish Name</Label>
              <Input
                id="name"
                value={editingItem ? editingItem.name : newItem.name}
                onChange={(e) => editingItem
                  ? setEditingItem({ ...editingItem, name: e.target.value })
                  : setNewItem({ ...newItem, name: e.target.value })
                }
                placeholder="e.g., Caesar Salad"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={editingItem ? editingItem.description || "" : newItem.description}
                onChange={(e) => editingItem
                  ? setEditingItem({ ...editingItem, description: e.target.value })
                  : setNewItem({ ...newItem, description: e.target.value })
                }
                placeholder="Brief description of the dish"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddItemDialogOpen(false);
                setEditingItem(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingItem) {
                  updateItemMutation.mutate({
                    id: editingItem.id,
                    name: editingItem.name,
                    description: editingItem.description,
                    isAvailable: editingItem.isAvailable,
                    orderIndex: editingItem.orderIndex,
                  });
                } else {
                  createItemMutation.mutate({
                    eventId,
                    ...newItem,
                  });
                }
              }}
            >
              {editingItem ? "Update" : "Add"} Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EmployeeLayout>
  );
}

interface SortableCourseCardProps {
  courseName: string;
  courseItems: any[];
  deleteCourse: (courseName: string) => void;
  setEditingItem: (item: any) => void;
  deleteItemMutation: any;
}

function SortableCourseCard({
  courseName,
  courseItems,
  deleteCourse,
  setEditingItem,
  deleteItemMutation,
}: SortableCourseCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: courseName });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="cursor-grab active:cursor-grabbing touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            <div>
              <CardTitle className="capitalize">{courseName}</CardTitle>
              <CardDescription>{courseItems.length} items</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteCourse(courseName)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courseItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {item.description || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={item.isAvailable ? "default" : "secondary"}>
                    {item.isAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingItem(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItemMutation.mutate({ id: item.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
