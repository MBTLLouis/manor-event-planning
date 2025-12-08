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
    loginMethod: "password",
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

describe("Budget Module", () => {
  it("creates and retrieves budget items", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test event first
    const event = await caller.events.create({
      title: "Budget Test Event",
      coupleName1: "Test",
      coupleName2: "Couple",
      eventDate: "2025-06-15",
      eventCode: "BUDGET001",
    });

    // Create a budget item
    const budgetItem = await caller.budget.create({
      eventId: event.id,
      category: "Catering",
      itemName: "Main Course",
      estimatedCost: 5000000, // $50,000 in cents
      actualCost: 4800000,
      paidAmount: 2500000,
      status: "pending",
    });

    expect(budgetItem.id).toBeDefined();

    // Retrieve budget items
    const items = await caller.budget.list({ eventId: event.id });
    expect(items).toHaveLength(1);
    expect(items[0]?.itemName).toBe("Main Course");
    expect(items[0]?.estimatedCost).toBe(5000000);
  });
});

describe("Vendors Module", () => {
  it("creates and manages vendors", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const event = await caller.events.create({
      title: "Vendor Test Event",
      coupleName1: "Test",
      coupleName2: "Couple",
      eventDate: "2025-07-20",
      eventCode: "VENDOR001",
    });

    // Create a vendor
    const vendor = await caller.vendors.create({
      eventId: event.id,
      name: "Elegant Catering Co.",
      category: "Catering",
      contactName: "John Smith",
      email: "john@elegantcatering.com",
      phone: "555-1234",
      status: "contacted",
      contractSigned: false,
      depositPaid: false,
    });

    expect(vendor.id).toBeDefined();

    // Retrieve vendors
    const vendors = await caller.vendors.list({ eventId: event.id });
    expect(vendors).toHaveLength(1);
    expect(vendors[0]?.name).toBe("Elegant Catering Co.");
    expect(vendors[0]?.status).toBe("contacted");
  });
});

describe("Checklist Module", () => {
  it("creates and tracks checklist items", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const event = await caller.events.create({
      title: "Checklist Test Event",
      coupleName1: "Test",
      coupleName2: "Couple",
      eventDate: "2025-08-10",
      eventCode: "CHECK001",
    });

    // Create a checklist item
    const item = await caller.checklist.create({
      eventId: event.id,
      category: "Pre-Event",
      title: "Book venue",
      description: "Confirm venue booking and deposit",
      priority: "high",
      assignedTo: "Event Coordinator",
    });

    expect(item.id).toBeDefined();

    // Mark as completed
    await caller.checklist.update({
      id: item.id,
      completed: true,
      completedAt: new Date(),
    });

    // Retrieve items
    const items = await caller.checklist.list({ eventId: event.id });
    expect(items).toHaveLength(1);
    expect(items[0]?.completed).toBe(true);
  });
});

describe("Notes Module", () => {
  it("creates and manages notes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const event = await caller.events.create({
      title: "Notes Test Event",
      coupleName1: "Test",
      coupleName2: "Couple",
      eventDate: "2025-09-05",
      eventCode: "NOTES001",
    });

    // Create a note
    const note = await caller.notes.create({
      eventId: event.id,
      title: "Important Reminder",
      content: "Remember to confirm the cake design with the couple",
      category: "Important",
      isPinned: true,
    });

    expect(note.id).toBeDefined();

    // Retrieve notes
    const notes = await caller.notes.list({ eventId: event.id });
    expect(notes).toHaveLength(1);
    expect(notes[0]?.title).toBe("Important Reminder");
    expect(notes[0]?.isPinned).toBe(true);
  });
});

describe("Accommodations Module", () => {
  it("creates and manages accommodations", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const event = await caller.events.create({
      title: "Accommodation Test Event",
      coupleName1: "Test",
      coupleName2: "Couple",
      eventDate: "2025-10-12",
      eventCode: "ACCOM001",
    });

    // Create accommodation
    const accommodation = await caller.accommodations.create({
      eventId: event.id,
      hotelName: "Grand Hotel",
      address: "123 Main St, City, State",
      phone: "555-5678",
      roomBlockCode: "WEDDING2025",
      roomRate: 15000, // $150 in cents
      checkInDate: new Date("2025-10-11"),
      checkOutDate: new Date("2025-10-13"),
    });

    expect(accommodation.id).toBeDefined();

    // Retrieve accommodations
    const accommodations = await caller.accommodations.list({ eventId: event.id });
    expect(accommodations).toHaveLength(1);
    expect(accommodations[0]?.hotelName).toBe("Grand Hotel");
    expect(accommodations[0]?.roomBlockCode).toBe("WEDDING2025");
  });
});

describe("Wedding Website Module", () => {
  it("creates and updates wedding website", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const event = await caller.events.create({
      title: "Website Test Event",
      coupleName1: "Test",
      coupleName2: "Couple",
      eventDate: "2025-11-20",
      eventCode: "WEBSITE001",
    });

    // Create wedding website
    const website = await caller.weddingWebsite.create({
      eventId: event.id,
      slug: "test-couple-2025",
      welcomeMessage: "Welcome to our wedding!",
      ourStory: "We met in college...",
      rsvpEnabled: true,
    });

    expect(website.id).toBeDefined();

    // Retrieve website
    const retrievedWebsite = await caller.weddingWebsite.get({ eventId: event.id });
    expect(retrievedWebsite).toBeDefined();
    expect(retrievedWebsite?.slug).toBe("test-couple-2025");
    expect(retrievedWebsite?.isPublished).toBe(false);

    // Publish website
    await caller.weddingWebsite.update({
      id: website.id,
      isPublished: true,
    });

    const publishedWebsite = await caller.weddingWebsite.get({ eventId: event.id });
    expect(publishedWebsite?.isPublished).toBe(true);
  });
});
