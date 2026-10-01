"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { AspiranteQuickDialog, type AspiranteQuickInitial } from "@dashboard/aspirantes/_components/aspirante-quick-dialog";
import { Button } from "@src/components/ui/button";
import type { PelotonResumen } from "@src/lib/pelotones";

export function AspirantePerfilEditButton({
  initial,
  pelotones,
}: {
  initial: AspiranteQuickInitial;
  pelotones: PelotonResumen[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 gap-1.5 border-slate-200 bg-white shadow-sm"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        Editar
      </Button>
      <AspiranteQuickDialog
        open={open}
        onOpenChange={setOpen}
        mode="edit"
        pelotones={pelotones}
        initial={initial}
      />
    </>
  );
}
