"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Check, Columns3, Mars, RotateCcw, Search, Venus } from "lucide-react";
import { AspiranteIdentityLink } from "@dashboard/aspirantes/_components/aspirante-foto";
import {
  AspiranteDocumentoViewer,
  CENSUS_DOCUMENTO_META,
  type CensusDocumentoKind,
} from "@dashboard/aspirantes/_components/aspirante-documento-viewer";
import { AspiranteRowActions } from "@dashboard/aspirantes/_components/aspirante-row-actions";
import { AspiranteQuickDialog } from "@dashboard/aspirantes/_components/aspirante-quick-dialog";
import { Button, buttonVariants } from "@src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@src/components/ui/dropdown-menu";
import { Input } from "@src/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@src/components/ui/table";
import {
  CENSUS_COLUMN_GROUPS,
  CENSUS_DEFAULT_VISIBLE_IDS,
  CENSUS_OPTIONAL_COLUMNS,
  sameCensusColumnIds,
  type CensusOptionalColumn,
  type CensusOptionalColumnId,
} from "@src/lib/aspirantes/census-table-columns";
import { useCensusColumnVisibility } from "@dashboard/aspirantes/_components/use-census-column-visibility";
import {
  calificacionAdmisionEtiqueta,
  gradoEducativoGroupKey,
  gradoEducativoGroupLabel,
  nacimientoMesGroupKey,
  nacimientoMesGroupLabel,
} from "@src/lib/aspirantes/census";
import { labelEstadoCivil } from "@src/lib/aspirantes/estado-civil";
import { formatTipoSangreHomologado } from "@src/lib/aspirantes/senaletica";
import { labelTipoEstudioNivel } from "@src/lib/aspirantes/tipo-estudio";
import { ageFromBirthDate, hasRealBirthDate } from "@src/lib/date";
import { ASPIRANTE_DOCUMENTO_KINDS } from "@src/lib/storage/aspirante-foto";
import type { PelotonResumen } from "@src/lib/pelotones";
import { cn } from "@src/lib/utils";

export type AspirantesCensusRow = {
  id: string;
  fotoKey: string | null;
  fotoEsquelaKey: string | null;
  fotoCedulaKey: string | null;
  fotoTituloKey: string | null;
  fotoTituloAutenticacionKey: string | null;
  fotoNotasKey: string | null;
  nombres: string;
  apellidos: string;
  cedula: string;
  hasFotoCedula: boolean;
  hasFotoTitulo: boolean;
  hasFotoTituloAuth: boolean;
  hasFotoNotas: boolean;
  notasIsPdf: boolean;
  unidadPostulante: string;
  tituloUniversidad: string | null;
  tipoEstudio: string | null;
  sexo: "MASCULINO" | "FEMENINO";
  fechaNacimientoIso: string;
  lugarNacimiento: string;
  calificacionAdmision: string;
  pelotonId: string | null;
  pelotonLabel: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  estadoCivil: string | null;
  religion: string | null;
  deporte: string | null;
  hijosCantidad: number;
  nombreUniversidad: string | null;
  paisUniversidad: string | null;
  nucleoUniversidad: string | null;
  anioIngresoUniversidad: number | null;
  anioEgresoUniversidad: number | null;
  contactoNombre: string | null;
  contactoParentesco: string | null;
  contactoTelefono: string | null;
  contactoDireccion: string | null;
  estaturaCm: number | null;
  pesoKg: number | null;
  tipoSangre: string | null;
  factorRh: string | null;
  colorCabello: string | null;
  formaLabios: string | null;
  formaNariz: string | null;
  colorOjos: string | null;
  colorPiel: string | null;
  senaParticular: string | null;
  instagram: string | null;
  twitter: string | null;
  facebook: string | null;
  padresVenezolanos: boolean | null;
  madreNombres: string | null;
  madreApellidos: string | null;
  madreCedula: string | null;
  madreFechaNacimientoIso: string | null;
  padreNombres: string | null;
  padreApellidos: string | null;
  padreCedula: string | null;
  padreFechaNacimientoIso: string | null;
  poseeVehiculoPropio: boolean | null;
  poseeViviendaPropia: boolean | null;
  carnetPatriaSerial: string | null;
  carnetPatriaCodigo: string | null;
  cuentaNominaBanfanb: string | null;
  tallaGorra: string | null;
  tallaCamisa: string | null;
  tallaPantalon: string | null;
  tallaCalzado: string | null;
  tallaUniformePatriota: string | null;
  tallaUniformeOliva: string | null;
  tensionArterial: string | null;
  alergias: string | null;
  condicionesMedicas: string | null;
  discapacidad: string | null;
  observaciones: string | null;
};

