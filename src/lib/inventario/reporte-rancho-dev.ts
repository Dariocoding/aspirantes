import type { AuthContext } from "@src/lib/auth/session";

/** Hostnames permitidos para operaciones de desarrollo en local. */
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function isLocalhostHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const hostname = host.split(":")[0]?.trim().toLowerCase() ?? "";
  return LOCAL_HOSTNAMES.has(hostname);
}

/** Super admin en localhost: puede eliminar reportes de prueba. */
export function canDeleteReporteRanchoEnLocalhost(
  ctx: AuthContext,
  host: string | null | undefined,
): boolean {
  return ctx.isSuper && isLocalhostHost(host);
}
