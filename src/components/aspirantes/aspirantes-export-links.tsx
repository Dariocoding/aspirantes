import { FileDown, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  /** Cadena de consulta sin `format` (mismos filtros que el listado). */
  exportQuery: string;
};

export function AspirantesExportLinks({ exportQuery }: Props) {
  const suffix = exportQuery ? `&${exportQuery}` : "";
  const base = "/api/aspirantes/censo/export";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link
        href={`${base}?format=xlsx${suffix}`}
        prefetch={false}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-9 gap-1.5 border-emerald-200/90 bg-emerald-50/80 px-2.5 text-emerald-950 shadow-sm hover:bg-emerald-100/90",
        )}
      >
        <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />
        Excel
      </Link>
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
