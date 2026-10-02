"use client";

import { ChevronDown, FileText, Files } from "lucide-react";
import { buttonVariants } from "@src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@src/components/ui/dropdown-menu";
import { etiquetaMes } from "@src/lib/roles-servicio/marcas";
import { cn } from "@src/lib/utils";

type Props = {
  anio: number;
  mes: number;
  dia: number;
  className?: string;
};

export function ordenDelDiaPdfUrl(anio: number, mes: number, dia: number): string {
  return `/api/roles-servicio/orden-del-dia/pdf?ambito=dia&anio=${anio}&mes=${mes}&dia=${dia}`;
}

export function ordenesDelMesPdfUrl(anio: number, mes: number): string {
  return `/api/roles-servicio/orden-del-dia/pdf?ambito=mes&anio=${anio}&mes=${mes}`;
}

export function OrdenDelDiaDownloadButton({ anio, mes, dia, className }: Props) {
  const mesNombre = etiquetaMes(anio, mes);

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
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuItem
          nativeButton={false}
          closeOnClick
          render={
            <a
              href={ordenDelDiaPdfUrl(anio, mes, dia)}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <FileText className="size-3.5" aria-hidden />
          <span className="min-w-0">
            <span className="block text-sm">Orden de este día</span>
            <span className="block text-[11px] text-muted-foreground">Día {dia} · 2 páginas</span>
          </span>
        </DropdownMenuItem>
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
