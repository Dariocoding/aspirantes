"use client";

import { CalendarDays, CalendarRange, ScrollText, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteEfemeride } from "@/app/actions/efemerides";
import {
  EfemerideCreateDialog,
  EfemerideEditDialog,
  EfemerideEditTriggerButton,
  type EfemerideRow,
} from "@/components/efemerides/efemeride-modals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canWrite } from "@/lib/auth/roles";
import { labelEfemerideTipo } from "@/lib/efemeride-tipo";
import { MESES_LOWER } from "@/lib/meses";
import { cn } from "@/lib/utils";
import type { Efemeride, UserRole } from "@/generated/prisma";

function formatEfemerideDate(dia: number, mes: number) {
  const nombreMes = MESES_LOWER[mes - 1] ?? `mes ${mes}`;
  return `${dia} de ${nombreMes}`;
}

function tipoBadgeClass(tipo: string) {
  switch (tipo.toUpperCase()) {
    case "FERIADO":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "PATRIO":
      return "border-red-200 bg-red-50 text-red-900";
    case "NACIONAL":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "CULTURAL":
      return "border-violet-200 bg-violet-50 text-violet-900";
    case "PROFESIONAL":
      return "border-sky-200 bg-sky-50 text-sky-900";
    case "HISTORICO":
      return "border-slate-300 bg-slate-100 text-slate-800";
    case "RELIGIOSO":
      return "border-indigo-200 bg-indigo-50 text-indigo-900";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function toRow(e: Efemeride): EfemerideRow {
  return {
    id: e.id,
    nombre: e.nombre,
    descripcion: e.descripcion,
    dia: e.dia,
    mes: e.mes,
    tipo: e.tipo,
    activa: e.activa,
  };
}

type Props = {
  efemerides: Efemeride[];
  role: UserRole;
};

export function EfemeridesView({ efemerides, role }: Props) {
  const write = canWrite(role);
  const [editTarget, setEditTarget] = useState<EfemerideRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const openEdit = (item: EfemerideRow) => {
    setEditTarget(item);
    setEditOpen(true);
  };

  const onEditOpenChange = (open: boolean) => {
    setEditOpen(open);
    if (!open) setEditTarget(null);
  };

  const colSpan = write ? 6 : 5;

  return (
    <div className="space-y-5">
      <EfemerideEditDialog item={editTarget} open={editOpen} onOpenChange={onEditOpenChange} />

      <Card className="gap-0 py-0 shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 gap-2.5">
              <CalendarRange className="mt-0.5 h-5 w-5 shrink-0 text-slate-800" aria-hidden />
              <div className="min-w-0 space-y-0.5">
                <CardTitle className="text-base font-semibold text-slate-900">Efemérides nacionales</CardTitle>
                <CardDescription className="text-xs leading-snug text-slate-600">
                  Calendario cívico, feriados y conmemoraciones.
                  <span className="text-slate-400"> · </span>
                  <span className="font-medium tabular-nums text-slate-800">{efemerides.length}</span>
                  {efemerides.length === 1 ? " registrada" : " registradas"}
                  {write ? (
                    <>
                      <span className="text-slate-400"> · </span>
                      <span className="text-slate-500">
                        <span className="font-medium text-slate-700">Nueva efeméride</span> o{" "}
                        <span className="font-medium text-slate-700">Editar</span> en la tabla.
                      </span>
                    </>
                  ) : null}
                </CardDescription>
              </div>
            </div>
            <EfemerideCreateDialog role={role} />
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white py-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white shadow-sm">
              <CalendarDays className="h-4 w-4 text-slate-700" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-semibold text-slate-900">Calendario de efemérides</CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Orden cronológico por mes y día. Incluye tipo, descripción breve y vigencia.
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
                    Nombre
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Fecha
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Tipo
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Descripción
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Estado
                  </TableHead>
                  {write ? (
                    <TableHead className="h-11 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Acciones
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {efemerides.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={colSpan} className="h-32 whitespace-normal px-4 text-center text-sm text-slate-500">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <ScrollText className="h-5 w-5" aria-hidden />
                        </div>
                        <p className="font-medium text-slate-700">No hay efemérides registradas</p>
                        <p className="text-xs text-slate-500">
                          {write
                            ? "Use el botón «Nueva efeméride» para añadir la primera fecha conmemorativa."
                            : "No hay datos para mostrar."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  efemerides.map((item) => (
                    <TableRow key={item.id} className="border-slate-100 transition-colors">
                      <TableCell className="max-w-[200px] px-4 py-3 font-medium text-slate-900">{item.nombre}</TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-slate-700">
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                          {formatEfemerideDate(item.dia, item.mes)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            tipoBadgeClass(item.tipo),
                          )}
                        >
                          {labelEfemerideTipo(item.tipo)}
                        </span>
                      </TableCell>
                      <TableCell
                        className="max-w-[240px] px-4 py-3 text-sm text-slate-600"
                        title={item.descripcion ?? undefined}
                      >
                        {item.descripcion ? (
                          <span className="line-clamp-2">{item.descripcion}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {item.activa ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            Inactiva
                          </span>
                        )}
                      </TableCell>
                      {write ? (
                        <TableCell className="px-4 py-3 text-right">
                          <div className="inline-flex flex-wrap justify-end gap-2">
                            <EfemerideEditTriggerButton item={toRow(item)} onEdit={openEdit} />
                            <form action={deleteEfemeride} className="inline-flex justify-end">
                              <input type="hidden" name="id" value={item.id} />
                              <Button type="submit" variant="destructive" size="sm" className="gap-1.5 shadow-sm">
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                Eliminar
                              </Button>
                            </form>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
