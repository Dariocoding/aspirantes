import type { AppId } from "@src/lib/apps/registry";

export type ModuleRow = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  appId: AppId;
  sortOrder: number;
  permissions: { id: string; key: string; label: string; description: string | null }[];
};

export type RoleRow = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  isSystem: boolean;
  isSuper: boolean;
  assignable: boolean;
  sortOrder: number;
  userCount: number;
  permissionIds: string[];
};

export type RolesPermisosViewProps = {
  modules: ModuleRow[];
  roles: RoleRow[];
  canManageRoles: boolean;
  canManageModules: boolean;
};
