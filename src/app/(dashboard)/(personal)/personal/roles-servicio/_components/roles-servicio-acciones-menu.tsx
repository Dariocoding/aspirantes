"use client";

import { useState, useTransition } from "react";
import {
  Cake,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  EllipsisVertical,
  FileText,
  Files,
  Landmark,
  Loader2,
  Moon,
  Sun,
  Sunrise,
  Wand2,
} from "lucide-react";
import {
  enviarCumpleanosTelegram,
  enviarEfemeridesTelegram,
  enviarServiciosTelegram,
} from "@src/app/actions/telegram-servicios";
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
import type { ModoEnvioManual } from "@src/lib/telegram/run-envio";
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
  canGenerar?: boolean;
  onGenerarCalendario?: () => void;
};

const DIAS_SEMANA = ["D", "L", "M", "M", "J", "V", "S"] as const;

const TELEGRAM_OPCIONES: {
  modo: ModoEnvioManual;
  label: string;
  detalle: string;
  icon: typeof Sun;
}[] = [
  {
    modo: "hoy",
    label: "Servicio de hoy",
    detalle: "Diurnos de hoy (Caracas)",
    icon: Sun,
  },
  {
    modo: "esta-noche",
    label: "Servicio de esta noche",
    detalle: "Nocturnos / estacionamiento de esta noche",
    icon: Moon,
  },
  {
    modo: "manana",
    label: "Servicio de mañana",
    detalle: "Diurnos de mañana",
    icon: Sunrise,
  },
];

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
  canGenerar = false,
  onGenerarCalendario,
}: Props) {
  const mesNombre = etiquetaMes(anio, mes);
  const hoy = fechaDeHoy();
  const seleccionado: FechaOrden = { anio, mes, dia: diaSeleccionado };

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

  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

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

  const enviarServicio = (modo: ModoEnvioManual) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await enviarServiciosTelegram(modo);
      if (result.ok) {
        const fecha = `${String(result.fecha.dia).padStart(2, "0")}/${String(result.fecha.mes).padStart(2, "0")}`;
        setFeedback({ ok: true, text: `Enviado al grupo (${fecha})` });
      } else {
        setFeedback({ ok: false, text: result.message });
      }
    });
  };

  const enviarCumples = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await enviarCumpleanosTelegram();
      if (!result.ok) {
        setFeedback({ ok: false, text: result.message });
        return;
      }
      if (result.totalPersonas === 0) {
        setFeedback({ ok: true, text: "Nadie cumple hoy, mañana ni en 2 días" });
        return;
      }
      setFeedback({
        ok: true,
        text: `Cumpleaños enviado (${result.totalPersonas} persona${result.totalPersonas === 1 ? "" : "s"})`,
      });
    });
  };

  const enviarEfemerides = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await enviarEfemeridesTelegram();
      if (!result.ok) {
        setFeedback({ ok: false, text: result.message });
        return;
      }
      if (result.totalItems === 0) {
        setFeedback({ ok: true, text: "No hay efemérides hoy ni mañana" });
        return;
      }
      setFeedback({
        ok: true,
        text: `Efemérides enviadas (${result.totalItems})`,
      });
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={pending}
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-7 shrink-0 text-slate-500 hover:text-slate-900"
              aria-label="Acciones del cuadro de servicio"
              title={feedback?.text}
            />
          }
        >
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <EllipsisVertical aria-hidden />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-64">
          {feedback ? (
            <div
              className={cn(
                "mb-1 flex items-start gap-1 rounded-md px-1.5 py-1.5 text-[11px]",
                feedback.ok ? "bg-teal-50 text-teal-800" : "bg-red-50 text-red-700",
              )}
              role="status"
            >
              {feedback.ok ? <Check className="mt-0.5 size-3 shrink-0" aria-hidden /> : null}
              <span className="min-w-0 leading-snug">{feedback.text}</span>
            </div>
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
                <Moon className="size-3.5" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">Orden de ayer</span>
                  <span className="block text-[11px] text-muted-foreground">{detalleOrden(fechaAyer)}</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                nativeButton={false}
                closeOnClick
                render={
                  <a href={ordenDelDiaPdfUrl(diurnoDe(fechaHoy))} target="_blank" rel="noopener noreferrer" />
                }
              >
                <Sun className="size-3.5" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">Orden de hoy</span>
                  <span className="block text-[11px] text-muted-foreground">{detalleOrden(fechaHoy)}</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                nativeButton={false}
                closeOnClick
                render={
                  <a href={ordenDelDiaPdfUrl(diurnoDe(fechaManana))} target="_blank" rel="noopener noreferrer" />
                }
              >
                <Sunrise className="size-3.5" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">Orden de mañana</span>
                  <span className="block text-[11px] text-muted-foreground">{detalleOrden(fechaManana)}</span>
                </span>
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
                  <FileText className="size-3.5" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-sm">Día seleccionado ({diaSeleccionado})</span>
                    <span className="block text-[11px] text-muted-foreground">{detalleOrden(seleccionado)}</span>
                  </span>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={pedirCalendario}>
                <CalendarDays className="size-3.5" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-sm">Elegir día</span>
                  <span className="block text-[11px] text-muted-foreground">Calendario · orden de ese día</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                nativeButton={false}
                closeOnClick
                render={
                  <a href={ordenesDelMesPdfUrl(anio, mes)} target="_blank" rel="noopener noreferrer" />
                }
              >
                <Files className="size-3.5" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-sm">Todas las del mes</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {mesNombre} · un PDF con cada día
                  </span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              disabled={planes.length === 0}
              onClick={() => descargarRestantes(anio, mes, planes)}
            >
              <Download className="size-3.5" aria-hidden />
              Restantes del mes
            </DropdownMenuItem>

            {canGenerar && onGenerarCalendario ? (
              <DropdownMenuItem onClick={onGenerarCalendario}>
                <Wand2 className="size-3.5" aria-hidden />
                Generar calendario
              </DropdownMenuItem>
            ) : null}

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuGroupLabel>Telegram</DropdownMenuGroupLabel>
              {TELEGRAM_OPCIONES.map((op) => {
                const Icon = op.icon;
                return (
                  <DropdownMenuItem
                    key={op.modo}
                    disabled={pending}
                    closeOnClick={false}
                    onClick={() => enviarServicio(op.modo)}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{op.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{op.detalle}</span>
                    </span>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuItem disabled={pending} closeOnClick={false} onClick={enviarCumples}>
                <Cake className="size-3.5" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">Cumpleaños</span>
                  <span className="block text-[11px] text-muted-foreground">
                    Hoy (felicitaciones), mañana y en 2 días
                  </span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={pending} closeOnClick={false} onClick={enviarEfemerides}>
                <Landmark className="size-3.5" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">Efemérides</span>
                  <span className="block text-[11px] text-muted-foreground">
                    Hoy y mañana (activas en el calendario)
                  </span>
                </span>
              </DropdownMenuItem>
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
