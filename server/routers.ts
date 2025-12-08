import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

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
      .mutation(async ({ input }) => {
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

        return { success: true, user };
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
    list: protectedProcedure.query(async () => {
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
      .query(async ({ input }) => {
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
      .mutation(async ({ input }) => {
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
      .mutation(async ({ input }) => {
        await db.deleteEvent(input.id);
        return { success: true };
      }),

    stats: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
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
        name: z.string(),
        email: z.string().optional(),
        groupName: z.string().optional(),
        rsvpStatus: z.enum(["confirmed", "pending", "declined"]).optional(),
        mealSelection: z.string().optional(),
        invitationSent: z.boolean().optional(),
        dietaryRestrictions: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createGuest(input);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().optional(),
        groupName: z.string().optional(),
        rsvpStatus: z.enum(["confirmed", "pending", "declined"]).optional(),
        mealSelection: z.string().optional(),
        invitationSent: z.boolean().optional(),
        dietaryRestrictions: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateGuest(id, data);
        return { success: true };
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
  }),

  tables: router({
    create: protectedProcedure
      .input(z.object({
        floorPlanId: z.number(),
        name: z.string(),
        tableType: z.enum(["round", "rectangular"]),
        seatCount: z.number(),
        positionX: z.number(),
        positionY: z.number(),
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
});

export type AppRouter = typeof appRouter;
