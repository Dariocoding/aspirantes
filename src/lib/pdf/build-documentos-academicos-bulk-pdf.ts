import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
  type PDFEmbeddedPage,
} from "pdf-lib";
import sharp from "sharp";
import { readInstitutionLogoPngBuffer } from "@src/lib/pdf/institution-logo";
import { getObjectBuffer } from "@src/lib/storage/s3";
import { isPdfObjectKey } from "@src/lib/storage/aspirante-foto";

const A4_P: [number, number] = [595.28, 841.89];
const A4_L: [number, number] = [841.89, 595.28];
const HEADER_H = 46;
const FOOTER_H = 22;
const MARGIN = 28;
const COVER_BANNER_H = 110;
const GREEN = rgb(0, 102 / 255, 0);
const GREEN_SOFT = rgb(215 / 255, 228 / 255, 189 / 255);
const BLACK = rgb(0.08, 0.1, 0.12);
const GRAY = rgb(0.35, 0.38, 0.4);
const WHITE = rgb(1, 1, 1);
const RED_MISS = rgb(0.55, 0.15, 0.15);

export type AspiranteDocumentosAcademicosSource = {
  nombres: string;
  apellidos: string;
  cedula: string;
  tituloUniversidad: string | null;
  unidadPostulante: string;
  fotoTituloKey: string | null;
  fotoTituloAutenticacionKey: string | null;
  fotoNotasKey: string | null;
};

export type DocumentosAcademicosBulkMeta = {
  convocatoriaNombre: string;
  convocatoriaCodigo: string;
  generatedAt: Date;
};

type LoadedImage = { kind: "image"; bytes: Uint8Array };
type LoadedPdf = { kind: "pdf"; bytes: Uint8Array };
type LoadedDoc = LoadedImage | LoadedPdf | { kind: "missing" } | { kind: "unreadable" };

type LoadedAspirante = {
  nombres: string;
  apellidos: string;
  cedula: string;
  tituloUniversidad: string | null;
  unidadPostulante: string;
  titulo: LoadedDoc;
  tituloAuth: LoadedDoc;
  notas: LoadedDoc;
};

