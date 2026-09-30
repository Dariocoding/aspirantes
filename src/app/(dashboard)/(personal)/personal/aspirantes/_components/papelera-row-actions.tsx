"use client";

import { useCallback, useState, useTransition } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { purgeAspirante, restoreAspirante } from "@src/app/actions/aspirantes";
import { Button } from "@src/components/ui/button";
import { SuccessCelebrationDialog } from "@src/components/ui/success-celebration-dialog";

type Props = {
  aspiranteId: string;
  nombreCompleto: string;
};

export function PapeleraRowActions({ aspiranteId, nombreCompleto }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [celebrate, setCelebrate] = useState<"restored" | "purged" | null>(null);

  const onCelebrateOpenChange = useCallback((open: boolean) => {
    if (!open) setCelebrate(null);
  }, []);

  const onRestaurar = useCallback(() => {
    const msg = `¿Restaurar a «${nombreCompleto}» en el censo?`;
    if (!confirm(msg)) return;
    const fd = new FormData();
    fd.set("id", aspiranteId);
    startTransition(async () => {
      await restoreAspirante(fd);
      setCelebrate("restored");
      router.refresh();
    });
  }, [aspiranteId, nombreCompleto, router]);

  const onPurgar = useCallback(() => {
    const msg = `¿Eliminar por completo a «${nombreCompleto}»? Se borrarán sus datos y documentos. Esta acción no se puede deshacer.`;
    if (!confirm(msg)) return;
    const fd = new FormData();
    fd.set("id", aspiranteId);
    startTransition(async () => {
      await purgeAspirante(fd);
      setCelebrate("purged");
      router.refresh();
    });
  }, [aspiranteId, nombreCompleto, router]);

  return (
    <>
      <SuccessCelebrationDialog
        open={celebrate === "restored"}
        onOpenChange={onCelebrateOpenChange}
        variant="saved"
        title="Aspirante restaurado"
        description="Volvió al censo con sus datos y documentos."
      />
      <SuccessCelebrationDialog
        open={celebrate === "purged"}
        onOpenChange={onCelebrateOpenChange}
        variant="deleted"
        title="Eliminado por completo"
        description="El registro y sus documentos se borraron de forma permanente."
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 border-slate-200 bg-white shadow-sm"
          disabled={isPending}
          onClick={onRestaurar}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          {isPending ? "Procesando…" : "Restaurar"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="gap-1.5 shadow-sm"
          disabled={isPending}
          onClick={onPurgar}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Eliminar por completo
        </Button>
      </div>
    </>
  );
}
