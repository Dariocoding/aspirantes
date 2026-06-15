"use client";

import type { FormEvent } from "react";
import { useCallback, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteAspirante } from "@src/app/actions/aspirantes";
import { Button } from "@src/components/ui/button";
import { SuccessCelebrationDialog } from "@src/components/ui/success-celebration-dialog";

type Props = {
  aspiranteId: string;
  nombreCompleto: string;
};

export function AspiranteDeleteForm({ aspiranteId, nombreCompleto }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [celebrateOpen, setCelebrateOpen] = useState(false);

  const submit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const msg = `¿Eliminar del censo a «${nombreCompleto}»? Esta acción no se puede deshacer.`;
      if (!confirm(msg)) return;
      const fd = new FormData(e.currentTarget);
      startTransition(async () => {
        await deleteAspirante(fd);
        setCelebrateOpen(true);
        router.refresh();
      });
    },
    [nombreCompleto, router],
  );

  const onCelebrateOpenChange = useCallback((open: boolean) => {
    setCelebrateOpen(open);
  }, []);

  return (
    <>
      <SuccessCelebrationDialog
        open={celebrateOpen}
        onOpenChange={onCelebrateOpenChange}
        variant="deleted"
        title="Aspirante eliminado del censo"
        description="El registro se eliminó de forma permanente."
      />
      <form onSubmit={submit} className="inline-flex justify-end">
        <input type="hidden" name="id" value={aspiranteId} />
        <Button type="submit" variant="destructive" size="sm" className="gap-1.5 shadow-sm" disabled={isPending}>
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          {isPending ? "Eliminando…" : "Eliminar"}
        </Button>
      </form>
    </>
  );
}
