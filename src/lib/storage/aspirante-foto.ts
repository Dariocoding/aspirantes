import { deleteObject, putObject } from "@src/lib/storage/s3";

export type AspiranteArchivoExt = "jpg" | "png" | "webp" | "gif" | "pdf";

const CONTENT_TYPE: Record<AspiranteArchivoExt, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
};

const EXTS_JPEG_PNG = new Set<AspiranteArchivoExt>(["jpg", "png"]);
const EXTS_IMAGEN = new Set<AspiranteArchivoExt>(["jpg", "png", "webp", "gif"]);
const EXTS_NOTAS = new Set<AspiranteArchivoExt>(["jpg", "png", "pdf"]);

export type AspiranteFotoKind = "perfil" | "esquela" | "cedula" | "titulo" | "tituloAuth" | "notas";

export type AspiranteDocumentoKind = Exclude<AspiranteFotoKind, "perfil" | "esquela">;

export const ASPIRANTE_FOTO_KINDS: readonly AspiranteFotoKind[] = [
  "perfil",
  "esquela",
  "cedula",
  "titulo",
  "tituloAuth",
  "notas",
];

export const ASPIRANTE_DOCUMENTO_KINDS: readonly AspiranteDocumentoKind[] = [
  "cedula",
  "titulo",
  "tituloAuth",
  "notas",
];

export type AspiranteFotoDbField =
  | "fotoKey"
  | "fotoEsquelaKey"
  | "fotoCedulaKey"
  | "fotoTituloKey"
  | "fotoTituloAutenticacionKey"
  | "fotoNotasKey";

const KIND_FILE: Record<AspiranteFotoKind, string> = {
  perfil: "foto",
  esquela: "esquela",
  cedula: "cedula",
  titulo: "titulo",
  tituloAuth: "titulo-auth",
  notas: "notas",
};

/** Campos FormData por tipo de archivo. */
export const ASPIRANTE_FOTO_FORM: Record<
  AspiranteFotoKind,
  { file: string; quitar: string; dbField: AspiranteFotoDbField }
> = {
  perfil: { file: "imagen", quitar: "quitarImagen", dbField: "fotoKey" },
  esquela: { file: "imagenEsquela", quitar: "quitarImagenEsquela", dbField: "fotoEsquelaKey" },
  cedula: { file: "imagenCedula", quitar: "quitarImagenCedula", dbField: "fotoCedulaKey" },
  titulo: { file: "imagenTitulo", quitar: "quitarImagenTitulo", dbField: "fotoTituloKey" },
  tituloAuth: {
    file: "imagenTituloAuth",
    quitar: "quitarImagenTituloAuth",
    dbField: "fotoTituloAutenticacionKey",
  },
  notas: { file: "imagenNotas", quitar: "quitarImagenNotas", dbField: "fotoNotasKey" },
};

export function allowedExtsForKind(kind: AspiranteFotoKind): Set<AspiranteArchivoExt> {
  if (kind === "titulo" || kind === "tituloAuth") return EXTS_JPEG_PNG;
  if (kind === "notas") return EXTS_NOTAS;
  return EXTS_IMAGEN;
}

export function acceptAttrForKind(kind: AspiranteFotoKind): string {
  if (kind === "titulo" || kind === "tituloAuth") return "image/jpeg,image/png,.jpg,.jpeg,.png";
  if (kind === "notas") return "image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf";
  return "image/jpeg,image/png,image/webp,image/gif";
}

export function formatHelpForKind(kind: AspiranteFotoKind): string {
  if (kind === "titulo" || kind === "tituloAuth") return "Solo JPEG o PNG.";
  if (kind === "notas") {
    return "JPEG, PNG o PDF. Varias imágenes se unen en un PDF; una sola se queda como imagen.";
  }
  return "JPEG, PNG, WebP o GIF.";
}

export function formatErrorForKind(kind: AspiranteFotoKind): string {
  if (kind === "titulo" || kind === "tituloAuth") {
    return "Formato no permitido. El fondo negro y la autenticación solo aceptan JPEG o PNG.";
  }
  if (kind === "notas") {
    return "Formato no permitido. Las notas certificadas aceptan JPEG, PNG o PDF.";
  }
  return "Formato no permitido. Use JPEG, PNG, WebP o GIF.";
}

export function isPdfObjectKey(key: string | null | undefined): boolean {
  if (!key) return false;
  const path = key.split("?")[0]?.toLowerCase() ?? "";
  return path.endsWith(".pdf");
}

export function fileLooksAllowed(file: File, kind: AspiranteFotoKind): boolean {
  const ext = extHintFromFile(file);
  return ext != null && allowedExtsForKind(kind).has(ext);
}

