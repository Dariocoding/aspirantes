"use client";

import { useState } from "react";
import { FileDown, ImageDown, Printer } from "lucide-react";
import { Button, buttonVariants } from "@src/components/ui/button";
import { cn } from "@src/lib/utils";

export function EsquelaDetalleToolbar({
  pdfHref,
  onDownloadImage,
}: {
  pdfHref?: string;
  onDownloadImage?: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex shrink-0 flex-wrap gap-2 print:hidden">
      {onDownloadImage ? (
        <Button
          type="button"
          size="sm"
          className="h-9 gap-1.5 bg-slate-900 hover:bg-slate-800"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void onDownloadImage()
              .catch((err: unknown) => {
                window.alert(err instanceof Error ? err.message : "No se pudo descargar la imagen.");
              })
              .finally(() => setBusy(false));
          }}
        >
          <ImageDown className="h-3.5 w-3.5" aria-hidden />
          {busy ? "Preparando imagen…" : "Descargar imagen"}
        </Button>
      ) : pdfHref ? (
        <a
          href={`${pdfHref}?download=1`}
          className={cn(buttonVariants({ variant: "default", size: "sm" }), "h-9 gap-1.5 bg-slate-900 hover:bg-slate-800")}
        >
          <FileDown className="h-3.5 w-3.5" aria-hidden />
          Descargar PDF
        </a>
      ) : null}
      <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => window.print()}>
        <Printer className="h-3.5 w-3.5" aria-hidden />
        Imprimir
      </Button>
    </div>
  );
}
