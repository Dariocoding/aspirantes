"use client";

import { Trash2 } from "lucide-react";
import { deleteReporteRancho } from "@src/app/actions/inventario-reporte-rancho";
import { Button } from "@src/components/ui/button";

type Props = {
  reporteId: string;
  fechaLabel: string;
};

export function DeleteReporteButton({ reporteId, fechaLabel }: Props) {
  return (
    <form
      action={deleteReporteRancho}
      className="inline-flex"
      onSubmit={(e) => {
        const ok = window.confirm(
          `¿Eliminar el reporte del ${fechaLabel}? Esta acción no se puede deshacer.`,
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={reporteId} />
      <Button type="submit" variant="destructive" size="sm" className="gap-1.5">
        <Trash2 className="h-4 w-4" aria-hidden />
        Eliminar
      </Button>
    </form>
  );
}
