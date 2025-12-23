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
  coupleCanView: boolean("coupleCanView").default(true).notNull(),
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
  // Name fields
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Full name for backward compatibility
  email: varchar("email", { length: 320 }),
  groupName: varchar("groupName", { length: 100 }),
  // 3-Stage System: 1=Save the Date, 2=RSVP Details, 3=Final Database
  stage: int("stage").default(1).notNull(),
  // Stage 1: Save the Date response
  saveTheDateResponse: mysqlEnum("saveTheDateResponse", ["yes", "no", "pending"]).default("pending"),
  // Unique token for RSVP link access
  rsvpToken: varchar("rsvpToken", { length: 64 }).unique(),
  // Stage 2 & 3: RSVP details
  rsvpStatus: mysqlEnum("rsvpStatus", ["draft", "invited", "confirmed", "declined"]).default("draft").notNull(),
  // Food choices
  starterSelection: varchar("starterSelection", { length: 255 }),
  mainSelection: varchar("mainSelection", { length: 255 }),
  dessertSelection: varchar("dessertSelection", { length: 255 }),
  // Detailed dietary requirements
  hasDietaryRequirements: boolean("hasDietaryRequirements").default(false).notNull(),
  dietaryRestrictions: text("dietaryRestrictions"), // Multi-choice: Vegetarian, Vegan, Gluten-Free, etc.
  allergySeverity: mysqlEnum("allergySeverity", ["none", "mild", "severe"]).default("none"),
  canOthersConsumeNearby: boolean("canOthersConsumeNearby").default(true),
  dietaryDetails: text("dietaryDetails"), // Additional details text box
  // Legacy field for backward compatibility
  mealSelection: text("mealSelection"),
  // Table assignment
  tableAssigned: boolean("tableAssigned").default(false).notNull(),
  tableId: int("tableId"),
  seatId: int("seatId"),
  // Guest type
  guestType: mysqlEnum("guestType", ["day", "evening", "both"]).default("both"),
  invitationSent: boolean("invitationSent").default(false).notNull(),
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
  mode: mysqlEnum("mode", ["ceremony", "reception"]).default("reception").notNull(),
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
  rotation: int("rotation").default(0).notNull(),
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

/**
 * Budget Items table - stores budget line items for events
 */
export const budgetItems = mysqlTable("budgetItems", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  itemName: varchar("itemName", { length: 255 }).notNull(),
  estimatedCost: int("estimatedCost").notNull(), // in cents
  actualCost: int("actualCost"), // in cents
  paidAmount: int("paidAmount").default(0).notNull(), // in cents
  status: mysqlEnum("status", ["pending", "paid", "overdue"]).default("pending").notNull(),
  vendorId: int("vendorId"),
  notes: text("notes"),
  dueDate: datetime("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BudgetItem = typeof budgetItems.$inferSelect;
export type InsertBudgetItem = typeof budgetItems.$inferInsert;

/**
 * Vendors table - stores vendor information for events
 */
export const vendors = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "Catering", "Photography", "Venue"
  contactName: varchar("contactName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 500 }),
  status: mysqlEnum("status", ["pending", "contacted", "booked", "confirmed", "cancelled"]).default("pending").notNull(),
  contractSigned: boolean("contractSigned").default(false).notNull(),
  depositPaid: boolean("depositPaid").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = typeof vendors.$inferInsert;

/**
 * Checklist Items table - stores task checklist items for events
 */
export const checklistItems = mysqlTable("checklistItems", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  completed: boolean("completed").default(false).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  assignedTo: varchar("assignedTo", { length: 255 }),
  dueDate: datetime("dueDate"),
  completedAt: timestamp("completedAt"),
  orderIndex: int("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = typeof checklistItems.$inferInsert;

/**
 * Menu Items table - stores configurable food choices for events
 */
export const menuItems = mysqlTable("menuItems", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  course: mysqlEnum("course", ["starter", "main", "dessert"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  orderIndex: int("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;

/**
 * Notes table - stores event-specific notes
 */
export const notes = mysqlTable("notes", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  createdById: int("createdById").notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

/**
 * Accommodations table - stores guest accommodation information
 */
export const accommodations = mysqlTable("accommodations", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  hotelName: varchar("hotelName", { length: 255 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 500 }),
  roomBlockCode: varchar("roomBlockCode", { length: 100 }),
  roomRate: int("roomRate"), // in cents
  checkInDate: datetime("checkInDate"),
  checkOutDate: datetime("checkOutDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Accommodation = typeof accommodations.$inferSelect;
export type InsertAccommodation = typeof accommodations.$inferInsert;

/**
 * Wedding Website Settings table - stores website configuration for events
 */
export const weddingWebsites = mysqlTable("weddingWebsites", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull().unique(),
  slug: varchar("slug", { length: 100 }).unique(),
  isPublished: boolean("isPublished").default(false).notNull(),
  welcomeMessage: text("welcomeMessage"),
  ourStory: text("ourStory"),
  registryLinks: text("registryLinks"), // JSON array of links
  rsvpEnabled: boolean("rsvpEnabled").default(true).notNull(),
  theme: varchar("theme", { length: 50 }).default("classic").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WeddingWebsite = typeof weddingWebsites.$inferSelect;
export type InsertWeddingWebsite = typeof weddingWebsites.$inferInsert;