export type AspirantesCensusGrouping = {
  groupByCarrera: boolean;
  groupByNacimientoMes: boolean;
  groupByGrado: boolean;
  groupByReligion: boolean;
  countByCarrera: Record<string, number>;
  countByNacimientoMes: Record<string, number>;
  countByGrado: Record<string, number>;
  countByReligion: Record<string, number>;
};

type Props = {
  rows: AspirantesCensusRow[];
  grouping: AspirantesCensusGrouping;
  canWrite: boolean;
  pelotones: PelotonResumen[];
};

function EmptyDash() {
  return <span className="text-slate-400">—</span>;
}

function TextCell({ value, title, clamp }: { value: string | null | undefined; title?: string; clamp?: boolean }) {
  const v = value?.trim();
  if (!v) return <EmptyDash />;
  return (
    <span className={cn("break-words font-medium", clamp && "line-clamp-2")} title={title ?? v}>
      {v}
    </span>
  );
}

function birthDate(iso: string): Date {
  return new Date(iso);
}

function calificacionBadgeClass(c: string) {
  if (c === "APTO") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (c === "NO_APTO") return "border-red-200 bg-red-50 text-red-900";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

type CensusDocFlag = "hasFotoCedula" | "hasFotoTitulo" | "hasFotoTituloAuth" | "hasFotoNotas";

function hasFotoFlag(kind: CensusDocumentoKind): CensusDocFlag {
  if (kind === "cedula") return "hasFotoCedula";
  if (kind === "titulo") return "hasFotoTitulo";
  if (kind === "tituloAuth") return "hasFotoTituloAuth";
  return "hasFotoNotas";
}

function DocUploadCheck({
  ok,
  kind,
  onOpen,
}: {
  ok: boolean;
  kind: CensusDocumentoKind;
  onOpen: (kind: CensusDocumentoKind) => void;
}) {
  const label = CENSUS_DOCUMENTO_META[kind].short;
  return (
    <button
      type="button"
      title={ok ? `${label}: cargado. Abrir visor.` : `${label}: pendiente. Abrir para subir.`}
      aria-label={ok ? `${label} cargado. Abrir visor.` : `${label} pendiente. Abrir para subir.`}
      onClick={() => onOpen(kind)}
      className="inline-flex min-w-0 flex-col items-center gap-0.5 rounded-md p-0.5 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400/70"
    >
      <span
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors",
          ok
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-white text-slate-300 hover:border-slate-300",
        )}
      >
        {ok ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden /> : null}
      </span>
      <span className="max-w-[5.5rem] truncate text-[9px] font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </span>
    </button>
  );
}

