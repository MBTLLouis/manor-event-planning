'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

interface TableGuest {
  guestId: number;
  firstName: string;
  lastName: string;
  seatNumber?: number;
  tableId?: number;
}

interface TableData {
  id: string;
  name: string;
  seatCount: number;
  guests: TableGuest[];
}

export default function CoupleSeatingV2() {
  // Get the couple's event
  const { data: events = [] } = trpc.events.list.useQuery();
  const coupleEvent = events.length > 0 ? events[0] : null;
  const eventId = coupleEvent?.id || 0;

  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedGuests, setSelectedGuests] = useState<Record<string, string>>({});
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editingTableName, setEditingTableName] = useState('');
  const [floorPlanId, setFloorPlanId] = useState<number | undefined>(undefined);
  const [newTableName, setNewTableName] = useState('');
  const [newTableSeatCount, setNewTableSeatCount] = useState(8);

  // Queries
  const eventLoading = false; // Already loaded from events.list
  const { data: eventGuests = [], isLoading: guestsLoading } = trpc.guests.list.useQuery(
    { eventId },
    { enabled: !!eventId }
  );
  const { data: floorPlans = [], isLoading: floorPlansLoading } = trpc.floorPlans.list.useQuery(
    { eventId },
    { enabled: !!eventId }
  );
  const { data: tablesData = [], isLoading: tablesLoading } = trpc.tables.list.useQuery(
    { floorPlanId: floorPlanId || 0 },
    { enabled: !!floorPlanId }
  );

  const isDataLoading = eventLoading || guestsLoading || floorPlansLoading || tablesLoading || !floorPlanId;

  // Table mutations for persistence
  const createTableMutation = trpc.tables.create.useMutation();
  const deleteTableMutation = trpc.tables.delete.useMutation();
  const updateTableMutation = trpc.tables.update.useMutation();
  const createFloorPlanMutation = trpc.floorPlans.create.useMutation();
  const utils = trpc.useUtils();

  // Guest assignment mutations
  const updateGuestMutation = trpc.guests.update.useMutation();
  const createSeatMutation = trpc.seats.create.useMutation();

  // Initialize floor plan and load tables on mount
  useEffect(() => {
    if (floorPlans.length > 0) {
      setFloorPlanId(floorPlans[0].id);
    } else if (eventId && floorPlans.length === 0 && coupleEvent) {
      createFloorPlanMutation.mutate(
        { eventId, name: 'Main Floor' },
        {
          onSuccess: (result) => {
            setFloorPlanId(result.id);
          },
        }
      );
    }
  }, [floorPlans, eventId, coupleEvent]);

  // Convert tables data to local format with guest assignments
  useEffect(() => {
    if (tablesData.length > 0) {
      const convertedTables = tablesData.map((table: any) => ({
        id: table.id.toString(),
        name: table.name,
        seatCount: table.seatCount || 8,
        guests: [],
      }));

      // Load guest assignments from eventGuests
      const tablesWithGuests = convertedTables.map((table) => {
        const tableGuests = eventGuests
          .filter((guest: any) => guest.tableId === parseInt(table.id))
          .sort((a: any, b: any) => (a.seatNumber || 0) - (b.seatNumber || 0))
          .map((guest: any) => ({
            guestId: guest.id,
            firstName: guest.firstName,
            lastName: guest.lastName,
            seatNumber: guest.seatNumber,
            tableId: guest.tableId,
          }));

        return {
          ...table,
          guests: tableGuests,
        };
      });

      setTables(tablesWithGuests);
    }
  }, [tablesData, eventGuests]);

  const handleAddTable = () => {
    if (!newTableName.trim() || !floorPlanId) return;

    createTableMutation.mutate(
      {
        floorPlanId,
        name: newTableName,
        tableType: 'round',
        seatCount: newTableSeatCount,
        positionX: 0,
        positionY: 0,
      },
      {
        onSuccess: (result) => {
          setTables([
            ...tables,
            {
              id: result.id.toString(),
              name: newTableName,
              seatCount: newTableSeatCount,
              guests: [],
            },
          ]);
          setNewTableName('');
          setNewTableSeatCount(8);
          utils.tables.list.invalidate({ floorPlanId });
          toast.success('Table added successfully');
        },
      }
    );
  };

  const handleEditTable = (tableId: string, currentName: string) => {
    setEditingTableId(tableId);
    setEditingTableName(currentName);
  };

  const handleSaveTableName = (tableId: string) => {
    if (!editingTableName.trim()) return;

    const tableIdNum = parseInt(tableId);
    updateTableMutation.mutate(
      {
        id: tableIdNum,
        name: editingTableName,
      },
      {
        onSuccess: () => {
          setTables(
            tables.map((t) =>
              t.id === tableId ? { ...t, name: editingTableName } : t
            )
          );
          setEditingTableId(null);
          utils.tables.list.invalidate({ floorPlanId });
          toast.success('Table updated');
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setEditingTableId(null);
    setEditingTableName('');
  };

  const handleAddGuest = (tableId: string) => {
    const guestIdStr = selectedGuests[tableId];
    if (!guestIdStr) return;

    const guestId = parseInt(guestIdStr);
    const guest = eventGuests.find((g: any) => g.id === guestId);
    if (!guest) return;

    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    const nextSeatNumber = table.guests.length + 1;
    const tableIdNum = parseInt(tableId);

    // First create a seat record
    createSeatMutation.mutate(
      {
        floorPlanId: floorPlanId || 0,
        tableId: tableIdNum,
        seatNumber: nextSeatNumber,
        guestId: guestId,
        positionX: 0,
        positionY: 0,
      },
      {
        onSuccess: (seatResult: any) => {
          // Then update guest with tableId and seatId
          updateGuestMutation.mutate(
            {
              id: guestId,
              tableId: tableIdNum,
              seatId: seatResult?.id,
            },
            {
              onSuccess: () => {
                setTables(
                  tables.map((t) => {
                    if (t.id === tableId) {
                      return {
                        ...t,
                        guests: [
                          ...t.guests,
                          {
                            guestId: guest.id,
                            firstName: guest.firstName,
                            lastName: guest.lastName,
                            seatNumber: nextSeatNumber,
                          },
                        ],
                      };
                    }
                    return t;
                  })
                );
                setSelectedGuests({ ...selectedGuests, [tableId]: '' });
                utils.guests.list.invalidate({ eventId });
                toast.success('Guest assigned to table');
              },
            }
          );
        },
      }
    );
  };

  const handleRemoveGuest = (tableId: string, guestId: number) => {
    // Clear guest table assignment in database
    updateGuestMutation.mutate(
      {
        id: guestId,
        tableId: null,
        seatId: null,
      },
      {
        onSuccess: () => {
          setTables(
            tables.map((table) => {
              if (table.id === tableId) {
                // Remove the guest and renumber remaining seats
                const updatedGuests = table.guests
                  .filter((g) => g.guestId !== guestId)
                  .map((g, index) => ({
                    ...g,
                    seatNumber: index + 1,
                  }));

                return {
                  ...table,
                  guests: updatedGuests,
                };
              }
              return table;
            })
          );
          utils.guests.list.invalidate({ eventId });
          toast.success('Guest removed from table');
        },
      }
    );
  };

  const handleDeleteTable = (tableId: string) => {
    const tableIdNum = parseInt(tableId);
    deleteTableMutation.mutate(
      { id: tableIdNum },
      {
        onSuccess: () => {
          setTables(tables.filter((table) => table.id !== tableId));
          utils.tables.list.invalidate({ floorPlanId: floorPlanId || 0 });
          toast.success('Table deleted');
        },
      }
    );
  };

  const unassignedGuests = eventGuests.filter((g: any) => !g.tableId) || [];

  if (isDataLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading seating plan...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Table Planning</h1>
          <p className="text-muted-foreground">{coupleEvent?.title || 'Your Event'}</p>
        </div>

        {/* Add New Table */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Table</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Table name (e.g., Table 1)"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Seat Count"
              value={newTableSeatCount}
              onChange={(e) => setNewTableSeatCount(parseInt(e.target.value))}
              className="w-24"
            />
            <Button onClick={handleAddTable} className="gap-2">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tables */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Tables</h2>
            {tables.map((table) => (
              <div key={table.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  {editingTableId === table.id ? (
                    <div className="flex gap-2 flex-1">
                      <Input
                        value={editingTableName}
                        onChange={(e) => setEditingTableName(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSaveTableName(table.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="font-semibold">{table.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {table.guests.length}/{table.seatCount} guests
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTable(table.id, table.name)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTable(table.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Guests at Table */}
                <div className="space-y-2 mb-3">
                  {table.guests.map((guest, index) => (
                    <div
                      key={guest.guestId}
                      className="flex items-center justify-between bg-muted p-2 rounded text-sm"
                    >
                      <span>
                        {guest.firstName} {guest.lastName} - Seat {index + 1}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveGuest(table.id, guest.guestId)}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add Guest to Table */}
                {unassignedGuests.length > 0 && (
                  <div className="flex gap-2">
                    <Select
                      value={selectedGuests[table.id] || ''}
                      onValueChange={(value) =>
                        setSelectedGuests({ ...selectedGuests, [table.id]: value })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select guest..." />
                      </SelectTrigger>
                      <SelectContent>
                        {unassignedGuests.map((guest: any) => (
                          <SelectItem key={guest.id} value={guest.id.toString()}>
                            {guest.firstName} {guest.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => handleAddGuest(table.id)} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Guest List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Guest List</h2>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {eventGuests.length} total guests
                </p>
                {eventGuests.map((guest: any) => (
                  <div key={guest.id} className="text-sm p-2 bg-muted rounded">
                    <div className="font-medium">
                      {guest.firstName} {guest.lastName}
                    </div>
                    {guest.tableId ? (
                      <div className="text-xs text-green-600">
                        ✓ Assigned
                      </div>
                    ) : (
                      <div className="text-xs text-amber-600">
                        Not assigned
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
