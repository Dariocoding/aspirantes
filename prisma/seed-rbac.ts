import type { PrismaClient } from "../src/generated/prisma";
import {
  RBAC_MODULES,
  SYSTEM_ROLE_IDS,
  SYSTEM_ROLE_PERMISSIONS,
} from "../src/lib/auth/rbac-catalog";

/**
 * Sincroniza módulos, permisos y permisos de roles del sistema.
 * Idempotente: crea lo que falta y actualiza etiquetas.
 */
export async function seedRbac(client: PrismaClient) {
  const permissionIdByKey = new Map<string, string>();

  for (const mod of RBAC_MODULES) {
    const dbModule = await client.authModule.upsert({
      where: { key: mod.key },
      create: {
        key: mod.key,
        label: mod.label,
        description: mod.description,
        appId: mod.appId,
        sortOrder: mod.sortOrder,
      },
      update: {
        label: mod.label,
        description: mod.description,
        appId: mod.appId,
        sortOrder: mod.sortOrder,
      },
    });

    for (const perm of mod.permissions) {
      const dbPerm = await client.authPermission.upsert({
        where: { key: perm.key },
        create: {
          key: perm.key,
          label: perm.label,
          description: perm.description,
          moduleId: dbModule.id,
        },
        update: {
          label: perm.label,
          description: perm.description,
          moduleId: dbModule.id,
        },
      });
      permissionIdByKey.set(perm.key, dbPerm.id);
    }
  }

  const roleMeta: Record<
    string,
    { id: string; label: string; description: string; sortOrder: number; isSuper: boolean; assignable: boolean }
  > = {
    SUPER_ADMIN: {
      id: SYSTEM_ROLE_IDS.SUPER_ADMIN,
      label: "Super administrador",
      description: "Acceso total; no se asigna desde la interfaz.",
      sortOrder: 0,
      isSuper: true,
      assignable: false,
    },
    ADMIN: {
      id: SYSTEM_ROLE_IDS.ADMIN,
      label: "Administrador",
      description: "Gestión operativa y de usuarios.",
      sortOrder: 10,
      isSuper: false,
      assignable: true,
    },
    OPERADOR: {
      id: SYSTEM_ROLE_IDS.OPERADOR,
      label: "Operador",
      description: "Registro y edición de aspirantes, efemérides y esquelas.",
      sortOrder: 20,
      isSuper: false,
      assignable: true,
    },
    CONSULTA: {
      id: SYSTEM_ROLE_IDS.CONSULTA,
      label: "Solo consulta",
      description: "Lectura del censo y panel principal.",
      sortOrder: 30,
      isSuper: false,
      assignable: true,
    },
  };

  for (const [roleKey, meta] of Object.entries(roleMeta)) {
    const role = await client.authRole.upsert({
      where: { key: roleKey },
      create: {
        id: meta.id,
        key: roleKey,
        label: meta.label,
        description: meta.description,
        isSystem: true,
        assignable: meta.assignable,
        isSuper: meta.isSuper,
        sortOrder: meta.sortOrder,
      },
      update: {
        label: meta.label,
        description: meta.description,
        assignable: meta.assignable,
        isSuper: meta.isSuper,
        sortOrder: meta.sortOrder,
      },
    });

    const wantedKeys = SYSTEM_ROLE_PERMISSIONS[roleKey] ?? [];
    const wantedIds = wantedKeys
      .map((k) => permissionIdByKey.get(k))
      .filter((id): id is string => !!id);

    await client.authRolePermission.deleteMany({
      where: {
        roleId: role.id,
        permissionId: { notIn: wantedIds.length ? wantedIds : ["__none__"] },
      },
    });

    for (const permissionId of wantedIds) {
      await client.authRolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId },
        },
        create: { roleId: role.id, permissionId },
        update: {},
      });
    }
  }

}
