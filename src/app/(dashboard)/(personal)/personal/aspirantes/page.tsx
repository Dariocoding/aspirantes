import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Search,
  UserPlus,
} from "lucide-react";
import { AspirantesCensusTable, type AspirantesCensusRow } from "@dashboard/aspirantes/_components/aspirantes-census-table";
import { AspirantesExportLinks } from "@dashboard/aspirantes/_components/aspirantes-export-links";
import { AspirantesImportDialog } from "@dashboard/aspirantes/_components/aspirantes-import-dialog";
import { AspirantesFiltersDrawer } from "@dashboard/aspirantes/_components/aspirantes-filters-drawer";
import { SinConvocatoriasPanel } from "@dashboard/aspirantes/_components/sin-convocatorias-panel";
import { Button, buttonVariants } from "@src/components/ui/button";
import { cn } from "@src/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import { auth } from "@src/auth";
import {
  buildAspiranteCensusWhere,
  censusOrderBy,
  censusQueryString,
  gradoEducativoGroupKey,
  isCensusCarreraGroupSort,
  isCensusGradoGroupSort,
  isCensusNacimientoMesSort,
  nacimientoMesGroupKey,
  sortAspirantesByGradoEducativo,
  sortAspirantesByNacimientoMes,
} from "@src/lib/aspirantes/census";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { canWrite } from "@src/lib/auth/roles";
import { routes } from "@src/lib/apps/routes";
import { prisma } from "@src/lib/prisma";
import type { Prisma } from "@src/generated/prisma";
import { labelPeloton } from "@src/lib/pelotones";

const PAGE_SIZE = 10;

function toCensusRow(
  a: Prisma.AspiranteGetPayload<{
    include: {
      datosFisicos: true;
      contactos: true;
      peloton: { select: { numero: true; nombre: true } };
    };
  }>,
): AspirantesCensusRow {
  const contacto = a.contactos[0];
  return {
    id: a.id,
    fotoKey: a.fotoKey,
    nombres: a.nombres,
    apellidos: a.apellidos,
    cedula: a.cedula,
    hasFotoCedula: Boolean(a.fotoCedulaKey),
    hasFotoTitulo: Boolean(a.fotoTituloKey),
    hasFotoTituloAuth: Boolean(a.fotoTituloAutenticacionKey),
    unidadPostulante: a.unidadPostulante ?? "",
    tituloUniversidad: a.tituloUniversidad,
    tipoEstudio: a.tipoEstudio,
    sexo: a.sexo,
    fechaNacimientoIso: a.fechaNacimiento.toISOString(),
    lugarNacimiento: a.lugarNacimiento ?? "",
    calificacionAdmision: a.calificacionAdmision,
    pelotonLabel: a.peloton ? labelPeloton(a.peloton) : null,
    telefono: a.telefono,
    correo: a.correo,
    direccion: a.direccion,
    estadoCivil: a.estadoCivil,
    hijosCantidad: a.hijosCantidad,
    nombreUniversidad: a.nombreUniversidad,
    paisUniversidad: a.paisUniversidad,
    contactoNombre: contacto?.nombre ?? null,
    contactoTelefono: contacto?.telefono ?? null,
    estaturaCm: a.datosFisicos?.estaturaCm ?? null,
    pesoKg: a.datosFisicos?.pesoKg ?? null,
    tipoSangre: a.datosFisicos?.tipoSangre ?? null,
    tensionArterial: a.datosFisicos?.tensionArterial ?? null,
  };
}

function hrefClearAdvanced(q: string | undefined, convocatoriaId?: string) {
  const p = new URLSearchParams();
  const t = q?.trim();
  if (t) p.set("q", t);
  if (convocatoriaId) p.set("convocatoria", convocatoriaId);
  const s = p.toString();
  return s ? `${routes.personal.aspirantes}?${s}` : routes.personal.aspirantes;
}

