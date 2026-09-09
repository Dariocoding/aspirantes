"use client";

import { ChevronDown, FileDown, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { buttonVariants } from "@src/components/ui/button";
import { cn } from "@src/lib/utils";

type Props = {
  /** Cadena de consulta sin `format` (mismos filtros que el listado). */
  exportQuery: string;
};

export function AspirantesExportLinks({ exportQuery }: Props) {
  const suffix = exportQuery ? `&${exportQuery}` : "";
  const base = "/api/aspirantes/censo/export";
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function closeMenu() {
    if (detailsRef.current) detailsRef.current.open = false;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <details ref={detailsRef} className="group relative">
        <summary
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-9 cursor-pointer list-none gap-1.5 border-emerald-200/90 bg-emerald-50/80 px-2.5 text-emerald-950 shadow-sm hover:bg-emerald-100/90 [&::-webkit-details-marker]:hidden",
          )}
        >
          <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />
          Excel
          <ChevronDown className="h-3.5 w-3.5 opacity-70 transition group-open:rotate-180" aria-hidden />
        </summary>
        <div
          className="absolute right-0 z-30 mt-1.5 w-64 overflow-hidden rounded-lg border border-emerald-200/90 bg-white py-1 shadow-lg shadow-slate-900/10"
          role="menu"
        >
          <a
            href={`${base}?format=xlsx${suffix}`}
            role="menuitem"
            className="block px-3 py-2 text-sm text-slate-800 hover:bg-emerald-50"
            onClick={closeMenu}
          >
            <span className="font-medium">Censo completo</span>
            <span className="mt-0.5 block text-xs text-slate-500">Exportación habitual del directorio</span>
          </a>
          <a
            href={`${base}?format=xlsx&variant=examenes-medicos${suffix}`}
            role="menuitem"
            className="block border-t border-slate-100 px-3 py-2 text-sm text-slate-800 hover:bg-emerald-50"
            onClick={closeMenu}
          >
            <span className="font-medium">Exámenes médicos</span>
            <span className="mt-0.5 block text-xs text-slate-500">Nombre, cédula y checklist médico</span>
          </a>
          <a
            href={`${base}?format=xlsx&variant=lista-oficial${suffix}`}
            role="menuitem"
            className="block border-t border-slate-100 px-3 py-2 text-sm text-slate-800 hover:bg-emerald-50"
            onClick={closeMenu}
          >
            <span className="font-medium">Lista oficial</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              N°, JQUIA ASP OFICIAL, apellidos, nombres, cédula, sexo
            </span>
          </a>
        </div>
      </details>
      <Link
        href={`${base}?format=pdf${suffix}`}
        prefetch={false}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-9 gap-1.5 border-rose-200/90 bg-rose-50/80 px-2.5 text-rose-950 shadow-sm hover:bg-rose-100/90",
        )}
      >
        <FileDown className="h-3.5 w-3.5" aria-hidden />
        PDF
      </Link>
    </div>
  );
}
