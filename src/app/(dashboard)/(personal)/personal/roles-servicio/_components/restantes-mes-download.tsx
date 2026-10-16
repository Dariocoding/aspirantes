"use client";

import { Download } from "lucide-react";
import { Button } from "@src/components/ui/button";
import {
  diaDesdeRestantes,
  formatearRestantesMes,
  nombreArchivoRestantes,
  type PlanRestanteInput,
} from "@src/lib/roles-servicio/restantes-mes";
import { cn } from "@src/lib/utils";

type Props = {
  anio: number;
  mes: number;
  planes: PlanRestanteInput[];
  className?: string;
};

export function RestantesMesDownloadButton({ anio, mes, planes, className }: Props) {
  const descargar = () => {
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
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      className={cn("gap-1.5", className)}
      onClick={descargar}
      disabled={planes.length === 0}
    >
      <Download className="size-3.5" aria-hidden />
      Restantes del mes
    </Button>
  );
}
