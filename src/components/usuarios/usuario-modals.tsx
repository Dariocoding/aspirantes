"use client";

import { Plus, Save, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { updateUsuarioActive, updateUsuarioRole } from "@/app/actions/usuarios";
import { UsuarioCreateForm } from "@/components/forms/usuario-create-form";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { userRoleLabel } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/generated/prisma";

export function UsuarioCreateDialog({ assignableRoles }: { assignableRoles: UserRole[] }) {
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
            Alta de cuenta con correo, nombre, contraseña inicial y rol. Los roles disponibles dependen de su propio
            nivel (solo un super administrador puede crear otro super administrador).
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
  role: UserRole;
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
  assignableRoles: UserRole[];
}) {
  const router = useRouter();
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const submit = async (formData: FormData) => {
    await updateUsuarioRole(formData);
    router.refresh();
    close();
  };

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
                  name="role"
                  required
                  defaultValue={assignableRoles.includes(user.role) ? user.role : assignableRoles[0]}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
                >
                  {assignableRoles.map((r) => (
                    <option key={r} value={r}>
                      {userRoleLabel(r)}
                    </option>
                  ))}
                </select>
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
