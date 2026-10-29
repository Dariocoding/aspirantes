"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowRightLeft, Loader2, Search } from "lucide-react";
import {
  actualizarMarcasAsignacion,
  actualizarMarcasLote,
} from "@src/app/actions/roles-servicio-marcas";
import { Input } from "@src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import {
  esColumnaAmarilla,
  letraSemana,
  type MarcaDia,
} from "@src/lib/roles-servicio/marcas";
import { listarTurnosEnMarca, planUsaTurnoEnMarca, turnoDesdeMarca } from "@src/lib/roles-servicio/turnos-marca";
import { foldBusqueda } from "@src/lib/text/fold";
import { cn } from "@src/lib/utils";
import type { AsignacionVista, PlanVista } from "./types";

type Fila = {
  plan: PlanVista;
  asignacion: AsignacionVista;
};

type Props = {
  filas: Fila[];
  dias: number[];
  anio: number;
  mes: number;
  diaHoy: number | null;
  diaSeleccionado: number;
  todosLosRoles: boolean;
  canWrite: boolean;
  onSelectDia: (dia: number) => void;
  onMarcasChange: (
    cambios: Array<{ asignacionId: string; dias: MarcaDia[] }>,
  ) => void;
  /** Si devuelve texto, no se escribe la marca. */
  choqueAlMarcar?: (asignacion: AsignacionVista, dia: number) => string | null;
  /** Muestra el nombre guardado en la guardia, no el del censo. */
  nombreFijo?: boolean;
};

type MenuTurno = {
  x: number;
  y: number;
  asignacion: AsignacionVista;
  dia: number;
  actual: string | null;
};

type CambioPersona = {
  plan: PlanVista;
  asignacion: AsignacionVista;
};

function marcaDelDia(asignacion: AsignacionVista, dia: number): string | null {
  return asignacion.dias.find((item) => item.dia === dia)?.marca ?? null;
}

function nombreFila(asignacion: AsignacionVista, nombreFijo: boolean): string {
  if (nombreFijo && asignacion.nombre.trim()) return asignacion.nombre.trim().toUpperCase();
  if (asignacion.aspirante) {
    return `${asignacion.aspirante.nombres} ${asignacion.aspirante.apellidos}`.toUpperCase();
  }
  if (asignacion.autoridad) {
    return `${asignacion.autoridad.nombres} ${asignacion.autoridad.apellidos}`.toUpperCase();
  }
  return (asignacion.nombre.trim() || "—").toUpperCase();
}

function conMarcaEnDia(asignacion: AsignacionVista, dia: number, marca: string | null): MarcaDia[] {
  const sinDia = asignacion.dias.filter((item) => item.dia !== dia);
  if (!marca) return sinDia;
  return [...sinDia, { dia, marca }].sort((a, b) => a.dia - b.dia);
}

/** Intercambia o mueve la marca del día entre dos personas del mismo rol. */
function cambiosAlReemplazarDia(args: {
  origen: AsignacionVista;
  destino: AsignacionVista;
  dia: number;
  marcaPorDefecto: string;
}): Array<{ asignacionId: string; dias: MarcaDia[] }> {
  const marcaOrigen = marcaDelDia(args.origen, args.dia);
  const marcaDestino = marcaDelDia(args.destino, args.dia);
  if (!marcaOrigen && !marcaDestino) {
    return [
      {
        asignacionId: args.destino.id,
        dias: conMarcaEnDia(args.destino, args.dia, args.marcaPorDefecto),
      },
    ];
  }
  return [
    {
      asignacionId: args.origen.id,
      dias: conMarcaEnDia(args.origen, args.dia, marcaDestino),
    },
    {
      asignacionId: args.destino.id,
      dias: conMarcaEnDia(args.destino, args.dia, marcaOrigen),
    },
  ];
}

