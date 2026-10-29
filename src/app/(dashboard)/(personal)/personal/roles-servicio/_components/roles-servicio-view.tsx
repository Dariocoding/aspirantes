"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
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
} from "lucide-react";
import { actualizarMarcasLote } from "@src/app/actions/roles-servicio-marcas";
import { sellarMesRoles } from "@src/app/actions/roles-servicio-sello";
import { Badge } from "@src/components/ui/badge";
import { Button, buttonVariants } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  aPlanDiurno,
  detectarRepeticionesDiurnas,
  mensajeChoqueDiurno,
} from "@src/lib/roles-servicio/repeticiones-diurno";
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
  const [selloAbierto, setSelloAbierto] = useState(false);
  const [selloPending, startSelloTransition] = useTransition();
  const [selloError, setSelloError] = useState<string | null>(null);
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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Roles de servicio</h1>
          <p className="text-xs text-slate-500">Elige el mes del cuadro.</p>
        </div>
        <SelectorMesCuadro anio={anio} mes={mes} diaHoy={diaHoy} sellado={sellado} onIr={irAMes} />
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
                        <li
                          key={`${plan.clave}-${asignacion.id}`}
                          className={cn(
                            "group rounded-xl border bg-white p-3 transition-colors hover:bg-slate-50/60",
                            todosLosRoles
                              ? "border-slate-200/90 hover:border-slate-300"
                              : "border-teal-300/90 ring-1 ring-teal-200/70",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <AvatarAsignacion asignacion={asignacion} size="md" />
                            <div className="min-w-0 flex-1">
                              {todosLosRoles ? (
                                <p className="truncate text-[10px] font-medium tracking-wide text-slate-500 uppercase">
                                  {plan.nombre}
                                </p>
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
                  <div className="relative mt-2 max-w-xs">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Filtrar personal…"
                      className="h-8 bg-white pl-8 text-xs"
                    />
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
      <p>
        <span className={cn("font-medium text-slate-900", compact ? "text-xs" : "text-sm")}>
          {asignacion.nombre}
        </span>
        {aspirante && !compact ? (
          <span className="mt-0.5 block font-mono text-[10px] tabular-nums text-slate-500">
            {formatCedulaMillares(aspirante.cedula)}
          </span>
        ) : null}
      </p>
    );
  }
  if (!asignacion.nombre.trim()) {
    return <p className={cn("text-slate-400", compact ? "text-xs" : "text-sm")}>Sin nombre en el rol</p>;
  }
  if (asignacion.autoridad) {
    const { autoridad } = asignacion;
    const cedula = autoridad.cedula?.trim()
      ? formatCedulaMillares(autoridad.cedula)
      : null;
    return (
      <p>
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
      </p>
    );
  }
  if (!asignacion.aspirante) {
    return (
      <p>
        <span className={cn("font-medium text-slate-900", compact ? "text-xs" : "text-sm")}>{asignacion.nombre}</span>
        <span className="mt-0.5 block text-[10px] text-amber-700">Sin coincidencia en el censo</span>
      </p>
    );
  }
  const { aspirante } = asignacion;
  const cedula = formatCedulaMillares(aspirante.cedula);
  return (
    <p>
      <Link
        href={routes.personal.aspirante(aspirante.id)}
        className={cn("font-medium text-slate-900 hover:underline", compact ? "text-xs" : "text-sm")}
      >
        {aspirante.nombres} {aspirante.apellidos}
      </Link>
      {!compact ? (
        <span className="mt-0.5 block text-[11px] text-slate-500">
          En el rol: {asignacion.nombre} · <span className="font-mono tabular-nums">{cedula}</span>
        </span>
      ) : (
        <span className="mt-0.5 block truncate font-mono text-[10px] tabular-nums text-slate-500">{cedula}</span>
      )}
    </p>
  );
}
