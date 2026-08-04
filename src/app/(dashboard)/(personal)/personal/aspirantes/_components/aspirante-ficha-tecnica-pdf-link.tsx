import { FileDown } from "lucide-react";
import { buttonVariants } from "@src/components/ui/button";
import { cn } from "@src/lib/utils";

export function aspiranteFichaTecnicaPdfUrl(aspiranteId: string): string {
  return `/api/aspirantes/${encodeURIComponent(aspiranteId)}/ficha-tecnica/pdf`;
}

export function AspiranteFichaTecnicaPdfLink({
  aspiranteId,
  className,
  size = "sm",
  label = "Ficha PDF",
}: {
  aspiranteId: string;
  className?: string;
  size?: "sm" | "default";
  label?: string;
}) {
  return (
    <a
      href={aspiranteFichaTecnicaPdfUrl(aspiranteId)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({ variant: "outline", size }),
        "gap-1.5 border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      <FileDown className="h-3.5 w-3.5" aria-hidden />
      {label}
    </a>
  );
}
