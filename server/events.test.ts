import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createEmployeeContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-employee",
    email: "employee@manor.com",
    name: "Test Employee",
    loginMethod: "local",
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

describe("events management", () => {
  it("should return empty events list for new user", async () => {
    const { ctx } = createEmployeeContext();
    const caller = appRouter.createCaller(ctx);

    const events = await caller.events.list();

    expect(Array.isArray(events)).toBe(true);
  });

  it("should return dashboard stats", async () => {
    const { ctx } = createEmployeeContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.stats();

    expect(stats).toHaveProperty("totalEvents");
    expect(stats).toHaveProperty("upcomingEvents");
    expect(stats).toHaveProperty("unreadMessages");
    expect(stats).toHaveProperty("pendingTasks");
    expect(typeof stats.totalEvents).toBe("number");
  });
});

describe("guest management", () => {
  it("should return guest stats with zero counts for event without guests", async () => {
    const { ctx } = createEmployeeContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.guests.stats({ eventId: 999999 });

    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("confirmed");
    expect(stats).toHaveProperty("pending");
    expect(stats).toHaveProperty("declined");
    expect(stats.total).toBe(0);
  });
});
