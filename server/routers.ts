import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import * as permStore from "./permissionsStore";
import bcrypt from "bcryptjs";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    login: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
        role: z.enum(["employee", "couple"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByUsername(input.username);
        
        if (!user || !user.password) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }

        const isValidPassword = await bcrypt.compare(input.password, user.password);
        if (!isValidPassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }

        if (user.role !== input.role) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid role" });
        }

        // Create session token using SDK
        const { sdk } = await import("./_core/sdk");
        const { ONE_YEAR_MS } = await import("@shared/const");
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, user };
      }),

    coupleLogin: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Find event by couple username
        const event = await db.getEventByCoupleUsername(input.username);
        
        if (!event || !event.couplePassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }

        // Compare plain text password (couple credentials are stored as plain text)
        if (input.password !== event.couplePassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }

        // Create session token using SDK
        const { sdk } = await import("./_core/sdk");
        const { ONE_YEAR_MS } = await import("@shared/const");
        const coupleOpenId = `couple-event-${event.id}`;
        const sessionToken = await sdk.createSessionToken(coupleOpenId, {
          name: event.coupleName1 || "Couple",
          expiresInMs: ONE_YEAR_MS,
        });

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, eventId: event.id };
      }),

    register: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
        name: z.string(),
        email: z.string().email().optional(),
        role: z.enum(["employee", "couple"]),
      }))
      .mutation(async ({ input }) => {
        const existingUser = await db.getUserByUsername(input.username);
        if (existingUser) {
          throw new TRPCError({ code: "CONFLICT", message: "Username already exists" });
        }

        const hashedPassword = await bcrypt.hash(input.password, 10);
        
        await db.createUser({
          openId: `local-${input.username}-${Date.now()}`,
          username: input.username,
          password: hashedPassword,
          name: input.name,
          email: input.email,
          role: input.role,
          loginMethod: "local",
        });

        return { success: true };
      }),
  }),

  events: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // For couples, return only their event by ID
      if (ctx.user?.role === 'couple') {
        const coupleEvent = await db.getEventById(ctx.user.id);
        return coupleEvent ? [coupleEvent] : [];
      }
      // For employees/admins, return all events
      return await db.getAllEvents();
    }),

    upcoming: protectedProcedure.query(async () => {
      return await db.getUpcomingEvents();
    }),

    past: protectedProcedure.query(async () => {
      return await db.getPastEvents();
    }),

    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return await db.searchEvents(input.query);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        // For couples, only allow access to their own event
        if (ctx.user?.role === 'couple' && ctx.user.id !== input.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        return await db.getEventById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        coupleName1: z.string().optional(),
        coupleName2: z.string().optional(),
        eventDate: z.string(),
        eventCode: z.string().optional(),
        status: z.enum(["planning", "confirmed", "completed", "cancelled"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Couples cannot create events
        if (ctx.user?.role === 'couple') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Couples cannot create events' });
        }
        const id = await db.createEvent({
          ...input,
          eventDate: new Date(input.eventDate),
          createdById: ctx.user.id,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        coupleName1: z.string().optional(),
        coupleName2: z.string().optional(),
        eventDate: z.string().optional(),
        eventCode: z.string().optional(),
        status: z.enum(["planning", "confirmed", "completed", "cancelled"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Couples cannot update event details
        if (ctx.user?.role === 'couple') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Couples cannot update event details' });
        }
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.eventDate) {
          updateData.eventDate = new Date(data.eventDate);
        }
        await db.updateEvent(id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Couples cannot delete events
        if (ctx.user?.role === 'couple') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Couples cannot delete events' });
        }
        await db.deleteEvent(input.id);
        return { success: true };
      }),

    toggleCoupleVisibility: protectedProcedure
      .input(z.object({ 
        id: z.number(),
        coupleCanView: z.boolean()
      }))
      .mutation(async ({ input, ctx }) => {
        // Couples cannot toggle visibility (security)
        if (ctx.user?.role === 'couple') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        await db.updateEvent(input.id, { coupleCanView: input.coupleCanView });
        return { success: true };
      }),

    stats: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        // For couples, only allow access to their own event stats
        if (ctx.user?.role === 'couple' && ctx.user.id !== input.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        const guestStats = await db.getGuestStats(input.id);
        return {
          guests: guestStats.total,
          confirmed: guestStats.confirmed,
          budget: 0,
          spent: 0,
          vendors: 0,
          booked: 0,
          tasks: 0,
          completed: 0,
        };
      }),

    getCoupleLoginDetails: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        // Couples cannot view login details (security)
        if (ctx.user?.role === 'couple') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        const event = await db.getEventById(input.id);
        if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        return {
          username: event.coupleUsername,
          password: event.couplePassword,
        };
      }),

    updateCoupleLoginDetails: protectedProcedure
      .input(z.object({
        id: z.number(),
        username: z.string().optional(),
        password: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Couples cannot update login details (security)
        if (ctx.user?.role === 'couple') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        const { id, username, password } = input;
        const updateData: any = {};
        if (username) updateData.coupleUsername = username;
        if (password) updateData.couplePassword = password;
        await db.updateEvent(id, updateData);
        return { success: true };
      }),

    getPermissions: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input, ctx }) => {
        // For couples, only allow access to their own event permissions
        if (ctx.user?.role === 'couple' && ctx.user.id !== input.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        return permStore.getPermissions(input.id);
      }),

    updatePermissions: protectedProcedure
      .input(z.object({
        id: z.number(),
        permissions: z.object({
          guestListEnabled: z.boolean(),
          seatingEnabled: z.boolean(),
          timelineEnabled: z.boolean(),
          menuEnabled: z.boolean(),
          notesEnabled: z.boolean(),
          hotelEnabled: z.boolean(),
          websiteEnabled: z.boolean(),
        }),
      }))
      .mutation(({ input, ctx }) => {
        // Couples cannot update permissions
        if (ctx.user?.role === 'couple') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Couples cannot update permissions' });
        }
        permStore.setPermissions(input.id, input.permissions);
        return { success: true };
      }),
  }),

  guests: router({
    list: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getGuestsByEventId(input.eventId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getGuestById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        firstName: z.string(),
        lastName: z.string(),
        name: z.string(),
        email: z.string().optional(),
        groupName: z.string().optional(),
        stage: z.number().optional(),
        saveTheDateResponse: z.enum(["yes", "no", "pending"]).optional(),
        rsvpStatus: z.enum(["draft", "invited", "confirmed", "declined"]).optional(),
        mealSelection: z.string().optional(),
        starterSelection: z.string().optional(),
        mainSelection: z.string().optional(),
        dessertSelection: z.string().optional(),
        hasDietaryRequirements: z.boolean().optional(),
        dietaryRestrictions: z.string().optional(),
        allergySeverity: z.enum(["none", "mild", "severe"]).optional(),
        canOthersConsumeNearby: z.boolean().optional(),
        dietaryDetails: z.string().optional(),
        guestType: z.enum(["day", "evening", "both"]).optional(),
        invitationSent: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createGuest(input);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        firstName: z.string().nullish(),
        lastName: z.string().nullish(),
        name: z.string().nullish(),
        email: z.string().nullish(),
        groupName: z.string().nullish(),
        rsvpStatus: z.enum(["draft", "invited", "confirmed", "declined"]).nullish(),
        mealSelection: z.string().nullish(),
        starterSelection: z.string().nullish(),
        mainSelection: z.string().nullish(),
        dessertSelection: z.string().nullish(),
        foodSelections: z.record(z.string(), z.string()).nullish(),
        hasDietaryRequirements: z.boolean().nullish(),
        dietaryRestrictions: z.string().nullish(),
        allergySeverity: z.enum(["none", "mild", "severe"]).nullish(),
        canOthersConsumeNearby: z.boolean().nullish(),
        dietaryDetails: z.string().nullish(),
        guestType: z.enum(["day", "evening", "both"]).nullish(),
        tableAssigned: z.boolean().nullish(),
        tableId: z.number().nullish(),
        seatId: z.number().nullish(),
        invitationSent: z.boolean().nullish(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        // Filter out null and undefined values
        const cleanData = Object.fromEntries(
          Object.entries(data).filter(([_, v]) => v !== null && v !== undefined)
        );
        // Only update if there are fields to update
        if (Object.keys(cleanData).length > 0) {
          await db.updateGuest(id, cleanData);
        }
        // Return the updated guest
        const updatedGuest = await db.getGuestById(id);
        return updatedGuest;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteGuest(input.id);
        return { success: true };
      }),

    stats: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getGuestStats(input.eventId);
      }),

    // 3-Stage System Procedures
    updateSaveTheDateResponse: protectedProcedure
      .input(z.object({
        guestId: z.number(),
        response: z.enum(["yes", "no"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateGuestSaveTheDateResponse(input.guestId, input.response);
        return { success: true };
      }),

    sendSaveTheDate: protectedProcedure
      .input(z.object({ guestId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markInvitationSent(input.guestId);
        return { success: true };
      }),

    submitRSVP: publicProcedure
      .input(z.object({
        token: z.string(),
        starterSelection: z.string().optional(),
        mainSelection: z.string().optional(),
        dessertSelection: z.string().optional(),
        dietaryRestrictions: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.submitGuestRSVP(input);
        return { success: true };
      }),

    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        return await db.getGuestByToken(input.token);
      }),
  }),

  floorPlans: router({
    list: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getFloorPlansByEventId(input.eventId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const floorPlan = await db.getFloorPlanById(input.id);
        if (!floorPlan) return null;

        const tables = await db.getTablesByFloorPlanId(input.id);
        const seats = await db.getSeatsByFloorPlanId(input.id);

        return { ...floorPlan, tables, seats };
      }),

    create: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        name: z.string(),
        mode: z.enum(["ceremony", "reception"]).optional(),
        orderIndex: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createFloorPlan(input);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        orderIndex: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateFloorPlan(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteFloorPlan(input.id);
        return { success: true };
      }),

    getTables: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        const floorPlans = await db.getFloorPlansByEventId(input.eventId);
        const allTables = [];
        for (const plan of floorPlans) {
          const tables = await db.getTablesByFloorPlanId(plan.id);
          for (const table of tables) {
            const seats = await db.getSeatsByTableId(table.id);
            allTables.push({ ...table, seats });
          }
        }
        return allTables;
      }),
  }),

  tables: router({
    list: protectedProcedure
      .input(z.object({ floorPlanId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTablesByFloorPlanId(input.floorPlanId);
      }),

    create: protectedProcedure
      .input(z.object({
        floorPlanId: z.number(),
        name: z.string(),
        tableType: z.enum(["round", "rectangular"]),
        seatCount: z.number(),
        positionX: z.number(),
        positionY: z.number(),
        rotation: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createTable(input);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        positionX: z.number().optional(),
        positionY: z.number().optional(),
        rotation: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTable(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTable(input.id);
        return { success: true };
      }),
  }),

  seats: router({
    create: protectedProcedure
      .input(z.object({
        floorPlanId: z.number(),
        tableId: z.number().optional(),
        seatNumber: z.number().optional(),
        guestId: z.number().optional(),
        positionX: z.number(),
        positionY: z.number(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createSeat(input);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        guestId: z.number().optional().nullable(),
        positionX: z.number().optional(),
        positionY: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSeat(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSeat(input.id);
        return { success: true };
      }),
  }),

  timeline: router({
    listDays: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        const days = await db.getTimelineDaysByEventId(input.eventId);
        const daysWithEvents = await Promise.all(
          days.map(async (day) => {
            const events = await db.getTimelineEventsByDayId(day.id);
            return { ...day, events };
          })
        );
        return daysWithEvents;
      }),

    createDay: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        title: z.string(),
        date: z.string(),
        orderIndex: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createTimelineDay({
          ...input,
          date: new Date(input.date),
        });
        return { id };
      }),

    updateDay: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        date: z.string().optional(),
        orderIndex: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.date) {
          updateData.date = new Date(data.date);
        }
        await db.updateTimelineDay(id, updateData);
        return { success: true };
      }),

    deleteDay: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTimelineDay(input.id);
        return { success: true };
      }),

    createEvent: protectedProcedure
      .input(z.object({
        timelineDayId: z.number(),
        time: z.string(),
        title: z.string(),
        description: z.string().optional(),
        assignedTo: z.string().optional(),
        notes: z.string().optional(),
        orderIndex: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createTimelineEvent(input);
        return { id };
      }),

    updateEvent: protectedProcedure
      .input(z.object({
        id: z.number(),
        time: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        assignedTo: z.string().optional(),
        notes: z.string().optional(),
        orderIndex: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTimelineEvent(id, data);
        return { success: true };
      }),

    deleteEvent: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTimelineEvent(input.id);
        return { success: true };
      }),
  }),

  foodOptions: router({
    list: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getFoodOptionsByEventId(input.eventId);
      }),

    create: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        category: z.enum(["starter", "main", "dessert"]),
        name: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createFoodOption(input);
        return { id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteFoodOption(input.id);
        return { success: true };
      }),
  }),

  messages: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllMessages();
    }),

    byEvent: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMessagesByEventId(input.eventId);
      }),

    create: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        content: z.string(),
        isUrgent: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createMessage({
          ...input,
          senderId: ctx.user.id,
        });
        return { id };
      }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateMessage(input.id, { isRead: true });
        return { success: true };
      }),

    unreadCount: protectedProcedure.query(async () => {
      return await db.getUnreadMessagesCount();
    }),
  }),

  dashboard: router({
    stats: protectedProcedure.query(async () => {
      const allEvents = await db.getAllEvents();
      const upcomingEvents = await db.getUpcomingEvents();
      const unreadMessages = await db.getUnreadMessagesCount();

      return {
        totalEvents: allEvents.length,
        upcomingEvents: upcomingEvents.length,
        unreadMessages,
        pendingTasks: 0,
      };
    }),
  }),

  budget: router({
    list: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBudgetItemsByEventId(input.eventId);
      }),

    create: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        category: z.string(),
        itemName: z.string(),
        estimatedCost: z.number(),
        actualCost: z.number().optional(),
        paidAmount: z.number().optional(),
        status: z.enum(["pending", "paid", "overdue"]).optional(),
        vendorId: z.number().optional(),
        notes: z.string().optional(),
        dueDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createBudgetItem(input);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        category: z.string().optional(),
        itemName: z.string().optional(),
        estimatedCost: z.number().optional(),
        actualCost: z.number().optional(),
        paidAmount: z.number().optional(),
        status: z.enum(["pending", "paid", "overdue"]).optional(),
        notes: z.string().optional(),
        dueDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateBudgetItem(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteBudgetItem(input.id);
        return { success: true };
      }),
  }),

  vendors: router({
    list: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getVendorsByEventId(input.eventId);
      }),

    create: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        name: z.string(),
        category: z.string(),
        contactName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        status: z.enum(["pending", "contacted", "booked", "confirmed", "cancelled"]).optional(),
        contractSigned: z.boolean().optional(),
        depositPaid: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createVendor(input);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        category: z.string().optional(),
        contactName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        status: z.enum(["pending", "contacted", "booked", "confirmed", "cancelled"]).optional(),
        contractSigned: z.boolean().optional(),
        depositPaid: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateVendor(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteVendor(input.id);
        return { success: true };
      }),
  }),

  checklist: router({
    list: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getChecklistItemsByEventId(input.eventId);
      }),

    create: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        category: z.string(),
        title: z.string(),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        assignedTo: z.string().optional(),
        dueDate: z.date().optional(),
        orderIndex: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createChecklistItem(input);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        category: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        completed: z.boolean().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        assignedTo: z.string().optional(),
        dueDate: z.date().optional(),
        completedAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateChecklistItem(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteChecklistItem(input.id);
        return { success: true };
      }),
  }),

  notes: router({
    list: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getNotesByEventId(input.eventId);
      }),

    create: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        title: z.string(),
        content: z.string(),
        category: z.string().optional(),
        isPinned: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const noteId = await db.createNote({
          eventId: input.eventId,
          title: input.title,
          content: input.content,
          category: input.category,
          isPinned: input.isPinned,
          createdById: ctx.user.id,
        });
        return { id: noteId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        category: z.string().optional(),
        isPinned: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateNote(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteNote(input.id);
        return { success: true };
      }),
  }),



  weddingWebsite: router({
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await db.getWeddingWebsiteBySlug(input.slug);
      }),

    get: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getWeddingWebsiteByEventId(input.eventId);
      }),

    create: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        slug: z.string(),
        welcomeMessage: z.string().optional(),
        ourStory: z.string().optional(),
        registryLinks: z.string().optional(),
        eventDetails: z.string().optional(),
        travelInfo: z.string().optional(),
        faqContent: z.string().optional(),
        dressCode: z.string().optional(),
        rsvpEnabled: z.boolean().optional(),
        theme: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createWeddingWebsite(input);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        slug: z.string().optional(),
        isPublished: z.boolean().optional(),
        welcomeMessage: z.string().optional(),
        ourStory: z.string().optional(),
        registryLinks: z.string().optional(),
        eventDetails: z.string().optional(),
        travelInfo: z.string().optional(),
        faqContent: z.string().optional(),
        dressCode: z.string().optional(),
        sectionOrder: z.string().optional(),
        visibleSections: z.string().optional(),
        rsvpEnabled: z.boolean().optional(),
        theme: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateWeddingWebsite(id, data);
        return { success: true };
      }),

    getEventBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const website = await db.getWeddingWebsiteBySlug(input.slug);
        if (!website) return null;
        return await db.getEventById(website.eventId);
      }),

    addPhoto: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        websiteId: z.number(),
        photoUrl: z.string(),
        caption: z.string().optional(),
        isFeatured: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.addWeddingWebsitePhoto(input);
        return { id };
      }),

    getPhotos: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getWeddingWebsitePhotos(input.eventId);
      }),

    updatePhoto: protectedProcedure
      .input(z.object({
        id: z.number(),
        caption: z.string().optional(),
        isFeatured: z.boolean().optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateWeddingWebsitePhoto(id, data);
        return { success: true };
      }),

    deletePhoto: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteWeddingWebsitePhoto(input.id);
        return { success: true };
      }),

    // Registry Links
    addRegistryLink: protectedProcedure
      .input(z.object({
        websiteId: z.number(),
        title: z.string(),
        url: z.string(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.addRegistryLink(input);
        return { id };
      }),

    getRegistryLinks: protectedProcedure
      .input(z.object({ websiteId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRegistryLinksByWebsiteId(input.websiteId);
      }),

    updateRegistryLink: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        url: z.string().optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateRegistryLink(id, data);
        return { success: true };
      }),

    deleteRegistryLink: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRegistryLink(input.id);
        return { success: true };
      }),

    // FAQ Items
    addFaqItem: protectedProcedure
      .input(z.object({
        websiteId: z.number(),
        question: z.string(),
        answer: z.string(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.addFaqItem(input);
        return { id };
      }),

    getFaqItems: protectedProcedure
      .input(z.object({ websiteId: z.number() }))
      .query(async ({ input }) => {
        return await db.getFaqItemsByWebsiteId(input.websiteId);
      }),

    updateFaqItem: protectedProcedure
      .input(z.object({
        id: z.number(),
        question: z.string().optional(),
        answer: z.string().optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateFaqItem(id, data);
        return { success: true };
      }),

    deleteFaqItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteFaqItem(input.id);
        return { success: true };
      }),

    // Timeline Items
    addTimelineItem: protectedProcedure
      .input(z.object({
        websiteId: z.number(),
        time: z.string(),
        title: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.addTimelineItem(input);
        return { id };
      }),

    getTimelineItems: protectedProcedure
      .input(z.object({ websiteId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTimelineItemsByWebsiteId(input.websiteId);
      }),

    updateTimelineItem: protectedProcedure
      .input(z.object({
        id: z.number(),
        time: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTimelineItem(id, data);
        return { success: true };
      }),

    deleteTimelineItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTimelineItem(input.id);
        return { success: true };
      }),
  }),

  menu: router({
    list: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMenuItemsByEventId(input.eventId);
      }),

    create: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        course: z.string(),
        name: z.string(),
        description: z.string().nullish(),
        orderIndex: z.number().default(0),
      }))
      .mutation(async ({ input, ctx }) => {
        // Couples can only add menu items to their own event
        if (ctx.user?.role === 'couple') {
          const event = await db.getEventById(input.eventId);
          if (!event || event.coupleUsername !== ctx.user.username) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this event' });
          }
        }
        return await db.createMenuItem({
          eventId: input.eventId,
          course: input.course,
          name: input.name,
          description: input.description || undefined,
          orderIndex: input.orderIndex,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().nullish(),
        isAvailable: z.boolean().optional(),
        orderIndex: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Only employees can update menu items
        if (ctx.user?.role === 'couple') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Couples cannot manage menu items' });
        }
        const { id, ...data } = input;
        return await db.updateMenuItem(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Only employees can delete menu items
        if (ctx.user?.role === 'couple') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Couples cannot manage menu items' });
        }
        await db.deleteMenuItem(input.id);
        return { success: true };
      }),
    
    deleteCourse: protectedProcedure
      .input(z.object({ eventId: z.number(), course: z.string() }))
      .mutation(async ({ input, ctx }) => {
        // Only employees can delete courses
        if (ctx.user?.role === 'couple') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Couples cannot manage courses' });
        }
        await db.deleteMenuItemsByCourse(input.eventId, input.course);
        return { success: true };
      }),
  }),

  drinks: router({
    list: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDrinksByEventId(input.eventId);
      }),

    create: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        drinkType: z.enum(["soft", "alcoholic"]),
        subType: z.string().nullish(),
        brandProducer: z.string().nullish(),
        cocktailName: z.string().nullish(),
        corkage: z.enum(["client_brings", "venue_provides"]).default("venue_provides"),
        totalQuantity: z.number(),
        description: z.string().nullish(),
        orderIndex: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        return await db.createDrink({
          eventId: input.eventId,
          drinkType: input.drinkType,
          subType: input.subType || undefined,
          brandProducer: input.brandProducer || undefined,
          cocktailName: input.cocktailName || undefined,
          corkage: input.corkage,
          totalQuantity: input.totalQuantity,
          description: input.description || undefined,
          orderIndex: input.orderIndex,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        drinkType: z.enum(["soft", "alcoholic"]).optional(),
        subType: z.string().nullish(),
        brandProducer: z.string().nullish(),
        cocktailName: z.string().nullish(),
        corkage: z.enum(["client_brings", "venue_provides"]).optional(),
        totalQuantity: z.number().optional(),
        description: z.string().nullish(),
        orderIndex: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateDrink(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDrink(input.id);
        return { success: true };
      }),
  }),

  accommodations: router({
    initializeRooms: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ input }) => {
        await db.initializeAccommodationRooms(input.eventId);
        return { success: true };
      }),

    getRooms: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAccommodationRoomsByEventId(input.eventId);
      }),

    updateRoom: protectedProcedure
      .input(z.object({
        id: z.number(),
        isBlocked: z.boolean().optional(),
        notes: z.string().nullish(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateAccommodationRoom(id, data);
      }),

    allocateGuest: protectedProcedure
      .input(z.object({
        roomId: z.number(),
        guestId: z.number(),
        eventId: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.allocateGuestToRoom(input.roomId, input.guestId, input.eventId, input.notes);
      }),

    getAllocations: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRoomAllocationsByEventId(input.eventId);
      }),

    updateAllocation: protectedProcedure
      .input(z.object({
        id: z.number(),
        notes: z.string().nullish(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateRoomAllocation(id, data);
      }),

    removeAllocation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRoomAllocation(input.id);
        return { success: true };
      }),
  }),

  employees: router({
    list: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return next({ ctx });
      })
      .query(async () => {
        return await db.getAllEmployees();
      }),

    create: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return next({ ctx });
      })
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        username: z.string(),
        password: z.string(),
        role: z.enum(["admin", "employee"]),
      }))
      .mutation(async ({ input }) => {
        const existingUser = await db.getUserByUsername(input.username);
        if (existingUser) {
          throw new TRPCError({ code: "CONFLICT" });
        }

        const hashedPassword = await bcrypt.hash(input.password, 10);
        const id = await db.createUser({
          openId: `local-${input.username}-${Date.now()}`,
          username: input.username,
          password: hashedPassword,
          name: input.name,
          email: input.email,
          role: input.role,
          loginMethod: "local",
        });

        return { id, success: true };
      }),

    update: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return next({ ctx });
      })
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["admin", "employee"]).optional(),
        password: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, password, ...data } = input;
        const updateData: any = { ...data };
        
        if (password) {
          updateData.password = await bcrypt.hash(password, 10);
        }

        await db.updateUser(id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return next({ ctx });
      })
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteUser(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
