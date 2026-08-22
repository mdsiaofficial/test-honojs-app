import { userRepository, UserRepository } from "../repositories/user.repository";
import { AppError } from "../middlewares/error.middleware";
import type { UpdateUserInput } from "../validators/user.validator";
import type { AuthUser } from "../types";
import type { User, NewUser } from "../db/schema/users";

export class UserService {
  constructor(private readonly userRepo: UserRepository = userRepository) {}

  private sanitizeUser(user: User): Omit<User, "passwordHash"> {
    const { passwordHash: _, ...sanitized } = user;
    return sanitized;
  }

  async getUserById(id: number): Promise<Omit<User, "passwordHash">> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return this.sanitizeUser(user);
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<{
    users: Omit<User, "passwordHash">[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const offset = (page - 1) * limit;
    const [userList, total] = await Promise.all([
      this.userRepo.findAll(limit, offset),
      this.userRepo.count(),
    ]);

    return {
      users: userList.map((u) => this.sanitizeUser(u)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async updateUser(
    id: number,
    input: UpdateUserInput,
    requestingUser: AuthUser
  ): Promise<Omit<User, "passwordHash">> {
    // Only allow updating own profile unless admin
    if (requestingUser.id !== id && requestingUser.role !== "admin") {
      throw new AppError("You do not have permission to update this user", 403);
    }

    const existing = await this.userRepo.findById(id);
    if (!existing) {
      throw new AppError("User not found", 404);
    }

    if (input.email && input.email !== existing.email) {
      const emailInUse = await this.userRepo.findByEmail(input.email);
      if (emailInUse) {
        throw new AppError("Email is already taken", 409);
      }
    }

    // Prepare update data
    const updateData: Partial<NewUser> = {};
    if (input.name) updateData.name = input.name;
    if (input.email) updateData.email = input.email;
    if (input.role && requestingUser.role === "admin") updateData.role = input.role;

    if (input.password) {
      updateData.passwordHash = await Bun.password.hash(input.password, {
        algorithm: "bcrypt",
        cost: 10,
      });
    }

    const updated = await this.userRepo.update(id, updateData);
    if (!updated) {
      throw new AppError("Failed to update user", 500);
    }

    return this.sanitizeUser(updated);
  }

  async deleteUser(id: number, requestingUser: AuthUser): Promise<void> {
    // Only allow self deletion or admin deletion
    if (requestingUser.id !== id && requestingUser.role !== "admin") {
      throw new AppError("You do not have permission to delete this user", 403);
    }

    const existing = await this.userRepo.findById(id);
    if (!existing) {
      throw new AppError("User not found", 404);
    }

    const deleted = await this.userRepo.delete(id);
    if (!deleted) {
      throw new AppError("Failed to delete user", 500);
    }
  }
}

export const userService = new UserService();

