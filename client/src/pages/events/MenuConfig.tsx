import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import EmployeeLayout from "@/components/EmployeeLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

export default function MenuConfig() {
  const params = useParams();
  const eventId = Number(params.id);
  
  const [activeTab, setActiveTab] = useState<"starter" | "main" | "dessert">("starter");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  
  const { data: menuItems = [], refetch } = trpc.menu.list.useQuery({ eventId });
  
  const createMutation = trpc.menu.create.useMutation({
    onSuccess: () => {
      toast.success("Menu item added successfully");
      setIsAddDialogOpen(false);
      setFormData({ name: "", description: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to add menu item: ${error.message}`);
    },
  });
  
  const updateMutation = trpc.menu.update.useMutation({
    onSuccess: () => {
      toast.success("Menu item updated successfully");
      setIsEditDialogOpen(false);
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
  
  const handleAdd = () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    
    const maxOrder = menuItems
      .filter(item => item.course === activeTab)
      .reduce((max, item) => Math.max(max, item.orderIndex), -1);
    
    createMutation.mutate({
      eventId,
      course: activeTab,
      name: formData.name,
      description: formData.description || null,
      orderIndex: maxOrder + 1,
    });
  };
  
  const handleEdit = () => {
    if (!editingItem) return;
    
    updateMutation.mutate({
      id: editingItem.id,
      name: formData.name,
      description: formData.description || null,
    });
  };
  
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      deleteMutation.mutate({ id });
    }
  };
  
  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
    });
    setIsEditDialogOpen(true);
  };
  
  const starters = menuItems.filter(item => item.course === "starter");
  const mains = menuItems.filter(item => item.course === "main");
  const desserts = menuItems.filter(item => item.course === "dessert");
  
  const renderMenuItems = (items: any[]) => (
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
                  onClick={() => handleDelete(item.id)}
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
  
  return (
    <EmployeeLayout>
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Menu Configuration</h1>
            <p className="text-muted-foreground mt-1">
              Manage food choices that appear in guest selection dropdowns
            </p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="starter">
                Starters ({starters.length})
              </TabsTrigger>
              <TabsTrigger value="main">
                Mains ({mains.length})
              </TabsTrigger>
              <TabsTrigger value="dessert">
                Desserts ({desserts.length})
              </TabsTrigger>
            </TabsList>
            
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          <TabsContent value="starter" className="space-y-4">
            {renderMenuItems(starters)}
          </TabsContent>
          
          <TabsContent value="main" className="space-y-4">
            {renderMenuItems(mains)}
          </TabsContent>
          
          <TabsContent value="dessert" className="space-y-4">
            {renderMenuItems(desserts)}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</DialogTitle>
            <DialogDescription>
              Add a new {activeTab} option for guests to select
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={`e.g., ${activeTab === 'starter' ? 'Soup of the Day' : activeTab === 'main' ? 'Grilled Salmon' : 'Chocolate Cake'}`}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the dish"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EmployeeLayout>
  );
}
