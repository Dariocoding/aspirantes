"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useTransition, type KeyboardEvent } from "react";
import {
  ArrowDownUp,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ChevronsUpDown,
  LayoutGrid,
  Lock,
  Maximize2,
  Search,
  UserRound,
  Users,
  ShieldAlert,
  Wand2,
  X,
} from "lucide-react";
import { buscarPersonalGlobal, type PersonaBusqueda } from "@src/app/actions/busqueda-personal";
import { actualizarMarcasLote } from "@src/app/actions/roles-servicio-marcas";
import { ordenarRolEscalera } from "@src/app/actions/roles-servicio-ordenar";
import { sellarMesRoles } from "@src/app/actions/roles-servicio-sello";
import { Badge } from "@src/components/ui/badge";
import { Button, buttonVariants } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import { Input } from "@src/components/ui/input";
import { GenerarCalendarioDialog } from "./generar-calendario-dialog";
import { DuplicarRolesControl } from "./duplicar-roles-control";
import { VerificarDiurnoDialog } from "./verificar-diurno-dialog";
import { RolesServicioAccionesMenu } from "./roles-servicio-acciones-menu";
import { AspiranteFotoThumbnail } from "@dashboard/aspirantes/_components/aspirante-foto";
import { routes } from "@src/lib/apps/routes";
import { formatCedulaMillares } from "@src/lib/aspirantes/cedula";
import { labelJerarquiaAutoridad } from "@src/lib/roles-servicio/jerarquia-autoridad";
import {
  diasDelMes,
  esFinDeSemana,
  etiquetaMes,
  letraSemana,
  type MarcaDia,
} from "@src/lib/roles-servicio/marcas";
import { turnoDesdeMarca } from "@src/lib/roles-servicio/turnos-marca";
import { ordenarAsignacionesEscalera } from "@src/lib/roles-servicio/ordenar-escalera";
import {
  aPlanDiurno,
  detectarRepeticionesDiurnas,
  mensajeChoqueDiurno,
} from "@src/lib/roles-servicio/repeticiones-diurno";
import { foldBusqueda } from "@src/lib/text/fold";
import { cn } from "@src/lib/utils";
import { RolPlanilla } from "./rol-planilla";
import type { AsignacionVista, PlanVista } from "./types";

export type { AsignacionVista, PlanVista };

type Props = {
  anio: number;
  mes: number;
  planes: PlanVista[];
  /** Clave del rol inicial desde la URL; `null` = todos los roles. */
  rolInicial: string | null;
  diaHoy: number | null;
  canWrite?: boolean;
  /** El mes está cerrado: personal y marcas no se reescriben. */
  sellado?: boolean;
};

type ModoVista = "dia" | "mes" | "cuadricula";

type ServicioDia = {
  plan: PlanVista;
  asignacion: AsignacionVista;
  marca: string;
};

type FilaCuadricula = {
  plan: PlanVista;
  asignacion: AsignacionVista;
};

const DIAS_SEMANA = ["D", "L", "M", "M", "J", "V", "S"] as const;

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

function desplazarMes(anio: number, mes: number, delta: number): { anio: number; mes: number } {
  const fecha = new Date(anio, mes - 1 + delta, 1);
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 };
}

function aniosSeleccionables(anio: number): number[] {
  const actual = new Date().getFullYear();
  return [...new Set([actual - 1, actual, actual + 1, anio])]
    .filter((valor) => valor >= 2000 && valor <= 2100)
    .sort((a, b) => a - b);
}

