import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@src/auth";
import { writeAuditLog } from "@src/lib/audit/log";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { canWrite } from "@src/lib/auth/roles";
import { applyCensusXlsxImport } from "@src/lib/excel/apply-census-xlsx-import";
import { parseAspirantesCensoXlsxBuffer } from "@src/lib/excel/parse-aspirantes-censo-xlsx";
import { prisma } from "@src/lib/prisma";
import { routes } from "@src/lib/apps/routes";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  if (!canWrite(authContextFromSession(session))) {
    return NextResponse.json(
      { message: "No autorizado: el rol consulta no puede importar el censo." },
      { status: 403 },
    );
  }

  const form = await request.formData();
  const convocatoriaId = String(form.get("convocatoria") ?? "").trim();
  const file = form.get("file");
  if (!convocatoriaId) {
    return NextResponse.json({ message: "Falta la convocatoria." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size < 1) {
    return NextResponse.json({ message: "Adjunte un archivo Excel (.xlsx)." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ message: "El archivo supera 8 MB." }, { status: 400 });
  }
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx")) {
    return NextResponse.json({ message: "Use un archivo .xlsx exportado del censo." }, { status: 400 });
  }

  const convocatoria = await prisma.convocatoria.findUnique({
    where: { id: convocatoriaId },
    select: { id: true, codigo: true, nombre: true },
  });
  if (!convocatoria) {
    return NextResponse.json({ message: "Convocatoria no encontrada." }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let parsed;
  try {
    parsed = await parseAspirantesCensoXlsxBuffer(buffer);
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "No se pudo leer el Excel." },
      { status: 400 },
    );
  }

  const result = await applyCensusXlsxImport(prisma, convocatoria.id, parsed);

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action: "CENSO_IMPORT_XLSX",
    entityType: "CENSO",
    entityId: convocatoria.id,
    metadata: {
      convocatoriaCodigo: convocatoria.codigo,
      convocatoriaNombre: convocatoria.nombre,
      fileName: file.name,
      columns: result.columns,
      updated: result.updated,
      created: result.created,
      unchanged: result.unchanged,
      errorCount: result.errors.length,
    },
  });

  revalidatePath(routes.hub);
  revalidatePath(routes.personal.aspirantes);
  revalidatePath(routes.personal.aspirantesGestion);

  return NextResponse.json({
    message:
      result.errors.length === 0
        ? `Importación lista: ${result.updated} actualizado(s), ${result.created} alta(s).`
        : `Importación parcial: ${result.updated} actualizado(s), ${result.created} alta(s), ${result.errors.length} con error.`,
    ...result,
  });
}
