import { eq, and, desc, asc, or, like, count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  events,
  InsertEvent,
  guests,
  InsertGuest,
  floorPlans,
  InsertFloorPlan,
  tables,
  InsertTable,
  seats,
  InsertSeat,
  timelineDays,
  InsertTimelineDay,
  timelineEvents,
  InsertTimelineEvent,
  foodOptions,
  InsertFoodOption,
  messages,
  InsertMessage,
  budgetItems,
  InsertBudgetItem,
  vendors,
  InsertVendor,
  checklistItems,
  InsertChecklistItem,
  notes,
  InsertNote,
  accommodations,
  InsertAccommodation,
  weddingWebsites,
  InsertWeddingWebsite,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "username", "password"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(users).values(user);
  return Number(result[0].insertId);
}

// Events
export async function createEvent(event: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(events).values(event);
  return Number(result[0].insertId);
}

export async function getEventById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllEvents() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(events).orderBy(desc(events.eventDate));
}

export async function getUpcomingEvents() {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return await db
    .select()
    .from(events)
    .where(sql`${events.eventDate} >= ${now}`)
    .orderBy(asc(events.eventDate));
}

export async function getPastEvents() {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return await db
    .select()
    .from(events)
    .where(sql`${events.eventDate} < ${now}`)
    .orderBy(desc(events.eventDate));
}

export async function searchEvents(query: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(events)
    .where(
      or(
        like(events.title, `%${query}%`),
        like(events.coupleName1, `%${query}%`),
        like(events.coupleName2, `%${query}%`),
        like(events.eventCode, `%${query}%`)
      )
    )
    .orderBy(desc(events.eventDate));
}

export async function updateEvent(id: number, data: Partial<InsertEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(events).set(data).where(eq(events.id, id));
}

export async function deleteEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(events).where(eq(events.id, id));
}

// Guests
export async function createGuest(guest: InsertGuest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(guests).values(guest);
  return Number(result[0].insertId);
}

export async function getGuestsByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(guests).where(eq(guests.eventId, eventId)).orderBy(asc(guests.name));
}

