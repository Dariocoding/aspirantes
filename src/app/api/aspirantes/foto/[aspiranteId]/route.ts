import { NextResponse } from "next/server";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { canWrite } from "@src/lib/auth/roles";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { toHonoreeCutoutPng } from "@src/lib/pdf/esquela-cumpleanos-assets";
import { prisma } from "@src/lib/prisma";
import {
  isDocumentoFotoKind,
  saveAspiranteDocumentoFoto,
} from "@src/lib/aspirantes/save-documento-foto";
import {
  ASPIRANTE_FOTO_FORM,
  isAspiranteFotoKind,
  type AspiranteFotoKind,
} from "@src/lib/storage/aspirante-foto";
import { getObjectBuffer, getPresignedGetUrl } from "@src/lib/storage/s3";

export const runtime = "nodejs";
export const maxDuration = 60;

function parseKind(raw: string | null): AspiranteFotoKind {
  if (isAspiranteFotoKind(raw)) return raw;
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
  const search = new URL(request.url).searchParams;
  const kind = parseKind(search.get("tipo"));
  const proxy = search.get("proxy") === "1";
  const dbField = ASPIRANTE_FOTO_FORM[kind].dbField;

  const aspirante = await prisma.aspirante.findUnique({
    where: { id: aspiranteId },
    select: {
      fotoKey: true,
      fotoEsquelaKey: true,
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

  const cutout = search.get("cutout") === "1";
  if (cutout || proxy) {
    const { body, contentType } = await getObjectBuffer(key);
    if (cutout) {
      const png = await toHonoreeCutoutPng(body);
      return new NextResponse(new Uint8Array(png), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "private, no-store",
        },
      });
    }
    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": contentType ?? "application/octet-stream",
        "Cache-Control": "private, no-store",
      },
    });
  }

  const url = await getPresignedGetUrl(key);
  const res = NextResponse.redirect(url, { status: 302 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ aspiranteId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, errors: { _form: "No autenticado." } }, { status: 401 });
  }
  if (!canWrite(authContextFromSession(session))) {
    return NextResponse.json({ ok: false, errors: { _form: "No autorizado." } }, { status: 403 });
  }

  const { aspiranteId } = await context.params;
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, errors: { _form: "No se pudo leer el archivo. Intente de nuevo." } },
      { status: 400 },
    );
  }

  const kindRaw = String(
    formData.get("kind") ?? new URL(request.url).searchParams.get("tipo") ?? "",
  ).trim();
  if (!aspiranteId) {
    return NextResponse.json({ ok: false, errors: { _form: "Falta el aspirante." } }, { status: 400 });
  }
  if (!isDocumentoFotoKind(kindRaw)) {
    return NextResponse.json(
      { ok: false, errors: { _form: "Tipo de documento no válido." } },
      { status: 400 },
    );
  }

  const result = await saveAspiranteDocumentoFoto({
    session,
    formData,
    aspiranteId,
    kind: kindRaw,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
