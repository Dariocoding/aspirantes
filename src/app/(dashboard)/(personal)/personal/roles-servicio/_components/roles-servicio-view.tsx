"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronsUpDown,
  LayoutGrid,
  Search,
  Shield,
  UserRound,
} from "lucide-react";
import { Badge } from "@src/components/ui/badge";
import { Button } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { Input } from "@src/components/ui/input";
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
import type { JerarquiaAutoridad } from "@src/generated/prisma";
import { cn } from "@src/lib/utils";

export type AsignacionVista = {
  id: string;
  orden: number;
  grado: string;
  nombre: string;
  dias: MarcaDia[];
  aspirante: {
    id: string;
    nombres: string;
    apellidos: string;
    cedula: string;
  } | null;
  autoridad: {
    id: string;
    nombres: string;
    apellidos: string;
    cedula: string | null;
    jerarquia: JerarquiaAutoridad;
  } | null;
};

export type PlanVista = {
  clave: string;
  nombre: string;
  curso: string;
  asignaciones: AsignacionVista[];
};

type Props = {
  anio: number;
  mes: number;
  planes: PlanVista[];
  /** Clave del rol inicial desde la URL; `null` = todos los roles. */
  rolInicial: string | null;
  diaHoy: number | null;
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

const GRUPOS_ROL: { id: string; label: string; match: (nombre: string) => boolean }[] = [
  { id: "oficial", label: "Oficiales", match: (n) => /oficial/i.test(n) },
  { id: "sanidad", label: "Sanidad", match: (n) => /enfermer|medicin/i.test(n) },
  { id: "inspeccion", label: "Inspección", match: (n) => /inspecci/i.test(n) },
  { id: "cuartel", label: "Cuarteles", match: (n) => /cuarteler/i.test(n) },
  { id: "bano", label: "Baños", match: (n) => /ba[nñ]o/i.test(n) },
  { id: "comedor", label: "Comedores", match: (n) => /comedor/i.test(n) },
  { id: "aula", label: "Aulas", match: (n) => /aula/i.test(n) },
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
  if (count <= 0) return "bg-white text-slate-400 hover:border-slate-300";
  const ratio = max <= 0 ? 0 : count / max;
  if (ratio < 0.25) return "bg-emerald-50 text-emerald-900 border-emerald-200/80 hover:border-emerald-400";
  if (ratio < 0.5) return "bg-emerald-100 text-emerald-950 border-emerald-300/80 hover:border-emerald-500";
  if (ratio < 0.75) return "bg-teal-100 text-teal-950 border-teal-300/80 hover:border-teal-500";
  return "bg-teal-200/80 text-teal-950 border-teal-400/80 hover:border-teal-600";
}

export function RolesServicioView({ anio, mes, planes, rolInicial, diaHoy }: Props) {
  const totalDias = diasDelMes(anio, mes);
  const dias = useMemo(() => Array.from({ length: totalDias }, (_, i) => i + 1), [totalDias]);
  const [rolClave, setRolClave] = useState<string | null>(rolInicial);
  const [modo, setModo] = useState<ModoVista>(diaHoy != null ? "dia" : "cuadricula");
  const [diaSeleccionado, setDiaSeleccionado] = useState<number>(diaHoy ?? 1);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [navAbierta, setNavAbierta] = useState(false);

  const planActivo = useMemo(
    () => (rolClave ? planes.find((plan) => plan.clave === rolClave) ?? null : null),
    [planes, rolClave],
  );
  const planesAlcance = planActivo ? [planActivo] : planes;
  const todosLosRoles = rolClave == null;

  useEffect(() => {
    const url = rolClave
      ? `${routes.personal.rolesServicio}?rol=${encodeURIComponent(rolClave)}`
      : routes.personal.rolesServicio;
    window.history.replaceState(null, "", url);
  }, [rolClave]);

  const vinculados = planes.reduce(
    (total, plan) => total + plan.asignaciones.filter((item) => estaVinculado(item)).length,
    0,
  );
  const conNombre = planes.reduce(
    (total, plan) => total + plan.asignaciones.filter((item) => item.nombre.trim()).length,
    0,
  );
  const cobertura = conNombre > 0 ? Math.round((vinculados / conNombre) * 100) : 0;

  const servicioDelDia = useMemo(() => {
    const lista: ServicioDia[] = [];
    for (const plan of planesAlcance) {
      for (const asignacion of plan.asignaciones) {
        const marca = marcaDelDia(asignacion, diaSeleccionado);
        if (!marca) continue;
        lista.push({ plan, asignacion, marca });
      }
    }
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

  const esHoySeleccionado = diaHoy != null && diaSeleccionado === diaHoy;

  const seleccionarRol = (clave: string | null) => {
    setRolClave(clave);
    setNavAbierta(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/80">
        <div className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 via-white to-teal-50/40 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm shadow-slate-900/20">
                <Shield className="size-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium tracking-[0.14em] text-slate-500 uppercase">
                  Cuadro de servicio · {planes[0]?.curso ?? "CEFOA"}
                </p>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.7rem]">
                  {todosLosRoles ? "Todos los roles" : planActivo?.nombre}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  <span className="font-medium text-slate-800">{etiquetaMes(anio, mes)}</span>
                  <span className="text-slate-300"> · </span>
                  {planes.length} roles publicados
                  {diaHoy != null ? (
                    <>
                      <span className="text-slate-300"> · </span>
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-950">
                        Hoy es {diaHoy}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-slate-200/80 ring-1 ring-slate-200 sm:min-w-72">
              <Kpi label="Roles" value={String(planes.length)} />
              <Kpi label="Vinculados" value={`${vinculados}/${conNombre || 0}`} />
              <Kpi label="Cobertura" value={`${cobertura}%`} hint={cobertura >= 90 ? "Censo al día" : "Revisar nombres"} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            {(
              [
                { id: "dia", label: "Día", icon: UserRound },
                { id: "mes", label: "Mes", icon: CalendarDays },
                { id: "cuadricula", label: "Cuadrícula", icon: LayoutGrid },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const activoModo = modo === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setModo(item.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                    activoModo
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

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-teal-500" /> Servicio
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-indigo-300" /> Autoridad
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-slate-200" /> Fin de semana
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-amber-300" /> Hoy
            </span>
          </div>
        </div>
      </header>

      {planes.length === 0 ? (
        <Card className="shadow-sm ring-slate-200/80">
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <CalendarRange className="size-8 text-slate-300" aria-hidden />
            <p className="text-sm font-medium text-slate-800">No hay roles cargados para este mes</p>
            <p className="max-w-sm text-xs text-slate-500">
              Publica el Excel mensual para ver el cuadro de servicio, el calendario y la cuadrícula.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[16.5rem_minmax(0,1fr)]">
          <aside className="min-w-0">
            <Card className="gap-0 py-0 shadow-sm ring-slate-200/80 xl:sticky xl:top-4">
              <CardHeader className="border-b border-slate-200/80 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm">Roles</CardTitle>
                    <CardDescription className="text-[11px]">{planesFiltrados.length} visibles</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="xl:hidden"
                    onClick={() => setNavAbierta((v) => !v)}
                    aria-expanded={navAbierta}
                    aria-label="Mostrar u ocultar lista de roles"
                  >
                    <ChevronsUpDown />
                  </Button>
                </div>
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={filtroRol}
                    onChange={(e) => setFiltroRol(e.target.value)}
                    placeholder="Buscar rol…"
                    className="h-8 bg-white pl-8 text-xs"
                  />
                </div>
              </CardHeader>
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

          <div className="flex min-w-0 flex-col gap-5">
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
                              <PersonaRol asignacion={asignacion} compact />
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <Badge variant="outline" className="font-mono text-[10px]">
                                  {asignacion.grado}
                                </Badge>
                                {marca !== "X" ? (
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
              <Card className="gap-0 py-0 shadow-sm ring-slate-200/80">
                <CardHeader className="border-b border-slate-200/80 px-4 py-3">
                  <CardTitle className="text-base">Calendario de {etiquetaMes(anio, mes)}</CardTitle>
                  <CardDescription className="text-xs">
                    Intensidad según personas de servicio
                    {todosLosRoles ? " en todos los roles" : ` en «${planActivo?.nombre}»`}. Pulsa un día para ver el
                    detalle.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {DIAS_SEMANA.map((letra, index) => (
                      <div
                        key={`${letra}-${index}`}
                        className="pb-1 text-center text-[10px] font-semibold tracking-wide text-slate-400 uppercase"
                      >
                        {letra}
                      </div>
                    ))}
                    {celdasCalendario.map((dia, index) => {
                      if (dia == null) {
                        return <div key={`empty-${index}`} className="aspect-square rounded-lg bg-slate-50/50" />;
                      }
                      const count = conteoPorDia.get(dia) ?? 0;
                      const seleccionado = dia === diaSeleccionado;
                      const hoy = dia === diaHoy;
                      return (
                        <button
                          key={dia}
                          type="button"
                          onClick={() => {
                            setDiaSeleccionado(dia);
                            setModo("dia");
                          }}
                          className={cn(
                            "relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition-all",
                            densidadClase(count, maxConteo),
                            esFinDeSemana(anio, mes, dia) && count === 0 && "bg-slate-50",
                            seleccionado && "ring-2 ring-slate-900 ring-offset-2",
                            hoy && "border-amber-400 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.7)]",
                          )}
                        >
                          <span className="text-[10px] font-medium text-slate-500">{letraSemana(anio, mes, dia)}</span>
                          <span className="text-base leading-none font-semibold tabular-nums">{dia}</span>
                          <span className="mt-0.5 text-[10px] tabular-nums opacity-80">
                            {count > 0 ? count : "·"}
                          </span>
                          {hoy ? (
                            <span className="absolute top-1 right-1 size-1.5 rounded-full bg-amber-500" aria-hidden />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {modo === "cuadricula" ? (
              <Card className="gap-0 overflow-hidden py-0 shadow-sm ring-slate-200/80">
                <CardHeader className="border-b border-slate-200/80 px-4 py-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                      <CardTitle className="text-base">
                        {todosLosRoles ? "Cuadrícula consolidada" : planActivo?.nombre}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {todosLosRoles
                          ? "Todos los roles del mes. Filtra por nombre o selecciona un rol en la barra lateral."
                          : `${planActivo?.curso}. Cada celda marcada es un día de servicio.`}
                      </CardDescription>
                    </div>
                    <div className="relative w-full max-w-xs">
                      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Filtrar personal…"
                        className="h-8 bg-white pl-8 text-xs"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {filasCuadricula.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm text-slate-500">
                      {busqueda.trim()
                        ? "Ninguna persona coincide con la búsqueda."
                        : "No hay personal asignado en la selección actual."}
                    </p>
                  ) : (
                    <div className="overflow-x-auto overscroll-x-contain">
                      <table className="w-max border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200">
                            {todosLosRoles ? (
                              <th className="sticky left-0 z-20 min-w-40 bg-slate-50 px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                                Rol
                              </th>
                            ) : null}
                            <th
                              className={cn(
                                "sticky z-20 min-w-56 bg-slate-50 px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide text-slate-500 uppercase",
                                todosLosRoles ? "left-40" : "left-0",
                              )}
                            >
                              Personal
                              <span className="ml-1 font-normal normal-case tabular-nums text-slate-400">
                                ({filasCuadricula.length})
                              </span>
                            </th>
                            {dias.map((dia) => {
                              const fin = esFinDeSemana(anio, mes, dia);
                              const hoy = dia === diaHoy;
                              const sel = dia === diaSeleccionado;
                              return (
                                <th
                                  key={dia}
                                  className={cn(
                                    "min-w-9 w-9 shrink-0 px-0 py-1.5 text-center font-semibold text-slate-600",
                                    fin && "bg-slate-100/80",
                                    hoy && "bg-amber-100 text-amber-950",
                                    sel && !hoy && "bg-teal-50 text-teal-950",
                                  )}
                                >
                                  <button
                                    type="button"
                                    className="mx-auto flex w-full flex-col items-center rounded-md px-0.5 py-0.5 hover:bg-black/5"
                                    onClick={() => {
                                      setDiaSeleccionado(dia);
                                      setModo("dia");
                                    }}
                                    title={`Ver servicio del día ${dia}`}
                                  >
                                    <span className="text-[9px] font-medium text-slate-400">
                                      {letraSemana(anio, mes, dia)}
                                    </span>
                                    <span className="tabular-nums">{dia}</span>
                                  </button>
                                </th>
                              );
                            })}
                            {/* Respiro para que el día 31 no quede pegado al borde redondeado */}
                            <th aria-hidden className="w-3 min-w-3 bg-slate-50 p-0" />
                          </tr>
                        </thead>
                        <tbody>
                          {filasCuadricula.map(({ plan, asignacion }, index) => (
                            <tr
                              key={`${plan.clave}-${asignacion.id}`}
                              className={cn(
                                "border-b border-slate-100 transition-colors hover:bg-slate-50/70",
                                index % 2 === 1 && "bg-slate-50/40",
                              )}
                            >
                              {todosLosRoles ? (
                                <td className="sticky left-0 z-10 min-w-40 bg-white px-3 py-2.5 align-middle text-[10px] font-medium text-slate-600 shadow-[4px_0_8px_-6px_rgba(15,23,42,0.18)]">
                                  {plan.nombre}
                                </td>
                              ) : null}
                              <td
                                className={cn(
                                  "sticky z-10 min-w-56 bg-white px-3 py-2.5 align-middle shadow-[4px_0_8px_-6px_rgba(15,23,42,0.18)]",
                                  todosLosRoles ? "left-40" : "left-0",
                                )}
                              >
                                <div className="flex items-start gap-2.5">
                                  <AvatarAsignacion asignacion={asignacion} size="sm" />
                                  <div className="min-w-0">
                                    <p className="text-[10px] tracking-wide text-slate-400 uppercase">
                                      {asignacion.orden}. {asignacion.grado}
                                    </p>
                                    <PersonaRol asignacion={asignacion} compact />
                                  </div>
                                </div>
                              </td>
                              {dias.map((dia) => {
                                const marca = marcaDelDia(asignacion, dia);
                                const fin = esFinDeSemana(anio, mes, dia);
                                const hoy = dia === diaHoy;
                                return (
                                  <td
                                    key={dia}
                                    className={cn(
                                      "min-w-9 w-9 shrink-0 px-0 py-1.5 text-center align-middle",
                                      fin && "bg-slate-50/80",
                                      hoy && "bg-amber-50/70",
                                      dia === diaSeleccionado && !hoy && "bg-teal-50/50",
                                    )}
                                  >
                                    {marca ? <MarcaCelda marca={marca} /> : <span className="text-slate-200">·</span>}
                                  </td>
                                );
                              })}
                              <td aria-hidden className="w-3 min-w-3 p-0" />
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white px-3 py-2.5">
      <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-slate-900 tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 truncate text-[10px] text-slate-500">{hint}</p> : null}
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
  const clase = size === "md" ? "size-9 text-[11px]" : "size-7 text-[10px]";
  return (
    <span
      className={cn(
        "mt-0.5 flex shrink-0 items-center justify-center rounded-full font-semibold",
        clase,
        asignacion.autoridad
          ? "bg-indigo-100 text-indigo-900"
          : asignacion.aspirante
            ? "bg-slate-100 text-slate-700"
            : "bg-amber-50 text-amber-800",
      )}
    >
      {iniciales(nombreMostrado(asignacion))}
    </span>
  );
}

function MarcaCelda({ marca }: { marca: string }) {
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

function PersonaRol({ asignacion, compact = false }: { asignacion: AsignacionVista; compact?: boolean }) {
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