export function RolPlanilla({
  filas,
  dias,
  anio,
  mes,
  diaHoy,
  diaSeleccionado,
  todosLosRoles,
  canWrite,
  onSelectDia,
  onMarcasChange,
  choqueAlMarcar,
  nombreFijo = false,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuTurno | null>(null);
  const [cambioPersona, setCambioPersona] = useState<CambioPersona | null>(null);
  const [filtroCambio, setFiltroCambio] = useState("");

  useEffect(() => {
    if (!menu) return;
    const cerrar = () => setMenu(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") cerrar();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", cerrar, true);
    window.addEventListener("resize", cerrar);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", cerrar, true);
      window.removeEventListener("resize", cerrar);
    };
  }, [menu]);

  const candidatosCambio = useMemo(() => {
    if (!cambioPersona) return [];
    const q = foldBusqueda(filtroCambio.trim());
    return cambioPersona.plan.asignaciones
      .filter((item) => item.id !== cambioPersona.asignacion.id)
      .filter((item) => {
        if (!q) return true;
        const texto = foldBusqueda(
          `${nombreFila(item, nombreFijo)} ${item.grado} ${item.nombre}`,
        );
        return texto.includes(q);
      })
      .sort((a, b) => {
        const marcaA = marcaDelDia(a, diaSeleccionado) ? 0 : 1;
        const marcaB = marcaDelDia(b, diaSeleccionado) ? 0 : 1;
        if (marcaA !== marcaB) return marcaA - marcaB;
        return a.orden - b.orden;
      });
  }, [cambioPersona, filtroCambio, nombreFijo, diaSeleccionado]);

  const guardarMarca = (asignacion: AsignacionVista, dia: number, marca: string | null) => {
    if (!canWrite || pending) return;
    if (marca) {
      const choque = choqueAlMarcar?.(asignacion, dia) ?? null;
      if (choque) {
        setMenu(null);
        setError(choque);
        return;
      }
    }
    const next = conMarcaEnDia(asignacion, dia, marca);
    onMarcasChange([{ asignacionId: asignacion.id, dias: next }]);
    setMenu(null);
    startTransition(async () => {
      const result = await actualizarMarcasAsignacion(asignacion.id, next);
      if (!result.ok) setError(result.message);
      else setError(null);
    });
  };

  const abrirCambioPersona = (plan: PlanVista, asignacion: AsignacionVista) => {
    if (!canWrite || pending) return;
    setMenu(null);
    setFiltroCambio("");
    setError(null);
    setCambioPersona({ plan, asignacion });
  };

  const aplicarCambioPersona = (destino: AsignacionVista) => {
    if (!cambioPersona || !canWrite || pending) return;
    const { asignacion: origen } = cambioPersona;
    const dia = diaSeleccionado;
    const marcaOrigen = marcaDelDia(origen, dia);
    const marcaDestino = marcaDelDia(destino, dia);

    // Quien recibe la guardia no debe chocar en otro diurno ese día.
    if (marcaOrigen && !marcaDestino) {
      const choque = choqueAlMarcar?.(destino, dia) ?? null;
      if (choque) {
        setError(choque);
        return;
      }
    }
    if (!marcaOrigen && marcaDestino) {
      const choque = choqueAlMarcar?.(origen, dia) ?? null;
      if (choque) {
        setError(choque);
        return;
      }
    }
    if (!marcaOrigen && !marcaDestino) {
      const choque = choqueAlMarcar?.(destino, dia) ?? null;
      if (choque) {
        setError(choque);
        return;
      }
    }

    const marcaPorDefecto = planUsaTurnoEnMarca(cambioPersona.plan) ? "T1" : "X";
    const cambios = cambiosAlReemplazarDia({ origen, destino, dia, marcaPorDefecto });
    onMarcasChange(cambios);
    setCambioPersona(null);
    startTransition(async () => {
      const result = await actualizarMarcasLote(cambios);
      if (!result.ok) setError(result.message);
      else setError(null);
    });
  };

  const toggleCelda = (asignacion: AsignacionVista, dia: number) => {
    const actual = marcaDelDia(asignacion, dia);
    guardarMarca(asignacion, dia, actual ? null : "X");
  };

  const abrirMenuTurno = (
    event: { clientX: number; clientY: number; preventDefault: () => void; currentTarget: EventTarget | null },
    asignacion: AsignacionVista,
    dia: number,
    desdeCelda: boolean,
  ) => {
    if (!canWrite || pending) return;
    event.preventDefault();
    const rect =
      event.currentTarget instanceof HTMLElement ? event.currentTarget.getBoundingClientRect() : null;
    const x = desdeCelda && rect ? rect.left : event.clientX;
    const y = desdeCelda && rect ? rect.bottom + 4 : event.clientY;
    setMenu({
      x: Math.min(x, window.innerWidth - 180),
      y: Math.min(y, window.innerHeight - 180),
      asignacion,
      dia,
      actual: marcaDelDia(asignacion, dia),
    });
  };

  return (
    <div className="flex w-full min-w-0 flex-col">
      {error ? (
        <p className="px-3 py-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="w-full min-w-0">
        <table className="w-full table-fixed border-collapse text-[11px] text-slate-900">
          <colgroup>
            <col className="w-8" />
            {todosLosRoles ? <col className="w-[6.5rem]" /> : null}
            <col className="w-44" />
            {dias.map((dia) => (
              <col key={`c-${dia}`} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th
                rowSpan={2}
                className="sticky left-0 z-30 border border-slate-400 bg-slate-100 px-1 py-1 font-bold"
              >
                №
              </th>
              {todosLosRoles ? (
                <th
                  rowSpan={2}
                  className="sticky left-8 z-30 border border-slate-400 bg-slate-100 px-1.5 py-1 text-left font-bold uppercase"
                >
                  Rol
                </th>
              ) : null}
              <th
                rowSpan={2}
                className={cn(
                  "sticky z-30 border border-slate-400 bg-slate-100 px-2 py-1 text-left font-bold uppercase",
                  todosLosRoles ? "left-[8.5rem]" : "left-8",
                )}
              >
                Nombres y apellidos
              </th>
              {dias.map((dia) => {
                const amarilla = esColumnaAmarilla(anio, mes, dia);
                return (
                  <th
                    key={`l-${dia}`}
                    className={cn(
                      "border border-slate-400 px-0 py-0.5 text-center font-bold",
                      amarilla ? "bg-amber-300" : "bg-white",
                      dia === diaHoy && "ring-2 ring-inset ring-sky-500",
                    )}
                  >
                    <button
                      type="button"
                      className="w-full"
                      onClick={() => onSelectDia(dia)}
                      title={`Día ${dia}`}
                    >
                      {letraSemana(anio, mes, dia)}
                    </button>
                  </th>
                );
              })}
            </tr>
            <tr>
              {dias.map((dia) => {
                const amarilla = esColumnaAmarilla(anio, mes, dia);
                const sel = dia === diaSeleccionado;
                return (
                  <th
                    key={`n-${dia}`}
                    className={cn(
                      "border border-slate-400 px-0 py-0.5 text-center font-bold tabular-nums",
                      amarilla ? "bg-amber-300" : "bg-white",
                      sel && "bg-teal-100",
                      dia === diaHoy && "ring-2 ring-inset ring-sky-500",
                    )}
                  >
                    <button type="button" className="w-full" onClick={() => onSelectDia(dia)}>
                      {dia}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filas.map(({ plan, asignacion }, index) => (
                <tr key={`${plan.clave}-${asignacion.id}`}>
                  <td className="sticky left-0 z-20 border border-slate-400 bg-white px-1 py-0.5 text-center tabular-nums">
                    {asignacion.orden || index + 1}
                  </td>
                  {todosLosRoles ? (
                    <td
                      className="sticky left-8 z-20 truncate border border-slate-400 bg-white px-1.5 py-0.5 text-[10px] font-medium"
                      title={plan.nombre}
                    >
                      {plan.nombre}
                    </td>
                  ) : null}
                  <td
                    className={cn(
                      "sticky z-20 border border-slate-400 bg-white p-0 font-medium uppercase",
                      todosLosRoles ? "left-[8.5rem]" : "left-8",
                      marcaDelDia(asignacion, diaSeleccionado) && "bg-teal-50",
                    )}
                  >
                    {canWrite ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => abrirCambioPersona(plan, asignacion)}
                        className="block w-full truncate px-2 py-0.5 text-left hover:bg-teal-100/80 hover:underline disabled:opacity-60"
                        title={`Cambiar quién monta el día ${diaSeleccionado}`}
                        aria-label={`Cambiar persona de guardia el día ${diaSeleccionado}: ${nombreFila(asignacion, nombreFijo)}`}
                      >
                        {nombreFila(asignacion, nombreFijo)}
                      </button>
                    ) : (
                      <span
                        className="block truncate px-2 py-0.5"
                        title={nombreFila(asignacion, nombreFijo)}
                      >
                        {nombreFila(asignacion, nombreFijo)}
                      </span>
                    )}
                  </td>
                  {dias.map((dia) => {
                    const marca = marcaDelDia(asignacion, dia);
                    const amarilla = esColumnaAmarilla(anio, mes, dia);
                    const conTurno = planUsaTurnoEnMarca(plan);
                    return (
                      <td
                        key={dia}
                        className={cn(
                          "border border-slate-400 px-0 py-0.5 text-center align-middle",
                          amarilla ? "bg-amber-200/90" : "bg-white",
                          dia === diaHoy && "ring-1 ring-inset ring-sky-400",
                        )}
                      >
                        {canWrite && !todosLosRoles ? (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={(event) =>
                              conTurno
                                ? abrirMenuTurno(event, asignacion, dia, true)
                                : toggleCelda(asignacion, dia)
                            }
                            onContextMenu={(event) => {
                              if (!conTurno) return;
                              abrirMenuTurno(event, asignacion, dia, false);
                            }}
                            className={cn(
                              "flex h-7 w-full items-center justify-center font-bold hover:bg-black/5",
                              marca ? "text-slate-900" : "text-transparent hover:text-slate-300",
                            )}
                            title={
                              conTurno
                                ? "Clic derecho: 1.er, 2.do o 3.er turno"
                                : marca
                                  ? `Quitar ${marca}`
                                  : `Marcar día ${dia}`
                            }
                            aria-label={
                              conTurno
                                ? `Elegir turno del día ${dia}`
                                : marca
                                  ? `Quitar marca del día ${dia}`
                                  : `Marcar día ${dia}`
                            }
                          >
                            {marca ? <MarcaTexto marca={marca} /> : "·"}
                          </button>
                        ) : marca ? (
                          <span className="font-bold">
                            <MarcaTexto marca={marca} />
                          </span>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {menu ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Cerrar opciones de turno"
            onClick={() => setMenu(null)}
            onContextMenu={(event) => {
              event.preventDefault();
              setMenu(null);
            }}
          />
          <div
            role="menu"
            className="fixed z-50 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
            style={{ left: menu.x, top: menu.y }}
          >
            <p className="px-3 py-1 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
              Día {menu.dia}
            </p>
            {listarTurnosEnMarca().map((turno) => {
              const activo = (menu.actual ?? "").toUpperCase() === turno.marca;
              return (
                <button
                  key={turno.marca}
                  type="button"
                  role="menuitem"
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-slate-50",
                    activo && "bg-slate-100 font-semibold",
                  )}
                  onClick={() => guardarMarca(menu.asignacion, menu.dia, turno.marca)}
                >
                  <span>{turno.nombre}</span>
                  <span className="font-mono text-[11px] text-slate-500">{turno.marca}</span>
                </button>
              );
            })}
            <button
              type="button"
              role="menuitem"
              className="flex w-full px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => guardarMarca(menu.asignacion, menu.dia, null)}
            >
              Quitar
            </button>
          </div>
        </>
      ) : null}

      <Dialog
        open={cambioPersona != null}
        onOpenChange={(open) => {
          if (!open) setCambioPersona(null);
        }}
      >
        <DialogContent className="flex max-h-[min(100dvh-2rem,560px)] max-w-md flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b border-slate-200 px-4 py-3">
            <DialogTitle className="flex items-center gap-2 text-base">
              <ArrowRightLeft className="size-4" aria-hidden />
              Cambiar guardia · día {diaSeleccionado}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {cambioPersona ? (
                <>
                  {letraSemana(anio, mes, diaSeleccionado)} {diaSeleccionado} ·{" "}
                  {nombreFila(cambioPersona.asignacion, nombreFijo)}
                  {marcaDelDia(cambioPersona.asignacion, diaSeleccionado)
                    ? ` · marca ${marcaDelDia(cambioPersona.asignacion, diaSeleccionado)}`
                    : " · sin marca ese día"}
                  . Elige a quién pasarle o intercambiarle la guardia.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="shrink-0 border-b border-slate-100 px-4 py-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={filtroCambio}
                onChange={(event) => setFiltroCambio(event.target.value)}
                placeholder="Buscar en este rol…"
                className="h-8 bg-white pl-8 text-xs"
                autoFocus
              />
            </div>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto p-2">
            {candidatosCambio.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-500">
                Nadie más en este rol coincide con la búsqueda.
              </li>
            ) : (
              candidatosCambio.map((candidato) => {
                const marca = marcaDelDia(candidato, diaSeleccionado);
                return (
                  <li key={candidato.id}>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => aplicarCambioPersona(candidato)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left hover:bg-slate-50 disabled:opacity-60"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium uppercase text-slate-900">
                          {nombreFila(candidato, nombreFijo)}
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          {candidato.grado}
                          {marca ? ` · ya marca ${marca}` : " · libre ese día"}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] font-medium text-teal-700">
                        {marcaDelDia(cambioPersona!.asignacion, diaSeleccionado) && marca
                          ? "Intercambiar"
                          : marcaDelDia(cambioPersona!.asignacion, diaSeleccionado)
                            ? "Pasarle"
                            : marca
                              ? "Tomarle"
                              : "Asignar"}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </DialogContent>
      </Dialog>

      {pending ? (
        <p className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-slate-500">
          <Loader2 className="size-3 animate-spin" aria-hidden />
          Guardando…
        </p>
      ) : null}
    </div>
  );
}

function MarcaTexto({ marca }: { marca: string }) {
  const turno = turnoDesdeMarca(marca);
  if (turno) return <span className="text-[10px]">{marca}</span>;
  return <>{marca === "X" ? "X" : marca}</>;
}
