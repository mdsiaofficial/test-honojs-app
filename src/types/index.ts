export type UserRole = "user" | "admin";

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

export interface JWTPayload {
  [key: string]: unknown;
  id: number;
  email: string;
  role: UserRole;
  exp?: number;
  iat?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errors?: unknown;
}

export type HonoEnv = {
  Variables: {
    user: AuthUser;
  };
};

