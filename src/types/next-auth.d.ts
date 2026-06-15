import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      roleId: string;
      roleKey: string;
      roleLabel: string;
      isSuper: boolean;
      permissions: string[];
    };
  }

  interface User {
    roleId?: string;
    roleKey?: string;
    roleLabel?: string;
    isSuper?: boolean;
    permissions?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roleId?: string;
    roleKey?: string;
    roleLabel?: string;
    isSuper?: boolean;
    permissions?: string[];
  }
}
