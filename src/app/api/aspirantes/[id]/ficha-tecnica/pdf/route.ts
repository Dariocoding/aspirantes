import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@src/auth";
import { writeAuditLog } from "@src/lib/audit/log";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { AspiranteFichaTecnicaPdfDocument } from "@src/lib/pdf/aspirante-ficha-tecnica-document";
import {
  fichaTecnicaPdfPropsFromAspirante,
  loadFotoForFichaTecnicaPdf,
} from "@src/lib/pdf/ficha-tecnica-from-aspirante";
import { registerFichaTecnicaPdfFonts } from "@src/lib/pdf/register-ficha-tecnica-fonts";
import { prisma } from "@src/lib/prisma";

export const runtime = "nodejs";

registerFichaTecnicaPdfFonts();

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  if (!hasPermission(authContextFromSession(session), Permission.ASPIRANTES_READ)) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { id } = await context.params;
  const a = await prisma.aspirante.findUnique({
    where: { id },
    include: {
      convocatoria: true,
    },
  });

  if (!a) {
    return NextResponse.json({ message: "No encontrado" }, { status: 404 });
  }

  const foto = await loadFotoForFichaTecnicaPdf(a.fotoKey);
  const doc = createElement(
    AspiranteFichaTecnicaPdfDocument,
    fichaTecnicaPdfPropsFromAspirante(a, foto),
  );

  const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action: "ASPIRANTE_FICHA_TECNICA_PDF",
    entityType: "ASPIRANTE",
    entityId: a.id,
    metadata: { cedula: a.cedula },
  });

  const safeName = a.cedula.replace(/\D/g, "") || a.id;
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ficha-tecnica-${safeName}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
