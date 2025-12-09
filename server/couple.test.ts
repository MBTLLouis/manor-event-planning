import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCoupleContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "couple-user",
    email: "couple@example.com",
    name: "Sarah & John",
    loginMethod: "local",
    role: "user",
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

  return { ctx };
}

describe("Couple Portal", () => {
  it("couple can view their events", async () => {
    const { ctx } = createCoupleContext();
    const caller = appRouter.createCaller(ctx);

    const events = await caller.events.list();
    
    expect(Array.isArray(events)).toBe(true);
  });

  it("couple can view guest list", async () => {
    const { ctx } = createCoupleContext();
    const caller = appRouter.createCaller(ctx);

    // First get an event
    const events = await caller.events.list();
    if (events.length > 0) {
      const guests = await caller.guests.list({ eventId: events[0].id });
      expect(Array.isArray(guests)).toBe(true);
    }
  });

  it("couple can view floor plans", async () => {
    const { ctx } = createCoupleContext();
    const caller = appRouter.createCaller(ctx);

    const events = await caller.events.list();
    if (events.length > 0) {
      const floorPlans = await caller.floorPlans.list({ eventId: events[0].id });
      expect(Array.isArray(floorPlans)).toBe(true);
    }
  });

  it("couple can view timeline", async () => {
    const { ctx } = createCoupleContext();
    const caller = appRouter.createCaller(ctx);

    const events = await caller.events.list();
    if (events.length > 0) {
      const days = await caller.timeline.listDays({ eventId: events[0].id });
      expect(Array.isArray(days)).toBe(true);
    }
  });

  it("couple can view food options", async () => {
    const { ctx } = createCoupleContext();
    const caller = appRouter.createCaller(ctx);

    const events = await caller.events.list();
    if (events.length > 0) {
      const foodOptions = await caller.foodOptions.list({ eventId: events[0].id });
      expect(Array.isArray(foodOptions)).toBe(true);
    }
  });
});
