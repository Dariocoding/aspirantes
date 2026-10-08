import Link from "next/link";
import { ClipboardList, Trash2 } from "lucide-react";
import { AspirantesCensusTable, type AspirantesCensusRow } from "@dashboard/aspirantes/_components/aspirantes-census-table";
import { CensusPager } from "@dashboard/aspirantes/_components/census-pager";
import { SinConvocatoriasPanel } from "@dashboard/aspirantes/_components/sin-convocatorias-panel";
import { buttonVariants } from "@src/components/ui/button";
import { cn } from "@src/lib/utils";
import { auth } from "@src/auth";
import {
  buildAspiranteCensusWhere,
  censusOrderBy,
  censusQueryString,
  censusSortInMemory,
  gradoEducativoGroupKey,
  nacimientoMesGroupKey,
  resolveCensusPresentation,
  sortAspirantesForCensus,
} from "@src/lib/aspirantes/census";
import { parseCondicionCensusFilter } from "@src/lib/aspirantes/condicion-militar";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { canWrite } from "@src/lib/auth/roles";
import { routes } from "@src/lib/apps/routes";
import { prisma } from "@src/lib/prisma";
import type { Prisma } from "@src/generated/prisma";
import { labelPeloton } from "@src/lib/pelotones";

const PAGE_SIZE = 10;

function PapeleraLink({ count }: { count: number }) {
  return (
    <Link
      href={routes.personal.papelera}
      prefetch={false}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "h-9 gap-1.5 border-slate-200 bg-white shadow-sm",
      )}
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden />
      Papelera
      {count > 0 ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-semibold tabular-nums text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

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
    fotoBoletaKey: a.fotoBoletaKey,
    fotoEsquelaKey: a.fotoEsquelaKey,
    fotoFichaTecnicaKey: a.fotoFichaTecnicaKey,
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
    condicionMilitar: a.condicionMilitar,
    jerarquia: a.jerarquia === "DISTINGUIDO" ? "DISTINGUIDO" : "ASPIRANTE_OFICIAL",
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
    const papeleraCount = write
      ? await prisma.aspirante.count({ where: { deletedAt: { not: null } } })
      : 0;
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <ClipboardList className="h-5 w-5 shrink-0 text-slate-800" aria-hidden />
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Censo de aspirantes</h1>
          </div>
          {write ? <PapeleraLink count={papeleraCount} /> : null}
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

  const where = buildAspiranteCensusWhere(sp, convocatoriaFiltroId);
  const presentation = resolveCensusPresentation(sp);
  const groupByCarrera = presentation.group === "carrera";
  const groupByNacimientoMes = presentation.group === "nacimiento-mes";
  const groupByGrado = presentation.group === "grado";
  const groupByReligion = presentation.group === "religion";
  const groupByCondicion = presentation.group === "condicion";
  const sortInMemory = censusSortInMemory(presentation.group);
  const sort = censusOrderBy(
    presentation.sort,
    presentation.group === "carrera" || presentation.group === "religion" ? presentation.group : null,
  );

  const [totalCount, aspirantesRaw, carreraGrupos, religionGrupos, condicionGrupos, pelotones] = await Promise.all([
    sortInMemory
      ? Promise.resolve(0)
      : prisma.aspirante.count({ where }),
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
    groupByCondicion
      ? prisma.aspirante.groupBy({
          by: ["condicionMilitar"],
          where,
          _count: { _all: true },
        })
      : Promise.resolve([] as { condicionMilitar: string | null; _count: { _all: number } }[]),
    prisma.peloton.findMany({
      where: { convocatoriaId: convocatoriaFiltroId },
      orderBy: { numero: "asc" },
      select: { id: true, numero: true, nombre: true },
    }),
  ]);

  const aspirantesOrdenados = sortInMemory
    ? sortAspirantesForCensus(aspirantesRaw, presentation.sort, presentation.group)
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
  const countByCondicion = new Map(
    condicionGrupos.map((g) => [g.condicionMilitar ?? "", g._count._all]),
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
    groupByCondicion,
    countByCarrera: Object.fromEntries(countByCarrera),
    countByReligion: Object.fromEntries(countByReligion),
    countByCondicion: Object.fromEntries(countByCondicion),
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
    group: sp.group,
    peloton: pelotonFiltroActivo ? pelotonFiltro : undefined,
    condicion: parseCondicionCensusFilter(sp.condicion) ?? undefined,
  };
  if (convocatoriaFiltroId) qsBase.convocatoria = convocatoriaFiltroId;

  return (
    <>
      <p className="border-b border-slate-200/90 px-4 py-2 text-xs text-slate-600">
        <span className="font-medium tabular-nums text-slate-800">{aspirantes.length}</span>
        {" de "}
        <span className="font-medium tabular-nums text-slate-800">{total}</span>
        {" en esta página · página "}
        <span className="font-medium tabular-nums text-slate-800">
          {page} / {totalPages}
        </span>
      </p>
      <AspirantesCensusTable
        rows={censusRows}
        grouping={censusGrouping}
        canWrite={write}
        pelotones={pelotones}
        selectionScope={convocatoriaFiltroId}
      />
      <CensusPager
        page={page}
        totalPages={totalPages}
        prevHref={
          page > 1
            ? `${routes.personal.aspirantes}?${censusQueryString(qsBase, { page: String(page - 1) })}`
            : null
        }
        nextHref={
          page < totalPages
            ? `${routes.personal.aspirantes}?${censusQueryString(qsBase, { page: String(page + 1) })}`
            : null
        }
      />
    </>
  );
}
