import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { posts } from "./posts"; 
// We import 'posts' here so we can define the relationship below

// 1. Define the actual database table
export const users = pgTable("users", {
  // serial() creates an auto-incrementing integer (1, 2, 3...)
  // primaryKey() means this is the unique identifier for the row
  id: serial("id").primaryKey(), 
  
  // varchar() is a string with a max length. .notNull() means it cannot be empty
  name: varchar("name", { length: 100 }).notNull(), 
  
  // .unique() ensures no two users can register with the same email
  email: varchar("email", { length: 255 }).notNull().unique(), 
  
  password: varchar("password", { length: 255 }).notNull(), 
  
  // .default("user") means if you don't specify a role, it defaults to "user"
  role: varchar("role", { length: 20 }).default("user").notNull(), 
  
  // timestamp() with .defaultNow() automatically saves the exact time the row is created
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Define the Relationships (The "Magic" of Drizzle)
export const usersRelations = relations(users, ({ many }) => ({
  // This tells Drizzle: "One user can have MANY posts"
  // This doesn't change the database, it just teaches TypeScript/Drizzle how they connect
  posts: many(posts), 
}));

// 3. TypeScript Type Inference
// Instead of manually typing `interface User { id: number, name: string... }`, 
// Drizzle reads the table above and creates the exact TypeScript type for you!
export type TUser = typeof users.$inferSelect; // Type for when you READ from the DB
export type TNewUser = typeof users.$inferInsert; // Type for when you INSERT into the DB