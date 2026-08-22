import { eq, desc, count } from "drizzle-orm";
import { db, type Database } from "../db";
import { users, type User, type NewUser } from "../db/schema/users";

export class UserRepository {
  constructor(private readonly database: Database = db) {}

  async findById(id: number): Promise<User | undefined> {
    const result = await this.database
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const result = await this.database
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return result[0];
  }

  async findAll(limit: number = 10, offset: number = 0): Promise<User[]> {
    return this.database
      .select()
      .from(users)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt));
  }

  async count(): Promise<number> {
    const result = await this.database.select({ total: count() }).from(users);
    return Number(result[0]?.total ?? 0);
  }

  async create(userData: NewUser): Promise<User> {
    const result = await this.database
      .insert(users)
      .values({
        ...userData,
        email: userData.email.toLowerCase(),
      })
      .returning();
    const user = result[0];
    if (!user) {
      throw new Error("Failed to create user");
    }
    return user;
  }

  async update(id: number, userData: Partial<NewUser>): Promise<User | undefined> {
    const valuesToUpdate: Partial<NewUser> & { updatedAt: Date } = {
      ...userData,
      updatedAt: new Date(),
    };
    if (userData.email) {
      valuesToUpdate.email = userData.email.toLowerCase();
    }

    const result = await this.database
      .update(users)
      .set(valuesToUpdate)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.database
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return result.length > 0;
  }
}

export const userRepository = new UserRepository();

