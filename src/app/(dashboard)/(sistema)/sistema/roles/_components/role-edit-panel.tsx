"use client";

import { deleteAuthRole, updateAuthRole } from "@src/app/actions/rbac";
import type { RoleRow } from "@dashboard/sistema/roles/_components/types";
import { Button } from "@src/components/ui/button";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import { Pencil, Trash2 } from "lucide-react";

type Props = {
  role: RoleRow;
  canManageRoles: boolean;
  onRefresh: () => void;
};

export function RoleEditPanel({ role, canManageRoles, onRefresh }: Props) {
  if (!canManageRoles || role.isSuper) return null;

  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        Datos del rol
      </p>
      <form
        action={async (fd) => {
          await updateAuthRole(fd);
          onRefresh();
        }}
        className="grid gap-3 sm:grid-cols-2"
      >
        <input type="hidden" name="roleId" value={role.id} />
        <div className="sm:col-span-2">
          <Label className="text-xs text-slate-600">Nombre visible</Label>
          <Input
            name="label"
            defaultValue={role.label}
            required
            className="mt-1 h-8 bg-white text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs text-slate-600">Descripción</Label>
          <Input
            name="description"
            defaultValue={role.description ?? ""}
            className="mt-1 h-8 bg-white text-sm"
            placeholder="Opcional"
          />
        </div>
        {/*     <div>
          <Label className="text-xs text-slate-600">Orden</Label>
          <Input
            name="sortOrder"
            type="number"
            defaultValue={role.sortOrder}
            className="mt-1 h-8 bg-white text-sm"
          />
        </div> */}
        <div className="flex items-end">
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="shadow-sm"
          >
            Guardar datos
          </Button>
        </div>
      </form>

      {!role.isSystem && role.userCount === 0 ? (
        <form
          action={async () => {
            await deleteAuthRole(role.id);
            onRefresh();
          }}
          className="mt-4 border-t border-slate-200/80 pt-4"
        >
          <Button
            type="submit"
            size="sm"
            variant="destructive"
            className="gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Eliminar rol vacío
          </Button>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Solo si no tiene usuarios asignados.
          </p>
        </form>
      ) : null}
    </div>
  );
}
