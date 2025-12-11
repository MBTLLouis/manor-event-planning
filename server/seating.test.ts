import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("Seating Planner", () => {
  let testEventId: number;
  let ceremonyPlanId: number;
  let receptionPlanId: number;
  let testGuestId: number;
  let testTableId: number;
  let testSeatId: number;

  beforeAll(async () => {
    // Create test event
    testEventId = await db.createEvent({
      title: "Test Wedding - Seating",
      eventDate: new Date("2026-06-15"),
      status: "planning",
      createdById: 1,
    });

    // Create test guest
    testGuestId = await db.createGuest({
      eventId: testEventId,
      name: "John Doe",
      email: "john@example.com",
      rsvpStatus: "confirmed",
    });
  });

  afterAll(async () => {
    // Clean up
    if (testSeatId) await db.deleteSeat(testSeatId);
    if (testTableId) await db.deleteTable(testTableId);
    if (ceremonyPlanId) await db.deleteFloorPlan(ceremonyPlanId);
    if (receptionPlanId) await db.deleteFloorPlan(receptionPlanId);
    if (testGuestId) await db.deleteGuest(testGuestId);
    if (testEventId) await db.deleteEvent(testEventId);
  });

  describe("Floor Plans", () => {
    it("should create ceremony floor plan", async () => {
      ceremonyPlanId = await db.createFloorPlan({
        eventId: testEventId,
        name: "Ceremony Seating",
        mode: "ceremony",
        orderIndex: 1,
      });

      expect(ceremonyPlanId).toBeGreaterThan(0);

      const plan = await db.getFloorPlanById(ceremonyPlanId);
      expect(plan).toBeDefined();
      expect(plan?.name).toBe("Ceremony Seating");
      expect(plan?.mode).toBe("ceremony");
    });

    it("should create reception floor plan", async () => {
      receptionPlanId = await db.createFloorPlan({
        eventId: testEventId,
        name: "Reception Tables",
        mode: "reception",
        orderIndex: 2,
      });

      expect(receptionPlanId).toBeGreaterThan(0);

      const plan = await db.getFloorPlanById(receptionPlanId);
      expect(plan).toBeDefined();
      expect(plan?.name).toBe("Reception Tables");
      expect(plan?.mode).toBe("reception");
    });

    it("should list floor plans for event", async () => {
      const plans = await db.getFloorPlansByEventId(testEventId);
      expect(plans.length).toBeGreaterThanOrEqual(2);
      expect(plans.some(p => p.mode === "ceremony")).toBe(true);
      expect(plans.some(p => p.mode === "reception")).toBe(true);
    });

    it("should update floor plan", async () => {
      await db.updateFloorPlan(ceremonyPlanId, {
        name: "Updated Ceremony",
      });

      const plan = await db.getFloorPlanById(ceremonyPlanId);
      expect(plan?.name).toBe("Updated Ceremony");
    });
  });

  describe("Tables (Reception Mode)", () => {
    it("should create round table with rotation", async () => {
      testTableId = await db.createTable({
        floorPlanId: receptionPlanId,
        name: "Table 1",
        tableType: "round",
        seatCount: 8,
        positionX: 300,
        positionY: 300,
        rotation: 0,
      });

      expect(testTableId).toBeGreaterThan(0);

      const tables = await db.getTablesByFloorPlanId(receptionPlanId);
      expect(tables.length).toBe(1);
      expect(tables[0].name).toBe("Table 1");
      expect(tables[0].tableType).toBe("round");
      expect(tables[0].seatCount).toBe(8);
      expect(tables[0].rotation).toBe(0);
    });

    it("should update table position", async () => {
      await db.updateTable(testTableId, {
        positionX: 400,
        positionY: 450,
      });

      const tables = await db.getTablesByFloorPlanId(receptionPlanId);
      const table = tables.find(t => t.id === testTableId);
      expect(table?.positionX).toBe(400);
      expect(table?.positionY).toBe(450);
    });

    it("should rotate table in 15° increments", async () => {
      await db.updateTable(testTableId, { rotation: 15 });
      let tables = await db.getTablesByFloorPlanId(receptionPlanId);
      let table = tables.find(t => t.id === testTableId);
      expect(table?.rotation).toBe(15);

      await db.updateTable(testTableId, { rotation: 30 });
      tables = await db.getTablesByFloorPlanId(receptionPlanId);
      table = tables.find(t => t.id === testTableId);
      expect(table?.rotation).toBe(30);

      await db.updateTable(testTableId, { rotation: 345 });
      tables = await db.getTablesByFloorPlanId(receptionPlanId);
      table = tables.find(t => t.id === testTableId);
      expect(table?.rotation).toBe(345);
    });

    it("should create rectangular table", async () => {
      const rectTableId = await db.createTable({
        floorPlanId: receptionPlanId,
        name: "Table 2",
        tableType: "rectangular",
        seatCount: 4,
        positionX: 500,
        positionY: 300,
        rotation: 0,
      });

      expect(rectTableId).toBeGreaterThan(0);

      const tables = await db.getTablesByFloorPlanId(receptionPlanId);
      const rectTable = tables.find(t => t.id === rectTableId);
      expect(rectTable?.tableType).toBe("rectangular");
      expect(rectTable?.seatCount).toBe(4);

      await db.deleteTable(rectTableId);
    });
  });

  describe("Seats", () => {
    it("should create individual seat for ceremony", async () => {
      testSeatId = await db.createSeat({
        floorPlanId: ceremonyPlanId,
        positionX: 200,
        positionY: 150,
      });

      expect(testSeatId).toBeGreaterThan(0);

      const seats = await db.getSeatsByFloorPlanId(ceremonyPlanId);
      expect(seats.length).toBe(1);
      expect(seats[0].positionX).toBe(200);
      expect(seats[0].positionY).toBe(150);
      expect(seats[0].tableId).toBeNull();
    });

    it("should create seat attached to table", async () => {
      const tableSeatId = await db.createSeat({
        floorPlanId: receptionPlanId,
        tableId: testTableId,
        seatNumber: 1,
        positionX: 350,
        positionY: 250,
      });

      expect(tableSeatId).toBeGreaterThan(0);

      const seats = await db.getSeatsByTableId(testTableId);
      expect(seats.length).toBe(1);
      expect(seats[0].tableId).toBe(testTableId);
      expect(seats[0].seatNumber).toBe(1);

      await db.deleteSeat(tableSeatId);
    });

    it("should update seat position (drag-and-drop)", async () => {
      await db.updateSeat(testSeatId, {
        positionX: 250,
        positionY: 200,
      });

      const seats = await db.getSeatsByFloorPlanId(ceremonyPlanId);
      const seat = seats.find(s => s.id === testSeatId);
      expect(seat?.positionX).toBe(250);
      expect(seat?.positionY).toBe(200);
    });

    it("should assign guest to seat", async () => {
      await db.updateSeat(testSeatId, {
        guestId: testGuestId,
      });

      const seats = await db.getSeatsByFloorPlanId(ceremonyPlanId);
      const seat = seats.find(s => s.id === testSeatId);
      expect(seat?.guestId).toBe(testGuestId);
    });

    it("should unassign guest from seat", async () => {
      await db.updateSeat(testSeatId, {
        guestId: null,
      });

      const seats = await db.getSeatsByFloorPlanId(ceremonyPlanId);
      const seat = seats.find(s => s.id === testSeatId);
      expect(seat?.guestId).toBeNull();
    });
  });

  describe("Integration: Complete Seating Workflow", () => {
    it("should handle complete ceremony seating workflow", async () => {
      // Create multiple ceremony seats
      const seat1 = await db.createSeat({
        floorPlanId: ceremonyPlanId,
        positionX: 100,
        positionY: 100,
      });
      const seat2 = await db.createSeat({
        floorPlanId: ceremonyPlanId,
        positionX: 150,
        positionY: 100,
      });

      // Assign guest to seat
      await db.updateSeat(seat1, { guestId: testGuestId });

      // Verify assignment
      const seats = await db.getSeatsByFloorPlanId(ceremonyPlanId);
      const assignedSeats = seats.filter(s => s.guestId !== null);
      const unassignedSeats = seats.filter(s => s.guestId === null);

      expect(assignedSeats.length).toBeGreaterThan(0);
      expect(unassignedSeats.length).toBeGreaterThan(0);

      // Clean up
      await db.deleteSeat(seat1);
      await db.deleteSeat(seat2);
    });

    it("should handle complete reception table workflow", async () => {
      // Create table
      const tableId = await db.createTable({
        floorPlanId: receptionPlanId,
        name: "Test Table",
        tableType: "round",
        seatCount: 8,
        positionX: 300,
        positionY: 300,
        rotation: 0,
      });

      // Create seats around table
      const seatIds = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i * 2 * Math.PI) / 8 - Math.PI / 2;
        const x = Math.cos(angle) * 70;
        const y = Math.sin(angle) * 70;

        const seatId = await db.createSeat({
          floorPlanId: receptionPlanId,
          tableId: tableId,
          seatNumber: i + 1,
          positionX: Math.round(300 + x),
          positionY: Math.round(300 + y),
        });
        seatIds.push(seatId);
      }

      // Verify seats created
      const tableSeats = await db.getSeatsByTableId(tableId);
      expect(tableSeats.length).toBe(8);

      // Rotate table
      await db.updateTable(tableId, { rotation: 45 });
      const tables = await db.getTablesByFloorPlanId(receptionPlanId);
      const table = tables.find(t => t.id === tableId);
      expect(table?.rotation).toBe(45);

      // Move table
      await db.updateTable(tableId, { positionX: 400, positionY: 400 });
      const updatedTables = await db.getTablesByFloorPlanId(receptionPlanId);
      const movedTable = updatedTables.find(t => t.id === tableId);
      expect(movedTable?.positionX).toBe(400);
      expect(movedTable?.positionY).toBe(400);

      // Clean up
      for (const seatId of seatIds) {
        await db.deleteSeat(seatId);
      }
      await db.deleteTable(tableId);
    });
  });
});
