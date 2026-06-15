import { auth } from "@src/auth";
import { canAccessApp, type AppId } from "@src/lib/apps/registry";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { redirect, unauthorized } from "next/navigation";

/** Bloquea rutas de una aplicación si el usuario no tiene acceso al portal correspondiente. */
export async function requireAppAccess(appId: AppId) {
  const session = await auth();
  if (!session?.user) unauthorized();
  if (!canAccessApp(authContextFromSession(session), appId)) {
    redirect("/sin-permiso?motivo=administracion");
  }
}
