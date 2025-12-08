import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

async function seed() {
  console.log("Seeding database...");

  // Create employee user
  const employeePassword = await bcrypt.hash("employee1234", 10);
  await connection.execute(
    `INSERT INTO users (openId, username, password, name, email, role, loginMethod) 
     VALUES (?, ?, ?, ?, ?, ?, ?) 
     ON DUPLICATE KEY UPDATE password = VALUES(password)`,
    ["local-employee", "employee", employeePassword, "Employee User", "employee@manor.com", "employee", "local"]
  );

  // Create couple user
  const couplePassword = await bcrypt.hash("couple1234", 10);
  await connection.execute(
    `INSERT INTO users (openId, username, password, name, email, role, loginMethod) 
     VALUES (?, ?, ?, ?, ?, ?, ?) 
     ON DUPLICATE KEY UPDATE password = VALUES(password)`,
    ["local-couple", "couple", couplePassword, "Sarah & John", "couple@example.com", "couple", "local"]
  );

  // Get employee ID
  const [users] = await connection.execute("SELECT id FROM users WHERE username = ?", ["employee"]);
  const employeeId = users[0].id;

  // Create test event
  const eventDate = new Date("2025-12-10T14:00:00");
  await connection.execute(
    `INSERT INTO events (title, coupleName1, coupleName2, eventDate, eventCode, status, createdById) 
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE title = VALUES(title)`,
    ["TEST - LOUIS & REN", "Louis", "Ren", eventDate, "180008", "planning", employeeId]
  );

  // Get event ID
  const [events] = await connection.execute("SELECT id FROM events WHERE eventCode = ?", ["180008"]);
  const eventId = events[0].id;

  // Add sample guest
  await connection.execute(
    `INSERT INTO guests (eventId, name, email, groupName, rsvpStatus, invitationSent) 
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [eventId, "John Doe", "john@example.com", "Family", "confirmed", true]
  );

  console.log("✓ Database seeded successfully!");
  console.log("\nLogin credentials:");
  console.log("Employee: username=employee, password=employee1234");
  console.log("Couple: username=couple, password=couple1234");

  await connection.end();
}

seed().catch(console.error);
