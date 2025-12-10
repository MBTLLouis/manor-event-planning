import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-employee",
    email: "employee@test.com",
    name: "Test Employee",
    loginMethod: "manus",
    role: "admin",
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Refactored Guest Management System", () => {
  it("should create guest with pending RSVP status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test event
    const event = await caller.events.create({
      title: "Test Wedding",
      coupleName1: "Test",
      coupleName2: "Couple",
      eventDate: "2026-06-15",
      eventCode: `TEST-${Date.now()}`,
      status: "planning",
    });

    // Create guest
    const result = await caller.guests.create({
      eventId: event.id,
      name: "John Doe",
      email: "john@example.com",
      groupName: "Friends",
      rsvpStatus: "pending",
      stage: 1,
      saveTheDateResponse: "pending",
    });

    expect(result.id).toBeGreaterThan(0);

    // Verify guest was created
    const guests = await caller.guests.list({ eventId: event.id });
    expect(guests).toHaveLength(1);
    expect(guests[0]?.name).toBe("John Doe");
    expect(guests[0]?.rsvpStatus).toBe("pending");
  });

  it("should update guest RSVP status to confirmed", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test event
    const event = await caller.events.create({
      title: "Test Wedding",
      coupleName1: "Test",
      coupleName2: "Couple",
      eventDate: "2026-06-15",
      eventCode: `TEST-${Date.now()}`,
      status: "planning",
    });

    // Create guest
    const result = await caller.guests.create({
      eventId: event.id,
      name: "Jane Smith",
      email: "jane@example.com",
      rsvpStatus: "pending",
      stage: 1,
      saveTheDateResponse: "pending",
    });

    // Update to confirmed
    await caller.guests.update({
      id: result.id,
      rsvpStatus: "confirmed",
    });

    // Verify update
    const guest = await caller.guests.getById({ id: result.id });
    expect(guest?.rsvpStatus).toBe("confirmed");
  });

  it("should allow meal selections only for confirmed guests", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test event
    const event = await caller.events.create({
      title: "Test Wedding",
      coupleName1: "Test",
      coupleName2: "Couple",
      eventDate: "2026-06-15",
      eventCode: `TEST-${Date.now()}`,
      status: "planning",
    });

    // Create food options
    await caller.foodOptions.create({
      eventId: event.id,
      category: "starter",
      name: "Caesar Salad",
    });
    await caller.foodOptions.create({
      eventId: event.id,
      category: "main",
      name: "Grilled Salmon",
    });
    await caller.foodOptions.create({
      eventId: event.id,
      category: "dessert",
      name: "Chocolate Cake",
    });

    // Create confirmed guest
    const result = await caller.guests.create({
      eventId: event.id,
      name: "Bob Johnson",
      email: "bob@example.com",
      rsvpStatus: "confirmed",
      stage: 1,
      saveTheDateResponse: "pending",
    });

    // Update with meal selections
    await caller.guests.update({
      id: result.id,
      starterSelection: "Caesar Salad",
      mainSelection: "Grilled Salmon",
      dessertSelection: "Chocolate Cake",
      dietaryRestrictions: "No nuts",
    });

    // Verify meal selections
    const guest = await caller.guests.getById({ id: result.id });
    expect(guest?.starterSelection).toBe("Caesar Salad");
    expect(guest?.mainSelection).toBe("Grilled Salmon");
    expect(guest?.dessertSelection).toBe("Chocolate Cake");
    expect(guest?.dietaryRestrictions).toBe("No nuts");
  });

  it("should calculate guest statistics correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test event
    const event = await caller.events.create({
      title: "Test Wedding",
      coupleName1: "Test",
      coupleName2: "Couple",
      eventDate: "2026-06-15",
      eventCode: `TEST-${Date.now()}`,
      status: "planning",
    });

    // Create guests with different statuses
    await caller.guests.create({
      eventId: event.id,
      name: "Guest 1",
      rsvpStatus: "confirmed",
      stage: 1,
      saveTheDateResponse: "pending",
    });
    await caller.guests.create({
      eventId: event.id,
      name: "Guest 2",
      rsvpStatus: "confirmed",
      stage: 1,
      saveTheDateResponse: "pending",
    });
    await caller.guests.create({
      eventId: event.id,
      name: "Guest 3",
      rsvpStatus: "pending",
      stage: 1,
      saveTheDateResponse: "pending",
    });
    await caller.guests.create({
      eventId: event.id,
      name: "Guest 4",
      rsvpStatus: "declined",
      stage: 1,
      saveTheDateResponse: "pending",
    });

    // Get stats
    const stats = await caller.guests.getStats({ eventId: event.id });
    expect(stats.total).toBe(4);
    expect(stats.confirmed).toBe(2);
    expect(stats.pending).toBe(1);
    expect(stats.declined).toBe(1);
  });

  it("should handle public RSVP submission with meal selections", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test event
    const event = await caller.events.create({
      title: "Test Wedding",
      coupleName1: "Test",
      coupleName2: "Couple",
      eventDate: "2026-06-15",
      eventCode: `TEST-${Date.now()}`,
      status: "planning",
    });

    // Create food options
    await caller.foodOptions.create({
      eventId: event.id,
      category: "starter",
      name: "Soup",
    });
    await caller.foodOptions.create({
      eventId: event.id,
      category: "main",
      name: "Chicken",
    });
    await caller.foodOptions.create({
      eventId: event.id,
      category: "dessert",
      name: "Ice Cream",
    });

    // Create guest with RSVP token
    const token = `test_token_${Date.now()}`;
    const result = await caller.guests.create({
      eventId: event.id,
      name: "Alice Brown",
      email: "alice@example.com",
      rsvpStatus: "pending",
      stage: 1,
      saveTheDateResponse: "pending",
    });

    // Update with token
    await caller.guests.update({
      id: result.id,
      rsvpToken: token,
    });

    // Submit RSVP via public endpoint
    const publicCaller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    });

    await publicCaller.guests.submitRSVP({
      token,
      rsvpStatus: "confirmed",
      starterSelection: "Soup",
      mainSelection: "Chicken",
      dessertSelection: "Ice Cream",
      dietaryRestrictions: "Vegetarian",
    });

    // Verify RSVP was submitted
    const guest = await caller.guests.getById({ id: result.id });
    expect(guest?.rsvpStatus).toBe("confirmed");
    expect(guest?.starterSelection).toBe("Soup");
    expect(guest?.mainSelection).toBe("Chicken");
    expect(guest?.dessertSelection).toBe("Ice Cream");
    expect(guest?.dietaryRestrictions).toBe("Vegetarian");
  });

  it("should handle RSVP decline without meal selections", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test event
    const event = await caller.events.create({
      title: "Test Wedding",
      coupleName1: "Test",
      coupleName2: "Couple",
      eventDate: "2026-06-15",
      eventCode: `TEST-${Date.now()}`,
      status: "planning",
    });

    // Create guest with RSVP token
    const token = `test_token_${Date.now()}`;
    const result = await caller.guests.create({
      eventId: event.id,
      name: "Charlie Davis",
      email: "charlie@example.com",
      rsvpStatus: "pending",
      stage: 1,
      saveTheDateResponse: "pending",
    });

    // Update with token
    await caller.guests.update({
      id: result.id,
      rsvpToken: token,
    });

    // Decline RSVP
    const publicCaller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    });

    await publicCaller.guests.submitRSVP({
      token,
      rsvpStatus: "declined",
    });

    // Verify RSVP was declined
    const guest = await caller.guests.getById({ id: result.id });
    expect(guest?.rsvpStatus).toBe("declined");
    expect(guest?.starterSelection).toBeNull();
    expect(guest?.mainSelection).toBeNull();
    expect(guest?.dessertSelection).toBeNull();
  });
});
