import { auth } from "@/auth";
import type { Session } from "next-auth";
import { redirect, unauthorized } from "next/navigation";
import { canWrite as roleCanWrite } from "@/lib/auth/roles";
import { hasPermission, Permission } from "@/lib/auth/permissions";

const SIN_PERMISO_ESCRITURA = "/sin-permiso?motivo=escritura";
const SIN_PERMISO_ADMIN = "/sin-permiso?motivo=administracion";

export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) unauthorized();
  return session;
}

export async function requireWriter(): Promise<Session> {
  const session = await requireSession();
  if (!roleCanWrite(session.user.role)) redirect(SIN_PERMISO_ESCRITURA);
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (!hasPermission(session.user.role, Permission.USERS_READ)) redirect(SIN_PERMISO_ADMIN);
  return session;
}
