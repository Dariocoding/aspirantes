import { auth } from "@src/auth";
import type { Session } from "next-auth";
import { redirect, unauthorized } from "next/navigation";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { canWrite } from "@src/lib/auth/roles";
import { hasPermission, Permission, type PermissionKey } from "@src/lib/auth/permissions";
import type { AuthContext } from "@src/lib/auth/session";

const SIN_PERMISO_ESCRITURA = "/sin-permiso?motivo=escritura";
const SIN_PERMISO_ADMIN = "/sin-permiso?motivo=administracion";

export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) unauthorized();
  return session;
}

export async function requireWriter(): Promise<Session> {
  const session = await requireSession();
  if (!canWrite(authContextFromSession(session))) redirect(SIN_PERMISO_ESCRITURA);
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (!hasPermission(authContextFromSession(session), Permission.USERS_READ)) {
    redirect(SIN_PERMISO_ADMIN);
  }
  return session;
}

export async function requirePermission(permission: string): Promise<Session> {
  const session = await requireSession();
  if (!hasPermission(authContextFromSession(session), permission)) {
    redirect(SIN_PERMISO_ADMIN);
  }
  return session;
}

export async function requireAnyPermission(permissions: readonly PermissionKey[]): Promise<Session> {
  const session = await requireSession();
  const ctx = authContextFromSession(session);
  if (!permissions.some((p) => hasPermission(ctx, p))) {
    redirect(SIN_PERMISO_ADMIN);
  }
  return session;
}

export function hasAnyPermission(ctx: AuthContext, permissions: readonly PermissionKey[]): boolean {
  return permissions.some((p) => hasPermission(ctx, p));
}
