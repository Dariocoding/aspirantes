"use client";

import { Plus, Save, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { updateUsuarioActive, updateUsuarioRole } from "@src/app/actions/usuarios";
import { UsuarioCreateForm } from "@dashboard/usuarios/_components/usuario-create-form";
import { Button, buttonVariants } from "@src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@src/components/ui/dialog";
import type { AuthRoleSummary } from "@src/lib/auth/rbac";
import { cn } from "@src/lib/utils";

export function UsuarioCreateDialog({ assignableRoles }: { assignableRoles: AuthRoleSummary[] }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ size: "lg" }),
          "w-full justify-center gap-2 border-slate-800 bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus-visible:ring-slate-400 sm:w-auto",
        )}
      >
        <Plus className="h-4 w-4" aria-hidden />
        Nuevo usuario
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar usuario</DialogTitle>
          <DialogDescription>
            Alta de cuenta con correo, nombre, contraseña inicial y rol. No es posible asignar el rol de super
            administrador desde la interfaz.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5">{open ? <UsuarioCreateForm assignableRoles={assignableRoles} onDone={close} /> : null}</div>
      </DialogContent>
    </Dialog>
  );
}

export type UsuarioRoleTarget = {
  id: string;
  email: string | null;
  name: string | null;
  roleId: string;
  roleLabel: string;
};

export function UsuarioRoleDialog({
  user,
  open,
  onOpenChange,
  assignableRoles,
}: {
  user: UsuarioRoleTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignableRoles: AuthRoleSummary[];
}) {
  const router = useRouter();
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const submit = async (formData: FormData) => {
    await updateUsuarioRole(formData);
    router.refresh();
    close();
  };

  const defaultRoleId =
    user && assignableRoles.some((r) => r.id === user.roleId)
      ? user.roleId
      : assignableRoles[0]?.id ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 shrink-0 text-slate-700" aria-hidden />
            Cambiar rol
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{user?.email ?? "Usuario seleccionado"}</span>
            {user?.name ? (
              <>
                <span className="text-muted-foreground"> · </span>
                <span>{user.name}</span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5">
          {open && user ? (
            <form action={submit} className="flex flex-col gap-4">
              <input type="hidden" name="userId" value={user.id} />
              <div className="flex flex-col gap-2">
                <label htmlFor={`usuario-role-${user.id}`} className="text-sm font-medium text-slate-800">
                  Rol en el sistema
                </label>
                <select
                  id={`usuario-role-${user.id}`}
                  name="roleId"
                  required
                  defaultValue={defaultRoleId}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
                >
                  {assignableRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {!assignableRoles.some((r) => r.id === user.roleId) ? (
                  <p className="text-xs text-amber-800">
                    Rol actual ({user.roleLabel}) no es asignable; al guardar se aplicará el rol seleccionado.
                  </p>
                ) : null}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={close}>
                  Cancelar
                </Button>
                <Button type="submit" className="gap-2 bg-slate-900 shadow-sm hover:bg-slate-800">
                  <Save className="h-4 w-4" aria-hidden />
                  Guardar rol
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type UsuarioToggleTarget = {
  id: string;
  email: string | null;
  active: boolean;
};

export function UsuarioToggleActiveDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UsuarioToggleTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const nextActive = user ? !user.active : false;

  const submit = async (formData: FormData) => {
    await updateUsuarioActive(formData);
    router.refresh();
    close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user?.active ? "Suspender acceso" : "Reactivar acceso"}</DialogTitle>
          <DialogDescription>
            {user?.active ? (
              <>
                El usuario no podrá iniciar sesión hasta que reactive su cuenta.
                {user.email ? (
                  <>
                    {" "}
                    <span className="font-medium text-slate-800">{user.email}</span>
                  </>
                ) : null}
              </>
            ) : (
              <>
                Se restaurará el acceso al sistema para{" "}
                {user?.email ? <span className="font-medium text-slate-800">{user.email}</span> : "este usuario"}.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 px-5 pb-5">
          {open && user ? (
            <form action={submit} className="flex justify-end gap-2">
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="active" value={nextActive ? "true" : "false"} />
              <Button type="button" variant="outline" onClick={close}>
                Cancelar
              </Button>
              <Button type="submit" variant={user.active ? "destructive" : "default"} className="shadow-sm">
                {user.active ? "Desactivar" : "Activar"}
              </Button>
            </form>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
