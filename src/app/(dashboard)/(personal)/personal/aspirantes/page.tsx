import Link from "next/link";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { AspirantesCensusTable, type AspirantesCensusRow } from "@dashboard/aspirantes/_components/aspirantes-census-table";
import { AspirantesExportLinks } from "@dashboard/aspirantes/_components/aspirantes-export-links";
import { AspiranteQuickRegisterButton } from "@dashboard/aspirantes/_components/aspirante-quick-dialog";
import { AspirantesFilterBar } from "@dashboard/aspirantes/_components/aspirantes-filter-bar";
import { SinConvocatoriasPanel } from "@dashboard/aspirantes/_components/sin-convocatorias-panel";
import { buttonVariants } from "@src/components/ui/button";
import { cn } from "@src/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { auth } from "@src/auth";
import {
  buildAspiranteCensusWhere,
  censusOrderBy,
  censusQueryString,
  gradoEducativoGroupKey,
  isCensusCarreraGroupSort,
  isCensusGradoGroupSort,
  isCensusNacimientoMesSort,
  isCensusReligionGroupSort,
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
    fotoEsquelaKey: a.fotoEsquelaKey,
    fotoCedulaKey: a.fotoCedulaKey,
    fotoTituloKey: a.fotoTituloKey,
    fotoTituloAutenticacionKey: a.fotoTituloAutenticacionKey,
    fotoNotasKey: a.fotoNotasKey,
    hasFotoCedula: Boolean(a.fotoCedulaKey),
    hasFotoTitulo: Boolean(a.fotoTituloKey),
    hasFotoTituloAuth: Boolean(a.fotoTituloAutenticacionKey),
    hasFotoNotas: Boolean(a.fotoNotasKey),
    notasIsPdf: Boolean(a.fotoNotasKey?.toLowerCase().endsWith(".pdf")),
    unidadPostulante: a.unidadPostulante ?? "",
    tituloUniversidad: a.tituloUniversidad,
    tipoEstudio: a.tipoEstudio,
    sexo: a.sexo,
    fechaNacimientoIso: a.fechaNacimiento.toISOString(),
    lugarNacimiento: a.lugarNacimiento ?? "",
    calificacionAdmision: a.calificacionAdmision,
    pelotonId: a.pelotonId,
    pelotonLabel: a.peloton ? labelPeloton(a.peloton) : null,
    telefono: a.telefono,
    correo: a.correo,
    direccion: a.direccion,
    estadoCivil: a.estadoCivil,
    religion: a.religion,
    deporte: a.deporte,
    hijosCantidad: a.hijosCantidad,
    nombreUniversidad: a.nombreUniversidad,
    paisUniversidad: a.paisUniversidad,
    nucleoUniversidad: a.nucleoUniversidad,
    anioIngresoUniversidad: a.anioIngresoUniversidad,
    anioEgresoUniversidad: a.anioEgresoUniversidad,
    contactoNombre: contacto?.nombre ?? null,
    contactoParentesco: contacto?.parentesco ?? null,
    contactoTelefono: contacto?.telefono ?? null,
    contactoDireccion: contacto?.direccion ?? null,
    estaturaCm: a.datosFisicos?.estaturaCm ?? null,
    pesoKg: a.datosFisicos?.pesoKg ?? null,
    tipoSangre: a.datosFisicos?.tipoSangre ?? null,
    factorRh: a.datosFisicos?.factorRh ?? null,
    colorCabello: a.datosFisicos?.colorCabello ?? null,
    formaLabios: a.datosFisicos?.formaLabios ?? null,
    formaNariz: a.datosFisicos?.formaNariz ?? null,
    colorOjos: a.datosFisicos?.colorOjos ?? null,
    colorPiel: a.datosFisicos?.colorPiel ?? null,
    senaParticular: a.datosFisicos?.senaParticular ?? null,
    instagram: a.instagram,
    twitter: a.twitter,
    facebook: a.facebook,
    padresVenezolanos: a.padresVenezolanos,
    madreNombres: a.madreNombres,
    madreApellidos: a.madreApellidos,
    madreCedula: a.madreCedula,
    madreFechaNacimientoIso: a.madreFechaNacimiento?.toISOString() ?? null,
    padreNombres: a.padreNombres,
    padreApellidos: a.padreApellidos,
    padreCedula: a.padreCedula,
    padreFechaNacimientoIso: a.padreFechaNacimiento?.toISOString() ?? null,
    poseeVehiculoPropio: a.poseeVehiculoPropio,
    poseeViviendaPropia: a.poseeViviendaPropia,
    carnetPatriaSerial: a.carnetPatriaSerial,
    carnetPatriaCodigo: a.carnetPatriaCodigo,
    cuentaNominaBanfanb: a.cuentaNominaBanfanb,
    tallaGorra: a.datosFisicos?.tallaGorra ?? null,
    tallaCamisa: a.datosFisicos?.tallaCamisa ?? null,
    tallaPantalon: a.datosFisicos?.tallaPantalon ?? null,
    tallaCalzado: a.datosFisicos?.tallaCalzado ?? null,
    tallaUniformePatriota: a.datosFisicos?.tallaUniformePatriota ?? null,
    tallaUniformeOliva: a.datosFisicos?.tallaUniformeOliva ?? null,
    tensionArterial: a.datosFisicos?.tensionArterial ?? null,
    alergias: a.datosFisicos?.alergias ?? null,
    condicionesMedicas: a.datosFisicos?.condicionesMedicas ?? null,
    discapacidad: a.datosFisicos?.discapacidad ?? null,
    observaciones: a.datosFisicos?.observaciones ?? null,
  };
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
  const groupByReligion = isCensusReligionGroupSort(sp.sort);
  const sortInMemory = groupByNacimientoMes || groupByGrado;

  const [totalCount, convocatoriaAspiranteCount, aspirantesRaw, carreraGrupos, religionGrupos, pelotones, membreteRows] =
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
    groupByCarrera
      ? prisma.aspirante.groupBy({
          by: ["tituloUniversidad"],
          where,
          _count: { _all: true },
        })
      : Promise.resolve([] as { tituloUniversidad: string | null; _count: { _all: number } }[]),
    groupByReligion
      ? prisma.aspirante.groupBy({
          by: ["religion"],
          where,
          _count: { _all: true },
        })
      : Promise.resolve([] as { religion: string | null; _count: { _all: number } }[]),
    prisma.peloton.findMany({
      where: { convocatoriaId: convocatoriaFiltroId },
      orderBy: { numero: "asc" },
      select: { id: true, numero: true, nombre: true },
    }),
    prisma.membrete
      .findMany({
        orderBy: [{ isDefault: "desc" }, { nombre: "asc" }],
        select: { id: true, nombre: true, isDefault: true },
      })
      .catch((err) => {
        console.error("membrete.findMany", err);
        return [];
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
  const countByReligion = new Map(
    religionGrupos.map((g) => [g.religion ?? "", g._count._all]),
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
    groupByReligion,
    countByCarrera: Object.fromEntries(countByCarrera),
    countByReligion: Object.fromEntries(countByReligion),
    countByNacimientoMes: Object.fromEntries(
      [...countByNacimientoMes.entries()].map(([k, v]) => [String(k), v]),
    ),
    countByGrado: Object.fromEntries([...countByGrado.entries()].map(([k, v]) => [String(k), v])),
  };

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
    sort: sp.sort,
    peloton: pelotonFiltroActivo ? pelotonFiltro : undefined,
  };
  if (convocatoriaFiltroId) qsBase.convocatoria = convocatoriaFiltroId;

  return (
    <div className="space-y-5">
      <div className="flex min-w-0 flex-col gap-1">
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

      <Card className="shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold text-slate-900">Directorio del censo</CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Listado paginado e identificación básica.
                {write
                  ? " Excel permite elegir columnas, exportar e importar por cédula; PDF exporta censo, fichas y boletas de permiso (todas, filtradas o eligiendo personal)."
                  : " La exportación masiva (Excel/PDF) está reservada a operadores y administradores."}
              </CardDescription>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
              {write ? (
                <AspirantesExportLinks
                  exportQuery={censusQueryString(qsBase, {})}
                  convocatoriaId={convocatoriaFiltroId}
                  convocatoriaCount={convocatoriaAspiranteCount}
                  membretes={membreteRows}
                />
              ) : null}
              {write ? <AspiranteQuickRegisterButton pelotones={pelotones} /> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          <div className="border-b border-slate-200/90 bg-slate-50/60 px-4 py-3">
            <AspirantesFilterBar
              q={sp.q ?? ""}
              sexo={sp.sexo}
              sort={sp.sort}
              peloton={pelotonFiltroActivo ? pelotonFiltro : undefined}
              pelotones={pelotones}
              convocatorias={convocatorias.map((c) => ({
                id: c.id,
                codigo: c.codigo,
                nombre: c.nombre,
                activa: c.activa,
              }))}
              convocatoriaId={convocatoriaFiltroId}
              defaultConvocatoriaId={defaultConvocatoriaId}
            />
            <p className="mt-3 text-xs text-slate-600">
              <span className="font-medium tabular-nums text-slate-800">{aspirantes.length}</span>
              {" de "}
              <span className="font-medium tabular-nums text-slate-800">{total}</span>
              {" en esta página · página "}
              <span className="font-medium tabular-nums text-slate-800">
                {page} / {totalPages}
              </span>
            </p>
          </div>
          <AspirantesCensusTable
            rows={censusRows}
            grouping={censusGrouping}
            canWrite={write}
            pelotones={pelotones}
          />

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
