import { NextResponse } from "next/server";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { prisma } from "@src/lib/prisma";
import { ASPIRANTE_FOTO_FORM, type AspiranteFotoKind } from "@src/lib/storage/aspirante-foto";
import { getPresignedGetUrl } from "@src/lib/storage/s3";

export const runtime = "nodejs";

function parseKind(raw: string | null): AspiranteFotoKind {
  if (raw === "cedula" || raw === "titulo" || raw === "tituloAuth" || raw === "notas") return raw;
  return "perfil";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ aspiranteId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  if (!hasPermission(authContextFromSession(session), Permission.ASPIRANTES_READ)) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { aspiranteId } = await context.params;
  const kind = parseKind(new URL(request.url).searchParams.get("tipo"));
  const dbField = ASPIRANTE_FOTO_FORM[kind].dbField;

  const aspirante = await prisma.aspirante.findUnique({
    where: { id: aspiranteId },
    select: {
      fotoKey: true,
      fotoCedulaKey: true,
      fotoTituloKey: true,
      fotoTituloAutenticacionKey: true,
      fotoNotasKey: true,
    },
  });

  const key = aspirante?.[dbField];
  if (!key) {
    return NextResponse.json({ message: "Sin imagen" }, { status: 404 });
  }

  const url = await getPresignedGetUrl(key);
  const res = NextResponse.redirect(url, { status: 302 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