export default async function AspirantesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const ctx = authContextFromSession(session);
  const write = canWrite(ctx);
  const showConvocatoriasLink = hasPermission(ctx, Permission.CONVOCATORIAS_MANAGE);

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
        <SinConvocatoriasPanel showConvocatoriasLink={showConvocatoriasLink} context="censo" />
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
  const sort = censusOrderBy(sp.sort);
  const groupByCarrera = isCensusCarreraGroupSort(sp.sort);
  const groupByNacimientoMes = isCensusNacimientoMesSort(sp.sort);
  const groupByGrado = isCensusGradoGroupSort(sp.sort);
  const sortInMemory = groupByNacimientoMes || groupByGrado;

  const unidadWhereLista: Prisma.AspiranteWhereInput = {
    convocatoriaId: convocatoriaFiltroId,
    unidadPostulante: { not: "" },
  };

  const [totalCount, convocatoriaAspiranteCount, aspirantesRaw, unidadGrupos, carreraGrupos, pelotones] =
    await Promise.all([
    sortInMemory
      ? Promise.resolve(0)
      : prisma.aspirante.count({ where }),
    prisma.aspirante.count({ where: { convocatoriaId: convocatoriaFiltroId } }),
    sortInMemory
      ? prisma.aspirante.findMany({
          where,
          include: {
            datosFisicos: true,
            contactos: { take: 1, orderBy: { createdAt: "asc" } },
            peloton: { select: { numero: true, nombre: true } },
          },
        })
      : prisma.aspirante.findMany({
          where,
          include: {
            datosFisicos: true,
            contactos: { take: 1, orderBy: { createdAt: "asc" } },
            peloton: { select: { numero: true, nombre: true } },
          },
          orderBy: sort,
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
    prisma.aspirante.groupBy({
      by: ["unidadPostulante"],
      where: unidadWhereLista,
      orderBy: { unidadPostulante: "asc" },
    }),
    groupByCarrera
      ? prisma.aspirante.groupBy({
          by: ["tituloUniversidad"],
          where,
          _count: { _all: true },
        })
      : Promise.resolve([] as { tituloUniversidad: string | null; _count: { _all: number } }[]),
    prisma.peloton.findMany({
      where: { convocatoriaId: convocatoriaFiltroId },
      orderBy: { numero: "asc" },
      select: { id: true, numero: true, nombre: true },
    }),
  ]);

  const aspirantesOrdenados = groupByNacimientoMes
    ? sortAspirantesByNacimientoMes(aspirantesRaw)
    : groupByGrado
      ? sortAspirantesByGradoEducativo(aspirantesRaw)
      : aspirantesRaw;
  const total = sortInMemory ? aspirantesOrdenados.length : totalCount;
  const aspirantes = sortInMemory
    ? aspirantesOrdenados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : aspirantesOrdenados;

  const countByCarrera = new Map(
    carreraGrupos.map((g) => [g.tituloUniversidad ?? "", g._count._all]),
  );

  const countByNacimientoMes = new Map<number, number>();
  if (groupByNacimientoMes) {
    for (const a of aspirantesOrdenados) {
      const key = nacimientoMesGroupKey(a.fechaNacimiento);
      countByNacimientoMes.set(key, (countByNacimientoMes.get(key) ?? 0) + 1);
    }
  }

  const countByGrado = new Map<number, number>();
  if (groupByGrado) {
    for (const a of aspirantesOrdenados) {
      const key = gradoEducativoGroupKey(a.tipoEstudio);
      countByGrado.set(key, (countByGrado.get(key) ?? 0) + 1);
    }
  }

  const censusRows = aspirantes.map(toCensusRow);
  const censusGrouping = {
    groupByCarrera,
    groupByNacimientoMes,
    groupByGrado,
    countByCarrera: Object.fromEntries(countByCarrera),
    countByNacimientoMes: Object.fromEntries(
      [...countByNacimientoMes.entries()].map(([k, v]) => [String(k), v]),
    ),
    countByGrado: Object.fromEntries([...countByGrado.entries()].map(([k, v]) => [String(k), v])),
  };

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

  const pelotonFiltro = sp.peloton?.trim();
  const pelotonFiltroActivo = Boolean(
    pelotonFiltro &&
      pelotonFiltro !== "TODOS" &&
      (pelotonFiltro === "SIN_ASIGNAR" || pelotones.some((p) => p.id === pelotonFiltro)),
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qsBase: Record<string, string | undefined> = {
    q: sp.q,
    sexo: sp.sexo,
    edadMin: sp.edadMin,
    edadMax: sp.edadMax,
    sort: sp.sort,
    calificacion: sp.calificacion,
    unidadPostulante: sp.unidadPostulante,
    peloton: pelotonFiltroActivo ? pelotonFiltro : undefined,
  };
  if (convocatoriaFiltroId) qsBase.convocatoria = convocatoriaFiltroId;

  let activeAdvancedCount = 0;
  if (sp.sexo && sp.sexo !== "TODOS") activeAdvancedCount++;
  if (sp.edadMin?.trim()) activeAdvancedCount++;
  if (sp.edadMax?.trim()) activeAdvancedCount++;
  if (
    sp.sort === "nombres" ||
    sp.sort === "titulo" ||
    sp.sort === "carrera" ||
    sp.sort === "grado" ||
    sp.sort === "nacimiento" ||
    sp.sort === "nacimiento-mes" ||
    sp.sort === "reciente"
  ) {
    activeAdvancedCount++;
  }
  if (unidadFiltroActivo) activeAdvancedCount++;
  if (pelotonFiltroActivo) activeAdvancedCount++;
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
              {convocatoriaActual.nombre}
              {" · "}
              {convocatoriaActual.anio}
            </strong>
          </p>
        </div>
        {write ? (
          <Link
            href={routes.personal.aspirantesGestion}
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
                    actuales. <span className="font-medium text-slate-700">Todas las fichas</span> genera un PDF con
                    la ficha técnica de cada aspirante de esta convocatoria. Puede editar el Excel exportado y volver
                    a <span className="font-medium text-slate-700">importarlo</span> (clave: cédula).
                  </>
                ) : (
                  <> La exportación masiva (Excel/PDF) está reservada a operadores y administradores.</>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {write ? (
                <>
                  <AspirantesImportDialog
                    convocatoriaId={convocatoriaFiltroId}
                    convocatoriaLabel={`${convocatoriaActual.nombre} (${convocatoriaActual.codigo})`}
                  />
                  <AspirantesExportLinks
                    exportQuery={censusQueryString(qsBase, {})}
                    convocatoriaId={convocatoriaFiltroId}
                    convocatoriaCount={convocatoriaAspiranteCount}
                  />
                </>
              ) : null}
              <AspirantesFiltersDrawer
                q={sp.q ?? ""}
                sexo={sp.sexo}
                edadMin={sp.edadMin}
                edadMax={sp.edadMax}
                sort={sp.sort}
                calificacion={sp.calificacion}
                unidadPostulante={sp.unidadPostulante}
                unidadesPostulantes={unidadesPostulantes}
                peloton={pelotonFiltroActivo ? pelotonFiltro : undefined}
                pelotones={pelotones}
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
              {sp.sort === "nombres" ||
              sp.sort === "titulo" ||
              sp.sort === "carrera" ||
              sp.sort === "grado" ||
              sp.sort === "nacimiento" ||
              sp.sort === "nacimiento-mes" ||
              sp.sort === "reciente" ? (
                <input type="hidden" name="sort" value={sp.sort} />
              ) : null}
              {sp.calificacion && sp.calificacion !== "TODOS" ? (
                <input type="hidden" name="calificacion" value={sp.calificacion} />
              ) : null}
              {unidadFiltroActivo && unidadFiltro ? (
                <input type="hidden" name="unidadPostulante" value={unidadFiltro} />
              ) : null}
              {pelotonFiltroActivo && pelotonFiltro ? (
                <input type="hidden" name="peloton" value={pelotonFiltro} />
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
                  href={routes.personal.aspirantes}
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
          <AspirantesCensusTable rows={censusRows} grouping={censusGrouping} canWrite={write} />

          <div className="flex flex-col gap-3 border-t border-slate-200/90 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Página <span className="font-semibold tabular-nums text-slate-800">{page}</span> de{" "}
              <span className="font-semibold tabular-nums text-slate-800">{totalPages}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {page > 1 ? (
                <Link
                  href={`${routes.personal.aspirantes}?${censusQueryString(qsBase, { page: String(page - 1) })}`}
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
                  href={`${routes.personal.aspirantes}?${censusQueryString(qsBase, { page: String(page + 1) })}`}
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
