import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import CoupleLayout from '@/components/CoupleLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CoupleSeating() {
  const { data: events = [] } = trpc.events.list.useQuery();
  const coupleEvent = events[0];

  const { data: floorPlans = [] } = trpc.floorPlans.list.useQuery(
    { eventId: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );

  const [isAddTableDialogOpen, setIsAddTableDialogOpen] = useState(false);
  const [isEditTableDialogOpen, setIsEditTableDialogOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('8');
  const [editingTable, setEditingTable] = useState<any>(null);

  const utils = trpc.useUtils();

  const createTableMutation = trpc.tables.create.useMutation({
    onSuccess: () => {
      toast.success('Table added');
      setIsAddTableDialogOpen(false);
      setNewTableName('');
      setNewTableCapacity('8');
      if (coupleEvent) {
        utils.floorPlans.list.invalidate({ eventId: coupleEvent.id });
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add table');
    },
  });

  const updateTableMutation = trpc.tables.update.useMutation({
    onSuccess: () => {
      toast.success('Table updated');
      setIsEditTableDialogOpen(false);
      setEditingTable(null);
      setNewTableName('');
      setNewTableCapacity('8');
      if (coupleEvent) {
        utils.floorPlans.list.invalidate({ eventId: coupleEvent.id });
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update table');
    },
  });

  const deleteTableMutation = trpc.tables.delete.useMutation({
    onSuccess: () => {
      toast.success('Table deleted');
      if (coupleEvent) {
        utils.floorPlans.list.invalidate({ eventId: coupleEvent.id });
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete table');
    },
  });

  const handleAddTable = () => {
    if (!newTableName.trim()) {
      toast.error('Please enter a table name');
      return;
    }

    if (!coupleEvent) {
      toast.error('Event not found');
      return;
    }

    const floorPlanId = floorPlans[0]?.id || 1;

    createTableMutation.mutate({
      floorPlanId,
      name: newTableName,
      tableType: 'round',
      seatCount: parseInt(newTableCapacity),
      positionX: 0,
      positionY: 0,
    });
  };

  const handleEditTable = () => {
    if (!newTableName.trim()) {
      toast.error('Please enter a table name');
      return;
    }

    updateTableMutation.mutate({
      id: editingTable.id,
      name: newTableName,
    });
  };

  const openEditDialog = (table: any) => {
    setEditingTable(table);
    setNewTableName(table.name);
    setNewTableCapacity(table.seatCount?.toString() || '8');
    setIsEditTableDialogOpen(true);
  };

  // Get all tables from all floor plans
  const allTables = floorPlans.flatMap((plan: any) => 
    (plan.tables || []).map((table: any) => ({
      ...table,
      floorPlanName: plan.name,
    }))
  );

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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2">Table Planning</h1>
            <p className="text-gray-600">Organize your seating arrangement</p>
          </div>
          <Dialog open={isAddTableDialogOpen} onOpenChange={setIsAddTableDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#2C5F5D] hover:bg-[#1e4441]">
                <Plus className="w-4 h-4 mr-2" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
                <DialogDescription>Create a new table for your event</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="tableName">Table Name</Label>
                  <Input
                    id="tableName"
                    placeholder="e.g., Table 1, VIP Table, Family Table"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    max="20"
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTable} className="bg-[#2C5F5D] hover:bg-[#1e4441]">
                  Add Table
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {allTables.length === 0 ? (
          <Card className="bg-gray-50">
            <CardContent className="py-12 text-center">
              <p className="text-lg text-gray-600 mb-2">No tables yet</p>
              <p className="text-sm text-muted-foreground">Add tables to start planning your seating arrangement</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Tables ({allTables.length})</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Table Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Capacity</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allTables.map((table: any) => (
                    <tr key={table.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{table.name}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{table.seatCount || 8} seats</Badge>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(table)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTableMutation.mutate({ id: table.id })}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Table Dialog */}
        <Dialog open={isEditTableDialogOpen} onOpenChange={setIsEditTableDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Table</DialogTitle>
              <DialogDescription>Update table details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editTableName">Table Name</Label>
                <Input
                  id="editTableName"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleEditTable} className="bg-[#2C5F5D] hover:bg-[#1e4441]">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CoupleLayout>
  );
}
