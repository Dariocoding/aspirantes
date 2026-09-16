"use client";

import { FileDown, Printer } from "lucide-react";
import { Button, buttonVariants } from "@src/components/ui/button";
import { cn } from "@src/lib/utils";

export function EsquelaDetalleToolbar({ pdfHref }: { pdfHref: string }) {
  return (
    <div className="flex shrink-0 flex-wrap gap-2 print:hidden">
      <a
        href={`${pdfHref}?download=1`}
        className={cn(buttonVariants({ variant: "default", size: "sm" }), "h-9 gap-1.5 bg-slate-900 hover:bg-slate-800")}
      >
        <FileDown className="h-3.5 w-3.5" aria-hidden />
        Descargar PDF
      </a>
      <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => window.print()}>
        <Printer className="h-3.5 w-3.5" aria-hidden />
        Imprimir
      </Button>
    </div>
  );
}
