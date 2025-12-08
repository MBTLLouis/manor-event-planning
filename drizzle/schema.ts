import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, datetime } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended to support both employee and couple roles with password authentication.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "employee", "couple"]).default("user").notNull(),
  username: varchar("username", { length: 100 }).unique(),
  password: varchar("password", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Events table - stores wedding/event information
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  coupleName1: varchar("coupleName1", { length: 100 }),
  coupleName2: varchar("coupleName2", { length: 100 }),
  eventDate: datetime("eventDate").notNull(),
  eventCode: varchar("eventCode", { length: 50 }).unique(),
  status: mysqlEnum("status", ["planning", "confirmed", "completed", "cancelled"]).default("planning").notNull(),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Guests table - stores guest information for events
 */
export const guests = mysqlTable("guests", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  groupName: varchar("groupName", { length: 100 }),
  rsvpStatus: mysqlEnum("rsvpStatus", ["confirmed", "pending", "declined"]).default("pending").notNull(),
  mealSelection: text("mealSelection"),
  invitationSent: boolean("invitationSent").default(false).notNull(),
  dietaryRestrictions: text("dietaryRestrictions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Guest = typeof guests.$inferSelect;
export type InsertGuest = typeof guests.$inferInsert;

/**
 * Floor Plans table - stores floor plan configurations
 */
export const floorPlans = mysqlTable("floorPlans", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  orderIndex: int("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FloorPlan = typeof floorPlans.$inferSelect;
export type InsertFloorPlan = typeof floorPlans.$inferInsert;

/**
 * Tables table - stores table configurations in floor plans
 */
export const tables = mysqlTable("tables", {
  id: int("id").autoincrement().primaryKey(),
  floorPlanId: int("floorPlanId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  tableType: mysqlEnum("tableType", ["round", "rectangular"]).notNull(),
  seatCount: int("seatCount").notNull(),
  positionX: int("positionX").notNull(),
  positionY: int("positionY").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Table = typeof tables.$inferSelect;
export type InsertTable = typeof tables.$inferInsert;

/**
 * Seats table - stores individual seat configurations
 */
export const seats = mysqlTable("seats", {
  id: int("id").autoincrement().primaryKey(),
  floorPlanId: int("floorPlanId").notNull(),
  tableId: int("tableId"),
  seatNumber: int("seatNumber"),
  guestId: int("guestId"),
  positionX: int("positionX").notNull(),
  positionY: int("positionY").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Seat = typeof seats.$inferSelect;
export type InsertSeat = typeof seats.$inferInsert;

/**
 * Timeline Days table - stores day configurations for event timelines
 */
export const timelineDays = mysqlTable("timelineDays", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  date: datetime("date").notNull(),
  orderIndex: int("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TimelineDay = typeof timelineDays.$inferSelect;
export type InsertTimelineDay = typeof timelineDays.$inferInsert;

/**
 * Timeline Events table - stores individual timeline events
 */
export const timelineEvents = mysqlTable("timelineEvents", {
  id: int("id").autoincrement().primaryKey(),
  timelineDayId: int("timelineDayId").notNull(),
  time: varchar("time", { length: 10 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assignedTo: varchar("assignedTo", { length: 255 }),
  notes: text("notes"),
  orderIndex: int("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertTimelineEvent = typeof timelineEvents.$inferInsert;

/**
 * Food Options table - stores menu options for events
 */
export const foodOptions = mysqlTable("foodOptions", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  category: mysqlEnum("category", ["starter", "main", "dessert"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FoodOption = typeof foodOptions.$inferSelect;
export type InsertFoodOption = typeof foodOptions.$inferInsert;

/**
 * Messages table - stores messages related to events
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  isUrgent: boolean("isUrgent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
