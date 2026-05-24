"use client";

import {
  Ban,
  Mail,
  Power,
  Shield,
  UserCircle,
  UserCog,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  UsuarioCreateDialog,
  UsuarioRoleDialog,
  type UsuarioRoleTarget,
  UsuarioToggleActiveDialog,
  type UsuarioToggleTarget,
} from "@/components/usuarios/usuario-modals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canManageUserWithRole, userRoleLabel } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/generated/prisma";

export type UsuarioListRow = {
  id: string;
  email: string | null;
  name: string | null;
  role: UserRole;
  active: boolean;
};

function roleBadgeClass(role: UserRole) {
  switch (role) {
    case "SUPER_ADMIN":
      return "border-amber-300 bg-amber-50 text-amber-950";
    case "ADMIN":
      return "border-violet-200 bg-violet-50 text-violet-900";
    case "OPERADOR":
      return "border-sky-200 bg-sky-50 text-sky-900";
    case "CONSULTA":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

type Props = {
  users: UsuarioListRow[];
  currentUserId: string;
  currentUserRole: UserRole;
  assignableRoles: UserRole[];
};

export function UsuariosView({ users, currentUserId, currentUserRole, assignableRoles }: Props) {
  const [roleTarget, setRoleTarget] = useState<UsuarioRoleTarget | null>(null);
  const [roleOpen, setRoleOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<UsuarioToggleTarget | null>(null);
  const [toggleOpen, setToggleOpen] = useState(false);

  const openRole = (u: UsuarioListRow) => {
    setRoleTarget({ id: u.id, email: u.email, name: u.name, role: u.role });
    setRoleOpen(true);
  };

  const openToggle = (u: UsuarioListRow) => {
    setToggleTarget({ id: u.id, email: u.email, active: u.active });
    setToggleOpen(true);
  };

  const onRoleOpenChange = (open: boolean) => {
    setRoleOpen(open);
    if (!open) setRoleTarget(null);
  };

  const onToggleOpenChange = (open: boolean) => {
    setToggleOpen(open);
    if (!open) setToggleTarget(null);
  };

  return (
    <div className="space-y-5">
      <UsuarioRoleDialog
        user={roleTarget}
        open={roleOpen}
        onOpenChange={onRoleOpenChange}
        assignableRoles={assignableRoles}
      />
      <UsuarioToggleActiveDialog user={toggleTarget} open={toggleOpen} onOpenChange={onToggleOpenChange} />

      <Card className="gap-0 py-0 shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 gap-2.5">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-slate-800" aria-hidden />
              <div className="min-w-0 space-y-0.5">
                <CardTitle className="text-base font-semibold text-slate-900">Usuarios del sistema</CardTitle>
                <CardDescription className="text-xs leading-snug text-slate-600">
                  Cuentas, roles y permisos (super administrador, administrador, operador o solo consulta).
                  <span className="text-slate-400"> · </span>
                  <span className="font-medium tabular-nums text-slate-800">{users.length}</span>
                  {users.length === 1 ? " cuenta" : " cuentas"}
                  <span className="text-slate-400"> · </span>
                  <span className="text-slate-500">
                    Use <span className="font-medium text-slate-700">Nuevo usuario</span> o las acciones en la tabla.
                  </span>
                </CardDescription>
              </div>
            </div>
            <UsuarioCreateDialog assignableRoles={assignableRoles} />
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white py-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white shadow-sm">
              <UserCircle className="h-4 w-4 text-slate-700" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-semibold text-slate-900">Cuentas registradas</CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Correo, nombre, rol y estado. No puede modificar ni desactivar su propia sesión.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          <div className="-mx-4 overflow-x-auto border-y border-slate-200/90 bg-white sm:mx-0 sm:border-x sm:border-t-0">
            <Table>
              <TableHeader className="[&_tr]:border-slate-200 [&_tr]:hover:bg-transparent">
                <TableRow className="border-slate-200 bg-slate-100/90 hover:bg-slate-100/90">
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Correo
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Nombre
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Rol
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Estado
                  </TableHead>
                  <TableHead className="h-11 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="h-32 whitespace-normal px-4 text-center text-sm text-slate-500">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <Users className="h-5 w-5" aria-hidden />
                        </div>
                        <p className="font-medium text-slate-700">No hay usuarios</p>
                        <p className="text-xs text-slate-500">Use «Nuevo usuario» para registrar la primera cuenta.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => {
                    const isSelf = u.id === currentUserId;
                    const canManage = canManageUserWithRole(currentUserRole, u.role);
                    return (
                      <TableRow key={u.id} className="border-slate-100 transition-colors">
                        <TableCell className="px-4 py-3">
                          <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-slate-900">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                            <span className="truncate">{u.email ?? "—"}</span>
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-slate-700">{u.name ?? "—"}</TableCell>
                        <TableCell className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              roleBadgeClass(u.role),
                            )}
                          >
                            <Shield className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
                            {userRoleLabel(u.role)}
                            {isSelf ? (
                              <span className="ml-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                (usted)
                              </span>
                            ) : null}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {u.active ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                              <Power className="h-3 w-3" aria-hidden />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                              <Ban className="h-3 w-3" aria-hidden />
                              Inactivo
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          {isSelf ? (
                            <span className="inline-flex items-center justify-end gap-1 text-xs text-slate-500">
                              <UserCog className="h-3.5 w-3.5" aria-hidden />
                              Cuenta actual
                            </span>
                          ) : !canManage ? (
                            <span className="inline-flex items-center justify-end gap-1 text-xs text-slate-500">
                              <Shield className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                              Solo super administrador
                            </span>
                          ) : (
                            <div className="inline-flex flex-wrap justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1.5 shadow-sm"
                                onClick={() => openRole(u)}
                              >
                                <Shield className="h-3.5 w-3.5" aria-hidden />
                                Rol
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1.5 shadow-sm"
                                onClick={() => openToggle(u)}
                              >
                                {u.active ? (
                                  <>
                                    <Ban className="h-3.5 w-3.5" aria-hidden />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <Power className="h-3.5 w-3.5" aria-hidden />
                                    Activar
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
