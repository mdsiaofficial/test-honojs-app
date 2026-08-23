import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";
import { relations } from "drizzle-orm";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),

  // text() is for long strings (like a blog post body) without a length limit
  content: text("content").notNull(),

  // boolean() is true/false. .default(false) means new posts are drafts by default
  published: boolean("published").default(false).notNull(),

  // 🔥 THIS IS THE CRITICAL LINK 🔥
  // This is a "Foreign Key". It stores the ID of the user who wrote the post.
  author_id: integer("author_id")
    // .references() physically links this column to the users table
    .references(() => users.id, {
      // onDelete: "cascade" means: "If the User is deleted, automatically delete all their posts too"
      onDelete: "cascade"
    })
    .notNull(), // A post MUST have an author

  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Define the reverse relationship
export const postsRelations = relations(
  posts,
  ({ one }) => (
    {
      // This tells Drizzle: "A post belongs to ONE user (the author)"
      // fields: the column in THIS table (author_id)
      // references: the column in the OTHER table (users.id)
      author: one(
        users,
        {
          fields: [posts.author_id],
          references: [users.id],
        }
      ),
    }
  )
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;