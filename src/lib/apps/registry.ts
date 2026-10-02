import {
  personalPathPrefixes,
  routes,
  sistemaPathPrefixes,
} from "@src/lib/apps/routes";
import {
  Permission,
  hasPermission,
  type PermissionKey,
} from "@src/lib/auth/permissions";
import type { AuthContext } from "@src/lib/auth/session";
import type { LucideIcon } from "lucide-react";
import {
  BookMarked,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  FileSearch,
  Home,
  KeyRound,
  LayoutGrid,
  Medal,
  Settings2,
  Shield,
  Stamp,
  Users,
} from "lucide-react";

export type AppId = "personal" | "sistema";

/**
 * Estructura en `src/app/(dashboard)/`:
 * - `(hub)/` — portal `/`
 * - `(personal)/personal/` — gestión de personal (`/personal/*`)
 * - `(sistema)/sistema/` — usuarios y auditorías (`/sistema/*`)
 * - `sin-permiso/`, `_components/` — compartido entre apps
 */

export type AppDefinition = {
  id: AppId;
  name: string;
  shortName: string;
  description: string;
  homeHref: string;
  pathPrefixes: readonly string[];
  accessPermissions: readonly PermissionKey[];
};

export type AppNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: PermissionKey;
  /** Prefijos adicionales que marcan el enlace como activo (p. ej. hijos de Configuración). */
  matchPrefixes?: readonly string[];
};

export type ConfigCard = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: string;
  permission?: PermissionKey;
};

export const APPS: Record<AppId, AppDefinition> = {
  personal: {
    id: "personal",
    name: "Gestión de personal",
    shortName: "Personal",
    description:
      "Censo y administración de aspirantes, permisos, efemérides, esquelas y convocatorias del C.E.F.O.A.",
    homeHref: routes.personal.home,
    pathPrefixes: personalPathPrefixes,
    accessPermissions: [Permission.DASHBOARD_READ, Permission.ASPIRANTES_READ],
  },
  sistema: {
    id: "sistema",
    name: "Gestión de usuarios y auditorías",
    shortName: "Usuarios y auditorías",
    description:
      "Administración de cuentas, roles y registro de auditoría del sistema.",
    homeHref: routes.sistema.home,
    pathPrefixes: sistemaPathPrefixes,
    accessPermissions: [
      Permission.USERS_READ,
      Permission.AUDIT_READ,
      Permission.ROLES_READ,
    ],
  },
};

export const APP_LIST: AppDefinition[] = [
  APPS.personal,
  APPS.sistema,
];

const HUB_PATHS = new Set(["/", ""]);

export function isHubPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return HUB_PATHS.has(normalized);
}

export function resolveAppFromPathname(pathname: string): AppId | "hub" {
  if (isHubPath(pathname)) return "hub";
  for (const app of APP_LIST) {
    if (
      app.pathPrefixes.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      )
    ) {
      return app.id;
    }
  }
  return "hub";
}

export function canAccessApp(ctx: AuthContext, appId: AppId): boolean {
  const app = APPS[appId];
  return app.accessPermissions.some((key) => hasPermission(ctx, key));
}

export function listAccessibleApps(ctx: AuthContext): AppDefinition[] {
  return APP_LIST.filter((app) => canAccessApp(ctx, app.id));
}

const personalMainLinks: AppNavLink[] = [
  { href: routes.personal.home, label: "Dashboard", icon: Home },
  {
    href: routes.personal.aspirantes,
    label: "Censo de Aspirantes",
    icon: Users,
  },
  { href: routes.personal.rolesServicio, label: "Roles de servicio", icon: CalendarRange },
  { href: routes.personal.permisos, label: "Permisos", icon: CalendarClock },
  {
    href: routes.personal.configuracion,
    label: "Configuración",
    icon: Settings2,
    matchPrefixes: [
      routes.personal.efemerides,
      routes.personal.esquelas,
      routes.personal.membretes,
      routes.personal.convocatorias,
    ],
  },
];

/** Enlaces del área Configuración (visibles como tarjetas, no en el sidebar). */
export const personalConfigCards: ConfigCard[] = [
  {
    href: routes.personal.efemerides,
    label: "Efemérides",
    description: "Calendario cívico, feriados y conmemoraciones del año.",
    icon: CalendarDays,
    tone: "bg-emerald-50 text-emerald-800",
  },
  {
    href: routes.personal.esquelas,
    label: "Esquelas",
    description: "Generador de esquelas y plantilla ceremonial.",
    icon: Medal,
    tone: "bg-amber-50 text-amber-800",
  },
  {
    href: routes.personal.membretes,
    label: "Membretes",
    description: "Encabezados institucionales para documentos y exportaciones.",
    icon: Stamp,
    tone: "bg-sky-50 text-sky-800",
  },
  {
    href: routes.personal.convocatorias,
    label: "Convocatorias",
    description: "Períodos académicos, pelotones y comando del curso.",
    icon: BookMarked,
    tone: "bg-indigo-50 text-indigo-800",
    permission: Permission.CONVOCATORIAS_MANAGE,
  },
];

const sistemaLinks: AppNavLink[] = [
  { href: routes.sistema.home, label: "Inicio", icon: Home },
  {
    href: routes.sistema.usuarios,
    label: "Usuarios",
    icon: Shield,
    permission: Permission.USERS_READ,
  },
  {
    href: routes.sistema.roles,
    label: "Roles y permisos",
    icon: KeyRound,
    permission: Permission.ROLES_READ,
  },
  {
    href: routes.sistema.auditoria,
    label: "Auditoría",
    icon: FileSearch,
    permission: Permission.AUDIT_READ,
  },
];

export function listPersonalConfigCards(ctx: AuthContext): ConfigCard[] {
  return personalConfigCards.filter(
    (card) => !card.permission || hasPermission(ctx, card.permission),
  );
}

export function getSidebarNavForApp(
  appId: AppId | "hub",
  ctx: AuthContext,
): { main: AppNavLink[]; config?: AppNavLink[]; hub?: AppNavLink[] } {
  const filterByPermission = (links: AppNavLink[]) =>
    links.filter(
      (link) => !link.permission || hasPermission(ctx, link.permission),
    );

  if (appId === "hub") {
    return {
      main: [],
      hub: [
        { href: routes.hub, label: "Portal de aplicaciones", icon: LayoutGrid },
      ],
    };
  }

  if (appId === "sistema") {
    return { main: filterByPermission(sistemaLinks) };
  }

  return {
    main: filterByPermission(personalMainLinks),
  };
}

export function getAppHeader(appId: AppId | "hub"): {
  title: string;
  subtitle: string;
} {
  if (appId === "hub") {
    return {
      title: "Portal institucional",
      subtitle: "Seleccione un módulo para continuar",
    };
  }

  const app = APPS[appId];
  return {
    title: app.name,
    subtitle: app.description,
  };
}

export { routes };
