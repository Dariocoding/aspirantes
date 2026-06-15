import type { ModuleRow } from "@dashboard/sistema/roles/_components/types";
import { APPS, APP_LIST, type AppId } from "@src/lib/apps/registry";

/** Claves de módulo conocidas → aplicación (respaldo si falta `appId` en BD). */
export const MODULE_APP_BY_KEY: Record<string, AppId> = {
  dashboard: "personal",
  aspirantes: "personal",
  convocatorias: "personal",
  efemerides: "personal",
  esquelas: "personal",
  users: "sistema",
  audit: "sistema",
  rbac: "sistema",
  inventario_rancho: "inventario",
};

export const RBAC_APP_ORDER: AppId[] = ["personal", "sistema", "inventario"];

export function resolveModuleAppId(mod: Pick<ModuleRow, "key" | "appId">): AppId {
  if (mod.appId === "personal" || mod.appId === "sistema" || mod.appId === "inventario") return mod.appId;
  return MODULE_APP_BY_KEY[mod.key] ?? "personal";
}

export type ModulesByAppGroup = {
  appId: AppId;
  name: string;
  shortName: string;
  description: string;
  modules: ModuleRow[];
};

export function groupModulesByApp(modules: ModuleRow[]): ModulesByAppGroup[] {
  const buckets: Record<AppId, ModuleRow[]> = { personal: [], sistema: [], inventario: [] };

  for (const mod of modules) {
    buckets[resolveModuleAppId(mod)].push(mod);
  }

  return RBAC_APP_ORDER.map((appId) => {
    const app = APPS[appId];
    const sorted = [...buckets[appId]].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, "es"),
    );
    return {
      appId,
      name: app.name,
      shortName: app.shortName,
      description: app.description,
      modules: sorted,
    };
  });
}

export function rbacAppSummaries(modules: ModuleRow[]) {
  return groupModulesByApp(modules).map((g) => ({
    appId: g.appId,
    shortName: g.shortName,
    moduleCount: g.modules.length,
    permissionCount: g.modules.reduce((n, m) => n + m.permissions.length, 0),
  }));
}

export { APP_LIST };
