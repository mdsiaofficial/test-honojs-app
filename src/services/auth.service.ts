import { sign, verify } from "hono/jwt";
import { userRepository, UserRepository } from "../repositories/user.repository";
import { AppError } from "../middlewares/error.middleware";
import { env } from "../config/env";
import type { RegisterInput, LoginInput } from "../validators/auth.validator";
import type { AuthUser, JWTPayload } from "../types";
import type { User } from "../db/schema/users";

export class AuthService {
  constructor(private readonly userRepo: UserRepository = userRepository) {}

  async register(input: RegisterInput): Promise<{ user: Omit<User, "passwordHash">; token: string }> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new AppError("A user with this email already exists", 409);
    }

    // Hash password with Bun.password
    const passwordHash = await Bun.password.hash(input.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    const user = await this.userRepo.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role || "user",
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role as AuthUser["role"],
    };

    const token = await this.generateToken(authUser);

    const { passwordHash: _, ...sanitizedUser } = user;
    return {
      user: sanitizedUser,
      token,
    };
  }

  async login(input: LoginInput): Promise<{ user: Omit<User, "passwordHash">; token: string }> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isValidPassword = await Bun.password.verify(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError("Invalid email or password", 401);
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role as AuthUser["role"],
    };

    const token = await this.generateToken(authUser);

    const { passwordHash: _, ...sanitizedUser } = user;
    return {
      user: sanitizedUser,
      token,
    };
  }

  async generateToken(user: AuthUser): Promise<string> {
    const payload: JWTPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      iat: Math.floor(Date.now() / 1000),
    };

    return await sign(payload, env.JWT_SECRET, "HS256");
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = await verify(token, env.JWT_SECRET, "HS256");
      return decoded as unknown as JWTPayload;
    } catch {
      throw new AppError("Invalid or expired authentication token", 401);
    }
  }

  async getMe(userId: number): Promise<Omit<User, "passwordHash">> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const { passwordHash: _, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

export const authService = new AuthService();

