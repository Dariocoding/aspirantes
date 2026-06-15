"use client";

import { useCallback, useMemo, useState } from "react";
import type { RoleRow } from "@dashboard/sistema/roles/_components/types";

export function useRoleEditor(roles: RoleRow[]) {
  const initialId = roles.find((r) => !r.isSuper)?.id ?? roles[0]?.id ?? null;
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(initialId);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const [checkedPerms, setCheckedPerms] = useState<Set<string>>(
    () => new Set(selectedRole?.permissionIds ?? []),
  );

  const selectRole = useCallback((role: RoleRow) => {
    setSelectedRoleId(role.id);
    setCheckedPerms(new Set(role.permissionIds));
  }, []);

  const togglePerm = useCallback((id: string) => {
    setCheckedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setModulePerms = useCallback((ids: string[], enabled: boolean) => {
    setCheckedPerms((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (enabled) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const isDirty =
    selectedRole &&
    !selectedRole.isSuper &&
    (checkedPerms.size !== selectedRole.permissionIds.length ||
      selectedRole.permissionIds.some((id) => !checkedPerms.has(id)));

  return {
    selectedRoleId,
    selectedRole,
    checkedPerms,
    selectRole,
    togglePerm,
    setModulePerms,
    isDirty: Boolean(isDirty),
  };
}
