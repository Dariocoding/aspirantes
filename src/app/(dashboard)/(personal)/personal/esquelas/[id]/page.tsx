import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EsquelaCumpleanosPoster } from "@dashboard/esquelas/_components/esquela-cumpleanos-poster";
import { EsquelaDetalleToolbar } from "@dashboard/esquelas/_components/esquela-detalle-toolbar";
import { buttonVariants } from "@src/components/ui/button";
import { aspiranteFotoUrl } from "@src/lib/storage/aspirante-foto";
import { auth } from "@src/auth";
import { routes } from "@src/lib/apps/routes";
import { honoreeDisplayName } from "@src/lib/pdf/esquela-cumpleanos-layout";
import { prisma } from "@src/lib/prisma";
import { cn } from "@src/lib/utils";
import { TipoEsquela } from "@src/generated/prisma";

export default async function EsquelaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const { id } = await params;
  const esquela = await prisma.esquela.findUnique({
    where: { id },
    include: { aspirante: true, efemeride: true },
  });
  if (!esquela) notFound();

  const esCumple = esquela.tipo === TipoEsquela.CUMPLEANOS;
  const nombre = esquela.aspirante
    ? honoreeDisplayName(esquela.aspirante.nombres, esquela.aspirante.apellidos)
    : esquela.titulo;
  const fotoSrc =
    esCumple && esquela.aspirante?.fotoKey
      ? aspiranteFotoUrl(esquela.aspirante.id, "perfil", { cutout: true })
      : null;
  const pdfHref = `/api/esquelas/${id}/pdf`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={routes.personal.esquelas}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 gap-1.5")}
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Volver a esquelas
        </Link>
        <EsquelaDetalleToolbar pdfHref={pdfHref} />
      </div>

      {esCumple ? (
        <div className="mx-auto w-full max-w-md print:max-w-none">
          <EsquelaCumpleanosPoster nombre={nombre} fotoSrc={fotoSrc} />
        </div>
      ) : (
        <article className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Efeméride</p>
          <h1 className="text-xl font-semibold text-slate-900">{esquela.titulo}</h1>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{esquela.cuerpo}</p>
          {esquela.efemeride ? (
            <p className="text-xs text-slate-500">{esquela.efemeride.nombre}</p>
          ) : null}
        </article>
      )}
    </div>
  );
}
