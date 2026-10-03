"use client";

import { ChevronDown, FileText, Files, Moon, Sun, Sunrise } from "lucide-react";
import { buttonVariants } from "@src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@src/components/ui/dropdown-menu";
import { etiquetaMes } from "@src/lib/roles-servicio/marcas";
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

  return (
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
  );
}
