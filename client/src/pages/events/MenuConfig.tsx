import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import EmployeeLayout from "@/components/EmployeeLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, GripVertical, X } from "lucide-react";
import { toast } from "sonner";

export default function MenuConfig() {
  const params = useParams();
  const eventId = Number(params.id);
  
  const [activeTab, setActiveTab] = useState<string>("starter");
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [itemFormData, setItemFormData] = useState({
    name: "",
    description: "",
  });
  
  const [newCourseName, setNewCourseName] = useState("");
  
  const { data: menuItems = [], refetch } = trpc.menu.list.useQuery({ eventId });
  
  // Get unique courses from menu items
  const courses = useMemo(() => {
    const courseSet = new Set(menuItems.map(item => item.course));
    return Array.from(courseSet).sort();
  }, [menuItems]);
  
  // Ensure activeTab is valid
  useState(() => {
    if (courses.length > 0 && !courses.includes(activeTab)) {
      setActiveTab(courses[0]);
    }
  });
  
  const createMutation = trpc.menu.create.useMutation({
    onSuccess: () => {
      toast.success("Menu item added successfully");
      setIsAddItemDialogOpen(false);
      setItemFormData({ name: "", description: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to add menu item: ${error.message}`);
    },
  });
  
  const updateMutation = trpc.menu.update.useMutation({
    onSuccess: () => {
      toast.success("Menu item updated successfully");
      setIsEditItemDialogOpen(false);
      setEditingItem(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update menu item: ${error.message}`);
    },
  });
  
  const deleteMutation = trpc.menu.delete.useMutation({
    onSuccess: () => {
      toast.success("Menu item deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete menu item: ${error.message}`);
    },
  });
  
  const handleAddItem = () => {
    if (!itemFormData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    
    const courseItems = menuItems.filter(item => item.course === activeTab);
    const maxOrder = courseItems.reduce((max, item) => Math.max(max, item.orderIndex), -1);
    
    createMutation.mutate({
      eventId,
      course: activeTab,
      name: itemFormData.name,
      description: itemFormData.description || null,
      orderIndex: maxOrder + 1,
    });
  };
  
  const handleEditItem = () => {
    if (!editingItem) return;
    
    updateMutation.mutate({
      id: editingItem.id,
      name: itemFormData.name,
      description: itemFormData.description || null,
    });
  };
  
  const handleDeleteItem = (id: number) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      deleteMutation.mutate({ id });
    }
  };
  
  const handleAddCourse = () => {
    if (!newCourseName.trim()) {
      toast.error("Course name is required");
      return;
    }
    
    if (courses.includes(newCourseName.toLowerCase())) {
      toast.error("Course already exists");
      return;
    }
    
    // Create a placeholder item for the new course
    createMutation.mutate({
      eventId,
      course: newCourseName.toLowerCase(),
      name: "Example Item",
      description: "Replace this with actual menu items",
      orderIndex: 0,
    });
    
    setIsAddCourseDialogOpen(false);
    setNewCourseName("");
    setActiveTab(newCourseName.toLowerCase());
  };
  
  const handleDeleteCourse = (courseName: string) => {
    const courseItems = menuItems.filter(item => item.course === courseName);
    
    if (confirm(`Delete "${courseName}" course and all ${courseItems.length} items in it?`)) {
      // Delete all items in this course
      courseItems.forEach(item => {
        deleteMutation.mutate({ id: item.id });
      });
      
      // Switch to first remaining course
      const remainingCourses = courses.filter(c => c !== courseName);
      if (remainingCourses.length > 0) {
        setActiveTab(remainingCourses[0]);
      }
    }
  };
  
  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      description: item.description || "",
    });
    setIsEditItemDialogOpen(true);
  };
  
  const renderMenuItems = (courseName: string) => {
    const items = menuItems.filter(item => item.course === courseName);
    
    return (
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No items added yet</p>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">{item.name}</h4>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };
  
  return (
    <EmployeeLayout>
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Menu Configuration</h1>
            <p className="text-muted-foreground mt-1">
              Manage courses and food choices for guest selection
            </p>
          </div>
          <Button onClick={() => setIsAddCourseDialogOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>
        
        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No courses configured yet</p>
              <Button onClick={() => setIsAddCourseDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <TabsList className="flex-wrap h-auto">
                {courses.map((course) => {
                  const itemCount = menuItems.filter(item => item.course === course).length;
                  return (
                    <TabsTrigger key={course} value={course} className="relative group">
                      <span className="capitalize">{course}</span>
                      <span className="ml-2 text-xs">({itemCount})</span>
                      {courses.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course);
                          }}
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              
              <Button onClick={() => setIsAddItemDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            
            {courses.map((course) => (
              <TabsContent key={course} value={course} className="space-y-4">
                {renderMenuItems(course)}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
      
      {/* Add Course Dialog */}
      <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogDescription>
              Create a custom course (e.g., "Canapés", "Cheese", "Coffee")
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="courseName">Course Name *</Label>
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
            <Button onClick={handleAddCourse}>
              Add Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Item Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item to {activeTab}</DialogTitle>
            <DialogDescription>
              Add a new menu option for guests to select
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={itemFormData.name}
                onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                placeholder="e.g., Grilled Salmon"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={itemFormData.description}
                onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                placeholder="Brief description of the dish"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Item Dialog */}
      <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Update the name and description
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={itemFormData.name}
                onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={itemFormData.description}
                onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditItem} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EmployeeLayout>
  );
}
