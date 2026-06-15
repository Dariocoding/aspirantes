import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { formatDate } from "@src/lib/date";
import { EsquelaPdfDocument } from "@src/lib/pdf/esquela-document";
import { readInstitutionLogoPngBuffer } from "@src/lib/pdf/institution-logo";
import { prisma } from "@src/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  if (!hasPermission(authContextFromSession(session), Permission.ESQUELAS_WRITE)) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
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

  const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="esquela-${id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
