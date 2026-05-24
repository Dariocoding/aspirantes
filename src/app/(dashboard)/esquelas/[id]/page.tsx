import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/print-button";

export default async function EsquelaPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const esquela = await prisma.esquela.findUnique({ where: { id }, include: { aspirante: true, efemeride: true } });

  if (!esquela) return notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-3 sm:px-0">
      <Card className="border-slate-400">
        <CardHeader>
          <CardTitle className="text-center text-2xl">{esquela.titulo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-lg">{esquela.cuerpo}</p>
          <p className="text-slate-600">Fecha: {formatDate(esquela.fechaEvento)}</p>
          <p className="text-sm text-slate-700">Fuerza Armada Nacional Bolivariana</p>
        </CardContent>
      </Card>
      <div className="print:hidden flex flex-wrap gap-3">
        <PrintButton />
        <Link
          href={`/api/esquelas/${id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "secondary" }))}
        >
          Descargar PDF
        </Link>
      </div>
    </div>
  );
}