function SelectorMesCuadro({
  anio,
  mes,
  diaHoy,
  sellado,
  onIr,
}: {
  anio: number;
  mes: number;
  diaHoy: number | null;
  sellado: boolean;
  onIr: (fecha: { anio: number; mes: number }) => void;
}) {
  const [vistaAnio, setVistaAnio] = useState(anio);
  const [vistaMes, setVistaMes] = useState(mes);
  useEffect(() => {
    setVistaAnio(anio);
    setVistaMes(mes);
  }, [anio, mes]);

  const ir = (fecha: { anio: number; mes: number }) => {
    setVistaAnio(fecha.anio);
    setVistaMes(fecha.mes);
    onIr(fecha);
  };

  const campo =
    "h-9 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-800";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Mes anterior"
          onClick={() => ir(desplazarMes(vistaAnio, vistaMes, -1))}
        >
          <ChevronLeft />
        </Button>
        <select
          className={cn(campo, "min-w-36")}
          aria-label="Mes"
          value={vistaMes}
          onChange={(event) => ir({ anio: vistaAnio, mes: Number(event.target.value) })}
        >
          {MESES.map((nombre, index) => (
            <option key={nombre} value={index + 1}>
              {nombre}
            </option>
          ))}
        </select>
        <select
          className={cn(campo, "w-24")}
          aria-label="Año"
          value={vistaAnio}
          onChange={(event) => ir({ anio: Number(event.target.value), mes: vistaMes })}
        >
          {aniosSeleccionables(vistaAnio).map((valor) => (
            <option key={valor} value={valor}>
              {valor}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Mes siguiente"
          onClick={() => ir(desplazarMes(vistaAnio, vistaMes, 1))}
        >
          <ChevronRight />
        </Button>
      </div>
      {diaHoy != null || sellado ? (
        <p className="text-[11px] text-slate-500">
          {diaHoy != null ? `Hoy ${diaHoy}` : null}
          {diaHoy != null && sellado ? " · " : null}
          {sellado ? "Sellado" : null}
        </p>
      ) : null}
    </div>
  );
}

const GRUPOS_ROL: { id: string; label: string; match: (nombre: string) => boolean }[] = [
  { id: "oficial", label: "Oficiales", match: (n) => /oficial/i.test(n) },
  { id: "sanidad", label: "Sanidad", match: (n) => /enfermer|medicin/i.test(n) },
  { id: "inspeccion", label: "Inspección", match: (n) => /inspecci/i.test(n) },
  { id: "cuartel", label: "Cuarteles", match: (n) => /cuarteler/i.test(n) },
  { id: "bano", label: "Baños", match: (n) => /ba[nñ]o/i.test(n) },
  { id: "comedor", label: "Comedores", match: (n) => /comedor/i.test(n) },
  { id: "aula", label: "Aulas", match: (n) => /aula/i.test(n) },
  { id: "estacionamiento", label: "Estacionamiento", match: (n) => /estacionamiento/i.test(n) },
  { id: "otros", label: "Otros", match: () => true },
];

function marcaDelDia(asignacion: AsignacionVista, dia: number): string | null {
  return asignacion.dias.find((item) => item.dia === dia)?.marca ?? null;
}

function estaVinculado(asignacion: AsignacionVista): boolean {
  return asignacion.aspirante != null || asignacion.autoridad != null;
}

function nombreMostrado(asignacion: AsignacionVista): string {
  if (asignacion.aspirante) {
    return `${asignacion.aspirante.nombres} ${asignacion.aspirante.apellidos}`;
  }
  if (asignacion.autoridad) {
    return `${asignacion.autoridad.nombres} ${asignacion.autoridad.apellidos}`;
  }
  return asignacion.nombre.trim() || "Sin nombre";
}

const NOMBRE_DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] as const;

function clavePersonaAsignacion(asignacion: AsignacionVista): string {
  if (asignacion.aspirante) return `aspirante:${asignacion.aspirante.id}`;
  if (asignacion.autoridad) return `autoridad:${asignacion.autoridad.id}`;
  return `rol:${asignacion.grado}|${asignacion.nombre.trim().toLowerCase()}`;
}

function etiquetaMarcaGuardia(marca: string): string {
  const turno = turnoDesdeMarca(marca);
  if (turno) return turno.nombre;
  if (marca.toUpperCase() === "X") return "En servicio";
  return `Marca ${marca}`;
}

type GuardiasRolMes = {
  plan: PlanVista;
  dias: MarcaDia[];
};

function cedulasDe(asignacion: AsignacionVista): string[] {
  return [asignacion.aspirante?.cedula, asignacion.autoridad?.cedula]
    .filter((valor): valor is string => Boolean(valor?.trim()))
    .map((valor) => valor.replace(/\D/g, ""))
    .filter((valor) => valor.length >= 6);
}

function tokensPersona(asignacion: AsignacionVista): string[] {
  return [...new Set(tokensNombre(`${nombreMostrado(asignacion)} ${asignacion.nombre}`))].sort();
}

function mismaFirma(a: string[], b: string[]): boolean {
  return a.length >= 2 && a.length === b.length && a.every((token, index) => token === b[index]);
}

/** Misma persona aunque el rol solo tenga el nombre y el censo tenga la ficha. */
function mismaPersonaEnRol(a: AsignacionVista, b: AsignacionVista): boolean {
  if (a.aspirante && b.aspirante) return a.aspirante.id === b.aspirante.id;
  if (a.autoridad && b.autoridad) return a.autoridad.id === b.autoridad.id;
  const cedulasA = cedulasDe(a);
  const mismaCedula = cedulasA.length > 0 && cedulasA.some((cedula) => cedulasDe(b).includes(cedula));
  if ((a.aspirante && b.autoridad) || (a.autoridad && b.aspirante)) return mismaCedula;
  if (mismaCedula) return true;
  const hayFilaSinFicha = (!a.aspirante && !a.autoridad) || (!b.aspirante && !b.autoridad);
  if (hayFilaSinFicha && mismaFirma(tokensPersona(a), tokensPersona(b))) return true;
  return clavePersonaAsignacion(a) === clavePersonaAsignacion(b);
}

function guardiasDelMes(planes: PlanVista[], origen: AsignacionVista): GuardiasRolMes[] {
  const porPlan = new Map<string, GuardiasRolMes>();
  for (const plan of planes) {
    for (const asignacion of plan.asignaciones) {
      if (!mismaPersonaEnRol(origen, asignacion)) continue;
      const actual = porPlan.get(plan.clave);
      if (!actual) {
        porPlan.set(plan.clave, { plan, dias: [...asignacion.dias] });
        continue;
      }
      const vistos = new Set(actual.dias.map((item) => `${item.dia}:${item.marca}`));
      for (const dia of asignacion.dias) {
        const claveDia = `${dia.dia}:${dia.marca}`;
        if (vistos.has(claveDia)) continue;
        actual.dias.push(dia);
        vistos.add(claveDia);
      }
    }
  }
  return [...porPlan.values()]
    .map((grupo) => ({
      ...grupo,
      dias: [...grupo.dias].sort((a, b) => a.dia - b.dia || a.marca.localeCompare(b.marca)),
    }))
    .sort((a, b) => a.plan.nombre.localeCompare(b.plan.nombre, "es"));
}

function asignacionDesdeCenso(persona: PersonaBusqueda): AsignacionVista {
  return {
    id: `censo:${persona.id}`,
    orden: 0,
    grado: persona.grado,
    nombre: `${persona.nombres} ${persona.apellidos}`,
    dias: [],
    aspirante: {
      id: persona.id,
      nombres: persona.nombres,
      apellidos: persona.apellidos,
      cedula: persona.cedula,
      fotoKey: persona.fotoKey,
    },
    autoridad: null,
  };
}

function tokensNombre(consulta: string): string[] {
  return foldBusqueda(consulta.trim())
    .split(/\s+/)
    .filter((token) => token.length >= 2 && /[a-z]/.test(token));
}

function consultaPersonaLista(consulta: string): boolean {
  const texto = consulta.trim();
  return tokensNombre(texto).length > 0 || texto.replace(/\D/g, "").length >= 3;
}

function asignacionCoincide(asignacion: AsignacionVista, consulta: string): boolean {
  const tokens = tokensNombre(consulta);
  const cedula = consulta.replace(/\D/g, "");
  const texto = foldBusqueda(
    [
      nombreMostrado(asignacion),
      asignacion.nombre,
      asignacion.grado,
      asignacion.aspirante?.cedula,
      asignacion.autoridad?.cedula,
    ]
      .filter(Boolean)
      .join(" "),
  );
  const porNombre = tokens.length > 0 && tokens.every((token) => texto.includes(token));
  const cedulas = [asignacion.aspirante?.cedula, asignacion.autoridad?.cedula].filter(
    (valor): valor is string => Boolean(valor?.trim()),
  );
  const porCedula =
    cedula.length >= 3 && cedulas.some((valor) => valor.replace(/\D/g, "").includes(cedula));
  return porNombre || porCedula;
}

function BuscadorPersonaMes({
  planes,
  anio,
  mes,
  onElegir,
}: {
  planes: PlanVista[];
  anio: number;
  mes: number;
  onElegir: (asignacion: AsignacionVista) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);
  const [consulta, setConsulta] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const [censo, setCenso] = useState<PersonaBusqueda[]>([]);
  const [consultaResuelta, setConsultaResuelta] = useState("");

  const texto = consulta.trim();
  const consultaLista = consultaPersonaLista(texto);

  const locales = useMemo(() => {
    if (!consultaLista) return [] as AsignacionVista[];
    const vistos = new Set<string>();
    const lista: AsignacionVista[] = [];
    for (const plan of planes) {
      for (const asignacion of plan.asignaciones) {
        const clave = clavePersonaAsignacion(asignacion);
        if (vistos.has(clave)) continue;
        if (nombreMostrado(asignacion) === "Sin nombre") continue;
        if (!asignacionCoincide(asignacion, texto)) continue;
        vistos.add(clave);
        lista.push(asignacion);
      }
    }
    return lista;
  }, [consultaLista, planes, texto]);

  const resultados = useMemo(() => {
    const censoVisible = consultaLista ? censo : [];
    const pool = [...locales, ...censoVisible.map(asignacionDesdeCenso)];
    const grupoDe = (asignacion: AsignacionVista): string => {
      if (asignacion.aspirante) return `aspirante:${asignacion.aspirante.id}`;
      if (asignacion.autoridad) return `autoridad:${asignacion.autoridad.id}`;
      const cedula = cedulasDe(asignacion)[0];
      if (cedula) {
        const porCedula = pool.find(
          (item) =>
            (item.aspirante != null || item.autoridad != null) && cedulasDe(item).includes(cedula),
        );
        if (porCedula?.aspirante) return `aspirante:${porCedula.aspirante.id}`;
        if (porCedula?.autoridad) return `autoridad:${porCedula.autoridad.id}`;
        return `cedula:${cedula}`;
      }
      const firma = tokensPersona(asignacion);
      if (firma.length >= 2) {
        const porNombre =
          pool.find((item) => item.aspirante != null && mismaFirma(firma, tokensPersona(item))) ??
          pool.find((item) => item.autoridad != null && mismaFirma(firma, tokensPersona(item)));
        if (porNombre?.aspirante) return `aspirante:${porNombre.aspirante.id}`;
        if (porNombre?.autoridad) return `autoridad:${porNombre.autoridad.id}`;
        return `nombre:${firma.join(" ")}`;
      }
      return clavePersonaAsignacion(asignacion);
    };
    const mapa = new Map<string, AsignacionVista>();
    for (const asignacion of pool) {
      const clave = grupoDe(asignacion);
      const actual = mapa.get(clave);
      if (!actual) {
        mapa.set(clave, asignacion);
        continue;
      }
      const peso = (item: AsignacionVista) => (item.aspirante ? 2 : item.autoridad ? 1 : 0);
      if (peso(asignacion) > peso(actual)) mapa.set(clave, asignacion);
    }
    return [...mapa.values()]
      .map((asignacion) => ({ asignacion, roles: guardiasDelMes(planes, asignacion) }))
      .sort((a, b) => {
        const pesoA = a.roles.length > 0 ? 0 : 1;
        const pesoB = b.roles.length > 0 ? 0 : 1;
        if (pesoA !== pesoB) return pesoA - pesoB;
        return nombreMostrado(a.asignacion).localeCompare(nombreMostrado(b.asignacion), "es");
      })
      .slice(0, 12);
  }, [censo, consultaLista, locales, planes]);

  useEffect(() => {
    if (!consultaLista) {
      seq.current += 1;
      return;
    }
    const id = ++seq.current;
    const tokens = tokensNombre(texto);
    const timer = window.setTimeout(() => {
      void buscarPersonalGlobal(texto, 20)
        .then((rows) => {
          if (seq.current !== id) return null;
          if (rows.length > 0 || tokens.length < 2) return rows;
          const apellido = [...tokens].sort((a, b) => b.length - a.length)[0] ?? "";
          return buscarPersonalGlobal(apellido, 20).then((mas) =>
            mas.filter((persona) => {
              const folded = foldBusqueda(`${persona.nombres} ${persona.apellidos} ${persona.cedula}`);
              return tokens.every((token) => folded.includes(token));
            }),
          );
        })
        .then((rows) => {
          if (rows == null || seq.current !== id) return;
          setCenso(rows);
          setConsultaResuelta(texto);
        })
        .catch(() => {
          if (seq.current !== id) return;
          setCenso([]);
          setConsultaResuelta(texto);
        });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [consultaLista, texto]);

  useEffect(() => {
    const cerrar = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", cerrar);
    return () => document.removeEventListener("pointerdown", cerrar);
  }, []);

  const panelAbierto = abierto && texto.length > 0;
  const buscando = consultaLista && consultaResuelta !== texto;
  const indice = resultados.length === 0 ? 0 : Math.min(activo, resultados.length - 1);

  useEffect(() => {
    if (!panelAbierto || resultados.length === 0) return;
    document.getElementById(`${listId}-${indice}`)?.scrollIntoView({ block: "nearest" });
  }, [indice, listId, panelAbierto, resultados.length]);

  const elegir = (asignacion: AsignacionVista) => {
    onElegir(asignacion);
    setConsulta("");
    setCenso([]);
    setAbierto(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setAbierto(true);
      if (resultados.length === 0) return;
      setActivo((i) => (Math.min(i, resultados.length - 1) + 1) % resultados.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setAbierto(true);
      if (resultados.length === 0) return;
      setActivo((i) => {
        const actual = Math.min(i, resultados.length - 1);
        return (actual - 1 + resultados.length) % resultados.length;
      });
    } else if (event.key === "Enter") {
      event.preventDefault();
      const elegido = resultados[indice];
      if (elegido) elegir(elegido.asignacion);
    } else if (event.key === "Escape") {
      setAbierto(false);
    }
  };

  return (
    <div ref={rootRef} className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
      <Input
        value={consulta}
        onChange={(event) => {
          setConsulta(event.target.value);
          setActivo(0);
          setCenso([]);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={onKeyDown}
        placeholder="Buscar aspirante por nombre o cédula…"
        className="h-9 bg-white pr-8 pl-8 text-sm shadow-sm"
        aria-label="Buscar aspirante del mes"
        aria-expanded={panelAbierto}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={panelAbierto && resultados.length > 0 ? `${listId}-${indice}` : undefined}
        autoComplete="off"
        spellCheck={false}
      />
      {consulta ? (
        <button
          type="button"
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Borrar búsqueda"
          onClick={() => {
            setConsulta("");
            setCenso([]);
            setAbierto(false);
          }}
        >
          <X className="size-3.5" aria-hidden />
        </button>
      ) : null}
      {panelAbierto ? (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {!consultaLista ? (
            <p className="px-3 py-3 text-xs text-slate-500">
              Escribe al menos 2 letras o 3 números de la cédula.
            </p>
          ) : resultados.length === 0 ? (
            <p className="px-3 py-3 text-xs text-slate-500">
              {buscando ? "Buscando…" : `Nadie coincide en el censo ni en ${etiquetaMes(anio, mes)}.`}
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Aspirantes" className="max-h-80 overflow-y-auto py-1">
              {resultados.map((item, index) => {
                const cedulaItem = item.asignacion.aspirante
                  ? formatCedulaMillares(item.asignacion.aspirante.cedula)
                  : item.asignacion.autoridad?.cedula?.trim()
                    ? formatCedulaMillares(item.asignacion.autoridad.cedula)
                    : null;
                const roles = item.roles.map((grupo) => grupo.plan.nombre);
                return (
                  <li
                    key={clavePersonaAsignacion(item.asignacion)}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === indice}
                  >
                    <button
                      type="button"
                      className={cn(
                        "flex w-full flex-col gap-0.5 px-3 py-2 text-left",
                        index === indice ? "bg-slate-100" : "hover:bg-slate-50",
                      )}
                      onMouseEnter={() => setActivo(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => elegir(item.asignacion)}
                    >
                      <span className="truncate text-sm font-medium text-slate-900">
                        {nombreMostrado(item.asignacion)}
                      </span>
                      <span className="truncate text-[11px] text-slate-500">
                        {cedulaItem ? (
                          <span className="font-mono tabular-nums">{cedulaItem}</span>
                        ) : (
                          item.asignacion.grado
                        )}
                        {" · "}
                        {roles.length === 0
                          ? `Sin roles en ${etiquetaMes(anio, mes)}`
                          : roles.join(" · ")}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function iniciales(texto: string): string {
  const partes = texto.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return (partes[0]?.slice(0, 2) ?? "?").toUpperCase();
  return `${partes[0]?.[0] ?? ""}${partes[partes.length - 1]?.[0] ?? ""}`.toUpperCase();
}

function grupoDeRol(nombre: string): string {
  for (const grupo of GRUPOS_ROL) {
    if (grupo.id === "otros") continue;
    if (grupo.match(nombre)) return grupo.id;
  }
  return "otros";
}

function densidadClase(count: number, max: number): string {
  if (count <= 0) return "bg-white text-slate-400 hover:bg-slate-50";
  const ratio = max <= 0 ? 0 : count / max;
  if (ratio < 0.25) return "bg-emerald-50 text-emerald-900 hover:bg-emerald-100/80";
  if (ratio < 0.5) return "bg-emerald-100 text-emerald-950 hover:bg-emerald-100";
  if (ratio < 0.75) return "bg-teal-100 text-teal-950 hover:bg-teal-100";
  return "bg-teal-200/90 text-teal-950 hover:bg-teal-200";
}

export function RolesServicioView({
  anio,
  mes,
  planes: planesProp,
  rolInicial,
  diaHoy,
  canWrite = false,
  sellado = false,
}: Props) {
  const router = useRouter();
  const totalDias = diasDelMes(anio, mes);
  const dias = useMemo(() => Array.from({ length: totalDias }, (_, i) => i + 1), [totalDias]);
  const [planes, setPlanes] = useState(planesProp);
  const [rolClave, setRolClave] = useState<string | null>(rolInicial);
  const [modo, setModo] = useState<ModoVista>(() => {
    // Cuadrícula solo tiene sentido con un rol concreto.
    if (rolInicial == null) return "dia";
    return diaHoy != null ? "dia" : "cuadricula";
  });
  const [diaSeleccionado, setDiaSeleccionado] = useState<number>(diaHoy ?? 1);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [navAbierta, setNavAbierta] = useState(false);
  const [cuadriculaAmpliada, setCuadriculaAmpliada] = useState(false);
  const [cuadriculaDesborda, setCuadriculaDesborda] = useState(false);
  const [generarOpen, setGenerarOpen] = useState(false);
  const [verificarOpen, setVerificarOpen] = useState(false);
  const [generarPending, startGenerarTransition] = useTransition();
  const [verificarPending, startVerificarTransition] = useTransition();
  const [escaleraPending, startEscaleraTransition] = useTransition();
  const [selloAbierto, setSelloAbierto] = useState(false);
  const [selloPending, startSelloTransition] = useTransition();
  const [selloError, setSelloError] = useState<string | null>(null);
  const [personaGuardias, setPersonaGuardias] = useState<AsignacionVista | null>(null);
  const puedeEditar = canWrite && !sellado;
  const mesSiguiente = useMemo(() => desplazarMes(anio, mes, 1), [anio, mes]);
  const irAMes = (fecha: { anio: number; mes: number }) => {
    router.push(`${routes.personal.rolesServicio}?anio=${fecha.anio}&mes=${fecha.mes}`);
  };
  const hrefPersonal = `${routes.personal.rolesServicioEstudio}?anio=${sellado ? mesSiguiente.anio : anio}&mes=${sellado ? mesSiguiente.mes : mes}&asignar=1`;
  const hrefArmar = `${routes.personal.rolesServicioEstudio}?anio=${sellado ? mesSiguiente.anio : anio}&mes=${sellado ? mesSiguiente.mes : mes}`;
  const cuadriculaScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPlanes(planesProp);
  }, [planesProp]);

  const planActivo = useMemo(
    () => (rolClave ? planes.find((plan) => plan.clave === rolClave) ?? null : null),
    [planes, rolClave],
  );
  const planesAlcance = planActivo ? [planActivo] : planes;
  const todosLosRoles = rolClave == null;

  const aplicarMarcasLocal = (cambios: Array<{ asignacionId: string; dias: MarcaDia[] }>) => {
    if (cambios.length === 0) return;
    const mapa = new Map(cambios.map((c) => [c.asignacionId, c.dias]));
    setPlanes((prev) =>
      prev.map((plan) => ({
        ...plan,
        asignaciones: plan.asignaciones.map((asignacion) => {
          const diasNext = mapa.get(asignacion.id);
          return diasNext ? { ...asignacion, dias: diasNext } : asignacion;
        }),
      })),
    );
  };

  const aplicarPersonaTraida = (args: {
    planClave: string;
    origenAsignacionId: string;
    origenDias: MarcaDia[];
    asignacion: AsignacionVista;
  }) => {
    setPlanes((prev) =>
      prev.map((plan) => {
        if (plan.clave !== args.planClave) return plan;
        const sinOrigenActualizado = plan.asignaciones.map((asignacion) =>
          asignacion.id === args.origenAsignacionId
            ? { ...asignacion, dias: args.origenDias }
            : asignacion,
        );
        const idx = sinOrigenActualizado.findIndex((item) => item.id === args.asignacion.id);
        if (idx >= 0) {
          const next = [...sinOrigenActualizado];
          next[idx] = args.asignacion;
          return { ...plan, asignaciones: next };
        }
        return { ...plan, asignaciones: [...sinOrigenActualizado, args.asignacion] };
      }),
    );
  };

  const aplicarPersonaSacada = (args: { planClave: string; asignacionId: string }) => {
    setPlanes((prev) =>
      prev.map((plan) => {
        if (plan.clave !== args.planClave) return plan;
        return {
          ...plan,
          asignaciones: plan.asignaciones
            .filter((asignacion) => asignacion.id !== args.asignacionId)
            .map((asignacion, index) =>
              asignacion.orden === index + 1 ? asignacion : { ...asignacion, orden: index + 1 },
            ),
        };
      }),
    );
  };

  const aplicarEscaleraLocal = (clave: string) => {
    setPlanes((prev) =>
      prev.map((plan) =>
        plan.clave === clave
          ? { ...plan, asignaciones: ordenarAsignacionesEscalera(plan.asignaciones) }
          : plan,
      ),
    );
  };

  const ordenarEscalera = () => {
    if (!planActivo || !puedeEditar || escaleraPending) return;
    const clave = planActivo.clave;
    aplicarEscaleraLocal(clave);
    startEscaleraTransition(async () => {
      const result = await ordenarRolEscalera(anio, mes, clave);
      if (!result.ok) {
        window.alert(result.message);
      }
      router.refresh();
    });
  };

  useEffect(() => {
    setRolClave(rolInicial);
    setDiaSeleccionado(diaHoy ?? 1);
  }, [anio, mes, rolInicial, diaHoy]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("anio", String(anio));
    params.set("mes", String(mes));
    if (rolClave) params.set("rol", rolClave);
    window.history.replaceState(null, "", `${routes.personal.rolesServicio}?${params.toString()}`);
  }, [anio, mes, rolClave]);

  useEffect(() => {
    if (modo !== "cuadricula") setCuadriculaAmpliada(false);
  }, [modo]);

  useEffect(() => {
    if (todosLosRoles && modo === "cuadricula") setModo("dia");
  }, [todosLosRoles, modo]);

  const abrirDiaDesdeCuadricula = (dia: number) => {
    setDiaSeleccionado(dia);
    setModo("dia");
    setCuadriculaAmpliada(false);
  };

  const servicioDelDia = useMemo(() => {
    const lista: ServicioDia[] = [];
    for (const plan of planesAlcance) {
      for (const asignacion of plan.asignaciones) {
        const marca = marcaDelDia(asignacion, diaSeleccionado);
        if (!marca) continue;
        lista.push({ plan, asignacion, marca });
      }
    }
    lista.sort((a, b) => {
      const turnoA = turnoDesdeMarca(a.marca);
      const turnoB = turnoDesdeMarca(b.marca);
      if (turnoA && turnoB && turnoA.orden !== turnoB.orden) return turnoA.orden - turnoB.orden;
      return 0;
    });
    return lista;
  }, [planesAlcance, diaSeleccionado]);

  const conteoPorDia = useMemo(() => {
    const mapa = new Map<number, number>();
    for (const plan of planesAlcance) {
      for (const asignacion of plan.asignaciones) {
        for (const marca of asignacion.dias) {
          mapa.set(marca.dia, (mapa.get(marca.dia) ?? 0) + 1);
        }
      }
    }
    return mapa;
  }, [planesAlcance]);

  const maxConteo = useMemo(() => Math.max(1, ...conteoPorDia.values(), 1), [conteoPorDia]);

  const celdasCalendario = useMemo(() => {
    const primero = new Date(anio, mes - 1, 1).getDay();
    const huecos = Array.from({ length: primero }, () => null as number | null);
    return [...huecos, ...dias];
  }, [anio, mes, dias]);

  const planesFiltrados = useMemo(() => {
    const q = filtroRol.trim().toLowerCase();
    if (!q) return planes;
    return planes.filter(
      (plan) => plan.nombre.toLowerCase().includes(q) || plan.curso.toLowerCase().includes(q),
    );
  }, [planes, filtroRol]);

  const gruposNav = useMemo(() => {
    const porGrupo = new Map<string, PlanVista[]>();
    for (const plan of planesFiltrados) {
      const id = grupoDeRol(plan.nombre);
      const lista = porGrupo.get(id) ?? [];
      lista.push(plan);
      porGrupo.set(id, lista);
    }
    return GRUPOS_ROL.map((grupo) => ({
      ...grupo,
      planes: porGrupo.get(grupo.id) ?? [],
    })).filter((grupo) => grupo.planes.length > 0);
  }, [planesFiltrados]);

  const filasCuadricula = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const filas: FilaCuadricula[] = [];
    for (const plan of planesAlcance) {
      for (const asignacion of plan.asignaciones) {
        if (!q) {
          filas.push({ plan, asignacion });
          continue;
        }
        const texto = [
          plan.nombre,
          asignacion.nombre,
          asignacion.grado,
          asignacion.aspirante?.nombres,
          asignacion.aspirante?.apellidos,
          asignacion.autoridad?.nombres,
          asignacion.autoridad?.apellidos,
          asignacion.aspirante?.cedula,
          asignacion.autoridad?.cedula,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (texto.includes(q)) filas.push({ plan, asignacion });
      }
    }
    return filas;
  }, [planesAlcance, busqueda]);

  useEffect(() => {
    if (modo !== "cuadricula") {
      setCuadriculaDesborda(false);
      return;
    }

    const el = cuadriculaScrollRef.current;
    if (!el) return;

    const medir = () => {
      setCuadriculaDesborda(el.scrollWidth > el.clientWidth + 2);
    };

    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    const tabla = el.querySelector("table");
    if (tabla) ro.observe(tabla);
    window.addEventListener("resize", medir);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", medir);
    };
  }, [modo, filasCuadricula, dias, todosLosRoles]);

  const esHoySeleccionado = diaHoy != null && diaSeleccionado === diaHoy;
  const planesDiurno = useMemo(() => aPlanDiurno(planes), [planes]);
  const repeticionesDiurnas = useMemo(
    () => detectarRepeticionesDiurnas(planesDiurno).length,
    [planesDiurno],
  );
  const choqueAlMarcar = (asignacion: AsignacionVista, dia: number) =>
    mensajeChoqueDiurno(planesDiurno, asignacion.id, dia);

  const seleccionarRol = (clave: string | null) => {
    setRolClave(clave);
    if (clave == null && modo === "cuadricula") setModo("dia");
    setNavAbierta(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Roles de servicio</h1>
            <p className="text-xs text-slate-500">Elige el mes del cuadro.</p>
          </div>
          <SelectorMesCuadro anio={anio} mes={mes} diaHoy={diaHoy} sellado={sellado} onIr={irAMes} />
        </div>
        <BuscadorPersonaMes planes={planes} anio={anio} mes={mes} onElegir={setPersonaGuardias} />
      </header>
      {planes.length === 0 ? (
        <Card className="shadow-sm ring-slate-200/80">
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <CalendarRange className="size-8 text-slate-300" aria-hidden />
            <p className="text-sm font-medium text-slate-800">No hay roles en {etiquetaMes(anio, mes)}</p>
            <p className="max-w-sm text-xs text-slate-500">
              Trae los roles de otro mes o arma este desde cero. Cada mes conserva los suyos.
            </p>
            {canWrite ? (
              <div className="mt-2 w-full max-w-md space-y-3">
                <DuplicarRolesControl anio={anio} mes={mes} tieneRoles={false} sellado={sellado} />
                <Link
                  href={`${routes.personal.rolesServicioEstudio}?anio=${anio}&mes=${mes}&asignar=1`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
                >
                  <Users className="size-3.5" aria-hidden />
                  Asignar personal
                </Link>
                <Link
                  href={`${routes.personal.rolesServicioEstudio}?anio=${anio}&mes=${mes}`}
                  className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
                >
                  <Wand2 className="size-3.5" aria-hidden />
                  Armar el mes
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="grid w-full gap-4 xl:grid-cols-[15.5rem_minmax(0,1fr)]">
          <aside className="min-w-0">
            <Card className="gap-0 py-0 shadow-sm ring-slate-200/80 xl:sticky xl:top-4">
              <CardHeader className="space-y-3 border-b border-slate-200/80 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm">Cuadro de servicio</CardTitle>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <RolesServicioAccionesMenu
                      anio={anio}
                      mes={mes}
                      diaSeleccionado={diaSeleccionado}
                      planes={planes}
                      canWrite={canWrite}
                      sellado={sellado}
                      hrefPersonal={hrefPersonal}
                      hrefArmar={hrefArmar}
                      canGenerar={puedeEditar && planes.some((p) => p.asignaciones.length > 0)}
                      onGenerarCalendario={() => setGenerarOpen(true)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="xl:hidden"
                      onClick={() => setNavAbierta((v) => !v)}
                      aria-expanded={navAbierta}
                      aria-label="Mostrar u ocultar panel lateral"
                    >
                      <ChevronsUpDown />
                    </Button>
                  </div>
                </div>

                <div className={cn(!navAbierta && "hidden xl:block")}>
                  <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                    {(
                      [
                        { id: "dia", label: "Día", icon: UserRound },
                        { id: "mes", label: "Mes", icon: CalendarDays },
                        { id: "cuadricula", label: "Cuad.", icon: LayoutGrid },
                      ] as const
                    ).map((item) => {
                      const Icon = item.icon;
                      const activoModo = modo === item.id;
                      const deshabilitado = item.id === "cuadricula" && todosLosRoles;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={deshabilitado}
                          title={
                            deshabilitado
                              ? "Elige un rol para ver la cuadrícula"
                              : undefined
                          }
                          onClick={() => {
                            if (deshabilitado) return;
                            setModo(item.id);
                          }}
                          className={cn(
                            "inline-flex flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] font-medium transition-all",
                            deshabilitado
                              ? "cursor-not-allowed text-slate-400 opacity-50"
                              : activoModo
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                                : "text-slate-600 hover:text-slate-900",
                          )}
                        >
                          <Icon className="size-3.5" aria-hidden />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-full justify-start gap-1.5 text-xs"
                  onClick={() => setVerificarOpen(true)}
                >
                  <ShieldAlert className="size-3.5" aria-hidden />
                  Verificar diurno
                  {repeticionesDiurnas > 0 ? (
                    <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                      {repeticionesDiurnas}
                    </span>
                  ) : null}
                </Button>
                {canWrite ? (
                  <Button
                    type="button"
                    variant={sellado ? "secondary" : "outline"}
                    size="sm"
                    className="h-8 w-full justify-start gap-1.5 text-xs"
                    onClick={() => {
                      setSelloError(null);
                      setSelloAbierto(true);
                    }}
                  >
                    <Lock className="size-3.5" aria-hidden />
                    {sellado ? "Mes sellado" : `Sellar ${etiquetaMes(anio, mes)}`}
                  </Button>
                ) : sellado ? (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <Lock className="size-3.5" aria-hidden />
                    Mes sellado
                  </p>
                  ) : null}
                {canWrite ? (
                  <DuplicarRolesControl anio={anio} mes={mes} tieneRoles={planes.length > 0} sellado={sellado} />
                ) : null}
              </CardHeader>

              <div className={cn("border-b border-slate-200/80 px-3 py-2.5", !navAbierta && "hidden xl:block")}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                    Roles · {planesFiltrados.length}
                  </p>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={filtroRol}
                    onChange={(e) => setFiltroRol(e.target.value)}
                    placeholder="Buscar rol…"
                    className="h-8 bg-white pl-8 text-xs"
                  />
                </div>
              </div>

              <CardContent
                className={cn(
                  "max-h-112 overflow-y-auto px-2 py-2",
                  !navAbierta && "hidden xl:block",
                )}
              >
                <nav className="flex flex-col gap-3" aria-label="Roles de servicio">
                  <button
                    type="button"
                    onClick={() => seleccionarRol(null)}
                    className={cn(
                      "rounded-lg px-2.5 py-2 text-left transition-colors",
                      todosLosRoles
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <span className="block text-xs font-medium">Todos los roles</span>
                    <span className={cn("mt-0.5 block text-[10px]", todosLosRoles ? "text-slate-300" : "text-slate-500")}>
                      {planes.length} roles · vista consolidada
                    </span>
                  </button>

                  {gruposNav.map((grupo) => (
                    <div key={grupo.id} className="flex flex-col gap-1">
                      <p className="px-2 text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                        {grupo.label}
                      </p>
                      {grupo.planes.map((plan) => {
                        const seleccion = plan.clave === rolClave;
                        const activos = plan.asignaciones.filter((a) => a.nombre.trim()).length;
                        const ligados = plan.asignaciones.filter((a) => estaVinculado(a)).length;
                        return (
                          <button
                            key={plan.clave}
                            type="button"
                            onClick={() => seleccionarRol(plan.clave)}
                            className={cn(
                              "rounded-lg px-2.5 py-2 text-left transition-colors",
                              seleccion
                                ? "bg-slate-900 text-white shadow-sm"
                                : "text-slate-700 hover:bg-slate-50",
                            )}
                          >
                            <span className="block text-xs leading-snug font-medium">{plan.nombre}</span>
                            <span
                              className={cn(
                                "mt-0.5 block text-[10px] tabular-nums",
                                seleccion ? "text-slate-300" : "text-slate-500",
                              )}
                            >
                              {ligados}/{activos || plan.asignaciones.length} vinculados
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </aside>

          <div className="flex w-full min-w-0 flex-col gap-5">
            {modo === "dia" ? (
              <Card className="gap-0 py-0 shadow-sm ring-slate-200/80">
                <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-amber-50/80 to-white px-4 py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Servicio del día {diaSeleccionado}
                        {esHoySeleccionado ? (
                          <Badge className="ml-2 align-middle" variant="secondary">
                            Hoy
                          </Badge>
                        ) : null}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {letraSemana(anio, mes, diaSeleccionado)} · {servicioDelDia.length} personas en turno
                        {todosLosRoles ? " · todos los roles" : ` · ${planActivo?.nombre}`}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        disabled={diaSeleccionado <= 1}
                        onClick={() => setDiaSeleccionado((d) => Math.max(1, d - 1))}
                      >
                        Anterior
                      </Button>
                      {diaHoy != null ? (
                        <Button type="button" variant="outline" size="xs" onClick={() => setDiaSeleccionado(diaHoy)}>
                          Ir a hoy
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        disabled={diaSeleccionado >= totalDias}
                        onClick={() => setDiaSeleccionado((d) => Math.min(totalDias, d + 1))}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {servicioDelDia.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                      Nadie figura de servicio este día
                      {todosLosRoles ? "" : " en este rol"}.
                    </p>
                  ) : (
                    <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {servicioDelDia.map(({ plan, asignacion, marca }) => (
                        <li key={`${plan.clave}-${asignacion.id}`}>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => setPersonaGuardias(asignacion)}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter" && event.key !== " ") return;
                              event.preventDefault();
                              setPersonaGuardias(asignacion);
                            }}
                            aria-label={`Ver guardias de ${nombreMostrado(asignacion)} en ${etiquetaMes(anio, mes)}`}
                            className={cn(
                              "group w-full cursor-pointer rounded-xl border bg-white p-3 text-left transition-colors hover:bg-slate-50/60",
                              "focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:outline-none",
                              todosLosRoles
                                ? "border-slate-200/90 hover:border-slate-300"
                                : "border-teal-300/90 ring-1 ring-teal-200/70",
                            )}
                          >
                          <div className="flex items-start gap-3">
                            <AvatarAsignacion asignacion={asignacion} size="md" />
                            <div className="min-w-0 flex-1">
                              {todosLosRoles ? (
                                <span className="block truncate text-[10px] font-medium tracking-wide text-slate-500 uppercase">
                                  {plan.nombre}
                                </span>
                              ) : null}
                              <PersonaRol asignacion={asignacion} compact nombreFijo={sellado} />
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <Badge variant="outline" className="font-mono text-[10px]">
                                  {asignacion.grado}
                                </Badge>
                                {turnoDesdeMarca(marca) ? (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {turnoDesdeMarca(marca)?.nombre}
                                  </Badge>
                                ) : marca !== "X" ? (
                                  <Badge variant="secondary" className="text-[10px]">
                                    Marca {marca}
                                  </Badge>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-teal-700">
                                    <CheckCircle2 className="size-3" aria-hidden /> En servicio
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {modo === "mes" ? (
              <Card className="w-full max-w-xl gap-0 py-0 shadow-sm ring-slate-200/80">
                <CardHeader className="border-b border-slate-200/80 px-4 py-3">
                  <CardTitle className="text-base">{etiquetaMes(anio, mes)}</CardTitle>
                  <CardDescription className="text-xs">
                    {todosLosRoles ? "Todos los roles" : planActivo?.nombre}
                    {" · "}
                    pulsa un día para el detalle
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                      {DIAS_SEMANA.map((letra, index) => (
                        <div
                          key={`${letra}-${index}`}
                          className="py-1.5 text-center text-[10px] font-semibold tracking-wide text-slate-500 uppercase"
                        >
                          {letra}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7">
                      {celdasCalendario.map((dia, index) => {
                        if (dia == null) {
                          return (
                            <div
                              key={`empty-${index}`}
                              className="h-11 border-r border-b border-slate-100 bg-slate-50/40 last:border-r-0 sm:h-12"
                            />
                          );
                        }
                        const count = conteoPorDia.get(dia) ?? 0;
                        const seleccionado = dia === diaSeleccionado;
                        const hoy = dia === diaHoy;
                        const finDeColumna = (index + 1) % 7 === 0;
                        return (
                          <button
                            key={dia}
                            type="button"
                            onClick={() => {
                              setDiaSeleccionado(dia);
                              setModo("dia");
                            }}
                            className={cn(
                              "relative flex h-11 flex-col items-center justify-center gap-0.5 border-r border-b border-slate-100 transition-colors sm:h-12",
                              finDeColumna && "border-r-0",
                              densidadClase(count, maxConteo),
                              esFinDeSemana(anio, mes, dia) && count === 0 && "bg-slate-50",
                              seleccionado && "z-10 ring-2 ring-inset ring-slate-900",
                              hoy && !seleccionado && "ring-2 ring-inset ring-amber-400",
                            )}
                          >
                            <span
                              className={cn(
                                "text-xs leading-none font-semibold tabular-nums sm:text-[13px]",
                                hoy && "text-amber-700",
                              )}
                            >
                              {dia}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] leading-none tabular-nums",
                                count > 0 ? "font-medium opacity-80" : "text-slate-300",
                              )}
                            >
                              {count > 0 ? count : "·"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {modo === "cuadricula" ? (
              <Card className="w-full gap-0 py-0 shadow-sm ring-slate-200/80">
                <CardHeader className="border-b border-slate-200/80 px-4 py-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                      <CardTitle className="text-base">
                        {todosLosRoles ? "Planilla consolidada" : planActivo?.nombre}
                      </CardTitle>
                      {planActivo?.curso || todosLosRoles ? (
                        <CardDescription className="text-xs">
                          {todosLosRoles ? `${planes.length} roles` : planActivo?.curso}
                        </CardDescription>
                      ) : null}
                    </div>
                    <div className="flex w-full max-w-md flex-wrap items-center gap-2 lg:justify-end">
                      {puedeEditar && planActivo ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          disabled={escaleraPending || planActivo.asignaciones.length < 2}
                          onClick={ordenarEscalera}
                          title="Ordena las filas por el primer día de guardia (diagonal)"
                        >
                          <ArrowDownUp className="size-3.5" aria-hidden />
                          {escaleraPending ? "Ordenando…" : "Escalera"}
                        </Button>
                      ) : null}
                      {cuadriculaDesborda ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => setCuadriculaAmpliada(true)}
                        >
                          <Maximize2 className="size-3.5" aria-hidden />
                          Ver completo
                        </Button>
                      ) : null}
                      <div className="relative min-w-0 flex-1 basis-40">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={busqueda}
                          onChange={(e) => setBusqueda(e.target.value)}
                          placeholder="Filtrar personal…"
                          className="h-8 bg-white pl-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="w-full min-w-0 p-0">
                  {filasCuadricula.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm text-slate-500">
                      {busqueda.trim()
                        ? "Ninguna persona coincide con la búsqueda."
                        : "No hay personal asignado en la selección actual."}
                    </p>
                  ) : (
                    <>
                      <div
                        ref={cuadriculaScrollRef}
                        className="w-full min-w-0 overflow-x-auto overscroll-x-contain"
                      >
                        <RolPlanilla
                          filas={filasCuadricula}
                          dias={dias}
                          anio={anio}
                          mes={mes}
                          diaHoy={diaHoy}
                          diaSeleccionado={diaSeleccionado}
                          todosLosRoles={todosLosRoles}
                          canWrite={puedeEditar}
                          onSelectDia={abrirDiaDesdeCuadricula}
                          onMarcasChange={aplicarMarcasLocal}
                          onPersonaTraida={aplicarPersonaTraida}
                          onPersonaSacada={aplicarPersonaSacada}
                          choqueAlMarcar={choqueAlMarcar}
                          nombreFijo={sellado}
                        />
                      </div>
                      {cuadriculaDesborda ? (
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 px-4 py-2">
                          <p className="text-[11px] text-slate-500">
                            Desplace horizontalmente para ver todo el mes, o ábrala a pantalla completa.
                          </p>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 gap-1.5 text-xs"
                            onClick={() => setCuadriculaAmpliada(true)}
                          >
                            <Maximize2 className="size-3.5" aria-hidden />
                            Ver completo
                          </Button>
                        </div>
                      ) : null}
                    </>
                  )}
                </CardContent>
              </Card>
            ) : null}

            <Dialog open={cuadriculaAmpliada} onOpenChange={setCuadriculaAmpliada}>
              <DialogContent
                className="flex h-[min(100dvh-1rem,920px)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[calc(100vw-1rem)]"
                showCloseButton
              >
                <DialogHeader className="shrink-0 border-b border-slate-200 px-4 py-3 pr-12 sm:px-5">
                  <DialogTitle>
                    {todosLosRoles ? "Planilla consolidada" : planActivo?.nombre}
                  </DialogTitle>
                  <DialogDescription>
                    Vista ampliada tipo Excel · {etiquetaMes(anio, mes)} · {filasCuadricula.length}{" "}
                    personas
                  </DialogDescription>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {puedeEditar && planActivo ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        disabled={escaleraPending || planActivo.asignaciones.length < 2}
                        onClick={ordenarEscalera}
                        title="Ordena las filas por el primer día de guardia (diagonal)"
                      >
                        <ArrowDownUp className="size-3.5" aria-hidden />
                        {escaleraPending ? "Ordenando…" : "Escalera"}
                      </Button>
                    ) : null}
                    <div className="relative min-w-0 flex-1 basis-40 max-w-xs">
                      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Filtrar personal…"
                        className="h-8 bg-white pl-8 text-xs"
                      />
                    </div>
                  </div>
                </DialogHeader>
                <div className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain">
                  {filasCuadricula.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm text-slate-500">
                      {busqueda.trim()
                        ? "Ninguna persona coincide con la búsqueda."
                        : "No hay personal asignado en la selección actual."}
                    </p>
                  ) : (
                    <RolPlanilla
                      filas={filasCuadricula}
                      dias={dias}
                      anio={anio}
                      mes={mes}
                      diaHoy={diaHoy}
                      diaSeleccionado={diaSeleccionado}
                      todosLosRoles={todosLosRoles}
                      canWrite={puedeEditar}
                      onSelectDia={abrirDiaDesdeCuadricula}
                      onMarcasChange={aplicarMarcasLocal}
                      onPersonaTraida={aplicarPersonaTraida}
                      onPersonaSacada={aplicarPersonaSacada}
                      choqueAlMarcar={choqueAlMarcar}
                      nombreFijo={sellado}
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <VerificarDiurnoDialog
              open={verificarOpen}
              onOpenChange={setVerificarOpen}
              planes={planes}
              anio={anio}
              mes={mes}
              canWrite={puedeEditar}
              pending={verificarPending}
              onApply={(cambios) => {
                aplicarMarcasLocal(cambios);
                startVerificarTransition(async () => {
                  await actualizarMarcasLote(cambios);
                });
              }}
            />

            <Dialog open={selloAbierto} onOpenChange={setSelloAbierto}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>
                    {sellado ? `Abrir ${etiquetaMes(anio, mes)}` : `Sellar ${etiquetaMes(anio, mes)}`}
                  </DialogTitle>
                  <DialogDescription>
                    {sellado
                      ? "Al quitar el sello, el personal y las marcas de este mes vuelven a poder editarse."
                      : "Las guardias de este mes quedan fijas. Un cambio de personal arma el mes siguiente y no reescribe estas."}
                  </DialogDescription>
                </DialogHeader>
                {selloError ? <p className="px-5 text-sm text-red-700">{selloError}</p> : null}
                <div className="flex justify-end gap-2 px-5 py-4">
                  <Button type="button" variant="outline" disabled={selloPending} onClick={() => setSelloAbierto(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    disabled={selloPending}
                    onClick={() => {
                      setSelloError(null);
                      startSelloTransition(async () => {
                        const result = await sellarMesRoles(anio, mes, !sellado);
                        if (!result.ok) {
                          setSelloError(result.message);
                          return;
                        }
                        setSelloAbierto(false);
                        router.refresh();
                      });
                    }}
                  >
                    {sellado ? "Quitar sello" : "Sellar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {puedeEditar ? (
              <GenerarCalendarioDialog
                open={generarOpen}
                onOpenChange={setGenerarOpen}
                planes={planes}
                rolInicialClave={planActivo?.clave ?? null}
                ultimoDia={dias[dias.length - 1] ?? 31}
                pending={generarPending}
                onApply={(cambios) => {
                  aplicarMarcasLocal(cambios);
                  startGenerarTransition(async () => {
                    const result = await actualizarMarcasLote(cambios);
                    if (result.ok) setGenerarOpen(false);
                  });
                }}
              />
            ) : null}
          </div>
        </div>
      )}
      <GuardiasMesDialog
        asignacion={personaGuardias}
        planes={planes}
        anio={anio}
        mes={mes}
        diaSeleccionado={diaSeleccionado}
        onClose={() => setPersonaGuardias(null)}
      />
    </div>
  );
}

function AvatarAsignacion({
  asignacion,
  size,
}: {
  asignacion: AsignacionVista;
  size: "sm" | "md";
}) {
  const aspirante = asignacion.aspirante;
  if (aspirante?.fotoKey) {
    return (
      <span className="mt-0.5 shrink-0">
        <AspiranteFotoThumbnail
          aspiranteId={aspirante.id}
          fotoKey={aspirante.fotoKey}
          nombre={nombreMostrado(asignacion)}
          size={size}
          kind="perfil"
        />
      </span>
    );
  }

  const clase = size === "md" ? "size-9 text-[11px]" : "size-7 text-[10px]";
  return (
    <span
      className={cn(
        "mt-0.5 flex shrink-0 items-center justify-center rounded-full font-semibold",
        clase,
        asignacion.autoridad
          ? "bg-indigo-100 text-indigo-900"
          : aspirante
            ? "bg-slate-100 text-slate-700"
            : "bg-amber-50 text-amber-800",
      )}
    >
      {iniciales(nombreMostrado(asignacion))}
    </span>
  );
}

function MarcaCelda({ marca }: { marca: string }) {
  const turno = turnoDesdeMarca(marca);
  if (turno) {
    const tono =
      marca.toUpperCase() === "T1"
        ? "bg-indigo-700"
        : marca.toUpperCase() === "T2"
          ? "bg-violet-700"
          : "bg-amber-700";
    return (
      <span
        className={cn(
          "mx-auto inline-flex min-w-5 items-center justify-center rounded-md px-1 py-0.5 font-mono text-[10px] font-semibold text-white",
          tono,
        )}
        title={turno.nombre}
      >
        {marca}
      </span>
    );
  }
  if (marca === "X") {
    return (
      <span
        className="mx-auto inline-flex size-5 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white shadow-sm shadow-teal-700/20"
        title="En servicio"
      >
        ✓
      </span>
    );
  }
  return (
    <span
      className="mx-auto inline-flex min-w-5 items-center justify-center rounded-md bg-slate-800 px-1 py-0.5 font-mono text-[10px] font-semibold text-white"
      title={`Marca ${marca}`}
    >
      {marca}
    </span>
  );
}

function PersonaRol({
  asignacion,
  compact = false,
  nombreFijo = false,
}: {
  asignacion: AsignacionVista;
  compact?: boolean;
  nombreFijo?: boolean;
}) {
  if (nombreFijo && asignacion.nombre.trim()) {
    const aspirante = asignacion.aspirante;
    return (
      <span className="block">
        <span className={cn("font-medium text-slate-900", compact ? "text-xs" : "text-sm")}>
          {asignacion.nombre}
        </span>
        {aspirante && !compact ? (
          <span className="mt-0.5 block font-mono text-[10px] tabular-nums text-slate-500">
            {formatCedulaMillares(aspirante.cedula)}
          </span>
        ) : null}
      </span>
    );
  }
  if (!asignacion.nombre.trim()) {
    return <span className={cn("block text-slate-400", compact ? "text-xs" : "text-sm")}>Sin nombre en el rol</span>;
  }
  if (asignacion.autoridad) {
    const { autoridad } = asignacion;
    const cedula = autoridad.cedula?.trim()
      ? formatCedulaMillares(autoridad.cedula)
      : null;
    return (
      <span className="block">
        <span className={cn("font-medium text-slate-900", compact ? "text-xs" : "text-sm")}>
          {autoridad.nombres} {autoridad.apellidos}
        </span>
        <span className="mt-0.5 block text-[10px] text-indigo-700">
          {labelJerarquiaAutoridad(autoridad.jerarquia)}
          {cedula ? (
            <>
              {" · "}
              <span className="font-mono tabular-nums">{cedula}</span>
            </>
          ) : (
            " · Sin cédula"
          )}
        </span>
      </span>
    );
  }
  if (!asignacion.aspirante) {
    return (
      <span className="block">
        <span className={cn("font-medium text-slate-900", compact ? "text-xs" : "text-sm")}>{asignacion.nombre}</span>
        <span className="mt-0.5 block text-[10px] text-amber-700">Sin coincidencia en el censo</span>
      </span>
    );
  }
  const { aspirante } = asignacion;
  const cedula = formatCedulaMillares(aspirante.cedula);
  return (
    <span className="block">
      <span className={cn("font-medium text-slate-900", compact ? "text-xs" : "text-sm")}>
        {aspirante.nombres} {aspirante.apellidos}
      </span>
      {!compact ? (
        <span className="mt-0.5 block text-[11px] text-slate-500">
          En el rol: {asignacion.nombre} · <span className="font-mono tabular-nums">{cedula}</span>
        </span>
      ) : (
        <span className="mt-0.5 block truncate font-mono text-[10px] tabular-nums text-slate-500">{cedula}</span>
      )}
    </span>
  );
}

function GuardiasMesDialog({
  asignacion,
  planes,
  anio,
  mes,
  diaSeleccionado,
  onClose,
}: {
  asignacion: AsignacionVista | null;
  planes: PlanVista[];
  anio: number;
  mes: number;
  diaSeleccionado: number;
  onClose: () => void;
}) {
  const grupos = asignacion ? guardiasDelMes(planes, asignacion) : [];
  const total = grupos.reduce((suma, grupo) => suma + grupo.dias.length, 0);
  const aspirante = asignacion?.aspirante ?? null;
  const cedula = aspirante
    ? formatCedulaMillares(aspirante.cedula)
    : asignacion?.autoridad?.cedula?.trim()
      ? formatCedulaMillares(asignacion.autoridad.cedula)
      : null;

  return (
    <Dialog open={asignacion != null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>{asignacion ? nombreMostrado(asignacion) : "Guardias"}</DialogTitle>
          <DialogDescription>
            {grupos.length === 0
              ? `Sin roles en ${etiquetaMes(anio, mes)}`
              : `${grupos.length} ${grupos.length === 1 ? "rol" : "roles"} en ${etiquetaMes(anio, mes)}${
                  total > 0 ? ` · ${total} ${total === 1 ? "día" : "días"} de servicio` : ""
                }`}
            {cedula ? ` · ${cedula}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[min(60vh,28rem)] overflow-y-auto px-5 py-4">
          {grupos.length === 0 ? (
            <p className="text-sm text-slate-500">
              No figura en el cuadro de {etiquetaMes(anio, mes)}.
            </p>
          ) : (
            <ul className="space-y-4">
              {grupos.map((grupo) => (
                <li key={grupo.plan.clave}>
                  <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                    {grupo.plan.nombre}
                  </p>
                  {grupo.dias.length === 0 ? (
                    <p className="mt-1.5 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">
                      Asignado, sin días marcados
                    </p>
                  ) : (
                    <ul className="mt-1.5 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
                      {grupo.dias.map((item) => {
                        const semana = NOMBRE_DIA[new Date(anio, mes - 1, item.dia).getDay()] ?? "";
                        const esDiaAbierto = item.dia === diaSeleccionado;
                        return (
                          <li
                            key={`${grupo.plan.clave}-${item.dia}-${item.marca}`}
                            className={cn(
                              "flex items-center justify-between gap-3 px-3 py-2 text-sm",
                              esDiaAbierto && "bg-amber-50",
                            )}
                          >
                            <span className="min-w-0 text-slate-900">
                              <span className="font-semibold tabular-nums">{item.dia}</span>
                              <span className="ml-1.5 text-slate-500 capitalize">{semana}</span>
                            </span>
                            <span className="shrink-0 text-xs text-slate-600">{etiquetaMarcaGuardia(item.marca)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        {aspirante ? (
          <DialogFooter className="sm:justify-stretch">
            <Link
              href={routes.personal.aspirante(aspirante.id)}
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              Visualizar perfil
            </Link>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