export async function getGuestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(guests).where(eq(guests.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateGuest(id: number, data: Partial<InsertGuest>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(guests).set(data).where(eq(guests.id, id));
}

export async function deleteGuest(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(guests).where(eq(guests.id, id));
}

export async function getGuestStats(eventId: number) {
  const db = await getDb();
  if (!db) return { total: 0, confirmed: 0, pending: 0, declined: 0 };

  const allGuests = await db.select().from(guests).where(eq(guests.eventId, eventId));

  return {
    total: allGuests.length,
    confirmed: allGuests.filter((g) => g.rsvpStatus === "confirmed").length,
    pending: allGuests.filter((g) => g.rsvpStatus === "pending").length,
    declined: allGuests.filter((g) => g.rsvpStatus === "declined").length,
  };
}

// 3-Stage Guest Management
export async function updateGuestSaveTheDateResponse(guestId: number, response: "yes" | "no") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate RSVP token if responding yes
  const rsvpToken = response === "yes" ? `rsvp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : undefined;
  
  await db.update(guests).set({
    saveTheDateResponse: response,
    stage: response === "yes" ? 2 : 1, // Auto-advance to Stage 2 if yes
    rsvpToken: rsvpToken,
  }).where(eq(guests.id, guestId));
}

export async function markInvitationSent(guestId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(guests).set({
    invitationSent: true,
  }).where(eq(guests.id, guestId));
}

export async function getGuestByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(guests).where(eq(guests.rsvpToken, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function submitGuestRSVP(data: {
  token: string;
  starterSelection?: string;
  mainSelection?: string;
  dessertSelection?: string;
  dietaryRestrictions?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const guest = await getGuestByToken(data.token);
  if (!guest) throw new Error("Invalid RSVP token");

  await db.update(guests).set({
    starterSelection: data.starterSelection,
    mainSelection: data.mainSelection,
    dessertSelection: data.dessertSelection,
    dietaryRestrictions: data.dietaryRestrictions,
    rsvpStatus: "confirmed",
    stage: 3, // Auto-advance to Stage 3 after RSVP submission
  }).where(eq(guests.id, guest.id));
}

// Floor Plans
export async function createFloorPlan(floorPlan: InsertFloorPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(floorPlans).values(floorPlan);
  return Number(result[0].insertId);
}

export async function getFloorPlansByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(floorPlans).where(eq(floorPlans.eventId, eventId)).orderBy(asc(floorPlans.orderIndex));
}

export async function getFloorPlanById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(floorPlans).where(eq(floorPlans.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateFloorPlan(id: number, data: Partial<InsertFloorPlan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(floorPlans).set(data).where(eq(floorPlans.id, id));
}

export async function deleteFloorPlan(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(floorPlans).where(eq(floorPlans.id, id));
}

// Tables
export async function createTable(table: InsertTable) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tables).values(table);
  return Number(result[0].insertId);
}

export async function getTablesByFloorPlanId(floorPlanId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(tables).where(eq(tables.floorPlanId, floorPlanId));
}

export async function updateTable(id: number, data: Partial<InsertTable>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(tables).set(data).where(eq(tables.id, id));
}

export async function deleteTable(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(tables).where(eq(tables.id, id));
}

// Seats
export async function createSeat(seat: InsertSeat) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(seats).values(seat);
  return Number(result[0].insertId);
}

export async function getSeatsByFloorPlanId(floorPlanId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(seats).where(eq(seats.floorPlanId, floorPlanId));
}

export async function getSeatsByTableId(tableId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(seats).where(eq(seats.tableId, tableId));
}

export async function updateSeat(id: number, data: Partial<InsertSeat>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(seats).set(data).where(eq(seats.id, id));
}

export async function deleteSeat(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(seats).where(eq(seats.id, id));
}

// Timeline Days
export async function createTimelineDay(day: InsertTimelineDay) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(timelineDays).values(day);
  return Number(result[0].insertId);
}

export async function getTimelineDaysByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(timelineDays).where(eq(timelineDays.eventId, eventId)).orderBy(asc(timelineDays.orderIndex));
}

export async function updateTimelineDay(id: number, data: Partial<InsertTimelineDay>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(timelineDays).set(data).where(eq(timelineDays.id, id));
}

export async function deleteTimelineDay(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(timelineDays).where(eq(timelineDays.id, id));
}

// Timeline Events
export async function createTimelineEvent(event: InsertTimelineEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(timelineEvents).values(event);
  return Number(result[0].insertId);
}

export async function getTimelineEventsByDayId(dayId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(timelineEvents).where(eq(timelineEvents.timelineDayId, dayId)).orderBy(asc(timelineEvents.orderIndex));
}

export async function updateTimelineEvent(id: number, data: Partial<InsertTimelineEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(timelineEvents).set(data).where(eq(timelineEvents.id, id));
}

export async function deleteTimelineEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(timelineEvents).where(eq(timelineEvents.id, id));
}

// Food Options
export async function createFoodOption(option: InsertFoodOption) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(foodOptions).values(option);
  return Number(result[0].insertId);
}

export async function getFoodOptionsByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(foodOptions).where(eq(foodOptions.eventId, eventId));
}

export async function deleteFoodOption(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(foodOptions).where(eq(foodOptions.id, id));
}

// Messages
export async function createMessage(message: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values(message);
  return Number(result[0].insertId);
}

export async function getMessagesByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(messages).where(eq(messages.eventId, eventId)).orderBy(desc(messages.createdAt));
}

export async function getAllMessages() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(messages).orderBy(desc(messages.createdAt));
}

export async function updateMessage(id: number, data: Partial<InsertMessage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(messages).set(data).where(eq(messages.id, id));
}

export async function getUnreadMessagesCount() {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: count() }).from(messages).where(eq(messages.isRead, false));
  return result[0]?.count ?? 0;
}

// Budget Items
export async function createBudgetItem(item: InsertBudgetItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(budgetItems).values(item);
  return Number(result[0].insertId);
}

export async function getBudgetItemsByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(budgetItems).where(eq(budgetItems.eventId, eventId)).orderBy(asc(budgetItems.category));
}

export async function updateBudgetItem(id: number, data: Partial<InsertBudgetItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(budgetItems).set(data).where(eq(budgetItems.id, id));
}

export async function deleteBudgetItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(budgetItems).where(eq(budgetItems.id, id));
}

// Vendors
export async function createVendor(vendor: InsertVendor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vendors).values(vendor);
  return Number(result[0].insertId);
}

export async function getVendorsByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(vendors).where(eq(vendors.eventId, eventId)).orderBy(asc(vendors.category));
}

export async function updateVendor(id: number, data: Partial<InsertVendor>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(vendors).set(data).where(eq(vendors.id, id));
}

export async function deleteVendor(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(vendors).where(eq(vendors.id, id));
}

// Checklist Items
export async function createChecklistItem(item: InsertChecklistItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(checklistItems).values(item);
  return Number(result[0].insertId);
}

export async function getChecklistItemsByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(checklistItems).where(eq(checklistItems.eventId, eventId)).orderBy(asc(checklistItems.orderIndex));
}

export async function updateChecklistItem(id: number, data: Partial<InsertChecklistItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(checklistItems).set(data).where(eq(checklistItems.id, id));
}

export async function deleteChecklistItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(checklistItems).where(eq(checklistItems.id, id));
}

// Notes
export async function createNote(note: InsertNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notes).values(note);
  return Number(result[0].insertId);
}

export async function getNotesByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(notes).where(eq(notes.eventId, eventId)).orderBy(desc(notes.isPinned), desc(notes.updatedAt));
}

export async function updateNote(id: number, data: Partial<InsertNote>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(notes).set(data).where(eq(notes.id, id));
}

export async function deleteNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(notes).where(eq(notes.id, id));
}

// Accommodations
export async function createAccommodation(accommodation: InsertAccommodation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(accommodations).values(accommodation);
  return Number(result[0].insertId);
}

export async function getAccommodationsByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(accommodations).where(eq(accommodations.eventId, eventId));
}

export async function updateAccommodation(id: number, data: Partial<InsertAccommodation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(accommodations).set(data).where(eq(accommodations.id, id));
}

export async function deleteAccommodation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(accommodations).where(eq(accommodations.id, id));
}

// Wedding Websites
export async function createWeddingWebsite(website: InsertWeddingWebsite) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(weddingWebsites).values(website);
  return Number(result[0].insertId);
}

export async function getWeddingWebsiteByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(weddingWebsites).where(eq(weddingWebsites.eventId, eventId)).limit(1);
  return result[0] ?? null;
}

export async function updateWeddingWebsite(id: number, data: Partial<InsertWeddingWebsite>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(weddingWebsites).set(data).where(eq(weddingWebsites.id, id));
}
