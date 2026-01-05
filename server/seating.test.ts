import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "employee",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("Seating Plan - Guest Assignment to Tables", () => {
  let eventId: number;
  let floorPlanId: number;
  let tableId: number;
  let ctx: TrpcContext;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(async () => {
    ctx = createAuthContext(1);
    caller = appRouter.createCaller(ctx);

    // Create a test event
    const event = await caller.events.create({
      title: "Test Wedding",
      coupleName1: "John",
      coupleName2: "Jane",
      eventDate: "2025-06-15T00:00:00Z",
      eventCode: `TEST-${Date.now()}`,
    });
    eventId = event.id;

    // Get or create floor plan
    const floorPlans = await caller.floorPlans.list({ eventId });
    floorPlanId = floorPlans[0]?.id || 1;

    // Create a table
    const table = await caller.tables.create({
      floorPlanId,
      name: "Table 1",
      tableType: "round",
      seatCount: 8,
      positionX: 0,
      positionY: 0,
    });
    tableId = table.id;
  });

  it("assigns a guest to a table", async () => {
    // Create a guest
    const guest = await caller.guests.create({
      eventId,
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      email: "john@example.com",
    });

    // Assign guest to table
    const updated = await caller.guests.update({
      id: guest.id,
      tableId,
    });

    expect(updated).toBeDefined();
    expect(updated?.tableId).toBe(tableId);
  });

  it("retrieves guests assigned to a table", async () => {
    // Create and assign a guest
    const guest = await caller.guests.create({
      eventId,
      firstName: "Jane",
      lastName: "Smith",
      name: "Jane Smith",
      email: "jane@example.com",
    });

    await caller.guests.update({
      id: guest.id,
      tableId,
    });

    // Get all guests
    const guests = await caller.guests.list({ eventId });
    const assignedGuest = guests.find((g: any) => g.id === guest.id);

    expect(assignedGuest).toBeDefined();
    expect(assignedGuest?.tableId).toBe(tableId);
  });

  it("retrieves unassigned guests", async () => {
    // Create two guests
    const guest1 = await caller.guests.create({
      eventId,
      firstName: "Guest",
      lastName: "One",
      name: "Guest One",
      email: "guest1@example.com",
    });

    const guest2 = await caller.guests.create({
      eventId,
      firstName: "Guest",
      lastName: "Two",
      name: "Guest Two",
      email: "guest2@example.com",
    });

    // Assign only first guest
    await caller.guests.update({
      id: guest1.id,
      tableId,
    });

    // Get all guests
    const guests = await caller.guests.list({ eventId });
    const unassigned = guests.filter((g: any) => !g.tableId);

    expect(unassigned.length).toBeGreaterThan(0);
    expect(unassigned.some((g: any) => g.id === guest2.id)).toBe(true);
  });

  it("handles multiple guests assigned to same table", async () => {
    // Create three guests
    const guest1 = await caller.guests.create({
      eventId,
      firstName: "Guest",
      lastName: "One",
      name: "Guest One",
      email: "guest1@example.com",
    });

    const guest2 = await caller.guests.create({
      eventId,
      firstName: "Guest",
      lastName: "Two",
      name: "Guest Two",
      email: "guest2@example.com",
    });

    const guest3 = await caller.guests.create({
      eventId,
      firstName: "Guest",
      lastName: "Three",
      name: "Guest Three",
      email: "guest3@example.com",
    });

    // Assign all three guests to the same table
    await caller.guests.update({
      id: guest1.id,
      tableId,
    });

    await caller.guests.update({
      id: guest2.id,
      tableId,
    });

    await caller.guests.update({
      id: guest3.id,
      tableId,
    });

    // Verify all three are assigned
    const guests = await caller.guests.list({ eventId });
    const assignedToTable = guests.filter((g: any) => g.tableId === tableId);
    expect(assignedToTable.length).toBe(3);
  });
});
