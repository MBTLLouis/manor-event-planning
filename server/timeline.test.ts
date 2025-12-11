import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
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

describe("Timeline Module", () => {
  it("should create, update, and delete timeline days", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test event
    const event = await caller.events.create({
      title: "Timeline Test Event",
      coupleName: "Test Couple",
      eventDate: "2026-06-15",
      eventCode: `TL-${Date.now()}`,
    });

    // Create timeline day
    const day = await caller.timeline.createDay({
      eventId: event.id,
      title: "Wedding Day",
      date: "2026-06-15",
      orderIndex: 1,
    });

    expect(day.id).toBeGreaterThan(0);

    // Update timeline day
    const updateResult = await caller.timeline.updateDay({
      id: day.id,
      title: "Ceremony Day",
      date: "2026-06-16",
    });

    expect(updateResult.success).toBe(true);

    // Delete timeline day
    const deleteResult = await caller.timeline.deleteDay({
      id: day.id,
    });

    expect(deleteResult.success).toBe(true);
  });

  it("should create, update, and delete timeline events", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test event
    const event = await caller.events.create({
      title: "Timeline Event Test",
      coupleName: "Test Couple 2",
      eventDate: "2026-07-20",
      eventCode: `TLE-${Date.now()}`,
    });

    // Create timeline day
    const day = await caller.timeline.createDay({
      eventId: event.id,
      title: "Wedding Day",
      date: "2026-07-20",
      orderIndex: 1,
    });

    // Create timeline event with time dropdown value
    const timelineEvent = await caller.timeline.createEvent({
      timelineDayId: day.id,
      time: "14:30",
      title: "Ceremony Begins",
      assignedTo: "Wedding Coordinator",
      notes: "Ensure all guests are seated",
      orderIndex: 1,
    });

    expect(timelineEvent.id).toBeGreaterThan(0);

    // Update timeline event
    const updateResult = await caller.timeline.updateEvent({
      id: timelineEvent.id,
      time: "15:00",
      title: "Ceremony Starts",
      assignedTo: "Event Manager",
      notes: "Updated timing",
    });

    expect(updateResult.success).toBe(true);

    // Delete timeline event
    const deleteResult = await caller.timeline.deleteEvent({
      id: timelineEvent.id,
    });

    expect(deleteResult.success).toBe(true);
  });

  it("should list timeline days with events", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test event
    const event = await caller.events.create({
      title: "Timeline List Test",
      coupleName: "Test Couple 3",
      eventDate: "2026-08-10",
      eventCode: `TLL-${Date.now()}`,
    });

    // Create timeline day
    const day = await caller.timeline.createDay({
      eventId: event.id,
      title: "Wedding Day",
      date: "2026-08-10",
      orderIndex: 1,
    });

    // Create multiple timeline events
    await caller.timeline.createEvent({
      timelineDayId: day.id,
      time: "10:00",
      title: "Guest Arrival",
      orderIndex: 1,
    });

    await caller.timeline.createEvent({
      timelineDayId: day.id,
      time: "14:00",
      title: "Ceremony",
      assignedTo: "Officiant",
      notes: "Main event",
      orderIndex: 2,
    });

    await caller.timeline.createEvent({
      timelineDayId: day.id,
      time: "18:00",
      title: "Reception",
      orderIndex: 3,
    });

    // List days with events
    const days = await caller.timeline.listDays({
      eventId: event.id,
    });

    expect(days.length).toBe(1);
    expect(days[0].events).toBeDefined();
    expect(days[0].events.length).toBe(3);
    expect(days[0].events[0].time).toBe("10:00");
    expect(days[0].events[1].assignedTo).toBe("Officiant");
    expect(days[0].events[2].title).toBe("Reception");
  });

  it("should handle time dropdown values correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test event
    const event = await caller.events.create({
      title: "Time Dropdown Test",
      coupleName: "Test Couple 4",
      eventDate: "2026-09-05",
      eventCode: `TDT-${Date.now()}`,
    });

    // Create timeline day
    const day = await caller.timeline.createDay({
      eventId: event.id,
      title: "Test Day",
      date: "2026-09-05",
      orderIndex: 1,
    });

    // Test various time formats (15-minute intervals)
    const times = ["00:00", "06:15", "12:30", "18:45", "23:45"];

    for (const time of times) {
      const event = await caller.timeline.createEvent({
        timelineDayId: day.id,
        time,
        title: `Event at ${time}`,
        orderIndex: 1,
      });

      expect(event.id).toBeGreaterThan(0);
    }

    // List and verify times
    const days = await caller.timeline.listDays({
      eventId: event.id,
    });

    expect(days[0].events.length).toBe(5);
    times.forEach((time, index) => {
      expect(days[0].events.some((e: any) => e.time === time)).toBe(true);
    });
  });

  it("should handle optional fields correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test event
    const event = await caller.events.create({
      title: "Optional Fields Test",
      coupleName: "Test Couple 5",
      eventDate: "2026-10-12",
      eventCode: `OFT-${Date.now()}`,
    });

    // Create timeline day
    const day = await caller.timeline.createDay({
      eventId: event.id,
      title: "Test Day",
      date: "2026-10-12",
      orderIndex: 1,
    });

    // Create event with only required fields
    const minimalEvent = await caller.timeline.createEvent({
      timelineDayId: day.id,
      time: "12:00",
      title: "Minimal Event",
      orderIndex: 1,
    });

    expect(minimalEvent.id).toBeGreaterThan(0);

    // Create event with all optional fields
    const fullEvent = await caller.timeline.createEvent({
      timelineDayId: day.id,
      time: "15:00",
      title: "Full Event",
      assignedTo: "Coordinator",
      notes: "This has all optional fields filled",
      orderIndex: 2,
    });

    expect(fullEvent.id).toBeGreaterThan(0);

    // Verify both events exist
    const days = await caller.timeline.listDays({
      eventId: event.id,
    });

    expect(days[0].events.length).toBe(2);
  });
});