function formatCedulaVe(cedula: string): string {
  const digits = cedula.replace(/\D/g, "");
  if (!digits) return cedula.trim() || "-";
  return `V-${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function nombreCompleto(a: { apellidos: string; nombres: string }): string {
  return `${a.apellidos.trim()} ${a.nombres.trim()}`.replace(/\s+/g, " ").trim();
}

function pdfSafe(font: PDFFont, text: string): string {
  const raw = text.replace(/\s+/g, " ").trim();
  let out = "";
  for (const ch of raw) {
    try {
      font.encodeText(ch);
      out += ch;
    } catch {
      out += "?";
    }
  }
  return out;
}

function ellipsize(font: PDFFont, text: string, size: number, maxWidth: number): string {
  const safe = pdfSafe(font, text);
  if (font.widthOfTextAtSize(safe, size) <= maxWidth) return safe;
  const dots = "...";
  let lo = 0;
  let hi = safe.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = safe.slice(0, mid) + dots;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return lo <= 0 ? dots : safe.slice(0, lo) + dots;
}

function pageSizeForAspect(w: number, h: number): [number, number] {
  return w >= h ? A4_L : A4_P;
}

function contain(
  srcW: number,
  srcH: number,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
): { x: number; y: number; width: number; height: number } {
  if (srcW <= 0 || srcH <= 0) {
    return { x: boxX, y: boxY, width: boxW, height: boxH };
  }
  const scale = Math.min(boxW / srcW, boxH / srcH);
  const width = srcW * scale;
  const height = srcH * scale;
  return {
    x: boxX + (boxW - width) / 2,
    y: boxY + (boxH - height) / 2,
    width,
    height,
  };
}

function hasAnyDoc(a: AspiranteDocumentosAcademicosSource): boolean {
  return Boolean(a.fotoTituloKey || a.fotoTituloAutenticacionKey || a.fotoNotasKey);
}

async function loadOptionalObject(key: string | null): Promise<Buffer | null> {
  if (!key) return null;
  try {
    const { body } = await getObjectBuffer(key);
    return body;
  } catch {
    return null;
  }
}

async function toJpegBytes(buffer: Buffer): Promise<Uint8Array> {
  const jpeg = await sharp(buffer)
    .rotate()
    .resize({ width: 2200, height: 2200, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();
  return new Uint8Array(jpeg);
}

async function loadImageDoc(key: string | null): Promise<LoadedDoc> {
  const body = await loadOptionalObject(key);
  if (!body) return { kind: key ? "unreadable" : "missing" };
  try {
    return { kind: "image", bytes: await toJpegBytes(body) };
  } catch {
    return { kind: "unreadable" };
  }
}

async function loadNotasDoc(key: string | null): Promise<LoadedDoc> {
  const body = await loadOptionalObject(key);
  if (!body) return { kind: key ? "unreadable" : "missing" };
  if (isPdfObjectKey(key)) {
    return { kind: "pdf", bytes: new Uint8Array(body) };
  }
  try {
    return { kind: "image", bytes: await toJpegBytes(body) };
  } catch {
    return { kind: "unreadable" };
  }
}

function statusLabel(d: LoadedDoc): { text: string; ok: boolean } {
  if (d.kind === "image" || d.kind === "pdf") return { text: "Incluido", ok: true };
  if (d.kind === "unreadable") return { text: "No se pudo leer", ok: false };
  return { text: "No cargado", ok: false };
}

function drawHeaderBar(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  opts: {
    nombre: string;
    cedula: string;
    docLabel: string;
    pageLabel: string;
  },
) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - HEADER_H, width, height: HEADER_H, color: GREEN });
  page.drawText(ellipsize(fontBold, opts.nombre.toUpperCase(), 11, width * 0.42), {
    x: MARGIN,
    y: height - 20,
    size: 11,
    font: fontBold,
    color: WHITE,
  });
  page.drawText(pdfSafe(font, formatCedulaVe(opts.cedula)), {
    x: MARGIN,
    y: height - 36,
    size: 9,
    font,
    color: WHITE,
  });
  const docW = fontBold.widthOfTextAtSize(pdfSafe(fontBold, opts.docLabel), 11);
  page.drawText(pdfSafe(fontBold, opts.docLabel), {
    x: (width - docW) / 2,
    y: height - 22,
    size: 11,
    font: fontBold,
    color: WHITE,
  });
  const right = pdfSafe(font, opts.pageLabel);
  page.drawText(right, {
    x: width - MARGIN - font.widthOfTextAtSize(right, 9),
    y: height - 22,
    size: 9,
    font,
    color: WHITE,
  });
}

function drawFooter(
  page: PDFPage,
  font: PDFFont,
  meta: DocumentosAcademicosBulkMeta,
  globalPage: number,
  globalPages: number,
) {
  const { width } = page.getSize();
  const fecha = meta.generatedAt.toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" });
  const left = pdfSafe(font, meta.convocatoriaNombre);
  const right = pdfSafe(font, `${fecha}  ·  ${globalPage} / ${globalPages}`);
  page.drawRectangle({ x: 0, y: 0, width, height: FOOTER_H, color: GREEN_SOFT });
  page.drawText(ellipsize(font, left, 8, width * 0.62), {
    x: MARGIN,
    y: 8,
    size: 8,
    font,
    color: BLACK,
  });
  page.drawText(right, {
    x: width - MARGIN - font.widthOfTextAtSize(right, 8),
    y: 8,
    size: 8,
    font,
    color: BLACK,
  });
}

async function drawImagePage(
  out: PDFDocument,
  font: PDFFont,
  fontBold: PDFFont,
  jpeg: Uint8Array,
  identity: { nombre: string; cedula: string; docLabel: string; pageLabel: string },
): Promise<PDFPage> {
  const image = await out.embedJpg(jpeg);
  const [pw, ph] = pageSizeForAspect(image.width, image.height);
  const page = out.addPage([pw, ph]);
  drawHeaderBar(page, font, fontBold, identity);
  const boxX = MARGIN;
  const boxY = FOOTER_H + 10;
  const boxW = pw - MARGIN * 2;
  const boxH = ph - HEADER_H - FOOTER_H - 18;
  const fitted = contain(image.width, image.height, boxX, boxY, boxW, boxH);
  page.drawImage(image, fitted);
  return page;
}

async function drawEmbeddedPdfPages(
  out: PDFDocument,
  font: PDFFont,
  fontBold: PDFFont,
  srcBytes: Uint8Array,
  identity: { nombre: string; cedula: string; docLabel: string },
): Promise<PDFPage[]> {
  const src = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
  const embedded = await out.embedPages(src.getPages());
  const pages: PDFPage[] = [];
  const total = embedded.length || 1;
  if (embedded.length === 0) {
    pages.push(drawPlaceholderPage(out, font, fontBold, identity, "El PDF de notas no tiene páginas."));
    return pages;
  }
  for (let i = 0; i < embedded.length; i++) {
    const srcPage = embedded[i]!;
    pages.push(drawEmbeddedPage(out, font, fontBold, srcPage, {
      ...identity,
      pageLabel: `Notas ${i + 1}/${total}`,
    }));
  }
  return pages;
}

function drawEmbeddedPage(
  out: PDFDocument,
  font: PDFFont,
  fontBold: PDFFont,
  srcPage: PDFEmbeddedPage,
  identity: { nombre: string; cedula: string; docLabel: string; pageLabel: string },
): PDFPage {
  const [pw, ph] = pageSizeForAspect(srcPage.width, srcPage.height);
  const page = out.addPage([pw, ph]);
  drawHeaderBar(page, font, fontBold, identity);
  const boxX = MARGIN;
  const boxY = FOOTER_H + 10;
  const boxW = pw - MARGIN * 2;
  const boxH = ph - HEADER_H - FOOTER_H - 18;
  const fitted = contain(srcPage.width, srcPage.height, boxX, boxY, boxW, boxH);
  page.drawPage(srcPage, fitted);
  return page;
}

function drawPlaceholderPage(
  out: PDFDocument,
  font: PDFFont,
  fontBold: PDFFont,
  identity: { nombre: string; cedula: string; docLabel: string },
  message: string,
): PDFPage {
  const page = out.addPage(A4_P);
  drawHeaderBar(page, font, fontBold, { ...identity, pageLabel: "—" });
  const { width, height } = page.getSize();
  const msg = pdfSafe(font, message);
  page.drawText(msg, {
    x: (width - font.widthOfTextAtSize(msg, 12)) / 2,
    y: height / 2,
    size: 12,
    font,
    color: GRAY,
  });
  return page;
}

function drawDividerPage(
  out: PDFDocument,
  font: PDFFont,
  fontBold: PDFFont,
  logo: Awaited<ReturnType<PDFDocument["embedPng"]>> | null,
  a: LoadedAspirante,
  index: number,
  total: number,
): PDFPage {
  const page = out.addPage(A4_P);
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - 96, width, height: 96, color: GREEN });
  if (logo) {
    const dim = logo.scaleToFit(52, 52);
    page.drawImage(logo, { x: MARGIN, y: height - 76, width: dim.width, height: dim.height });
  }
  page.drawText(pdfSafe(fontBold, "EXPEDIENTE ACADEMICO"), {
    x: logo ? MARGIN + 64 : MARGIN,
    y: height - 38,
    size: 16,
    font: fontBold,
    color: WHITE,
  });
  page.drawText(pdfSafe(font, `Aspirante ${index} de ${total}`), {
    x: logo ? MARGIN + 64 : MARGIN,
    y: height - 58,
    size: 11,
    font,
    color: WHITE,
  });

  const nombre = pdfSafe(fontBold, nombreCompleto(a).toUpperCase());
  let nameSize = 22;
  while (nameSize > 12 && fontBold.widthOfTextAtSize(nombre, nameSize) > width - MARGIN * 2) {
    nameSize -= 1;
  }
  page.drawText(nombre, {
    x: MARGIN,
    y: height - 150,
    size: nameSize,
    font: fontBold,
    color: BLACK,
  });
  page.drawText(pdfSafe(fontBold, formatCedulaVe(a.cedula)), {
    x: MARGIN,
    y: height - 176,
    size: 14,
    font: fontBold,
    color: GREEN,
  });

  const lines = [
    ["Titulo universitario", a.tituloUniversidad?.trim() || "-"],
    ["Unidad postulante", a.unidadPostulante.trim() || "-"],
  ];
  let y = height - 220;
  for (const [label, value] of lines) {
    page.drawText(pdfSafe(font, label), { x: MARGIN, y, size: 9, font, color: GRAY });
    page.drawText(ellipsize(fontBold, value, 12, width - MARGIN * 2), {
      x: MARGIN,
      y: y - 16,
      size: 12,
      font: fontBold,
      color: BLACK,
    });
    y -= 44;
  }

  page.drawText(pdfSafe(fontBold, "Documentos en este expediente"), {
    x: MARGIN,
    y: y - 8,
    size: 11,
    font: fontBold,
    color: BLACK,
  });

  const checks: { label: string; doc: LoadedDoc }[] = [
    { label: "Titulo (fondo negro)", doc: a.titulo },
    { label: "Autenticacion / certificado del fondo negro", doc: a.tituloAuth },
    { label: "Notas certificadas", doc: a.notas },
  ];
  y -= 36;
  for (const row of checks) {
    const st = statusLabel(row.doc);
    page.drawRectangle({
      x: MARGIN,
      y: y - 8,
      width: width - MARGIN * 2,
      height: 28,
      color: st.ok ? rgb(0.93, 0.97, 0.93) : rgb(0.98, 0.93, 0.93),
    });
    page.drawText(pdfSafe(font, row.label), {
      x: MARGIN + 10,
      y: y + 2,
      size: 11,
      font,
      color: BLACK,
    });
    const stText = pdfSafe(fontBold, st.text);
    page.drawText(stText, {
      x: width - MARGIN - 12 - fontBold.widthOfTextAtSize(stText, 11),
      y: y + 2,
      size: 11,
      font: fontBold,
      color: st.ok ? GREEN : RED_MISS,
    });
    y -= 34;
  }

  return page;
}

function drawCoverPages(
  out: PDFDocument,
  font: PDFFont,
  fontBold: PDFFont,
  logo: Awaited<ReturnType<PDFDocument["embedPng"]>> | null,
  items: AspiranteDocumentosAcademicosSource[],
  meta: DocumentosAcademicosBulkMeta,
): PDFPage[] {
  const pages: PDFPage[] = [];
  const headerRows = 1;
  const rowH = 16;
  const pageH = A4_P[1];
  const tableTopFirst = pageH - COVER_BANNER_H - 92;
  const tableTopNext = pageH - COVER_BANNER_H - 28;
  const usableFirst = tableTopFirst - (FOOTER_H + 36);
  const usableNext = tableTopNext - (FOOTER_H + 36);
  const rowsFirst = Math.max(8, Math.floor(usableFirst / rowH) - headerRows);
  const rowsNext = Math.max(12, Math.floor(usableNext / rowH) - headerRows);

  const chunks: AspiranteDocumentosAcademicosSource[][] = [];
  let remaining = items.slice();
  if (remaining.length) {
    chunks.push(remaining.slice(0, rowsFirst));
    remaining = remaining.slice(rowsFirst);
    while (remaining.length) {
      chunks.push(remaining.slice(0, rowsNext));
      remaining = remaining.slice(rowsNext);
    }
  } else {
    chunks.push([]);
  }

  const fecha = meta.generatedAt.toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" });

  chunks.forEach((chunk, chunkIndex) => {
    const page = out.addPage(A4_P);
    pages.push(page);
    const { width, height } = page.getSize();
    page.drawRectangle({
      x: 0,
      y: height - COVER_BANNER_H,
      width,
      height: COVER_BANNER_H,
      color: GREEN,
    });
    if (logo && chunkIndex === 0) {
      const dim = logo.scaleToFit(64, 64);
      page.drawImage(logo, { x: MARGIN, y: height - 88, width: dim.width, height: dim.height });
    }
    const titleX = logo && chunkIndex === 0 ? MARGIN + 78 : MARGIN;
    page.drawText(pdfSafe(fontBold, "DOCUMENTOS ACADEMICOS"), {
      x: titleX,
      y: height - 42,
      size: 18,
      font: fontBold,
      color: WHITE,
    });
    page.drawText(
      ellipsize(font, `${meta.convocatoriaCodigo} · ${meta.convocatoriaNombre}`, 11, width - titleX - MARGIN),
      {
        x: titleX,
        y: height - 62,
        size: 11,
        font,
        color: WHITE,
      },
    );
    page.drawText(
      pdfSafe(font, `Fondo negro, autenticacion y notas certificadas · ${fecha}`),
      {
        x: titleX,
        y: height - 80,
        size: 9,
        font,
        color: WHITE,
      },
    );

    if (chunkIndex === 0) {
      const conDocs = items.filter(hasAnyDoc).length;
      const sinDocs = items.length - conDocs;
      page.drawText(
        pdfSafe(
          font,
          `${items.length} aspirante(s) en el listado · ${conDocs} con documento · ${sinDocs} sin documento academico.`,
        ),
        {
          x: MARGIN,
          y: height - 140,
          size: 11,
          font,
          color: BLACK,
        },
      );
      page.drawText(
        pdfSafe(
          font,
          "El listado incluye a todos. Solo hay expediente (imagenes) cuando hay al menos un documento.",
        ),
        {
          x: MARGIN,
          y: height - 158,
          size: 10,
          font,
          color: GRAY,
        },
      );
    }

    const col = {
      n: MARGIN,
      nombre: MARGIN + 28,
      ci: MARGIN + 268,
      fn: MARGIN + 360,
      au: MARGIN + 430,
      no: MARGIN + 500,
    };
    const tableTop = chunkIndex === 0 ? tableTopFirst : tableTopNext;
    const tableWidth = width - MARGIN * 2 + 8;
    const tableBodyBottom = FOOTER_H + 16;
    page.drawRectangle({
      x: MARGIN - 4,
      y: tableBodyBottom,
      width: tableWidth,
      height: tableTop - 4 - tableBodyBottom,
      color: WHITE,
    });
    page.drawRectangle({ x: MARGIN - 4, y: tableTop - 4, width: tableWidth, height: 18, color: GREEN });
    const headers: [number, string][] = [
      [col.n, "N"],
      [col.nombre, "Apellidos y nombres"],
      [col.ci, "Cedula"],
      [col.fn, "Fondo"],
      [col.au, "Auth."],
      [col.no, "Notas"],
    ];
    for (const [x, label] of headers) {
      page.drawText(pdfSafe(fontBold, label), { x, y: tableTop + 2, size: 8, font: fontBold, color: WHITE });
    }

    const startN = chunks.slice(0, chunkIndex).reduce((acc, c) => acc + c.length, 0);
    chunk.forEach((a, i) => {
      const y = tableTop - 18 - i * rowH;
      const missingAll = !hasAnyDoc(a);
      page.drawRectangle({
        x: MARGIN - 4,
        y: y - 4,
        width: tableWidth,
        height: rowH,
        color: missingAll
          ? rgb(0.98, 0.93, 0.93)
          : i % 2 === 0
            ? rgb(0.96, 0.97, 0.95)
            : WHITE,
      });
      const nameColor = missingAll ? RED_MISS : BLACK;
      page.drawText(String(startN + i + 1), { x: col.n, y, size: 8, font, color: nameColor });
      page.drawText(ellipsize(font, nombreCompleto(a), 8, 230), {
        x: col.nombre,
        y,
        size: 8,
        font,
        color: nameColor,
      });
      page.drawText(ellipsize(font, formatCedulaVe(a.cedula), 8, 86), {
        x: col.ci,
        y,
        size: 8,
        font,
        color: nameColor,
      });
      const drawMark = (key: string | null, x: number) => {
        const ok = Boolean(key);
        page.drawText(ok ? "Si" : "No", {
          x,
          y,
          size: 8,
          font: ok ? font : fontBold,
          color: ok ? BLACK : RED_MISS,
        });
      };
      drawMark(a.fotoTituloKey, col.fn);
      drawMark(a.fotoTituloAutenticacionKey, col.au);
      drawMark(a.fotoNotasKey, col.no);
    });
  });

  return pages;
}

async function appendDocument(
  out: PDFDocument,
  font: PDFFont,
  fontBold: PDFFont,
  a: LoadedAspirante,
  doc: LoadedDoc,
  docLabel: string,
  pages: PDFPage[],
) {
  const identity = { nombre: nombreCompleto(a), cedula: a.cedula, docLabel };
  if (doc.kind === "missing") return;
  if (doc.kind === "unreadable") {
    pages.push(drawPlaceholderPage(out, font, fontBold, identity, `No se pudo leer: ${docLabel}.`));
    return;
  }
  if (doc.kind === "image") {
    pages.push(
      await drawImagePage(out, font, fontBold, doc.bytes, {
        ...identity,
        pageLabel: `${docLabel} 1/1`,
      }),
    );
    return;
  }
  try {
    const added = await drawEmbeddedPdfPages(out, font, fontBold, doc.bytes, identity);
    pages.push(...added);
  } catch {
    pages.push(drawPlaceholderPage(out, font, fontBold, identity, `No se pudo leer el PDF de ${docLabel}.`));
  }
}

/**
 * Un PDF masivo: portada-índice + expediente por aspirante (fondo negro, autenticación, notas).
 * No es un ZIP: cada hoja lleva nombre y cédula.
 */
export async function buildDocumentosAcademicosBulkPdf(
  sources: AspiranteDocumentosAcademicosSource[],
  meta: DocumentosAcademicosBulkMeta,
): Promise<Uint8Array> {
  if (!sources.length) {
    throw new Error("NONE");
  }
  const withDocs = sources.filter(hasAnyDoc);

  const out = await PDFDocument.create();
  out.setTitle(`Documentos academicos - ${meta.convocatoriaNombre}`);
  out.setSubject("Fondo negro, autenticacion del titulo y notas certificadas");
  out.setCreator("Censo de aspirantes");
  out.setCreationDate(meta.generatedAt);

  const font = await out.embedFont(StandardFonts.Helvetica);
  const fontBold = await out.embedFont(StandardFonts.HelveticaBold);

  let logo = null as Awaited<ReturnType<PDFDocument["embedPng"]>> | null;
  const logoBuf = readInstitutionLogoPngBuffer();
  if (logoBuf) {
    try {
      logo = await out.embedPng(new Uint8Array(logoBuf));
    } catch {
      logo = null;
    }
  }

  const allPages: PDFPage[] = [];
  allPages.push(...drawCoverPages(out, font, fontBold, logo, sources, meta));

  for (let i = 0; i < withDocs.length; i++) {
    const src = withDocs[i]!;
    const a: LoadedAspirante = {
      nombres: src.nombres,
      apellidos: src.apellidos,
      cedula: src.cedula,
      tituloUniversidad: src.tituloUniversidad,
      unidadPostulante: src.unidadPostulante,
      titulo: await loadImageDoc(src.fotoTituloKey),
      tituloAuth: await loadImageDoc(src.fotoTituloAutenticacionKey),
      notas: await loadNotasDoc(src.fotoNotasKey),
    };
    allPages.push(drawDividerPage(out, font, fontBold, logo, a, i + 1, withDocs.length));
    await appendDocument(out, font, fontBold, a, a.titulo, "Titulo (fondo negro)", allPages);
    await appendDocument(out, font, fontBold, a, a.tituloAuth, "Autenticacion", allPages);
    await appendDocument(out, font, fontBold, a, a.notas, "Notas certificadas", allPages);
  }

  const total = allPages.length;
  allPages.forEach((page, idx) => {
    drawFooter(page, font, meta, idx + 1, total);
  });

  return out.save({ useObjectStreams: true });
}
