export type TUserRole = "user" | "admin";

export interface IAuthUser {
  id: number;
  email: string;
  role: TUserRole;
}

export type THonoEnv = {
  Variables: {
    user: IAuthUser;
  };
};