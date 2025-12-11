import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Circle, Square } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import EmployeeLayout from "@/components/EmployeeLayout";
import { toast } from "sonner";

export default function FloorPlans() {
  const [, params] = useRoute("/events/:id/floor-plans");
  const [, setLocation] = useLocation();
  const eventId = params?.id ? parseInt(params.id) : 0;

  const [isCreatePlanDialogOpen, setIsCreatePlanDialogOpen] = useState(false);
  const [isAddTableDialogOpen, setIsAddTableDialogOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newTable, setNewTable] = useState({
    name: "",
    tableType: "round" as "round" | "rectangular",
    seatCount: 8,
  });

  const { data: event } = trpc.events.getById.useQuery({ id: eventId });
  const { data: floorPlans } = trpc.floorPlans.list.useQuery({ eventId });
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const { data: selectedPlan } = trpc.floorPlans.getById.useQuery(
    { id: selectedPlanId! },
    { enabled: selectedPlanId !== null }
  );

  const utils = trpc.useUtils();
  const createFloorPlanMutation = trpc.floorPlans.create.useMutation({
    onSuccess: (data) => {
      toast.success("Floor plan created!");
      setIsCreatePlanDialogOpen(false);
      setNewPlanName("");
      setSelectedPlanId(data.id);
      utils.floorPlans.list.invalidate({ eventId });
    },
  });

  const createTableMutation = trpc.tables.create.useMutation({
    onSuccess: () => {
      toast.success("Table added!");
      setIsAddTableDialogOpen(false);
      setNewTable({ name: "", tableType: "round", seatCount: 8 });
      if (selectedPlanId) {
        utils.floorPlans.getById.invalidate({ id: selectedPlanId });
      }
    },
  });

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    createFloorPlanMutation.mutate({
      eventId,
      name: newPlanName,
      orderIndex: (floorPlans?.length || 0) + 1,
    });
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;

    const randomX = Math.floor(Math.random() * 400) + 50;
    const randomY = Math.floor(Math.random() * 300) + 50;

    createTableMutation.mutate({
      floorPlanId: selectedPlanId,
      ...newTable,
      positionX: randomX,
      positionY: randomY,
    });
  };

  // Auto-select first plan if available
  if (floorPlans && floorPlans.length > 0 && selectedPlanId === null) {
    setSelectedPlanId(floorPlans[0].id);
  }

  return (
    <EmployeeLayout>
      <div className="p-8">
        <Button variant="ghost" className="mb-6" onClick={() => setLocation(`/events/${eventId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{event?.title}</h1>
          <p className="text-lg text-muted-foreground">Floor Plan Designer</p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          {floorPlans && floorPlans.length > 0 ? (
            <Tabs value={selectedPlanId?.toString()} onValueChange={(v) => setSelectedPlanId(parseInt(v))} className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  {floorPlans.map((plan) => (
                    <TabsTrigger key={plan.id} value={plan.id.toString()}>
                      {plan.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <div className="flex gap-2">
                  <Dialog open={isCreatePlanDialogOpen} onOpenChange={setIsCreatePlanDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        New Plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handleCreatePlan}>
                        <DialogHeader>
                          <DialogTitle>Create Floor Plan</DialogTitle>
                          <DialogDescription>Add a new floor plan layout</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="plan-name">Plan Name</Label>
                            <Input
                              id="plan-name"
                              placeholder="e.g., Reception Hall"
                              value={newPlanName}
                              onChange={(e) => setNewPlanName(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Create Plan</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isAddTableDialogOpen} onOpenChange={setIsAddTableDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Table
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handleAddTable}>
                        <DialogHeader>
                          <DialogTitle>Add Table</DialogTitle>
                          <DialogDescription>Add a new table to the floor plan</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="table-name">Table Name</Label>
                            <Input
                              id="table-name"
                              placeholder="e.g., Table 1"
                              value={newTable.name}
                              onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="table-type">Table Type</Label>
                            <Select
                              value={newTable.tableType}
                              onValueChange={(value: any) => setNewTable({ ...newTable, tableType: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="round">Round</SelectItem>
                                <SelectItem value="rectangular">Rectangular</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="seat-count">Seat Count</Label>
                            <Input
                              id="seat-count"
                              type="number"
                              min="2"
                              max="20"
                              value={newTable.seatCount}
                              onChange={(e) => setNewTable({ ...newTable, seatCount: parseInt(e.target.value) })}
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Add Table</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Seat
                  </Button>
                </div>
              </div>

              {floorPlans.map((plan) => (
                <TabsContent key={plan.id} value={plan.id.toString()}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Floor Plan Canvas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border-2 border-dashed border-border rounded-lg bg-secondary/20 p-8 min-h-[500px] relative"
                           style={{ backgroundImage: 'radial-gradient(circle, #ccc 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                        {selectedPlan?.tables?.map((table) => (
                          <div
                            key={table.id}
                            className="absolute bg-primary/20 border-2 border-primary rounded-lg p-4 cursor-move hover:shadow-lg transition-shadow"
                            style={{
                              left: `${table.positionX}px`,
                              top: `${table.positionY}px`,
                              width: table.tableType === "round" ? "120px" : "160px",
                              height: table.tableType === "round" ? "120px" : "80px",
                            }}
                          >
                            <div className="flex flex-col items-center justify-center h-full">
                              {table.tableType === "round" ? (
                                <Circle className="w-8 h-8 text-primary mb-2" />
                              ) : (
                                <Square className="w-8 h-8 text-primary mb-2" />
                              )}
                              <p className="text-xs font-semibold text-center">{table.name}</p>
                              <p className="text-xs text-muted-foreground">{table.seatCount} seats</p>
                            </div>
                          </div>
                        ))}
                        {(!selectedPlan?.tables || selectedPlan.tables.length === 0) && (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">Click "Add Table" to start designing your floor plan</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Table Overview */}
                  {selectedPlan?.tables && selectedPlan.tables.length > 0 && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Table Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {selectedPlan.tables.map((table) => (
                            <Card key={table.id}>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">{table.name}</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {table.tableType === "round" ? "Round Table" : "Rectangular Table"}
                                </p>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm mb-3">
                                  <span className="font-medium">0 / {table.seatCount}</span> seats filled
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                  {Array.from({ length: table.seatCount }).map((_, idx) => (
                                    <div
                                      key={idx}
                                      className="aspect-square rounded-lg bg-secondary flex items-center justify-center text-xs cursor-pointer hover:bg-secondary/70"
                                    >
                                      {idx + 1}
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <Card className="flex-1">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground mb-4">No floor plans created yet</p>
                <Dialog open={isCreatePlanDialogOpen} onOpenChange={setIsCreatePlanDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Floor Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleCreatePlan}>
                      <DialogHeader>
                        <DialogTitle>Create Floor Plan</DialogTitle>
                        <DialogDescription>Add a new floor plan layout</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="plan-name">Plan Name</Label>
                          <Input
                            id="plan-name"
                            placeholder="e.g., Reception Hall"
                            value={newPlanName}
                            onChange={(e) => setNewPlanName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Create Plan</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}
