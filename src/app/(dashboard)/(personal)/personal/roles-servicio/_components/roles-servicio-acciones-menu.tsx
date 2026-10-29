"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Download,
  EllipsisVertical,
  Eraser,
  FileSpreadsheet,
  FileText,
  Files,
  Moon,
  Sun,
  Sunrise,
  Users,
  Wand2,
} from "lucide-react";
import { limpiarAsignacionesSinMarcas } from "@src/app/actions/roles-servicio-limpiar";
import { Button } from "@src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@src/components/ui/dropdown-menu";
import {
  diaDesdeRestantes,
  formatearRestantesMes,
  nombreArchivoRestantes,
  type PlanRestanteInput,
} from "@src/lib/roles-servicio/restantes-mes";
import { diasDelMes, esFinDeSemana, etiquetaMes, letraSemana } from "@src/lib/roles-servicio/marcas";
import { cn } from "@src/lib/utils";
import { ordenDelDiaPdfUrl, ordenesDelMesPdfUrl } from "./orden-del-dia-download";

type FechaOrden = { anio: number; mes: number; dia: number };

type Props = {
  anio: number;
  mes: number;
  diaSeleccionado: number;
  planes: PlanRestanteInput[];
  canWrite?: boolean;
  sellado?: boolean;
  hrefPersonal?: string;
  hrefArmar?: string;
  canGenerar?: boolean;
  onGenerarCalendario?: () => void;
};

const DIAS_SEMANA = ["D", "L", "M", "M", "J", "V", "S"] as const;

function fechaDeHoy(): FechaOrden {
  const n = new Date();
  return { anio: n.getFullYear(), mes: n.getMonth() + 1, dia: n.getDate() };
}

function sumarDias({ anio, mes, dia }: FechaOrden, delta: number): FechaOrden {
  const d = new Date(anio, mes - 1, dia + delta);
  return { anio: d.getFullYear(), mes: d.getMonth() + 1, dia: d.getDate() };
}

function mismaFecha(a: FechaOrden, b: FechaOrden): boolean {
  return a.anio === b.anio && a.mes === b.mes && a.dia === b.dia;
}

function celdasDelMes(anio: number, mes: number): Array<number | null> {
  const offset = new Date(anio, mes - 1, 1).getDay();
  const celdas: Array<number | null> = Array.from({ length: offset }, () => null);
  for (let dia = 1; dia <= diasDelMes(anio, mes); dia += 1) celdas.push(dia);
  return celdas;
}

function mesVecino(anio: number, mes: number, delta: number): { anio: number; mes: number } {
  const fecha = new Date(anio, mes - 1 + delta, 1);
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 };
}

