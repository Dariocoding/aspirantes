import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { unauthorized } from "next/navigation";

const COPY: Record<string, { title: string; body: string }> = {
  escritura: {
    title: "Solo lectura",
    body:
      "Su usuario tiene rol de consulta: puede ver el censo y la configuración general, pero no registrar, editar ni eliminar datos ni exportar listados masivos.",
  },
  administracion: {
    title: "Zona de administración",
    body: "Esta sección está reservada a usuarios con rol de administrador del sistema.",
  },
};

export default async function SinPermisoPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string | string[] }>;
}) {
  const session = await auth();
  if (!session?.user) unauthorized();

  const sp = await searchParams;
  const raw = sp.motivo;
  const key = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const motivo = key === "administracion" ? "administracion" : "escritura";
  const text = COPY[motivo];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50/90 p-4 text-amber-950 shadow-sm">
        <ShieldAlert className="mt-0.5 size-8 shrink-0 text-amber-800" aria-hidden />
        <div className="min-w-0 space-y-2">
          <h1 className="text-lg font-semibold tracking-tight">{text.title}</h1>
          <p className="text-sm leading-relaxed text-amber-950/90">{text.body}</p>
        </div>
      </div>
      <p className="text-sm text-slate-600">
        Si necesita permisos adicionales, solicítelos al administrador de la plataforma.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href="/" className={cn(buttonVariants({ variant: "default", size: "sm" }), "bg-slate-900")}>
          Volver al panel
        </Link>
        <Link href="/aspirantes" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Ir al censo
        </Link>
      </div>
    </div>
  );
}