export function fileLooksPdf(file: File): boolean {
  return extHintFromFile(file) === "pdf";
}

function extHintFromFile(file: File): AspiranteArchivoExt | null {
  const t = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (t === "image/jpeg" || t === "image/jpg" || name.endsWith(".jpg") || name.endsWith(".jpeg")) return "jpg";
  if (t === "image/png" || name.endsWith(".png")) return "png";
  if (t === "image/webp" || name.endsWith(".webp")) return "webp";
  if (t === "image/gif" || name.endsWith(".gif")) return "gif";
  if (
    t === "application/pdf" ||
    t === "application/x-pdf" ||
    t === "application/acrobat" ||
    name.endsWith(".pdf")
  ) {
    return "pdf";
  }
  return null;
}

function sniffExt(buffer: Buffer): AspiranteArchivoExt | null {
  // SOI JPEG: FF D8. El tercer byte suele ser FF (marcador), pero algunos escáneres no lo cumplen.
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) return "jpg";
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  if (buffer.length >= 6) {
    const header = buffer.toString("ascii", 0, 6);
    if (header === "GIF87a" || header === "GIF89a") return "gif";
  }
  if (buffer.length >= 4 && buffer.toString("ascii", 0, 4) === "%PDF") return "pdf";
  return null;
}

export function aspiranteFotoObjectKey(aspiranteId: string, kind: AspiranteFotoKind, ext: string): string {
  return `aspirantes/${aspiranteId}/${KIND_FILE[kind]}.${ext}`;
}

/** @deprecated Prefer `aspiranteFotoObjectKey(id, "perfil", ext)`. */
export function aspiranteFotoKey(aspiranteId: string, ext: string): string {
  return aspiranteFotoObjectKey(aspiranteId, "perfil", ext);
}

/** Ruta de la API de foto (usable en servidor y cliente). */
export function isAspiranteFotoKind(v: string | null | undefined): v is AspiranteFotoKind {
  return Boolean(v && (ASPIRANTE_FOTO_KINDS as readonly string[]).includes(v));
}

/** Fuente de la foto en esquelas: ceremonial si existe; si no, carnet. */
export function pickFotoForEsquela(
  fotoEsquelaKey: string | null | undefined,
  fotoCarnetKey: string | null | undefined,
): { key: string; kind: "esquela" | "perfil" } | null {
  if (fotoEsquelaKey) return { key: fotoEsquelaKey, kind: "esquela" };
  if (fotoCarnetKey) return { key: fotoCarnetKey, kind: "perfil" };
  return null;
}

export function aspiranteFotoUrl(
  aspiranteId: string,
  kind: AspiranteFotoKind = "perfil",
  extra?: { cutout?: boolean; oval?: boolean },
): string {
  const params = new URLSearchParams();
  if (kind !== "perfil") params.set("tipo", kind);
  if (extra?.cutout) params.set("cutout", "1");
  if (extra?.oval) params.set("oval", "1");
  const q = params.toString();
  return `/api/aspirantes/foto/${aspiranteId}${q ? `?${q}` : ""}`;
}

export function parseAspiranteFotoFile(
  formData: FormData,
  kind: AspiranteFotoKind = "perfil",
): File | null {
  const raw = formData.get(ASPIRANTE_FOTO_FORM[kind].file);
  if (!(raw instanceof File) || raw.size === 0) return null;
  return raw;
}

export function shouldRemoveAspiranteFoto(
  formData: FormData,
  kind: AspiranteFotoKind = "perfil",
): boolean {
  return formData.get(ASPIRANTE_FOTO_FORM[kind].quitar) === "1";
}

export async function uploadAspiranteFoto(
  file: File,
  aspiranteId: string,
  kind: AspiranteFotoKind = "perfil",
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffExt(buffer);
  const hinted = extHintFromFile(file);
  const allowed = allowedExtsForKind(kind);
  const ext =
    sniffed && allowed.has(sniffed) ? sniffed : hinted && allowed.has(hinted) ? hinted : null;
  if (!ext) {
    throw new AspiranteFotoError(formatErrorForKind(kind));
  }

  const key = aspiranteFotoObjectKey(aspiranteId, kind, ext);
  await putObject(key, buffer, CONTENT_TYPE[ext]);
  return key;
}

export async function removeAspiranteFoto(key: string | null | undefined): Promise<void> {
  if (!key) return;
  try {
    await deleteObject(key);
  } catch {
    // Si el objeto ya no existe en el bucket, no bloqueamos la operación en BD.
  }
}

export class AspiranteFotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AspiranteFotoError";
  }
}
