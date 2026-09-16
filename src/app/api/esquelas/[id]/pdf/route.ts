import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { formatDate } from "@src/lib/date";
import {
  loadFotoCircularForEsquelaPdf,
  readCumpleanosPlantillaJpeg,
  readLaurelOverlayPng,
} from "@src/lib/pdf/esquela-cumpleanos-assets";
import { EsquelaCumpleanosPdfDocument } from "@src/lib/pdf/esquela-cumpleanos-document";
import { honoreeDisplayName } from "@src/lib/pdf/esquela-cumpleanos-layout";
import { EsquelaPdfDocument } from "@src/lib/pdf/esquela-document";
import { readInstitutionLogoPngBuffer } from "@src/lib/pdf/institution-logo";
import { prisma } from "@src/lib/prisma";
import { TipoEsquela } from "@src/generated/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  const ctx = authContextFromSession(session);
  const puedeVer =
    hasPermission(ctx, Permission.ESQUELAS_WRITE) || hasPermission(ctx, Permission.ASPIRANTES_READ);
  if (!puedeVer) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { id } = await context.params;
  const esquela = await prisma.esquela.findUnique({
    where: { id },
    include: { aspirante: { select: { nombres: true, apellidos: true, fotoKey: true } } },
  });

  if (!esquela) {
    return NextResponse.json({ message: "No encontrada" }, { status: 404 });
  }

  const download = new URL(request.url).searchParams.get("download") === "1";

  let buffer: Buffer;
  if (esquela.tipo === TipoEsquela.CUMPLEANOS) {
    const plantillaJpeg = await readCumpleanosPlantillaJpeg();
    if (!plantillaJpeg) {
      return NextResponse.json({ message: "Falta la plantilla de cumpleaños" }, { status: 500 });
    }
    const fotoPng = await loadFotoCircularForEsquelaPdf(esquela.aspirante?.fotoKey ?? null);
    const laurelPng = await readLaurelOverlayPng();
    const nombre = esquela.aspirante
      ? honoreeDisplayName(esquela.aspirante.nombres, esquela.aspirante.apellidos)
      : esquela.titulo;
    const doc = createElement(EsquelaCumpleanosPdfDocument, {
      nombre,
      plantillaJpeg,
      fotoPng,
      laurelPng,
    });
    buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
  } else {
    const logoPng = readInstitutionLogoPngBuffer();
    const doc = createElement(EsquelaPdfDocument, {
      titulo: esquela.titulo,
      cuerpo: esquela.cuerpo,
      fechaTexto: formatDate(esquela.fechaEvento),
      logoPng,
      referencia: `ESQ-${id.toUpperCase()}`,
    });
    buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
  }

  const disposition = download ? "attachment" : "inline";
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="esquela-${id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
