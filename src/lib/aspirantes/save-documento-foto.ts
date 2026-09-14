import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";
import type { AspiranteActionState } from "@src/lib/action-types";
import { writeAuditLog } from "@src/lib/audit/log";
import { applyAspiranteFotoKind, unknownFotoSaveError } from "@src/lib/aspirantes/apply-fotos";
import { routes } from "@src/lib/apps/routes";
import { prisma } from "@src/lib/prisma";
import { isPdfObjectKey, type AspiranteDocumentoKind } from "@src/lib/storage/aspirante-foto";

export type DocumentoFotoSaveResult = AspiranteActionState & {
  hasFoto?: boolean;
  isPdf?: boolean;
};

const DOCUMENTO_KINDS: readonly AspiranteDocumentoKind[] = [
  "cedula",
  "titulo",
  "tituloAuth",
  "notas",
];

export function isDocumentoFotoKind(v: string): v is AspiranteDocumentoKind {
  return (DOCUMENTO_KINDS as readonly string[]).includes(v);
}

export async function saveAspiranteDocumentoFoto(args: {
  session: Session;
  formData: FormData;
  aspiranteId: string;
  kind: AspiranteDocumentoKind;
}): Promise<DocumentoFotoSaveResult> {
  const { session, formData, aspiranteId, kind } = args;
  try {
    const existing = await prisma.aspirante.findUnique({
      where: { id: aspiranteId },
      select: {
        id: true,
        cedula: true,
        fotoCedulaKey: true,
        fotoTituloKey: true,
        fotoTituloAutenticacionKey: true,
        fotoNotasKey: true,
      },
    });
    if (!existing) {
      return { ok: false, errors: { _form: "No se encontró el aspirante." } };
    }

    const previousKey =
      kind === "cedula"
        ? existing.fotoCedulaKey
        : kind === "titulo"
          ? existing.fotoTituloKey
          : kind === "tituloAuth"
            ? existing.fotoTituloAutenticacionKey
            : existing.fotoNotasKey;

    const result = await applyAspiranteFotoKind(formData, aspiranteId, kind, previousKey);
    if ("ok" in result && result.ok === false) {
      return result;
    }

    const nextKey = "key" in result ? result.key : previousKey;
    const hasFoto = Boolean(nextKey);
    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "ASPIRANTE_UPDATE",
      entityType: "ASPIRANTE",
      entityId: aspiranteId,
      metadata: { cedula: existing.cedula, documento: kind, hasFoto },
    });
    revalidatePath(routes.personal.aspirantes);
    revalidatePath(routes.personal.aspirantesGestion);
    revalidatePath(routes.personal.aspirante(aspiranteId));
    return { ok: true, errors: {}, hasFoto, isPdf: isPdfObjectKey(nextKey) };
  } catch (e) {
    const digest =
      e && typeof e === "object" && "digest" in e ? String((e as { digest: unknown }).digest) : "";
    if (digest.startsWith("NEXT_")) throw e;
    console.error("[saveAspiranteDocumentoFoto]", e);
    return { ok: false, errors: { _form: unknownFotoSaveError(e) } };
  }
}
