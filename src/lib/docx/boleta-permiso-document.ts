import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  ImageRun,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import {
  formatVenceBoleta,
  type BoletaPermisoCard,
  type BoletaPermisoConvocatoriaInfo,
} from "@src/lib/pdf/boleta-permiso";

const OLIVE = "3A4A28";
const OLIVE_DEEP = "2A351C";
const GOLD = "C4A35A";
const GOLD_DEEP = "8C6D2E";
const CREAM = "F3EAD4";
const WHITE = "FFFDF6";
const PHOTO_BG = "D9CBA8";
const INK = "1C1A14";
const MUTED = "4A4538";
const WARN = "5C1C16";

const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE };

const CARD_W = 7020;
const INNER_W = 6780;

function border(color: string, size: number) {
  return { style: BorderStyle.SINGLE, size, color, space: 0 };
}

function boxBorders(color: string, size: number) {
  const b = border(color, size);
  return { top: b, bottom: b, left: b, right: b };
}

function p(
  text: string,
  opts: {
    size?: number;
    bold?: boolean;
    color?: string;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spaceAfter?: number;
    spaceBefore?: number;
  } = {},
) {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.CENTER,
    spacing: { after: opts.spaceAfter ?? 0, before: opts.spaceBefore ?? 0, line: 220 },
    children: [
      new TextRun({
        text,
        font: "Arial",
        size: opts.size ?? 14,
        bold: opts.bold ?? false,
        color: opts.color ?? INK,
      }),
    ],
  });
}

type CellBorder = {
  style: (typeof BorderStyle)[keyof typeof BorderStyle];
  size: number;
  color: string;
  space?: number;
};
type CellBorders = {
  top: CellBorder;
  bottom: CellBorder;
  left: CellBorder;
  right: CellBorder;
};

function cell(
  children: Array<Paragraph | Table>,
  opts: {
    width: number;
    fill?: string;
    borders?: CellBorders;
    align?: "top" | "center" | "bottom";
    span?: number;
    margins?: { top: number; bottom: number; left: number; right: number };
  },
) {
  return new TableCell({
    width: { size: opts.width, type: WidthType.DXA },
    columnSpan: opts.span,
    verticalAlign: opts.align ?? VerticalAlign.CENTER,
    shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill } : undefined,
    borders: opts.borders ?? noBorders,
    margins: opts.margins ?? { top: 40, bottom: 40, left: 50, right: 50 },
    children,
  });
}

function imagePara(data: Buffer, type: "png" | "jpg", width: number, height: number) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new ImageRun({
        type,
        data,
        transformation: { width, height },
      }),
    ],
  });
}

