"use client";

import { RolePermissionsPanel } from "@dashboard/sistema/roles/_components/role-permissions-panel";
import { RolesListPanel } from "@dashboard/sistema/roles/_components/roles-list-panel";
import type { RolesPermisosViewProps } from "@dashboard/sistema/roles/_components/types";
import { useRoleEditor } from "@dashboard/sistema/roles/_components/use-role-editor";
import { useRouter } from "next/navigation";

export type { ModuleRow, RoleRow } from "@dashboard/sistema/roles/_components/types";

export function RolesPermisosView({
  modules,
  roles,
  canManageRoles,
  canManageModules,
}: RolesPermisosViewProps) {
  const router = useRouter();
  const refresh = () => router.refresh();

  const {
    selectedRoleId,
    selectedRole,
    checkedPerms,
    selectRole,
    togglePerm,
    setModulePerms,
    isDirty,
  } = useRoleEditor(roles);

  return (
    <div className="space-y-5 pb-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(260px,300px)_1fr] lg:items-start">
        <RolesListPanel
          roles={roles}
          selectedRoleId={selectedRoleId}
          onSelectRole={selectRole}
          canManageRoles={canManageRoles}
          onRefresh={refresh}
        />
        <RolePermissionsPanel
          modules={modules}
          selectedRole={selectedRole}
          checkedPerms={checkedPerms}
          canManageRoles={canManageRoles}
          isDirty={isDirty}
          onTogglePerm={togglePerm}
          onSetModulePerms={setModulePerms}
          onRefresh={refresh}
        />
      </div>
      {/*       <ModulesCatalog modules={modules} canManageModules={canManageModules} onRefresh={refresh} />
       */}{" "}
    </div>
  );
}
