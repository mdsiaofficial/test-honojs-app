export type TUserRole = "user" | "admin";

export interface TAuthUser {
  id: number;
  email: string;
  role: TUserRole;
}

export type THonoEnv = {
  Variables: {
    user: TAuthUser;
  };
};