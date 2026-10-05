"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, FileText, Files, Moon, Sun, Sunrise } from "lucide-react";
import { Button, buttonVariants } from "@src/components/ui/button";
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@src/components/ui/dropdown-menu";
import { diasDelMes, esFinDeSemana, etiquetaMes, letraSemana } from "@src/lib/roles-servicio/marcas";
import { cn } from "@src/lib/utils";

type FechaOrden = { anio: number; mes: number; dia: number };

type Props = {
  anio: number;
  mes: number;
  /** Día seleccionado en el cuadro (puede diferir de hoy). */
  diaSeleccionado: number;
  className?: string;
};

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

const DIAS_SEMANA = ["D", "L", "M", "M", "J", "V", "S"] as const;

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

export function ordenDelDiaPdfUrl({ anio, mes, dia }: FechaOrden): string {
  return `/api/roles-servicio/orden-del-dia/pdf?ambito=dia&anio=${anio}&mes=${mes}&dia=${dia}`;
}

export function ordenesDelMesPdfUrl(anio: number, mes: number): string {
  return `/api/roles-servicio/orden-del-dia/pdf?ambito=mes&anio=${anio}&mes=${mes}`;
}

export function OrdenDelDiaDownloadButton({
  anio,
  mes,
  diaSeleccionado,
  className,
}: Props) {
  const mesNombre = etiquetaMes(anio, mes);
  const hoy = fechaDeHoy();
  const manana = sumarDias(hoy, 1);
  const diaSiguiente = sumarDias(hoy, 2);
  const seleccionado: FechaOrden = { anio, mes, dia: diaSeleccionado };

  // Cada botón imprime diurno + nocturno del mismo día de servicio.
  const ordenAyer = hoy;
  const ordenHoy = manana;
  const ordenManana = diaSiguiente;

  const seleccionadoEsEspecial =
    !mismaFecha(seleccionado, ordenAyer) &&
    !mismaFecha(seleccionado, ordenHoy) &&
    !mismaFecha(seleccionado, ordenManana);

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
      ordenDelDiaPdfUrl({ anio: vistaAnio, mes: vistaMes, dia }),
      "_blank",
      "noopener,noreferrer",
    );
    setCalendarioAbierto(false);
  };

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "default", size: "xs" }),
          "gap-1.5",
          className,
        )}
      >
        <FileText className="size-3.5" aria-hidden />
        Imprimir órdenes
        <ChevronDown className="size-3 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        <DropdownMenuItem
          nativeButton={false}
          closeOnClick
          render={
            <a href={ordenDelDiaPdfUrl(ordenAyer)} target="_blank" rel="noopener noreferrer" />
          }
        >
          <Moon className="size-3.5" aria-hidden />
          <span className="min-w-0">
            <span className="block text-sm font-medium">Orden de ayer</span>
            <span className="block text-[11px] text-muted-foreground">
              {etiquetaCorta(ordenAyer)} · nocturno de hoy · diurnos de hoy
            </span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          nativeButton={false}
          closeOnClick
          render={
            <a href={ordenDelDiaPdfUrl(ordenHoy)} target="_blank" rel="noopener noreferrer" />
          }
        >
          <Sun className="size-3.5" aria-hidden />
          <span className="min-w-0">
            <span className="block text-sm font-medium">Orden de hoy</span>
            <span className="block text-[11px] text-muted-foreground">
              {etiquetaCorta(ordenHoy)} · nocturno de mañana · diurnos para mañana
            </span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          nativeButton={false}
          closeOnClick
          render={
            <a href={ordenDelDiaPdfUrl(ordenManana)} target="_blank" rel="noopener noreferrer" />
          }
        >
          <Sunrise className="size-3.5" aria-hidden />
          <span className="min-w-0">
            <span className="block text-sm font-medium">Orden de mañana</span>
            <span className="block text-[11px] text-muted-foreground">
              {etiquetaCorta(ordenManana)} · nocturno del día siguiente · diurnos del día siguiente
            </span>
          </span>
        </DropdownMenuItem>

        {seleccionadoEsEspecial ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              nativeButton={false}
              closeOnClick
              render={
                <a
                  href={ordenDelDiaPdfUrl(seleccionado)}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <FileText className="size-3.5" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm">Día seleccionado ({diaSeleccionado})</span>
                <span className="block text-[11px] text-muted-foreground">
                  {etiquetaCorta(seleccionado)} · 2 páginas
                </span>
              </span>
            </DropdownMenuItem>
          </>
        ) : null}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={pedirCalendario}>
          <CalendarDays className="size-3.5" aria-hidden />
          <span className="min-w-0">
            <span className="block text-sm">Elegir día</span>
            <span className="block text-[11px] text-muted-foreground">
              Calendario · orden de ese día
            </span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          nativeButton={false}
          closeOnClick
          render={
            <a
              href={ordenesDelMesPdfUrl(anio, mes)}
              target="_blank"
              rel="noopener noreferrer"
            />
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
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={calendarioAbierto} onOpenChange={setCalendarioAbierto}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Orden de servicio</DialogTitle>
          <DialogDescription>
            Elige el día. Se abre la orden con el servicio diurno y el nocturno.
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
