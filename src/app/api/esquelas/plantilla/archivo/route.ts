import { NextResponse } from "next/server";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { getOrCreateCumpleanosPlantilla } from "@src/lib/pdf/esquela-plantilla";
import { readEsquelaPlantillaAssetBuffer } from "@src/lib/storage/esquela-plantilla";

export const runtime = "nodejs";

export async function GET(request: Request) {
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

  const kind = new URL(request.url).searchParams.get("kind");
  if (kind !== "fondo" && kind !== "overlay") {
    return NextResponse.json({ message: "Archivo no válido" }, { status: 400 });
  }

  const row = await getOrCreateCumpleanosPlantilla();
  const key = kind === "fondo" ? row.fondoKey : row.overlayKey;
  if (!key) {
    return NextResponse.json({ message: "Sin imagen personalizada" }, { status: 404 });
  }

  try {
    const { body, contentType } = await readEsquelaPlantillaAssetBuffer(key);
    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": contentType ?? "application/octet-stream",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ message: "No se pudo leer la imagen" }, { status: 404 });
  }
}
