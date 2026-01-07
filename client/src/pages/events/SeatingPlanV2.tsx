import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import EmployeeLayout from '@/components/EmployeeLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  tableId?: string;
  seatNumber?: number;
}

interface TableGuest {
  guestId: number;
  firstName: string;
  lastName: string;
  seatNumber: number;
}

interface Table {
  id: string;
  name: string;
  capacity: number;
  guests: TableGuest[];
}

export default function SeatingPlanV2() {
  const params = useParams();
  const eventId = Number(params.id);
  const [, setLocation] = useLocation();

  const { data: event, isLoading: eventLoading } = trpc.events.getById.useQuery({ id: eventId });
  const { data: eventGuests = [], isLoading: guestsLoading } = trpc.guests.list.useQuery({ eventId }, { enabled: !!eventId });

  const [tables, setTables] = useState<Table[]>([]);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('8');
  const [selectedGuests, setSelectedGuests] = useState<Record<string, string>>({});
  const [guestSearchQueries, setGuestSearchQueries] = useState<Record<string, string>>({});

  // Track which guests are already assigned
  const assignedGuestIds = new Set(
    tables.flatMap((table) => table.guests.map((g) => g.guestId))
  );
  const unassignedGuests = eventGuests.filter(
    (guest: any) => !assignedGuestIds.has(guest.id)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'unsaved' | 'saving'>('idle');
  const [floorPlanId, setFloorPlanId] = useState<number | null>(null);

  // Get or create floor plan
  const { data: floorPlans = [], isLoading: floorPlansLoading } = trpc.floorPlans.list.useQuery({ eventId }, { enabled: !!eventId });
  const createFloorPlanMutation = trpc.floorPlans.create.useMutation();
  
  // Load saved tables from database
  const { data: savedTables = [], isLoading: tablesLoading } = trpc.tables.list.useQuery(
    { floorPlanId: floorPlanId || 0 },
    { enabled: !!floorPlanId }
  );

  // Table mutations for persistence
  const createTableMutation = trpc.tables.create.useMutation();
  const deleteTableMutation = trpc.tables.delete.useMutation();
  const updateTableMutation = trpc.tables.update.useMutation();
  const updateGuestMutation = trpc.guests.update.useMutation();
  const utils = trpc.useUtils();
  
  // Check if all data is loaded
  const isDataLoading = eventLoading || guestsLoading || floorPlansLoading || tablesLoading || !floorPlanId;

  // Initialize floor plan and load tables on mount
  useEffect(() => {
    if (floorPlans.length > 0) {
      setFloorPlanId(floorPlans[0].id);
      // Convert saved tables to in-memory format
      const convertedTables = savedTables.map(table => ({
        id: table.id.toString(),
        name: table.name,
        capacity: table.seatCount,
        guests: [] // TODO: Load guest assignments from database
      }));
      if (convertedTables.length > 0) {
        setTables(convertedTables);
        setSaveStatus('saved');
      }
    } else if (eventId && floorPlans.length === 0) {
      // Create default floor plan if none exists
      createFloorPlanMutation.mutate(
        { eventId, name: 'Main Floor' },
        {
          onSuccess: (result) => {
            setFloorPlanId(result.id);
          }
        }
      );
    }
  }, [floorPlans, eventId]);

  // Track unsaved changes
  useEffect(() => {
    if (tables.length > 0 && saveStatus !== 'saving') {
      setSaveStatus('unsaved');
    }
  }, [tables]);

  const handleAddTable = () => {
    if (!newTableName.trim() || !floorPlanId) return;

    const capacity = parseInt(newTableCapacity) || 8;

    createTableMutation.mutate(
      {
        floorPlanId,
        name: newTableName,
        tableType: 'round',
        seatCount: capacity,
        positionX: 0,
        positionY: 0,
      },
      {
        onSuccess: () => {
          utils.tables.list.invalidate({ floorPlanId: floorPlanId || 0 });
          setNewTableName('');
          setNewTableCapacity('8');
          toast.success('Table added');
        },
      }
    );
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

    updateGuestMutation.mutate(
      {
        id: guestId,
        tableId: tableIdNum,
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
  };

  const handleRemoveGuest = (tableId: string, guestId: number) => {
    updateGuestMutation.mutate(
      {
        id: guestId,
        tableId: null,
      },
      {
        onSuccess: () => {
          setTables(
            tables.map((table) => {
              if (table.id === tableId) {
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

  // Get seating info for a guest
  const getGuestSeatingInfo = (guestId: number) => {
    for (const table of tables) {
      const guest = table.guests.find((g) => g.guestId === guestId);
      if (guest) {
        return { table: table.name, seat: guest.seatNumber };
      }
    }
    return null;
  };

  return (
    <EmployeeLayout>
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setLocation(`/events/${eventId}`)} disabled={isDataLoading}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </Button>
          <h1 className="text-3xl font-serif font-bold mt-2">Table Planning</h1>
          <p className="text-muted-foreground">{event?.title}</p>
        </div>
        
        {isDataLoading && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="py-8 flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <p className="text-blue-700 font-medium">Loading table planning data...</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Add Table Section */}
            <Card className="bg-teal-50 border-teal-200">
              <CardHeader>
                <CardTitle className="text-lg">Add New Table</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Table name (e.g., Table 1)"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTable()}
                    disabled={isDataLoading}
                  />
                  <Input
                    type="number"
                    placeholder="Capacity"
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(e.target.value)}
                    className="w-24"
                    min="1"
                    max="20"
                    disabled={isDataLoading}
                  />
                  <Button
                    onClick={handleAddTable}
                    className="bg-teal-600 hover:bg-teal-700"
                    disabled={isDataLoading}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tables Display */}
            {tables.length === 0 ? (
              <Card className="bg-gray-50">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600">No tables yet. Add a table to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tables.map((table) => {
                  const occupancy = table.guests.length;
                  const isFull = occupancy >= table.capacity;

                  return (
                    <Card key={table.id} className={isFull ? 'opacity-75' : ''}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{table.name}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTable(table.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600">
                          {occupancy}/{table.capacity} guests
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isFull ? 'bg-red-500' : 'bg-teal-500'
                            }`}
                            style={{
                              width: `${Math.min((occupancy / table.capacity) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Guest List */}
                        <div className="space-y-2">
                          {table.guests.length === 0 ? (
                            <p className="text-xs text-gray-500">No guests assigned</p>
                          ) : (
                            table.guests.map((guest) => (
                              <div
                                key={guest.guestId}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {guest.firstName} {guest.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500">Seat {guest.seatNumber}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveGuest(table.id, guest.guestId)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Add Guest Selection */}
                        {!isFull && unassignedGuests.length > 0 && (
                          <div className="space-y-2 pt-2 border-t">
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Search guest..."
                                value={guestSearchQueries[table.id] || ''}
                                onChange={(e) =>
                                  setGuestSearchQueries({
                                    ...guestSearchQueries,
                                    [table.id]: e.target.value,
                                  })
                                }
                                className="pl-8 text-sm"
                              />
                            </div>
                            {(guestSearchQueries[table.id] || unassignedGuests.length > 0) && (
                              <div className="border rounded-md max-h-48 overflow-y-auto">
                                {unassignedGuests
                                  .filter((guest: any) => {
                                    const query = guestSearchQueries[table.id] || '';
                                    return (
                                      !query ||
                                      `${guest.firstName} ${guest.lastName}`
                                        .toLowerCase()
                                        .includes(query.toLowerCase())
                                    );
                                  })
                                  .map((guest: any) => (
                                    <button
                                      key={guest.id}
                                      onClick={() => {
                                        setSelectedGuests({
                                          ...selectedGuests,
                                          [table.id]: guest.id.toString(),
                                        });
                                        setGuestSearchQueries({
                                          ...guestSearchQueries,
                                          [table.id]: '',
                                        });
                                        handleAddGuest(table.id);
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0 transition-colors text-sm"
                                    >
                                      {guest.firstName} {guest.lastName}
                                    </button>
                                  ))}
                                {guestSearchQueries[table.id] &&
                                  unassignedGuests.filter((guest: any) =>
                                    `${guest.firstName} ${guest.lastName}`
                                      .toLowerCase()
                                      .includes(guestSearchQueries[table.id].toLowerCase())
                                  ).length === 0 && (
                                    <div className="px-3 py-2 text-sm text-gray-500">
                                      No guests found
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Guest List Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Guest List</CardTitle>
                <p className="text-xs text-gray-600 mt-1">
                  {eventGuests.length} total guests
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {eventGuests.map((guest: any) => {
                    const seatingInfo = getGuestSeatingInfo(guest.id);
                    return (
                      <div
                        key={guest.id}
                        className={`p-2 rounded border text-sm ${
                          seatingInfo
                            ? 'bg-teal-50 border-teal-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <p className="font-medium">
                          {guest.firstName} {guest.lastName}
                        </p>
                        {seatingInfo ? (
                          <p className="text-xs text-teal-700">
                            📍 {seatingInfo.table} • Seat {seatingInfo.seat}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500">Not assigned</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
