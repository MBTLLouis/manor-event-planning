import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import CoupleLayout from '@/components/CoupleLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

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

export default function CoupleSeatingV2() {
  const params = useParams();
  const eventId = Number(params.id);
  const [, setLocation] = useLocation();

  const { data: event } = trpc.events.getById.useQuery({ id: eventId });
  const { data: eventGuests = [] } = trpc.guests.list.useQuery({ eventId });

  const [tables, setTables] = useState<Table[]>([]);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('8');
  const [selectedGuests, setSelectedGuests] = useState<Record<string, string>>({});

  // Track which guests are already assigned
  const assignedGuestIds = new Set(
    tables.flatMap((table) => table.guests.map((g) => g.guestId))
  );
  const unassignedGuests = eventGuests.filter(
    (guest: any) => !assignedGuestIds.has(guest.id)
  );

  const handleAddTable = () => {
    if (!newTableName.trim()) return;

    const newTable: Table = {
      id: Date.now().toString(),
      name: newTableName,
      capacity: parseInt(newTableCapacity) || 8,
      guests: [],
    };

    setTables([...tables, newTable]);
    setNewTableName('');
    setNewTableCapacity('8');
  };

  const handleAddGuest = (tableId: string) => {
    const guestIdStr = selectedGuests[tableId];
    if (!guestIdStr) return;

    const guestId = parseInt(guestIdStr);
    const guest = eventGuests.find((g: any) => g.id === guestId);
    if (!guest) return;

    setTables(
      tables.map((table) => {
        if (table.id === tableId) {
          const nextSeatNumber = table.guests.length + 1;
          return {
            ...table,
            guests: [
              ...table.guests,
              {
                guestId: guest.id,
                firstName: guest.firstName,
                lastName: guest.lastName,
                seatNumber: nextSeatNumber,
              },
            ],
          };
        }
        return table;
      })
    );

    setSelectedGuests({ ...selectedGuests, [tableId]: '' });
  };

  const handleRemoveGuest = (tableId: string, guestId: number) => {
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
  };

  const handleDeleteTable = (tableId: string) => {
    setTables(tables.filter((table) => table.id !== tableId));
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
    <CoupleLayout>
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setLocation(`/events/${eventId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </Button>
          <h1 className="text-3xl font-serif font-bold mt-2">Table Planning</h1>
          <p className="text-muted-foreground">{event?.title}</p>
        </div>

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
                  />
                  <Input
                    type="number"
                    placeholder="Capacity"
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(e.target.value)}
                    className="w-24"
                    min="1"
                    max="20"
                  />
                  <Button
                    onClick={handleAddTable}
                    className="bg-teal-600 hover:bg-teal-700"
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
                          <div className="flex gap-2 pt-2 border-t">
                            <Select
                              value={selectedGuests[table.id] || ''}
                              onValueChange={(value) =>
                                setSelectedGuests({
                                  ...selectedGuests,
                                  [table.id]: value,
                                })
                              }
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Select guest" />
                              </SelectTrigger>
                              <SelectContent>
                                {unassignedGuests.map((guest: any) => (
                                  <SelectItem key={guest.id} value={guest.id.toString()}>
                                    {guest.firstName} {guest.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() => handleAddGuest(table.id)}
                              className="bg-teal-600 hover:bg-teal-700"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
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
    </CoupleLayout>
  );
}
