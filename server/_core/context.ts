import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getDb } from "../../server/db";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Check if this is a couple session by verifying the session cookie
    const cookies = parseCookieHeader(opts.req.headers.cookie || "");
    const sessionCookie = cookies[COOKIE_NAME];
    
    if (sessionCookie) {
      const sessionData = await sdk.verifySession(sessionCookie);
      if (sessionData?.openId?.startsWith("couple-event-")) {
        // Extract event ID from openId (format: "couple-event-{eventId}")
        const eventId = parseInt(sessionData.openId.split("-").pop() || "0", 10);
        if (eventId > 0) {
          // Create a synthetic user object for couple sessions
          const db = await getDb();
          if (db) {
            const { events } = await import("../../drizzle/schema");
            const { eq } = await import("drizzle-orm");
            const result = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
            if (result.length > 0) {
              // Create a synthetic couple user
              user = {
                id: eventId,
                openId: sessionData.openId,
                name: result[0].coupleName1 || "Couple",
                email: null,
                loginMethod: "couple",
                role: "couple",
                username: result[0].coupleUsername || null,
                password: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastSignedIn: new Date(),
              } as User;
            }
          }
        }
      }
    }
    // If not a couple session, authentication is optional for public procedures.
    if (!user) {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