function renderOptionalCell(col: CensusOptionalColumn, a: AspirantesCensusRow): ReactNode {
  const fecha = birthDate(a.fechaNacimientoIso);
  switch (col.id) {
    case "documentos":
      return null;
    case "unidad":
      return <TextCell value={a.unidadPostulante} clamp />;
    case "carrera": {
      const carrera = (a.tituloUniversidad ?? "").trim();
      const nivel = labelTipoEstudioNivel(a.tipoEstudio);
      if (!carrera) return <EmptyDash />;
      return (
        <span className="line-clamp-2 break-words font-medium" title={nivel ? `${carrera} (${nivel})` : carrera}>
          {carrera}
          {nivel ? <span className="font-normal text-slate-500"> ({nivel})</span> : null}
        </span>
      );
    }
    case "sexo": {
      const esFemenino = a.sexo === "FEMENINO";
      return (
        <span
          title={esFemenino ? "Femenino" : "Masculino"}
          aria-label={esFemenino ? "Femenino" : "Masculino"}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full border",
            esFemenino ? "border-rose-200 bg-rose-50 text-rose-600" : "border-sky-200 bg-sky-50 text-sky-700",
          )}
        >
          {esFemenino ? <Venus className="h-3.5 w-3.5" aria-hidden /> : <Mars className="h-3.5 w-3.5" aria-hidden />}
        </span>
      );
    }
    case "edad":
      return <span className="tabular-nums text-slate-700">{ageFromBirthDate(fecha) ?? "—"}</span>;
    case "nacimiento":
      return (
        <span className="tabular-nums text-slate-700">
          {hasRealBirthDate(fecha) ? fecha.toLocaleDateString("es-VE") : "—"}
        </span>
      );
    case "lugarNacimiento":
      return <TextCell value={a.lugarNacimiento} clamp />;
    case "calificacion":
      return (
        <span
          className={cn(
            "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold",
            calificacionBadgeClass(a.calificacionAdmision),
          )}
        >
          {calificacionAdmisionEtiqueta(a.calificacionAdmision)}
        </span>
      );
    case "peloton":
      return <TextCell value={a.pelotonLabel} />;
    case "telefono":
      return a.telefono?.trim() ? (
        <span className="font-mono tabular-nums text-slate-700">{a.telefono.trim()}</span>
      ) : (
        <EmptyDash />
      );
    case "correo":
      return <TextCell value={a.correo} />;
    case "direccion":
      return <TextCell value={a.direccion} clamp />;
    case "estadoCivil":
      return <TextCell value={labelEstadoCivil(a.estadoCivil) ?? undefined} />;
    case "religion":
      return <TextCell value={a.religion} />;
    case "deporte":
      return <TextCell value={a.deporte} />;
    case "hijos":
      return <span className="tabular-nums text-slate-700">{a.hijosCantidad}</span>;
    case "contactoEmergencia": {
      const nombre = a.contactoNombre?.trim();
      const tel = a.contactoTelefono?.trim();
      if (!nombre && !tel) return <EmptyDash />;
      return (
        <span className="line-clamp-2 break-words text-slate-800" title={[nombre, tel].filter(Boolean).join(" · ")}>
          {nombre || "Sin nombre"}
          {tel ? <span className="block font-mono text-xs tabular-nums text-slate-500">{tel}</span> : null}
        </span>
      );
    }
    case "universidad":
      return <TextCell value={a.nombreUniversidad} clamp />;
    case "paisUniversidad":
      return <TextCell value={a.paisUniversidad} />;
    case "tipoSangre": {
      const label = formatTipoSangreHomologado(a.tipoSangre, a.factorRh);
      return label ? <span className="font-semibold tabular-nums text-slate-800">{label}</span> : <EmptyDash />;
    }
    case "estatura":
      return a.estaturaCm != null ? (
        <span className="tabular-nums text-slate-700">{a.estaturaCm} cm</span>
      ) : (
        <EmptyDash />
      );
    case "peso":
      return a.pesoKg != null ? <span className="tabular-nums text-slate-700">{a.pesoKg} kg</span> : <EmptyDash />;
    case "tension":
      return <TextCell value={a.tensionArterial} />;
    case "tallaGorra":
    case "tallaCamisa":
    case "tallaPantalon":
    case "tallaCalzado": {
      const value =
        col.id === "tallaGorra"
          ? a.tallaGorra
          : col.id === "tallaCamisa"
            ? a.tallaCamisa
            : col.id === "tallaPantalon"
              ? a.tallaPantalon
              : a.tallaCalzado;
      return <TextCell value={value} />;
    }
    default:
      return <EmptyDash />;
  }
}

function cellAlignClass(id: CensusOptionalColumnId): string {
  if (
    id === "documentos" ||
    id === "sexo" ||
    id === "edad" ||
    id === "nacimiento" ||
    id === "hijos" ||
    id === "estatura" ||
    id === "peso" ||
    id === "tallaGorra" ||
    id === "tallaCamisa" ||
    id === "tallaPantalon" ||
    id === "tallaCalzado"
  ) {
    return "text-center";
  }
  return "";
}

