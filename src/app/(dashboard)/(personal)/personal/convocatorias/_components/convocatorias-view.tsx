"use client";

import { BookMarked, CalendarDays, Megaphone } from "lucide-react";
import { activarConvocatoria } from "@src/app/actions/convocatorias";
import {
  ConvocatoriaCreateDialog,
  ConvocatoriaDeleteDialog,
  ConvocatoriaEditDialog,
} from "@dashboard/convocatorias/_components/convocatoria-modals";
import { Button } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@src/components/ui/table";

export type ConvocatoriaRow = {
  id: string;
  codigo: string;
  nombre: string;
  anio: number;
  activa: boolean;
  aspirantesCount: number;
};

type Props = {
  convocatorias: ConvocatoriaRow[];
};

export function ConvocatoriasView({ convocatorias }: Props) {
  return (
    <div className="space-y-5">
      <Card className="gap-0 py-0 shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 gap-2.5">
              <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-slate-800" aria-hidden />
              <div className="min-w-0 space-y-0.5">
                <CardTitle className="text-base font-semibold text-slate-900">Convocatorias</CardTitle>
                <CardDescription className="text-xs leading-snug text-slate-600">
                  Cada convocatoria agrupa el censo de un período. Solo una puede estar activa: los nuevos aspirantes se
                  asignan a esa convocatoria.
                  <span className="text-slate-400"> Â· </span>
                  <span className="font-medium tabular-nums text-slate-800">{convocatorias.length}</span>
                  {convocatorias.length === 1 ? " período" : " períodos"}
                  <span className="text-slate-400"> Â· </span>
                  <span className="text-slate-500">
                    <span className="font-medium text-slate-700">Nueva convocatoria</span> desde el botón.
                  </span>
                </CardDescription>
              </div>
            </div>
            <ConvocatoriaCreateDialog />
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white py-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white shadow-sm">
              <BookMarked className="h-4 w-4 text-slate-700" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold text-slate-900">Períodos registrados</CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Active la convocatoria en la que deben inscribirse los aspirantes.
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
                    Código
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Año
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
                {convocatorias.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="h-32 whitespace-normal px-4 text-center text-sm text-slate-500">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <CalendarDays className="h-5 w-5" aria-hidden />
                        </div>
                        <p className="font-medium text-slate-700">No hay convocatorias registradas</p>
                          <p className="text-xs text-slate-500">Use «Nueva convocatoria» para crear el primer período.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  convocatorias.map((c) => (
                    <TableRow key={c.id} className="border-slate-100 transition-colors">
                      <TableCell className="max-w-[220px] px-4 py-3 font-medium text-slate-900">{c.nombre}</TableCell>
                      <TableCell className="px-4 py-3 font-mono text-sm tabular-nums text-slate-700">{c.codigo}</TableCell>
                      <TableCell className="px-4 py-3 tabular-nums text-slate-700">{c.anio}</TableCell>
                      <TableCell className="px-4 py-3">
                        {c.activa ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                            Activa Â· recibiendo registros
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            Inactiva
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {!c.activa ? (
                            <form action={activarConvocatoria} className="inline-flex">
                              <input type="hidden" name="id" value={c.id} />
                              <Button type="submit" size="sm" variant="secondary" className="shadow-sm">
                                Activar recepción
                              </Button>
                            </form>
                          ) : null}
                          <ConvocatoriaEditDialog
                            defaults={{ id: c.id, codigo: c.codigo, nombre: c.nombre, anio: c.anio }}
                          />
                          {c.aspirantesCount === 0 ? (
                            <ConvocatoriaDeleteDialog convocatoriaId={c.id} nombre={c.nombre} />
                          ) : (
                            <span
                              className="inline-flex"
                              title="No se puede eliminar mientras haya aspirantes registrados en esta convocatoria."
                            >
                              <Button type="button" size="sm" variant="outline" disabled className="opacity-45">
                                Eliminar
                              </Button>
                            </span>
                          )}
                        </div>
                      </TableCell>
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
