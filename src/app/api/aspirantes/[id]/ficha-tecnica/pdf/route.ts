import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@src/auth";
import { writeAuditLog } from "@src/lib/audit/log";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { inlinePdfResponse, pdfNoEncontrado } from "@src/lib/pdf/inline-pdf";
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
  if (!session?.user || !hasPermission(authContextFromSession(session), Permission.ASPIRANTES_READ)) {
    pdfNoEncontrado();
  }

  const { id } = await context.params;
  const a = await prisma.aspirante.findUnique({
    where: { id },
    include: {
      convocatoria: true,
    },
  });

  if (!a) pdfNoEncontrado();

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
  return inlinePdfResponse(buffer, `ficha-tecnica-${safeName}.pdf`);
}
