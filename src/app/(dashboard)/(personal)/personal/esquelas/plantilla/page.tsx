import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { unauthorized } from "next/navigation";
import { EsquelaPlantillaView } from "@dashboard/esquelas/_components/esquela-plantilla-view";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { routes } from "@src/lib/apps/routes";
import { resolveCumpleanosPlantilla } from "@src/lib/pdf/esquela-plantilla";
import { buttonVariants } from "@src/components/ui/button";
import { cn } from "@src/lib/utils";

export default async function EsquelaPlantillaPage() {
  const session = await auth();
  if (!session?.user) unauthorized();
  const ctx = authContextFromSession(session);
  const canSee =
    hasPermission(ctx, Permission.ESQUELAS_WRITE) || hasPermission(ctx, Permission.ASPIRANTES_READ);
  if (!canSee) unauthorized();

  const plantilla = await resolveCumpleanosPlantilla();
  const canWrite = hasPermission(ctx, Permission.ESQUELAS_WRITE);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={routes.personal.esquelas}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 gap-1.5")}
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Volver a esquelas
        </Link>
      </div>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Plantilla de esquela</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
          Suba el fondo, coloque dónde va la foto y el nombre, y ajuste el estilo. El afiche de
          cumpleaños que ya usa la unidad queda como configuración por defecto.
        </p>
      </div>
      <EsquelaPlantillaView
        canWrite={canWrite}
        layout={plantilla.layout}
        fondoSrc={plantilla.fondoSrc}
        overlaySrc={plantilla.overlaySrc}
        hasCustomFondo={plantilla.hasCustomFondo}
        hasCustomOverlay={plantilla.hasCustomOverlay}
      />
    </div>
  );
}
