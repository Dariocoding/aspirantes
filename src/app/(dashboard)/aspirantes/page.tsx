import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Pencil,
  Search,
  UserRound,
  UserPlus,
} from "lucide-react";
import { AspiranteDeleteForm } from "@/components/aspirantes/aspirante-delete-form";
import { AspirantesExportLinks } from "@/components/aspirantes/aspirantes-export-links";
import { AspirantesFiltersDrawer } from "@/components/aspirantes/aspirantes-filters-drawer";
import { SinConvocatoriasPanel } from "@/components/aspirantes/sin-convocatorias-panel";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth } from "@/auth";
import {
  buildAspiranteCensusWhere,
  calificacionAdmisionEtiqueta,
  censusQueryString,
} from "@/lib/aspirantes/census";
import { canWrite, isAdmin } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

const PAGE_SIZE = 10;

function calificacionAdmisionBadgeClass(c: string) {
  if (c === "APTO") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (c === "NO_APTO") return "border-red-200 bg-red-50 text-red-900";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

function hrefClearAdvanced(q: string | undefined, convocatoriaId?: string) {
  const p = new URLSearchParams();
  const t = q?.trim();
  if (t) p.set("q", t);
  if (convocatoriaId) p.set("convocatoria", convocatoriaId);
  const s = p.toString();
  return s ? `/aspirantes?${s}` : "/aspirantes";
}

export default async function AspirantesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const role = session.user.role;
  const write = canWrite(role);

  const spRaw = await searchParams;
  const sp: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(spRaw)) {
    sp[k] = Array.isArray(v) ? v[0] : v;
  }

  const page = Math.max(1, Number(sp.page) || 1);

  const convocatorias = await prisma.convocatoria.findMany({
    orderBy: [{ anio: "desc" }, { createdAt: "desc" }],
  });

  if (!convocatorias.length) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <ClipboardList className="h-5 w-5 shrink-0 text-slate-800" aria-hidden />
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Censo de aspirantes</h1>
          </div>
        </div>
        <SinConvocatoriasPanel showConvocatoriasLink={isAdmin(role)} context="censo" />
      </div>
    );
  }

  /** Última convocatoria creada (mismo criterio de orden que el listado). */
  const defaultConvocatoriaId = convocatorias[0]!.id;
  const paramC = sp.convocatoria?.trim();
  const convocatoriaFiltroId =
    paramC && convocatorias.some((c) => c.id === paramC) ? paramC : defaultConvocatoriaId;

  const convocatoriaActual =
    convocatorias.find((c) => c.id === convocatoriaFiltroId) ?? convocatorias[0]!;

  const where = buildAspiranteCensusWhere(sp, convocatoriaFiltroId);
  const sort = sp.sort === "nombres" ? ({ nombres: "asc" } as const) : ({ createdAt: "desc" } as const);

  const unidadWhereLista: Prisma.AspiranteWhereInput = {
    convocatoriaId: convocatoriaFiltroId,
    unidadPostulante: { not: "" },
  };

  const [total, aspirantes, unidadGrupos] = await Promise.all([
    prisma.aspirante.count({ where }),
    prisma.aspirante.findMany({
      where,
      include: { datosFisicos: true, contactos: true, convocatoria: true },
      orderBy: sort,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.aspirante.groupBy({
      by: ["unidadPostulante"],
      where: unidadWhereLista,
      orderBy: { unidadPostulante: "asc" },
    }),
  ]);

  const unidadFiltro = sp.unidadPostulante?.trim();
  const unidadFiltroActivo = Boolean(unidadFiltro && unidadFiltro !== "TODOS");
  const unidadesDesdeDb = unidadGrupos.map((g) => g.unidadPostulante);
  const unidadesPostulantes = Array.from(
    new Set(
      unidadFiltroActivo && unidadFiltro && !unidadesDesdeDb.includes(unidadFiltro)
        ? [...unidadesDesdeDb, unidadFiltro]
        : unidadesDesdeDb,
    ),
  ).sort((a, b) => a.localeCompare(b, "es"));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qsBase: Record<string, string | undefined> = {
    q: sp.q,
    sexo: sp.sexo,
    edadMin: sp.edadMin,
    edadMax: sp.edadMax,
    sort: sp.sort,
    calificacion: sp.calificacion,
    unidadPostulante: sp.unidadPostulante,
  };
  if (convocatoriaFiltroId) qsBase.convocatoria = convocatoriaFiltroId;

  let activeAdvancedCount = 0;
  if (sp.sexo && sp.sexo !== "TODOS") activeAdvancedCount++;
  if (sp.edadMin?.trim()) activeAdvancedCount++;
  if (sp.edadMax?.trim()) activeAdvancedCount++;
  if (sp.sort === "nombres") activeAdvancedCount++;
  if (unidadFiltroActivo) activeAdvancedCount++;
  if (
    sp.calificacion &&
    sp.calificacion !== "TODOS" &&
    (sp.calificacion === "APTO" || sp.calificacion === "NO_APTO" || sp.calificacion === "EN_EVALUACION")
  ) {
    activeAdvancedCount++;
  }
  if (
    paramC &&
    defaultConvocatoriaId &&
    paramC !== defaultConvocatoriaId &&
    convocatorias.some((c) => c.id === paramC)
  ) {
    activeAdvancedCount++;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-2">
            <ClipboardList className="h-5 w-5 shrink-0 text-slate-800" aria-hidden />
            <h1 className="min-w-0 text-xl font-semibold tracking-tight text-slate-900">Censo de aspirantes</h1>
          </div>
          <p className="min-w-0 pl-7 text-sm text-slate-600">
            Convocatoria:{" "}
            <strong className="font-bold text-slate-900">
              {convocatoriaActual.nombre}{" "}
              <span className="font-mono font-bold tracking-tight text-slate-800">({convocatoriaActual.codigo})</span>
              {" · "}
              {convocatoriaActual.anio}
            </strong>
          </p>
        </div>
        {write ? (
          <Link
            href="/aspirantes/gestion"
            prefetch={false}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "h-9 w-full justify-center gap-2 bg-slate-900 px-3 shadow-sm hover:bg-slate-800 sm:w-auto sm:shrink-0",
            )}
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            Registro
          </Link>
        ) : null}
      </div>

      <Card className="shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold text-slate-900">Directorio del censo</CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Listado paginado e identificación básica.
                {write ? (
                  <>
                    {" "}
                    Excel y PDF exportan{" "}
                    <span className="font-medium text-slate-700">todos</span> los registros que cumplen los filtros
                    actuales.
                  </>
                ) : (
                  <> La exportación masiva (Excel/PDF) está reservada a operadores y administradores.</>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {write ? <AspirantesExportLinks exportQuery={censusQueryString(qsBase, {})} /> : null}
              <AspirantesFiltersDrawer
                q={sp.q ?? ""}
                sexo={sp.sexo}
                edadMin={sp.edadMin}
                edadMax={sp.edadMax}
                sort={sp.sort}
                calificacion={sp.calificacion}
                unidadPostulante={sp.unidadPostulante}
                unidadesPostulantes={unidadesPostulantes}
                convocatorias={convocatorias.map((c) => ({
                  id: c.id,
                  codigo: c.codigo,
                  nombre: c.nombre,
                  activa: c.activa,
                }))}
                convocatoriaId={convocatoriaFiltroId}
                clearAdvancedHref={hrefClearAdvanced(sp.q, convocatoriaFiltroId)}
                activeAdvancedCount={activeAdvancedCount}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          <div className="border-b border-slate-200/90 bg-slate-50/60 px-4 py-3">
            <form method="get" className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              {convocatoriaFiltroId ? <input type="hidden" name="convocatoria" value={convocatoriaFiltroId} /> : null}
              <input type="hidden" name="sexo" value={sp.sexo ?? "TODOS"} />
              {sp.edadMin?.trim() ? <input type="hidden" name="edadMin" value={sp.edadMin} /> : null}
              {sp.edadMax?.trim() ? <input type="hidden" name="edadMax" value={sp.edadMax} /> : null}
              {sp.sort === "nombres" ? <input type="hidden" name="sort" value="nombres" /> : null}
              {sp.calificacion && sp.calificacion !== "TODOS" ? (
                <input type="hidden" name="calificacion" value={sp.calificacion} />
              ) : null}
              {unidadFiltroActivo && unidadFiltro ? (
                <input type="hidden" name="unidadPostulante" value={unidadFiltro} />
              ) : null}
              <div className="relative min-w-0 flex-1">
                <Label htmlFor="q" className="sr-only">
                  Buscar por nombre, apellido o cédula
                </Label>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <Input
                  id="q"
                  name="q"
                  defaultValue={sp.q ?? ""}
                  placeholder="Buscar por nombre, apellido o cédula…"
                  className="h-10 border-slate-200 bg-white pl-9 shadow-sm"
                />
              </div>
              <div className="flex gap-2 sm:w-auto">
                <Button
                  type="submit"
                  className="h-10 flex-1 gap-2 bg-slate-900 shadow-sm hover:bg-slate-800 sm:flex-initial sm:px-5"
                >
                  <Search className="h-4 w-4" aria-hidden />
                  Buscar
                </Button>
                <Link
                  href="/aspirantes"
                  prefetch={false}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "h-10 border-slate-200 bg-white px-3 shadow-sm sm:px-4",
                  )}
                >
                  Limpiar
                </Link>
              </div>
            </form>
            <p className="mt-2 text-xs text-slate-600">
              <span className="font-medium tabular-nums text-slate-800">{aspirantes.length}</span>
              {" de "}
              <span className="font-medium tabular-nums text-slate-800">{total}</span>
              {" en esta página · página "}
              <span className="font-medium tabular-nums text-slate-800">
                {page} / {totalPages}
              </span>
            </p>
          </div>
          <div className="-mx-4 min-w-0 overflow-x-auto border-y border-slate-200/90 bg-white sm:mx-0 sm:rounded-b-none sm:border-x sm:border-t-0">
            <Table>
              <TableHeader className="[&_tr]:border-slate-200 [&_tr]:hover:bg-transparent">
                <TableRow className="border-slate-200 bg-slate-100/90 hover:bg-slate-100/90">
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Nombre completo
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Unidad postulante
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Admisión
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Convocatoria
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Cédula
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Sexo
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Edad
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Nacimiento
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Ficha
                  </TableHead>
                  {write ? (
                    <TableHead className="h-11 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Acciones
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {aspirantes.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={write ? 10 : 9}
                      className="h-32 whitespace-normal px-4 text-center text-sm text-slate-500"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <Search className="h-5 w-5" aria-hidden />
                        </div>
                        <p className="font-medium text-slate-700">No hay resultados con estos criterios</p>
                        <p className="text-xs text-slate-500">Ajuste la búsqueda o limpie los filtros para ver el censo.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  aspirantes.map((a) => (
                    <TableRow key={a.id} className="border-slate-100 transition-colors">
                      <TableCell className="px-4 py-3 font-medium text-slate-900">
                        {a.nombres} {a.apellidos}
                      </TableCell>
                      <TableCell className="max-w-40 px-4 py-3 text-sm text-slate-800">
                        {(a.unidadPostulante ?? "").trim() ? (
                          <span className="font-medium">{a.unidadPostulante ?? ""}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            calificacionAdmisionBadgeClass(a.calificacionAdmision),
                          )}
                        >
                          {calificacionAdmisionEtiqueta(a.calificacionAdmision)}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-40 px-4 py-3 text-xs text-slate-700">
                        <span className="font-mono text-[11px] text-slate-600">{a.convocatoria.codigo}</span>
                        {a.convocatoria.activa ? (
                          <span className="ml-1.5 text-[10px] font-semibold uppercase text-emerald-700">activa</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-mono text-sm tabular-nums text-slate-700">{a.cedula}</TableCell>
                      <TableCell className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            a.sexo === "FEMENINO"
                              ? "border-rose-200 bg-rose-50 text-rose-800"
                              : "border-sky-200 bg-sky-50 text-sky-900",
                          )}
                        >
                          {a.sexo === "FEMENINO" ? "Femenino" : "Masculino"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 tabular-nums text-slate-700">{a.edad}</TableCell>
                      <TableCell className="px-4 py-3 text-slate-700">
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                          {a.fechaNacimiento.toLocaleDateString("es-VE")}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Link
                          href={`/aspirantes/${encodeURIComponent(a.id)}`}
                          prefetch={false}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                            "h-8 gap-1.5 px-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                          )}
                        >
                          <UserRound className="h-3.5 w-3.5" aria-hidden />
                          Perfil
                        </Link>
                      </TableCell>
                      {write ? (
                        <TableCell className="px-4 py-3 text-right">
                          <div className="inline-flex flex-wrap justify-end gap-2">
                            <Link
                              href={`/aspirantes/gestion?edit=${encodeURIComponent(a.id)}`}
                              prefetch={false}
                              className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "gap-1.5 border-slate-200 bg-white shadow-sm",
                              )}
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden />
                              Editar
                            </Link>
                            <AspiranteDeleteForm
                              aspiranteId={a.id}
                              nombreCompleto={`${a.nombres} ${a.apellidos}`}
                            />
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200/90 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Página <span className="font-semibold tabular-nums text-slate-800">{page}</span> de{" "}
              <span className="font-semibold tabular-nums text-slate-800">{totalPages}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {page > 1 ? (
                <Link
                  href={`/aspirantes?${censusQueryString(qsBase, { page: String(page - 1) })}`}
                  prefetch={false}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-9 gap-1 border-slate-200 bg-white pr-3 pl-2.5 shadow-sm",
                  )}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  Anterior
                </Link>
              ) : (
                <span
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "pointer-events-none h-9 gap-1 border-slate-100 bg-slate-100/50 pr-3 pl-2.5 text-slate-400 opacity-60",
                  )}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  Anterior
                </span>
              )}
              {page < totalPages ? (
                <Link
                  href={`/aspirantes?${censusQueryString(qsBase, { page: String(page + 1) })}`}
                  prefetch={false}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-9 gap-1 border-slate-200 bg-white pl-3 pr-2.5 shadow-sm",
                  )}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : (
                <span
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "pointer-events-none h-9 gap-1 border-slate-100 bg-slate-100/50 pl-3 pr-2.5 text-slate-400 opacity-60",
                  )}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
