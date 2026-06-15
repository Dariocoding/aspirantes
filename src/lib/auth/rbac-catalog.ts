import type { AppId } from "@src/lib/apps/registry";

/**
 * Catálogo base de módulos y permisos. El seed los sincroniza con la base de datos.
 * Las claves deben coincidir con `Permission` en permissions.ts.
 */
export type RbacModuleSeed = {
  key: string;
  label: string;
  description?: string;
  /** Aplicación del portal a la que pertenece el módulo. */
  appId: AppId;
  sortOrder: number;
  permissions: {
    key: string;
    label: string;
    description?: string;
  }[];
};

export const RBAC_MODULES: RbacModuleSeed[] = [
  {
    key: "dashboard",
    label: "Panel principal",
    description: "Portal de aplicaciones y acceso general.",
    appId: "personal",
    sortOrder: 0,
    permissions: [{ key: "dashboard.read", label: "Ver panel principal" }],
  },
  {
    key: "aspirantes",
    label: "Censo de aspirantes",
    appId: "personal",
    sortOrder: 10,
    permissions: [
      { key: "aspirantes.read", label: "Consultar aspirantes" },
      { key: "aspirantes.write", label: "Registrar y editar aspirantes" },
    ],
  },
  {
    key: "convocatorias",
    label: "Convocatorias",
    appId: "personal",
    sortOrder: 20,
    permissions: [
      { key: "convocatorias.manage", label: "Gestionar convocatorias" },
    ],
  },
  {
    key: "efemerides",
    label: "Efemérides",
    appId: "personal",
    sortOrder: 30,
    permissions: [{ key: "efemerides.write", label: "Gestionar efemérides" }],
  },
  {
    key: "esquelas",
    label: "Esquelas",
    appId: "personal",
    sortOrder: 40,
    permissions: [{ key: "esquelas.write", label: "Gestionar esquelas" }],
  },
  {
    key: "users",
    label: "Usuarios",
    appId: "sistema",
    sortOrder: 50,
    permissions: [
      { key: "users.read", label: "Ver usuarios" },
      { key: "users.manage", label: "Crear y editar usuarios" },
      { key: "users.super", label: "Gestionar super administradores" },
    ],
  },
  {
    key: "audit",
    label: "Auditoría",
    appId: "sistema",
    sortOrder: 60,
    permissions: [{ key: "audit.read", label: "Consultar auditoría" }],
  },
  {
    key: "rbac",
    label: "Roles y permisos",
    description: "Configuración de roles, módulos y permisos del sistema.",
    appId: "sistema",
    sortOrder: 70,
    permissions: [
      { key: "roles.read", label: "Ver roles y módulos" },
      {
        key: "roles.manage",
        label: "Gestionar roles y asignación de permisos",
      },
      { key: "modules.manage", label: "Crear módulos y permisos" },
    ],
  },
  {
    key: "inventario_rancho",
    label: "Inventario — Rancho",
    description:
      "Control de existencias, entradas y salidas de insumos alimenticios.",
    appId: "inventario",
    sortOrder: 80,
    permissions: [
      {
        key: "inventario.rancho.read",
        label: "Consultar inventario del rancho",
      },
      {
        key: "inventario.rancho.write",
        label: "Registrar entradas y salidas del rancho",
      },
    ],
  },
];

/** Permisos por rol del sistema (clave de rol → claves de permiso). */
export const SYSTEM_ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  SUPER_ADMIN: RBAC_MODULES.flatMap((m) => m.permissions.map((p) => p.key)),
  ADMIN: [
    "dashboard.read",
    "aspirantes.read",
    "aspirantes.write",
    "convocatorias.manage",
    "efemerides.write",
    "esquelas.write",
    "users.read",
    "users.manage",
    "audit.read",
    "roles.read",
    "inventario.rancho.read",
    "inventario.rancho.write",
  ],
  OPERADOR: [
    "dashboard.read",
    "aspirantes.read",
    "aspirantes.write",
    "efemerides.write",
    "esquelas.write",
  ],
  CONSULTA: ["dashboard.read", "aspirantes.read"],
};

export const SYSTEM_ROLE_IDS = {
  SUPER_ADMIN: "authrole_super_admin",
  ADMIN: "authrole_admin",
  OPERADOR: "authrole_operador",
  CONSULTA: "authrole_consulta",
} as const;