function etiquetaCorta({ anio, mes, dia }: FechaOrden): string {
  const d = new Date(anio, mes - 1, dia);
  return d.toLocaleDateString("es-VE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function diurnoDe(fechaOrden: FechaOrden): FechaOrden {
  return sumarDias(fechaOrden, 1);
}

function detalleOrden(fechaOrden: FechaOrden): string {
  return `${etiquetaCorta(fechaOrden)} · nocturno de esa noche · diurno ${etiquetaCorta(diurnoDe(fechaOrden))}`;
}

function FilaMenu({
  icon,
  titulo,
  detalle,
}: {
  icon: ReactNode;
  titulo: string;
  detalle: string;
}) {
  return (
    <>
      <span className="mt-0.5 self-start [&_svg]:size-3.5">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{titulo}</span>
        <span className="block text-[11px] leading-snug text-muted-foreground">{detalle}</span>
      </span>
    </>
  );
}

function descargarRestantes(anio: number, mes: number, planes: PlanRestanteInput[]) {
  const desde = diaDesdeRestantes(anio, mes);
  const texto = formatearRestantesMes({ anio, mes, desde, planes });
  const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivoRestantes(anio, mes, desde);
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function RolesServicioAccionesMenu({
  anio,
  mes,
  diaSeleccionado,
  planes,
  canWrite = false,
  sellado = false,
  hrefPersonal,
  hrefArmar,
  canGenerar = false,
  onGenerarCalendario,
}: Props) {
  const router = useRouter();
  const [limpiarPending, startLimpiarTransition] = useTransition();
  const mesNombre = etiquetaMes(anio, mes);
  const hoy = fechaDeHoy();
  const seleccionado: FechaOrden = { anio, mes, dia: diaSeleccionado };
  const sinGuardia = planes.reduce(
    (total, plan) => total + plan.asignaciones.filter((persona) => persona.dias.length === 0).length,
    0,
  );

  const fechaAyer = sumarDias(hoy, -1);
  const fechaHoy = hoy;
  const fechaManana = sumarDias(hoy, 1);

  const seleccionadoEsEspecial =
    !mismaFecha(seleccionado, fechaAyer) &&
    !mismaFecha(seleccionado, fechaHoy) &&
    !mismaFecha(seleccionado, fechaManana);

  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const [vistaAnio, setVistaAnio] = useState(anio);
  const [vistaMes, setVistaMes] = useState(mes);
  const celdas = celdasDelMes(vistaAnio, vistaMes);

  const pedirCalendario = () => {
    setVistaAnio(anio);
    setVistaMes(mes);
    window.setTimeout(() => setCalendarioAbierto(true), 0);
  };

  const abrirOrdenDelDia = (dia: number) => {
    window.open(
      ordenDelDiaPdfUrl(diurnoDe({ anio: vistaAnio, mes: vistaMes, dia })),
      "_blank",
      "noopener,noreferrer",
    );
    setCalendarioAbierto(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-7 shrink-0 text-slate-500 hover:text-slate-900"
              aria-label="Acciones del cuadro de servicio"
            />
          }
        >
          <EllipsisVertical aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-72">
          {canWrite && hrefPersonal && hrefArmar ? (
            <>
              <DropdownMenuGroup>
                <DropdownMenuGroupLabel>Roles</DropdownMenuGroupLabel>
                <DropdownMenuItem onClick={() => router.push(hrefPersonal)}>
                  <FilaMenu
                    icon={<Users className="size-3.5" aria-hidden />}
                    titulo="Personal"
                    detalle={
                      sellado
                        ? "Este mes está sellado. El personal se arma en el mes siguiente."
                        : "Asignar o quitar gente de los roles."
                    }
                  />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(hrefArmar)}>
                  <FilaMenu
                    icon={<Wand2 className="size-3.5" aria-hidden />}
                    titulo="Armar"
                    detalle={
                      sellado
                        ? "Este mes está sellado. El siguiente mes se arma aparte."
                        : "Puestos y días de servicio."
                    }
                  />
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={sellado || limpiarPending || sinGuardia === 0}
                  onClick={() => {
                    const mensaje =
                      sinGuardia === 1
                        ? "Hay 1 persona en la lista sin ningún día de guardia. ¿Quieres quitarla?"
                        : `Hay ${sinGuardia} personas en la lista sin ningún día de guardia. ¿Quieres quitarlas?`;
                    if (!window.confirm(mensaje)) return;
                    startLimpiarTransition(async () => {
                      const result = await limpiarAsignacionesSinMarcas(anio, mes);
                      if (!result.ok) {
                        window.alert(result.message);
                        return;
                      }
                      router.refresh();
                    });
                  }}
                >
                  <FilaMenu
                    icon={<Eraser className="size-3.5" aria-hidden />}
                    titulo={limpiarPending ? "Limpiando…" : "Quitar sin guardia"}
                    detalle={
                      sellado
                        ? "Este mes está sellado."
                        : sinGuardia === 0
                          ? "Nadie está en la lista sin días."
                          : `${sinGuardia} en lista sin montar guardia.`
                    }
                  />
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          ) : null}

          <DropdownMenuGroup>
            <DropdownMenuGroupLabel>Imprimir órdenes</DropdownMenuGroupLabel>
            <DropdownMenuItem
              nativeButton={false}
              closeOnClick
              render={
                <a href={ordenDelDiaPdfUrl(diurnoDe(fechaAyer))} target="_blank" rel="noopener noreferrer" />
              }
            >
              <FilaMenu
                icon={<Moon className="size-3.5" aria-hidden />}
                titulo="Orden de ayer"
                detalle={detalleOrden(fechaAyer)}
              />
            </DropdownMenuItem>
            <DropdownMenuItem
              nativeButton={false}
              closeOnClick
              render={
                <a href={ordenDelDiaPdfUrl(diurnoDe(fechaHoy))} target="_blank" rel="noopener noreferrer" />
              }
            >
              <FilaMenu
                icon={<Sun className="size-3.5" aria-hidden />}
                titulo="Orden de hoy"
                detalle={detalleOrden(fechaHoy)}
              />
            </DropdownMenuItem>
            <DropdownMenuItem
              nativeButton={false}
              closeOnClick
              render={
                <a href={ordenDelDiaPdfUrl(diurnoDe(fechaManana))} target="_blank" rel="noopener noreferrer" />
              }
            >
              <FilaMenu
                icon={<Sunrise className="size-3.5" aria-hidden />}
                titulo="Orden de mañana"
                detalle={detalleOrden(fechaManana)}
              />
            </DropdownMenuItem>
            {seleccionadoEsEspecial ? (
              <DropdownMenuItem
                nativeButton={false}
                closeOnClick
                render={
                  <a
                    href={ordenDelDiaPdfUrl(diurnoDe(seleccionado))}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <FilaMenu
                  icon={<FileText className="size-3.5" aria-hidden />}
                  titulo={`Día seleccionado (${diaSeleccionado})`}
                  detalle={detalleOrden(seleccionado)}
                />
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={pedirCalendario}>
              <FilaMenu
                icon={<CalendarDays className="size-3.5" aria-hidden />}
                titulo="Elegir día"
                detalle="Calendario · orden de ese día"
              />
            </DropdownMenuItem>
            <DropdownMenuItem
              nativeButton={false}
              closeOnClick
              render={
                <a href={ordenesDelMesPdfUrl(anio, mes)} target="_blank" rel="noopener noreferrer" />
              }
            >
              <FilaMenu
                icon={<Files className="size-3.5" aria-hidden />}
                titulo="Todas las del mes"
                detalle={`${mesNombre} · un PDF con cada día`}
              />
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuGroupLabel>Calendario</DropdownMenuGroupLabel>
            <DropdownMenuItem
              nativeButton={false}
              closeOnClick
              disabled={planes.length === 0}
              render={
                <a
                  href={`/api/roles-servicio/export/xlsx?anio=${anio}&mes=${mes}`}
                  download
                />
              }
            >
              <FilaMenu
                icon={<FileSpreadsheet className="size-3.5" aria-hidden />}
                titulo="Exportar Excel"
                detalle="Mismo formato oficial · personas y días del mes"
              />
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={planes.length === 0}
              onClick={() => descargarRestantes(anio, mes, planes)}
            >
              <FilaMenu
                icon={<Download className="size-3.5" aria-hidden />}
                titulo="Restantes del mes"
                detalle="Texto con los días que faltan"
              />
            </DropdownMenuItem>
            {canGenerar && onGenerarCalendario ? (
              <DropdownMenuItem onClick={onGenerarCalendario}>
                <FilaMenu
                  icon={<CalendarPlus className="size-3.5" aria-hidden />}
                  titulo="Generar calendario"
                  detalle="Marcas automáticas de los roles con personal"
                />
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={calendarioAbierto} onOpenChange={setCalendarioAbierto}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Orden de servicio</DialogTitle>
            <DialogDescription>
              El día que eliges es la fecha de la orden. El nocturno es de esa noche y el diurno, del día siguiente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Mes anterior"
                onClick={() => {
                  const siguiente = mesVecino(vistaAnio, vistaMes, -1);
                  setVistaAnio(siguiente.anio);
                  setVistaMes(siguiente.mes);
                }}
              >
                <ChevronLeft />
              </Button>
              <p className="text-sm font-medium capitalize">{etiquetaMes(vistaAnio, vistaMes)}</p>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Mes siguiente"
                onClick={() => {
                  const siguiente = mesVecino(vistaAnio, vistaMes, 1);
                  setVistaAnio(siguiente.anio);
                  setVistaMes(siguiente.mes);
                }}
              >
                <ChevronRight />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {DIAS_SEMANA.map((letra, index) => (
                <div
                  key={`${letra}-${index}`}
                  className="pb-1 text-center text-[10px] font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  {letra}
                </div>
              ))}
              {celdas.map((dia, index) => {
                if (dia == null) {
                  return <div key={`vacio-${index}`} className="aspect-square" />;
                }
                const fecha: FechaOrden = { anio: vistaAnio, mes: vistaMes, dia };
                const esHoy = mismaFecha(fecha, hoy);
                const esSeleccionado = mismaFecha(fecha, seleccionado);
                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => abrirOrdenDelDia(dia)}
                    aria-label={`Orden del ${etiquetaCorta(fecha)}`}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center rounded-lg border border-transparent text-sm transition-colors hover:border-border hover:bg-muted",
                      esFinDeSemana(vistaAnio, vistaMes, dia) && "text-muted-foreground",
                      esSeleccionado && "border-foreground bg-muted font-semibold",
                      esHoy && "ring-2 ring-amber-400 ring-offset-1",
                    )}
                  >
                    <span className="text-[9px] leading-none text-muted-foreground">
                      {letraSemana(vistaAnio, vistaMes, dia)}
                    </span>
                    <span className="tabular-nums">{dia}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
