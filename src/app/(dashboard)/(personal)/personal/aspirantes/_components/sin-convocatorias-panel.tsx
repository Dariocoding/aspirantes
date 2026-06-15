import Link from "next/link";
import { Megaphone } from "lucide-react";
import { buttonVariants } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { routes } from "@src/lib/apps/routes";
import { cn } from "@src/lib/utils";

type Props = {
      /** Si es administrador, se ofrece enlace directo a la gestión de convocatorias. */
  showConvocatoriasLink: boolean;
  context?: "censo" | "gestion";
};

export function SinConvocatoriasPanel({ showConvocatoriasLink, context = "censo" }: Props) {
  const title = context === "gestion" ? "Registro bloqueado" : "Censo no disponible";
  const description =
    context === "gestion"
      ? "Debe existir al menos una convocatoria antes de registrar o actualizar aspirantes."
      : "Año no hay convocatorias en el sistema. Cree la primera para habilitar el censo y el registro.";

  return (
    <Card className="shadow-sm shadow-slate-900/5 ring-slate-200/80">
      <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white shadow-sm">
            <Megaphone className="h-5 w-5 text-slate-700" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
            <CardDescription className="text-sm text-slate-600">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
          <p className="max-w-md text-sm text-slate-600">
            {showConvocatoriasLink
              ? "Como administrador, puede crear el primer período en la sección Convocatorias."
              : "Solicite a un administrador que cree una convocatoria en el sistema."}
          </p>
          {showConvocatoriasLink ? (
            <Link
              href={routes.personal.convocatorias}
              prefetch={false}
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "gap-2 bg-slate-900 shadow-sm hover:bg-slate-800",
              )}
            >
              Ir a convocatorias
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