function headerTable(
  convocatoria: BoletaPermisoConvocatoriaInfo,
  logoCefoa: Buffer | null,
  logoEjercito: Buffer | null,
) {
  const logoW = 980;
  const textW = INNER_W - logoW * 2;
  return new Table({
    width: { size: INNER_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [logoW, textW, logoW],
    rows: [
      new TableRow({
        children: [
          cell(
            logoCefoa
              ? [imagePara(logoCefoa, "png", 42, 50)]
              : [p(" ", { size: 8 })],
            { width: logoW, fill: CREAM },
          ),
          cell(
            convocatoria.headerLines.map((line, i) =>
              p(line, {
                size: i === 0 || i === convocatoria.headerLines.length - 1 ? 12 : 11,
                bold: i === 0 || i === convocatoria.headerLines.length - 1,
                spaceAfter: 20,
              }),
            ),
            { width: textW, fill: CREAM },
          ),
          cell(
            logoEjercito
              ? [imagePara(logoEjercito, "png", 42, 50)]
              : [p(" ", { size: 8 })],
            { width: logoW, fill: CREAM },
          ),
        ],
      }),
    ],
  });
}

function traitCell(label: string, value: string, width: number) {
  return cell(
    [
      p(label, { size: 11, bold: true, color: OLIVE_DEEP, align: AlignmentType.LEFT }),
      p(value, { size: 16, color: INK, align: AlignmentType.LEFT, spaceBefore: 40 }),
    ],
    {
      width,
      fill: WHITE,
      borders: boxBorders(OLIVE, 6),
      margins: { top: 60, bottom: 60, left: 80, right: 80 },
    },
  );
}

function frenteCard(
  card: BoletaPermisoCard,
  convocatoria: BoletaPermisoConvocatoriaInfo,
  logoCefoa: Buffer | null,
  logoEjercito: Buffer | null,
) {
  const traitsW = 3800;
  const photoW = INNER_W - traitsW;
  const mid = new Table({
    width: { size: INNER_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [traitsW, photoW],
    rows: [
      new TableRow({
        children: [
          cell(
            [
              new Table({
                width: { size: traitsW - 80, type: WidthType.DXA },
                layout: TableLayoutType.FIXED,
                columnWidths: [traitsW - 80],
                rows: [
                  new TableRow({ children: [traitCell("CABELLO", card.cabello, traitsW - 80)] }),
                  new TableRow({ children: [traitCell("GRUPO SANGUÍNEO", card.grupoSanguineo, traitsW - 80)] }),
                  new TableRow({ children: [traitCell("OJOS", card.ojos, traitsW - 80)] }),
                  new TableRow({ children: [traitCell("COLOR DE PIEL", card.colorPiel, traitsW - 80)] }),
                ],
              }),
            ],
            { width: traitsW, fill: CREAM, align: VerticalAlign.TOP },
          ),
          cell(
            card.foto
              ? [imagePara(card.foto.data, card.foto.format === "png" ? "png" : "jpg", 96, 122)]
              : [p("FOTO", { size: 16, color: MUTED })],
            {
              width: photoW,
              fill: PHOTO_BG,
              borders: boxBorders(OLIVE, 8),
              align: VerticalAlign.CENTER,
            },
          ),
        ],
      }),
    ],
  });

  const foot = new Table({
    width: { size: INNER_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [2400, INNER_W - 2400],
    rows: [
      new TableRow({
        children: [
          cell([p("Huella", { size: 12, color: MUTED }), p("dactilar", { size: 12, color: MUTED })], {
            width: 2400,
            fill: WHITE,
            borders: boxBorders(OLIVE, 8),
            margins: { top: 200, bottom: 80, left: 60, right: 60 },
          }),
          cell([p(formatVenceBoleta(convocatoria.anio), { size: 18, bold: true, color: OLIVE_DEEP })], {
            width: INNER_W - 2400,
            fill: CREAM,
            align: VerticalAlign.BOTTOM,
          }),
        ],
      }),
    ],
  });

  return wrapCard([
    headerTable(convocatoria, logoCefoa, logoEjercito),
    new Table({
      width: { size: INNER_W, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      columnWidths: [INNER_W - 1200, 1200],
      rows: [
        new TableRow({
          children: [
            cell([p("ASPIRANTE A OFICIAL", { size: 18, bold: true, color: "FFFDF6" })], {
              width: INNER_W - 1200,
              fill: OLIVE,
            }),
            cell([p("EJB", { size: 18, bold: true, color: GOLD })], {
              width: 1200,
              fill: OLIVE_DEEP,
            }),
          ],
        }),
      ],
    }),
    p(`Serial:${card.serial} CEFOA`, { size: 16, bold: true, align: AlignmentType.LEFT, spaceBefore: 80, spaceAfter: 80 }),
    mid,
    p("A quien se recomienda se le preste las consideraciones de su grado", {
      size: 12,
      color: MUTED,
      spaceBefore: 80,
      spaceAfter: 80,
    }),
    p(card.nombres.toLocaleUpperCase("es"), { size: 22, bold: true, spaceBefore: 40 }),
    p(card.apellidos.toLocaleUpperCase("es"), { size: 18, bold: true }),
    p(`C.I.V ${card.cedula}`, { size: 16, spaceAfter: 120 }),
    foot,
  ]);
}

function backBox(label: string, value: string, minAfter = 80) {
  return [
    p(label, {
      size: 12,
      bold: true,
      color: OLIVE_DEEP,
      align: AlignmentType.LEFT,
      spaceBefore: 80,
      spaceAfter: 40,
    }),
    new Table({
      width: { size: INNER_W, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      columnWidths: [INNER_W],
      rows: [
        new TableRow({
          children: [
            cell([p(value, { size: 14, align: AlignmentType.LEFT, color: INK })], {
              width: INNER_W,
              fill: WHITE,
              borders: boxBorders(OLIVE, 6),
              margins: { top: minAfter, bottom: minAfter, left: 80, right: 80 },
            }),
          ],
        }),
      ],
    }),
  ];
}

function reversoCard(
  card: BoletaPermisoCard,
  convocatoria: BoletaPermisoConvocatoriaInfo,
  logoCefoa: Buffer | null,
  logoEjercito: Buffer | null,
) {
  return wrapCard([
    headerTable(convocatoria, logoCefoa, logoEjercito),
    ...backBox("DIRECCIÓN DOMICILIARIA", card.direccion, 120),
    ...backBox("TELÉFONO", card.telefono, 80),
    ...backBox(
      "DIRECCIÓN / TELÉFONO DE EMERGENCIA",
      [card.emergenciaDireccion, ...card.emergenciaTelefonos].filter(Boolean).join("  ·  "),
      120,
    ),
    p(convocatoria.directorNombre || " ", { size: 16, bold: true, spaceBefore: 200 }),
    p(convocatoria.directorCargo, { size: 13, color: MUTED, spaceAfter: 120 }),
    ...card.emergenciaTelefonos.map((t) => p(t, { size: 16, bold: true })),
    p("Este Aspirante a Oficial no está autorizado para portar armas de fuego", {
      size: 13,
      color: WARN,
      spaceBefore: 200,
    }),
  ]);
}

function wrapCard(children: Array<Paragraph | Table>) {
  const inner = new Table({
    width: { size: INNER_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [INNER_W],
    rows: [
      new TableRow({
        children: [
          cell(children, {
            width: INNER_W,
            fill: CREAM,
            borders: boxBorders(OLIVE, 10),
            align: VerticalAlign.TOP,
            margins: { top: 80, bottom: 80, left: 80, right: 80 },
          }),
        ],
      }),
    ],
  });
  return new Table({
    width: { size: CARD_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [CARD_W],
    rows: [
      new TableRow({
        height: { value: 10200, rule: HeightRule.ATLEAST },
        children: [
          cell([inner], {
            width: CARD_W,
            fill: CREAM,
            borders: boxBorders(GOLD, 24),
            align: VerticalAlign.TOP,
            margins: { top: 60, bottom: 60, left: 60, right: 60 },
          }),
        ],
      }),
    ],
  });
}

function personPage(
  card: BoletaPermisoCard,
  convocatoria: BoletaPermisoConvocatoriaInfo,
  logoCefoa: Buffer | null,
  logoEjercito: Buffer | null,
) {
  const gap = 360;
  const total = CARD_W * 2 + gap;
  return new Table({
    width: { size: total, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [CARD_W, gap, CARD_W],
    rows: [
      new TableRow({
        children: [
          cell([frenteCard(card, convocatoria, logoCefoa, logoEjercito)], {
            width: CARD_W,
            fill: "ECE7DC",
            align: VerticalAlign.TOP,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
          }),
          cell([p(" ")], { width: gap, fill: "ECE7DC" }),
          cell([reversoCard(card, convocatoria, logoCefoa, logoEjercito)], {
            width: CARD_W,
            fill: "ECE7DC",
            align: VerticalAlign.TOP,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
          }),
        ],
      }),
    ],
  });
}

export async function buildBoletasPermisoDocx(input: {
  convocatoria: BoletaPermisoConvocatoriaInfo;
  cards: BoletaPermisoCard[];
  logoCefoa: Buffer | null;
  logoEjercito: Buffer | null;
}): Promise<Buffer> {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 14 },
        },
      },
    },
    sections: input.cards.map((card) => ({
      properties: {
        page: {
          size: {
            orientation: PageOrientation.LANDSCAPE,
          },
          margin: { top: 360, right: 360, bottom: 360, left: 360 },
        },
      },
      children: [personPage(card, input.convocatoria, input.logoCefoa, input.logoEjercito)],
    })),
  });
  return Buffer.from(await Packer.toBuffer(doc));
}