export function AspirantesCensusTable({ rows, grouping, canWrite, pelotones }: Props) {
  const { visibleIds, setVisibleIds, toggleColumn } = useCensusColumnVisibility();
  const [columnQuery, setColumnQuery] = useState("");
  const [quickEdit, setQuickEdit] = useState<AspirantesCensusRow | null>(null);
  const [docFlags, setDocFlags] = useState<
    Record<
      string,
      Pick<AspirantesCensusRow, "hasFotoCedula" | "hasFotoTitulo" | "hasFotoTituloAuth" | "hasFotoNotas" | "notasIsPdf">
    >
  >({});
  const [viewer, setViewer] = useState<{
    aspiranteId: string;
    nombreCompleto: string;
    kind: CensusDocumentoKind;
  } | null>(null);

  const visibleSet = useMemo(() => new Set(visibleIds), [visibleIds]);
  const visibleColumns = useMemo(
    () => CENSUS_OPTIONAL_COLUMNS.filter((c) => visibleSet.has(c.id)),
    [visibleSet],
  );

  const isDefault = sameCensusColumnIds(visibleIds, CENSUS_DEFAULT_VISIBLE_IDS);
  const colSpan = 3 + visibleColumns.length;
  const minWidthRem = 16 + 7 + 3.5 + visibleColumns.reduce((sum, c) => sum + c.minWidthRem, 0);

  const q = columnQuery.trim().toLowerCase();
  const filteredByGroup = useMemo(() => {
    return CENSUS_COLUMN_GROUPS.map((group) => ({
      group,
      columns: CENSUS_OPTIONAL_COLUMNS.filter((c) => {
        if (c.group !== group) return false;
        if (!q) return true;
        return c.label.toLowerCase().includes(q);
      }),
    })).filter((g) => g.columns.length > 0);
  }, [q]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/90 bg-white px-4 py-2">
        <p className="text-[11px] text-slate-500">
          Nombre completo y cédula siempre visibles. El resto se guarda en este navegador.
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-8 gap-2 border-slate-200 bg-white shadow-sm",
            )}
          >
            <Columns3 className="h-3.5 w-3.5" aria-hidden />
            Columnas
            {!isDefault ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-semibold text-white tabular-nums">
                {visibleColumns.length}
              </span>
            ) : null}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 p-0">
            <div className="border-b border-border px-2.5 py-2">
              <p className="text-xs font-medium text-slate-800">Datos a mostrar</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Nombre completo y cédula permanecen fijos. El resto se guarda automáticamente en este navegador.
              </p>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
                <Input
                  value={columnQuery}
                  onChange={(e) => setColumnQuery(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  placeholder="Buscar columna…"
                  className="h-8 pl-7 text-xs"
                  aria-label="Buscar columna"
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto p-1">
              <DropdownMenuGroup>
                <DropdownMenuCheckboxItem checked disabled>
                  Nombre completo
                  <span className="ml-auto text-[10px] font-medium tracking-wide text-slate-400 uppercase">fijo</span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked disabled>
                  Cédula
                  <span className="ml-auto text-[10px] font-medium tracking-wide text-slate-400 uppercase">fijo</span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked disabled>
                  Acciones
                  <span className="ml-auto text-[10px] font-medium tracking-wide text-slate-400 uppercase">fijo</span>
                </DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {filteredByGroup.length === 0 ? (
                <p className="px-2 py-4 text-center text-xs text-slate-500">Ninguna columna coincide.</p>
              ) : (
                filteredByGroup.map(({ group, columns }) => (
                  <DropdownMenuGroup key={group}>
                    <DropdownMenuGroupLabel>{group}</DropdownMenuGroupLabel>
                    {columns.map((col) => (
                      <DropdownMenuCheckboxItem
                        key={col.id}
                        checked={visibleSet.has(col.id)}
                        onCheckedChange={(checked) => toggleColumn(col.id, checked === true)}
                      >
                        {col.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                ))
              )}
            </div>
            <div className="flex gap-1 border-t border-border p-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 flex-1 text-xs"
                onClick={() => setVisibleIds(CENSUS_OPTIONAL_COLUMNS.map((c) => c.id))}
              >
                Todas
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 flex-1 gap-1 text-xs"
                onClick={() => {
                  setColumnQuery("");
                  setVisibleIds([...CENSUS_DEFAULT_VISIBLE_IDS]);
                }}
              >
                <RotateCcw className="h-3 w-3" aria-hidden />
                Predeterminadas
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="-mx-4 min-w-0 overflow-x-auto border-y border-slate-200/90 bg-white sm:mx-0 sm:rounded-b-none sm:border-x sm:border-t-0">
        <Table className="table-fixed" style={{ minWidth: `${minWidthRem}rem` }}>
          <TableHeader className="[&_tr]:border-slate-200 [&_tr]:hover:bg-transparent">
            <TableRow className="border-slate-200 bg-slate-100/90 hover:bg-slate-100/90">
              <TableHead className="h-9 w-[16rem] px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Nombre completo
              </TableHead>
              <TableHead className="h-9 w-[7rem] px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Cédula
              </TableHead>
              {visibleColumns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    "h-9 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600",
                    col.headClassName,
                    cellAlignClass(col.id) && "px-2 text-center",
                  )}
                >
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="h-9 w-14 px-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colSpan} className="h-28 whitespace-normal px-3 text-center text-sm text-slate-500">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Search className="h-4 w-4" aria-hidden />
                    </div>
                    <p className="font-medium text-slate-700">No hay resultados con estos criterios</p>
                    <p className="text-xs text-slate-500">Ajuste la búsqueda o limpie los filtros para ver el censo.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              (() => {
                const bodyRows: ReactNode[] = [];
                let prevCarreraKey: string | null = null;
                let prevNacimientoMesKey: number | null = null;
                let prevGradoKey: number | null = null;
                let prevReligionKey: string | null = null;

                    for (const aRaw of rows) {
                      const a = {
                        ...aRaw,
                        ...(docFlags[aRaw.id] ?? {}),
                      };
                      const nombreCompleto = `${a.nombres} ${a.apellidos}`.trim();
                  const carreraKey = a.tituloUniversidad ?? "";
                  const nacimientoMesKey = nacimientoMesGroupKey(birthDate(a.fechaNacimientoIso));
                  const gradoKey = gradoEducativoGroupKey(a.tipoEstudio);
                  const religionKey = a.religion ?? "";

                  if (grouping.groupByCarrera && carreraKey !== prevCarreraKey) {
                    prevCarreraKey = carreraKey;
                    const grupoCount = grouping.countByCarrera[carreraKey] ?? 0;
                    bodyRows.push(
                      <TableRow
                        key={`grupo-carrera-${carreraKey || "_sin"}`}
                        className="border-slate-200 bg-slate-100/90 hover:bg-slate-100/90"
                      >
                        <TableCell colSpan={colSpan} className="px-3 py-2 text-sm font-semibold text-slate-800">
                          <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span>{carreraKey.trim() || "Sin carrera"}</span>
                            <span className="text-xs font-medium tabular-nums text-slate-500">({grupoCount})</span>
                          </span>
                        </TableCell>
                      </TableRow>,
                    );
                  }

                  if (grouping.groupByGrado && gradoKey !== prevGradoKey) {
                    prevGradoKey = gradoKey;
                    const grupoCount = grouping.countByGrado[String(gradoKey)] ?? 0;
                    bodyRows.push(
                      <TableRow
                        key={`grupo-grado-${gradoKey}`}
                        className="border-slate-200 bg-slate-100/90 hover:bg-slate-100/90"
                      >
                        <TableCell colSpan={colSpan} className="px-3 py-2 text-sm font-semibold text-slate-800">
                          <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span>{gradoEducativoGroupLabel(gradoKey)}</span>
                            <span className="text-xs font-medium tabular-nums text-slate-500">({grupoCount})</span>
                          </span>
                        </TableCell>
                      </TableRow>,
                    );
                  }

                  if (grouping.groupByReligion && religionKey !== prevReligionKey) {
                    prevReligionKey = religionKey;
                    const grupoCount = grouping.countByReligion[religionKey] ?? 0;
                    bodyRows.push(
                      <TableRow
                        key={`grupo-religion-${religionKey || "_sin"}`}
                        className="border-slate-200 bg-slate-100/90 hover:bg-slate-100/90"
                      >
                        <TableCell colSpan={colSpan} className="px-3 py-2 text-sm font-semibold text-slate-800">
                          <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span>{religionKey.trim() || "Sin religión"}</span>
                            <span className="text-xs font-medium tabular-nums text-slate-500">({grupoCount})</span>
                          </span>
                        </TableCell>
                      </TableRow>,
                    );
                  }

                  if (grouping.groupByNacimientoMes && nacimientoMesKey !== prevNacimientoMesKey) {
                    prevNacimientoMesKey = nacimientoMesKey;
                    const grupoCount = grouping.countByNacimientoMes[String(nacimientoMesKey)] ?? 0;
                    bodyRows.push(
                      <TableRow
                        key={`grupo-mes-${nacimientoMesKey}`}
                        className="border-slate-200 bg-slate-100/90 hover:bg-slate-100/90"
                      >
                        <TableCell colSpan={colSpan} className="px-3 py-2 text-sm font-semibold text-slate-800">
                          <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span>{nacimientoMesGroupLabel(nacimientoMesKey)}</span>
                            <span className="text-xs font-medium tabular-nums text-slate-500">({grupoCount})</span>
                          </span>
                        </TableCell>
                      </TableRow>,
                    );
                  }

                  bodyRows.push(
                    <TableRow key={a.id} className="border-slate-100 transition-colors">
                      <TableCell className="px-3 py-2 font-medium text-slate-900">
                        <AspiranteIdentityLink
                          aspiranteId={a.id}
                          fotoKey={a.fotoKey}
                          nombre={nombreCompleto}
                          size="sm"
                          className="-ml-1"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2 font-mono text-sm tabular-nums text-slate-700">
                        {a.cedula}
                      </TableCell>
                      {visibleColumns.map((col) => (
                        <TableCell
                          key={col.id}
                          className={cn(
                            "overflow-hidden px-3 py-2 whitespace-normal text-sm text-slate-800",
                            cellAlignClass(col.id) && "px-2",
                            cellAlignClass(col.id),
                          )}
                        >
                          {col.id === "documentos" ? (
                            <div className="flex items-start justify-center gap-1.5">
                              {ASPIRANTE_DOCUMENTO_KINDS.map((kind) => (
                                <DocUploadCheck
                                  key={kind}
                                  kind={kind}
                                  ok={a[hasFotoFlag(kind)]}
                                  onOpen={(k) =>
                                    setViewer({
                                      aspiranteId: a.id,
                                      nombreCompleto,
                                      kind: k,
                                    })
                                  }
                                />
                              ))}
                            </div>
                          ) : (
                            renderOptionalCell(col, a)
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="px-2 py-2 text-center">
                        <AspiranteRowActions
                          aspiranteId={a.id}
                          nombreCompleto={nombreCompleto}
                          canWrite={canWrite}
                          onQuickEdit={
                            canWrite
                              ? () => {
                                  window.setTimeout(() => setQuickEdit(a), 0);
                                }
                              : undefined
                          }
                        />
                      </TableCell>
                    </TableRow>,
                  );
                }

                return bodyRows;
              })()
            )}
          </TableBody>
        </Table>
      </div>
      {viewer ? (
        <AspiranteDocumentoViewer
          open
          onOpenChange={(open) => {
            if (!open) setViewer(null);
          }}
          aspiranteId={viewer.aspiranteId}
          nombreCompleto={viewer.nombreCompleto}
          kind={viewer.kind}
          canWrite={canWrite}
          hasFoto={
            (() => {
              const row = rows.find((r) => r.id === viewer.aspiranteId);
              const flags = docFlags[viewer.aspiranteId];
              const merged = { ...row, ...flags };
              return Boolean(merged[hasFotoFlag(viewer.kind)]);
            })()
          }
          storedIsPdf={
            (() => {
              if (viewer.kind !== "notas") return false;
              const row = rows.find((r) => r.id === viewer.aspiranteId);
              const flags = docFlags[viewer.aspiranteId];
              return Boolean(flags?.notasIsPdf ?? row?.notasIsPdf);
            })()
          }
          onHasFotoChange={(hasFoto, isPdf) => {
            const row = rows.find((r) => r.id === viewer.aspiranteId);
            const prevFlags = docFlags[viewer.aspiranteId];
            const current = {
              hasFotoCedula: prevFlags?.hasFotoCedula ?? row?.hasFotoCedula ?? false,
              hasFotoTitulo: prevFlags?.hasFotoTitulo ?? row?.hasFotoTitulo ?? false,
              hasFotoTituloAuth: prevFlags?.hasFotoTituloAuth ?? row?.hasFotoTituloAuth ?? false,
              hasFotoNotas: prevFlags?.hasFotoNotas ?? row?.hasFotoNotas ?? false,
              notasIsPdf: prevFlags?.notasIsPdf ?? row?.notasIsPdf ?? false,
            };
            setDocFlags((prev) => ({
              ...prev,
              [viewer.aspiranteId]: {
                ...current,
                [hasFotoFlag(viewer.kind)]: hasFoto,
                notasIsPdf: viewer.kind === "notas" ? Boolean(hasFoto && isPdf) : current.notasIsPdf,
              },
            }));
          }}
        />
      ) : null}
      {canWrite ? (
        <AspiranteQuickDialog
          open={Boolean(quickEdit)}
          onOpenChange={(open) => {
            if (!open) setQuickEdit(null);
          }}
          mode="edit"
          pelotones={pelotones}
          initial={quickEdit}
        />
      ) : null}
    </>
  );
}
