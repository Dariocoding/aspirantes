import {
  inventarioPathPrefixes,
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
  BookOpen,
  CalendarDays,
  FileSearch,
  Home,
  KeyRound,
  LayoutGrid,
  Medal,
  ClipboardList,
  Shield,
  Users,
  Warehouse,
} from "lucide-react";

export type AppId = "personal" | "sistema" | "inventario";

/**
 * Estructura en `src/app/(dashboard)/`:
 * - `(hub)/` — portal `/`
 * - `(personal)/personal/` — gestión de personal (`/personal/*`)
 * - `(sistema)/sistema/` — usuarios y auditorías (`/sistema/*`)
 * - `(inventario)/inventario/` — inventario del rancho (`/inventario/*`)
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
};

export const APPS: Record<AppId, AppDefinition> = {
  personal: {
    id: "personal",
    name: "Gestión de personal",
    shortName: "Personal",
    description:
      "Censo y administración de aspirantes, efemérides, esquelas y convocatorias del Ejército Bolivariano.",
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
  inventario: {
    id: "inventario",
    name: "Control de inventario",
    shortName: "Inventario",
    description:
      "Existencias, entradas y salidas de insumos en el rancho.",
    homeHref: routes.inventario.home,
    pathPrefixes: inventarioPathPrefixes,
    accessPermissions: [Permission.INVENTARIO_RANCHO_READ],
  },
};

export const APP_LIST: AppDefinition[] = [
  APPS.personal,
  APPS.sistema,
  APPS.inventario,
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
  { href: routes.personal.manual, label: "Manual de usuario", icon: BookOpen },
];

const personalConfigLinks: AppNavLink[] = [
  { href: routes.personal.efemerides, label: "Efemérides", icon: CalendarDays },
  { href: routes.personal.esquelas, label: "Esquelas", icon: Medal },
  {
    href: routes.personal.convocatorias,
    label: "Convocatorias",
    icon: BookMarked,
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

const inventarioLinks: AppNavLink[] = [
  { href: routes.inventario.home, label: "Inicio", icon: Home },
  {
    href: routes.inventario.rancho,
    label: "Rancho",
    icon: Warehouse,
    permission: Permission.INVENTARIO_RANCHO_READ,
  },
  {
    href: routes.inventario.ranchoReportes,
    label: "Reportes del rancho",
    icon: ClipboardList,
    permission: Permission.INVENTARIO_RANCHO_READ,
  },
];

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

  if (appId === "inventario") {
    return { main: filterByPermission(inventarioLinks) };
  }

  return {
    main: filterByPermission(personalMainLinks),
    config: filterByPermission(personalConfigLinks),
  };
}

export function getAppHeader(appId: AppId | "hub"): {
  title: string;
  subtitle: string;
} {
  if (appId === "hub") {
    return {
      title: "Portal de aplicaciones",
      subtitle: "Seleccione una aplicación para continuar",
    };
  }

  const app = APPS[appId];
  return {
    title: app.name,
    subtitle: app.description,
  };
}

export { routes };
