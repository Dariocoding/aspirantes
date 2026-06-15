import type { Session } from "next-auth";
import type { AuthContext } from "@src/lib/auth/session";

export function authContextFromSession(session: Session): AuthContext {
  const u = session.user;
  return {
    roleId: u.roleId,
    roleKey: u.roleKey,
    roleLabel: u.roleLabel,
    isSuper: u.isSuper,
    permissions: u.permissions ?? [],
  };
}
