import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import EmployeeLayout from '@/components/EmployeeLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SeatingPlan() {
  const params = useParams();
  const eventId = Number(params.id);
  const [, setLocation] = useLocation();

  const { data: event } = trpc.events.getById.useQuery({ id: eventId });
  const { data: floorPlans = [] } = trpc.floorPlans.list.useQuery({ eventId });

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
      utils.floorPlans.list.invalidate({ eventId });
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
      utils.floorPlans.list.invalidate({ eventId });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update table');
    },
  });

  const deleteTableMutation = trpc.tables.delete.useMutation({
    onSuccess: () => {
      toast.success('Table deleted');
      utils.floorPlans.list.invalidate({ eventId });
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

  return (
    <EmployeeLayout>
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="ghost" onClick={() => setLocation(`/events/${eventId}`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Event
            </Button>
            <h1 className="text-3xl font-serif font-bold mt-2">Table Planning</h1>
            <p className="text-muted-foreground">{event?.title}</p>
          </div>
          <Dialog open={isAddTableDialogOpen} onOpenChange={setIsAddTableDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700">
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
                <Button onClick={handleAddTable} className="bg-teal-600 hover:bg-teal-700">
                  Add Table
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {allTables.length === 0 ? (
          <Card className="bg-muted">
            <CardContent className="py-12 text-center">
              <p className="text-lg text-gray-600 mb-2">No tables yet</p>
              <p className="text-sm text-muted-foreground">Add tables to start planning your seating</p>
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
                    <th className="text-left py-3 px-4 font-semibold">Floor Plan</th>
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
                      <td className="py-3 px-4 text-sm text-muted-foreground">{table.floorPlanName}</td>
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
              <Button onClick={handleEditTable} className="bg-teal-600 hover:bg-teal-700">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </EmployeeLayout>
  );
}
