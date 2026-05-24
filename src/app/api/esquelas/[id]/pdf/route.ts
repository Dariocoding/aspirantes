import { createElement } from "react";
import { auth } from "@/auth";
import { formatDate } from "@/lib/date";
import { EsquelaPdfDocument } from "@/lib/pdf/esquela-document";
import { readInstitutionLogoPngBuffer } from "@/lib/pdf/institution-logo";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const { id } = await context.params;
  const esquela = await prisma.esquela.findUnique({ where: { id } });

  if (!esquela) {
    return NextResponse.json({ message: "No encontrada" }, { status: 404 });
  }

  const logoPng = readInstitutionLogoPngBuffer();

  const doc = createElement(EsquelaPdfDocument, {
    titulo: esquela.titulo,
    cuerpo: esquela.cuerpo,
    fechaTexto: formatDate(esquela.fechaEvento),
    logoPng,
    referencia: `ESQ-${id.toUpperCase()}`,
  });

  const buffer = await renderToBuffer(
    doc as Parameters<typeof renderToBuffer>[0],
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="esquela-${id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
