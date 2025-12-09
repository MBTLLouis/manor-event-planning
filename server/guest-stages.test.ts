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
    loginMethod: "custom",
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("3-Stage Guest Management System", () => {
  it("Stage 1: Creates guest with default stage 1", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test event
    const eventResult = await caller.events.create({
      title: "Test Wedding - 3 Stage",
      coupleName1: "Alice",
      coupleName2: "Bob",
      eventDate: "2025-06-15",
      eventCode: `TEST3STAGE${Date.now()}`,
      status: "planning",
    });

    // Create guest in Stage 1
    const guestResult = await caller.guests.create({
      eventId: eventResult.id,
      name: "John Doe",
      email: "john@example.com",
      stage: 1,
      saveTheDateResponse: "pending",
    });

    expect(guestResult.id).toBeGreaterThan(0);

    // Verify guest is in Stage 1
    const guest = await caller.guests.getById({ id: guestResult.id });
    expect(guest?.stage).toBe(1);
    expect(guest?.saveTheDateResponse).toBe("pending");
  });

  it("Stage 1 → Stage 2: Auto-advances when responding Yes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test event
    const eventResult = await caller.events.create({
      title: "Test Wedding - Stage Progression",
      coupleName1: "Charlie",
      coupleName2: "Diana",
      eventDate: "2025-07-20",
      eventCode: `TESTSTAGE${Date.now()}`,
      status: "planning",
    });

    // Create guest in Stage 1
    const guestResult = await caller.guests.create({
      eventId: eventResult.id,
      name: "Jane Smith",
      email: "jane@example.com",
      stage: 1,
      saveTheDateResponse: "pending",
    });

    // Update Save the Date response to "yes"
    await caller.guests.updateSaveTheDateResponse({
      guestId: guestResult.id,
      response: "yes",
    });

    // Verify guest advanced to Stage 2 and has RSVP token
    const updatedGuest = await caller.guests.getById({ id: guestResult.id });
    expect(updatedGuest?.stage).toBe(2);
    expect(updatedGuest?.saveTheDateResponse).toBe("yes");
    expect(updatedGuest?.rsvpToken).toBeTruthy();
    expect(updatedGuest?.rsvpToken).toMatch(/^rsvp_/);
  });

  it("Stage 2: Guest can access RSVP form with token", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test event
    const eventResult = await caller.events.create({
      title: "Test Wedding - RSVP Access",
      coupleName1: "Eve",
      coupleName2: "Frank",
      eventDate: "2025-08-10",
      eventCode: `TESTRSVP${Date.now()}`,
      status: "planning",
    });

    // Create guest and advance to Stage 2
    const guestResult = await caller.guests.create({
      eventId: eventResult.id,
      name: "Bob Johnson",
      email: "bob@example.com",
      stage: 1,
      saveTheDateResponse: "pending",
    });

    await caller.guests.updateSaveTheDateResponse({
      guestId: guestResult.id,
      response: "yes",
    });

    const stage2Guest = await caller.guests.getById({ id: guestResult.id });
    const token = stage2Guest?.rsvpToken;

    // Guest can retrieve their info with token
    const guestByToken = await caller.guests.getByToken({ token: token! });
    expect(guestByToken?.id).toBe(guestResult.id);
    expect(guestByToken?.name).toBe("Bob Johnson");
    expect(guestByToken?.stage).toBe(2);
  });

  it("Stage 2 → Stage 3: Auto-advances when RSVP submitted", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test event
    const eventResult = await caller.events.create({
      title: "Test Wedding - RSVP Submission",
      coupleName1: "Grace",
      coupleName2: "Henry",
      eventDate: "2025-09-05",
      eventCode: `TESTSUBMIT${Date.now()}`,
      status: "planning",
    });

    // Create food options
    await caller.foodOptions.create({
      eventId: eventResult.id,
      name: "Caesar Salad",
      category: "starter",
    });
    await caller.foodOptions.create({
      eventId: eventResult.id,
      name: "Grilled Salmon",
      category: "main",
    });
    await caller.foodOptions.create({
      eventId: eventResult.id,
      name: "Chocolate Cake",
      category: "dessert",
    });

    // Create guest and advance to Stage 2
    const guestResult = await caller.guests.create({
      eventId: eventResult.id,
      name: "Alice Williams",
      email: "alice@example.com",
      stage: 1,
      saveTheDateResponse: "pending",
    });

    await caller.guests.updateSaveTheDateResponse({
      guestId: guestResult.id,
      response: "yes",
    });

    const stage2Guest = await caller.guests.getById({ id: guestResult.id });
    const token = stage2Guest?.rsvpToken;

    // Submit RSVP
    await caller.guests.submitRSVP({
      token: token!,
      starterSelection: "Caesar Salad",
      mainSelection: "Grilled Salmon",
      dessertSelection: "Chocolate Cake",
      dietaryRestrictions: "No shellfish",
    });

    // Verify guest advanced to Stage 3 with meal selections
    const stage3Guest = await caller.guests.getById({ id: guestResult.id });
    expect(stage3Guest?.stage).toBe(3);
    expect(stage3Guest?.rsvpStatus).toBe("confirmed");
    expect(stage3Guest?.starterSelection).toBe("Caesar Salad");
    expect(stage3Guest?.mainSelection).toBe("Grilled Salmon");
    expect(stage3Guest?.dessertSelection).toBe("Chocolate Cake");
    expect(stage3Guest?.dietaryRestrictions).toBe("No shellfish");
  });

  it("Stage 3: Final database contains complete guest records", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test event
    const eventResult = await caller.events.create({
      title: "Test Wedding - Final Database",
      coupleName1: "Ivy",
      coupleName2: "Jack",
      eventDate: "2025-10-12",
      eventCode: `TESTFINAL${Date.now()}`,
      status: "planning",
    });

    // Create and process multiple guests
    const guests = [
      { name: "Guest 1", email: "guest1@test.com" },
      { name: "Guest 2", email: "guest2@test.com" },
      { name: "Guest 3", email: "guest3@test.com" },
    ];

    for (const guestData of guests) {
      const guestResult = await caller.guests.create({
        eventId: eventResult.id,
        name: guestData.name,
        email: guestData.email,
        stage: 1,
        saveTheDateResponse: "pending",
      });

      // Advance to Stage 2
      await caller.guests.updateSaveTheDateResponse({
        guestId: guestResult.id,
        response: "yes",
      });

      // Get token and submit RSVP
      const stage2Guest = await caller.guests.getById({ id: guestResult.id });
      await caller.guests.submitRSVP({
        token: stage2Guest!.rsvpToken!,
        starterSelection: "Starter",
        mainSelection: "Main",
        dessertSelection: "Dessert",
      });
    }

    // Verify all guests are in Stage 3
    const allGuests = await caller.guests.list({ eventId: eventResult.id });
    const stage3Guests = allGuests.filter((g: any) => g.stage === 3);
    expect(stage3Guests.length).toBe(3);
    expect(stage3Guests.every((g: any) => g.rsvpStatus === "confirmed")).toBe(true);
  });
});
