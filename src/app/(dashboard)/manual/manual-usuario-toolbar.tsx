"use client";

import { FileDown, Printer } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ManualUsuarioToolbar() {
  return (
    <div className="flex shrink-0 flex-wrap gap-2 print:hidden">
      <a
        href="/api/manual-usuario/pdf"
        download
        className={cn(
          buttonVariants({ variant: "default" }),
          "inline-flex bg-slate-900 text-white hover:bg-slate-800",
        )}
      >
        <FileDown className="mr-2 h-4 w-4" aria-hidden />
        Descargar PDF
      </a>
      <Button
        type="button"
        variant="outline"
        className="border-slate-300"
        onClick={() => window.print()}
      >
        <Printer className="mr-2 h-4 w-4" aria-hidden />
        Imprimir vista
      </Button>
    </div>
  );
}
