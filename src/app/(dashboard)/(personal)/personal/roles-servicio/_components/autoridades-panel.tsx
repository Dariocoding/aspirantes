"use client";

import { Pencil, Plus, Save, Trash2, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useState, useTransition } from "react";
import { createAutoridad, deleteAutoridad, updateAutoridad } from "@src/app/actions/autoridades";
import { Button, buttonVariants } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@src/components/ui/dialog";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/components/ui/select";
import { SuccessCelebrationDialog } from "@src/components/ui/success-celebration-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@src/components/ui/table";
import { useCelebrateOnOkTransition } from "@src/hooks/use-celebrate-on-ok-transition";
import type { AutoridadActionState } from "@src/lib/action-types";
import { autoridadInitialActionState } from "@src/lib/action-types";
import {
  JERARQUIA_AUTORIDAD_OPCIONES,
  labelJerarquiaAutoridad,
} from "@src/lib/roles-servicio/jerarquia-autoridad";
import type { JerarquiaAutoridad } from "@src/generated/prisma";
import { cn } from "@src/lib/utils";

export type AutoridadVista = {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string | null;
  telefono: string | null;
  correo: string | null;
  jerarquia: JerarquiaAutoridad;
  activa: boolean;
  asignaciones: number;
};

function ErrorList({ errors }: { errors: Record<string, string> }) {
  const entries = Object.entries(errors);
  if (!entries.length) return null;
  return (
    <ul className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 md:col-span-2">
      {entries.map(([k, v]) => (
        <li key={k}>
          <span className="font-medium">{k}:</span> {v}
        </li>
      ))}
    </ul>
  );
}

function JerarquiaSelect({ id, defaultValue }: { id: string; defaultValue: JerarquiaAutoridad }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Jerarquía</Label>
      <Select name="jerarquia" defaultValue={defaultValue} required modal={false}>
        <SelectTrigger id={id} size="default" className="h-9 w-full min-w-0 shadow-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {JERARQUIA_AUTORIDAD_OPCIONES.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function AutoridadFormFields({ item }: { item?: AutoridadVista }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="nombres">Nombres</Label>
        <Input id="nombres" name="nombres" defaultValue={item?.nombres ?? ""} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="apellidos">Apellidos</Label>
        <Input id="apellidos" name="apellidos" defaultValue={item?.apellidos ?? ""} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cedula">Cédula (opcional)</Label>
        <Input id="cedula" name="cedula" defaultValue={item?.cedula ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="telefono">Teléfono (opcional)</Label>
        <Input id="telefono" name="telefono" defaultValue={item?.telefono ?? ""} />
      </div>
      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="correo">Correo (opcional)</Label>
        <Input id="correo" name="correo" type="email" defaultValue={item?.correo ?? ""} />
      </div>
      <JerarquiaSelect id="jerarquia" defaultValue={item?.jerarquia ?? "TENIENTE"} />
    </>
  );
}

function AutoridadCreateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createAutoridad, autoridadInitialActionState);
  const [celebrateOpen, setCelebrateOpen] = useCelebrateOnOkTransition(state.ok);

  const onCelebrateOpenChange = useCallback(
    (next: boolean) => {
      setCelebrateOpen(next);
      if (!next) {
        router.refresh();
        setOpen(false);
      }
    },
    [router, setCelebrateOpen],
  );

  return (
    <>
      <SuccessCelebrationDialog
        open={celebrateOpen}
        onOpenChange={onCelebrateOpenChange}
        variant="created"
        title="Autoridad registrada"
        description="Quedó vinculable a los roles de servicio."
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className={cn(buttonVariants({ size: "sm" }))}>
          <Plus data-icon="inline-start" />
          Nueva autoridad
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar autoridad</DialogTitle>
            <DialogDescription>
              Oficiales del cuadro vinculables a roles como el oficial de día.
            </DialogDescription>
          </DialogHeader>
          <form action={action} className="grid gap-3 md:grid-cols-2">
            <ErrorList errors={state.errors} />
            <AutoridadFormFields />
            <div className="flex justify-end md:col-span-2">
              <Button type="submit" disabled={pending}>
                <Save data-icon="inline-start" />
                Guardar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AutoridadEditDialog({
  item,
  open,
  onOpenChange,
}: {
  item: AutoridadVista;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateAutoridad, autoridadInitialActionState);
  const [celebrateOpen, setCelebrateOpen] = useCelebrateOnOkTransition(state.ok);

  const onCelebrateOpenChange = useCallback(
    (next: boolean) => {
      setCelebrateOpen(next);
      if (!next) {
        router.refresh();
        onOpenChange(false);
      }
    },
    [router, onOpenChange, setCelebrateOpen],
  );

  return (
    <>
      <SuccessCelebrationDialog
        open={celebrateOpen}
        onOpenChange={onCelebrateOpenChange}
        variant="saved"
        title="Autoridad actualizada"
        description="Los cambios se guardaron correctamente."
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar autoridad</DialogTitle>
            <DialogDescription>
              {item.nombres} {item.apellidos}
            </DialogDescription>
          </DialogHeader>
          <form action={action} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="id" value={item.id} />
            <ErrorList errors={state.errors} />
            <AutoridadFormFields item={item} />
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input type="checkbox" name="activa" value="true" defaultChecked={item.activa} />
              Activa en el cuadro
            </label>
            <div className="flex justify-end md:col-span-2">
              <Button type="submit" disabled={pending}>
                <Save data-icon="inline-start" />
                Actualizar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AutoridadesPanel({ autoridades, canWrite }: { autoridades: AutoridadVista[]; canWrite: boolean }) {
  const router = useRouter();
  const [editTarget, setEditTarget] = useState<AutoridadVista | null>(null);
  const [pendingDelete, startDelete] = useTransition();

  const onDelete = (id: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar a ${nombre}? Se desvinculará de los roles de servicio.`)) return;
    startDelete(async () => {
      await deleteAutoridad(id);
      router.refresh();
    });
  };

  return (
    <Card className="gap-0 py-0 shadow-sm ring-slate-200/80">
      <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-indigo-50/60 to-white px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-2.5">
            <UserCog className="mt-0.5 size-5 shrink-0 text-indigo-800" aria-hidden />
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">Autoridades del cuadro</CardTitle>
              <CardDescription className="text-xs leading-snug text-slate-600">
                Oficiales vinculados por nombre a los roles de servicio (p. ej. oficial de día).
                <span className="text-slate-400"> · </span>
                <span className="font-medium tabular-nums text-slate-800">{autoridades.length}</span> registradas
              </CardDescription>
            </div>
          </div>
          {canWrite ? <AutoridadCreateDialog /> : null}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jerarquía</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead className="text-right">Roles</TableHead>
              {canWrite ? <TableHead className="w-24 text-right">Acciones</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {autoridades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canWrite ? 6 : 5} className="py-10 text-center text-sm text-slate-500">
                  No hay autoridades registradas. Agrégalas para vincular oficiales en los roles de servicio.
                </TableCell>
              </TableRow>
            ) : (
              autoridades.map((item) => (
                <TableRow key={item.id} className={cn(!item.activa && "opacity-60")}>
                  <TableCell className="text-xs font-medium text-indigo-900">
                    {labelJerarquiaAutoridad(item.jerarquia)}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-slate-900">
                      {item.nombres} {item.apellidos}
                    </p>
                    {!item.activa ? <p className="text-[11px] text-slate-500">Inactiva</p> : null}
                  </TableCell>
                  <TableCell className="tabular-nums text-slate-600">{item.cedula ?? "—"}</TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {item.telefono ? <p>{item.telefono}</p> : null}
                    {item.correo ? <p className="truncate">{item.correo}</p> : null}
                    {!item.telefono && !item.correo ? "—" : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{item.asignaciones}</TableCell>
                  {canWrite ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setEditTarget(item)}>
                          <Pencil />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={pendingDelete}
                          onClick={() => onDelete(item.id, `${item.nombres} ${item.apellidos}`)}
                        >
                          <Trash2 />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      {editTarget ? (
        <AutoridadEditDialog item={editTarget} open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)} />
      ) : null}
    </Card>
  );
}
