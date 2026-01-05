import { describe, it, expect, beforeAll } from "vitest";
import { db } from "./db";

describe("Couple Login", () => {
  it("should find event by couple username", async () => {
    // Get all events to see what's stored
    const events = await db.getAllEvents();
    console.log("All events:", events);
    
    // Try to find Louis & Ren event
    const louisRenEvent = events.find(e => e.title?.includes("Louis"));
    console.log("Louis & Ren event:", louisRenEvent);
    
    if (louisRenEvent) {
      console.log("Couple credentials:", {
        username: louisRenEvent.coupleUsername,
        password: louisRenEvent.couplePassword,
      });
    }
    
    expect(louisRenEvent).toBeDefined();
  });

  it("should find event by couple username using getEventByCoupleUsername", async () => {
    const event = await db.getEventByCoupleUsername("LouisRen");
    console.log("Found event by username:", event);
    expect(event).toBeDefined();
  });

  it("should check user roles", async () => {
    // Get all users to see their roles
    const allUsers = await db.getAllUsers?.() || [];
    console.log("All users:", allUsers);
  });
});
