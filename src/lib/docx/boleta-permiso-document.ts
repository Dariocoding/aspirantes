import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import {
  BOLETA_ARMAS,
  BOLETA_EMERGENCIA_INSTITUCIONAL,
  BOLETA_RECOMENDACION,
  formatVenceBoleta,
  type BoletaPermisoCard,
  type BoletaPermisoConvocatoriaInfo,
} from "@src/lib/pdf/boleta-permiso";

const INK = "000000";
const BLUE = "1F4E79";
const FLAG_Y = "FFCC00";
const FLAG_B = "0033A0";
const FLAG_R = "CF142B";
const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE };

/** Carta 8.5×11 in, márgenes 2,54 cm en los cuatro lados. */
const TWIP_IN = 1440;
const PAGE_W = Math.round(8.5 * TWIP_IN);
const PAGE_H = Math.round(11 * TWIP_IN);
const MARGIN = TWIP_IN;
const GAP = 120;
const CARD_W = PAGE_W - MARGIN * 2;
const CARD_H = Math.floor((PAGE_H - MARGIN * 2 - GAP) / 2);
const FLAG_W = 150;
const BODY_W = CARD_W - FLAG_W;
const LEFT_W = 4780;
const RIGHT_W = BODY_W - LEFT_W;

type CellBorder = {
  style: (typeof BorderStyle)[keyof typeof BorderStyle];
  size: number;
  color: string;
  space?: number;
};
type CellBorders = { top: CellBorder; bottom: CellBorder; left: CellBorder; right: CellBorder };

function line(color: string, size: number): CellBorder {
  return { style: BorderStyle.SINGLE, size, color, space: 0 };
}

function box(color: string, size: number): CellBorders {
  const b = line(color, size);
  return { top: b, bottom: b, left: b, right: b };
}

function p(
  children: TextRun[],
  opts: {
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    before?: number;
    after?: number;
    line?: number;
  } = {},
) {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.LEFT,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 40, line: opts.line ?? 240 },
    children,
  });
}

function run(text: string, size = 16, bold = false) {
  return new TextRun({ text, font: "Arial", size, bold, color: INK });
}

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
    verticalAlign: opts.align ?? "top",
    shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill } : undefined,
    borders: opts.borders ?? noBorders,
    margins: opts.margins ?? { top: 40, bottom: 40, left: 60, right: 60 },
    children: children.length ? children : [p([run(" ")])],
  });
}

function imagePara(data: Buffer, type: "png" | "jpg", width: number, height: number) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 0, before: 0 },
    children: [new ImageRun({ type, data, transformation: { width, height } })],
  });
}

function headerBlock(
  convocatoria: BoletaPermisoConvocatoriaInfo,
  logoCefoa: Buffer | null,
  logoEjercito: Buffer | null,
) {
  const logoW = 720;
  const textW = LEFT_W - logoW * 2;
  return new Table({
    width: { size: LEFT_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [logoW, textW, logoW],
    rows: [
      new TableRow({
        children: [
          cell(logoCefoa ? [imagePara(logoCefoa, "png", 38, 46)] : [p([run(" ")])], {
            width: logoW,
            align: "center",
            margins: { top: 40, bottom: 40, left: 20, right: 20 },
          }),
          cell(
            convocatoria.headerLines.map((line) =>
              p([run(line, 13, true)], { align: AlignmentType.CENTER, after: 16, line: 200 }),
            ),
            { width: textW, align: "center" },
          ),
          cell(logoEjercito ? [imagePara(logoEjercito, "png", 38, 46)] : [p([run(" ")])], {
            width: logoW,
            align: "center",
            margins: { top: 40, bottom: 40, left: 20, right: 20 },
          }),
        ],
      }),
    ],
  });
}

function fieldBlock(label: string, value: string) {
  return [
    p([run(label, 14, true)], { after: 16, before: 80 }),
    p([run(value === "—" ? "" : value, 14, false)], { after: 24, line: 220 }),
  ];
}

function leftColumn(
  card: BoletaPermisoCard,
  convocatoria: BoletaPermisoConvocatoriaInfo,
  logoCefoa: Buffer | null,
  logoEjercito: Buffer | null,
) {
  const photoW = 1400;
  const identW = LEFT_W - photoW - 60;
  const identity = new Table({
    width: { size: LEFT_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [photoW, identW],
    rows: [
      new TableRow({
        children: [
          cell(
            [
              card.foto
                ? imagePara(card.foto.data, card.foto.format === "png" ? "png" : "jpg", 62, 80)
                : p([run("FOTO", 20, true)], { align: AlignmentType.CENTER }),
            ],
            {
              width: photoW,
              borders: box(INK, 12),
              align: "center",
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
            },
          ),
          cell(
            [
              p([run("ASPIRANTE A OFICIAL", 16, true)], { after: 40 }),
              p([run("NOMBRES:", 14, true)], { after: 12 }),
              p([run(card.nombres.toLocaleUpperCase("es"), 16, true)], { after: 40 }),
              p([run("APELLIDOS:", 14, true)], { after: 12 }),
              p([run(card.apellidos.toLocaleUpperCase("es"), 16, true)], { after: 40 }),
              p([run("C.I.V:  ", 14, true), run(card.cedula, 16, true)]),
            ],
            { width: identW, align: "center", margins: { top: 20, bottom: 20, left: 80, right: 20 } },
          ),
        ],
      }),
    ],
  });

  return cell(
    [
      headerBlock(convocatoria, logoCefoa, logoEjercito),
      identity,
      p([run(formatVenceBoleta(convocatoria.anio), 12, true)], { before: 40, after: 40 }),
      ...fieldBlock("DIRECCIÓN DOMICILIARIA:", card.direccion),
      ...fieldBlock("TELEFONO:", card.telefono),
      ...fieldBlock("DIRECCIÓN DE EMERGENCIA:", card.emergenciaDireccion),
      ...fieldBlock("TELÉFONO DE EMERGENCIA:", card.emergenciaTelefono),
      p([run(BOLETA_RECOMENDACION, 13, false)], { before: 80, align: AlignmentType.CENTER, line: 220 }),
    ],
    { width: LEFT_W, align: "top", margins: { top: 40, bottom: 40, left: 50, right: 50 } },
  );
}

function traitLine(label: string, value: string, labelW: number, valueW: number) {
  return new TableRow({
    children: [
      cell([p([run(label, 14, true)])], {
        width: labelW,
        margins: { top: 40, bottom: 40, left: 30, right: 30 },
      }),
      cell([p([run(value, 14, false)])], {
        width: valueW,
        margins: { top: 40, bottom: 40, left: 30, right: 30 },
      }),
    ],
  });
}

function rightColumn(card: BoletaPermisoCard, convocatoria: BoletaPermisoConvocatoriaInfo) {
  const serialW = 1100;
  const ejbW = 720;
  const titleW = RIGHT_W - serialW - ejbW;
  const huellaW = 1300;
  const traitsW = RIGHT_W - huellaW - 60;
  const traitLabelW = Math.min(1700, Math.floor(traitsW * 0.58));
  const traitValW = traitsW - traitLabelW;

  const titleBar = new Table({
    width: { size: RIGHT_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [serialW, titleW, ejbW],
    rows: [
      new TableRow({
        children: [
          cell(
            [
              p([run("Serial:", 13, true), run(card.serial, 16, true)]),
              p([run("CEFOA", 13, true)]),
            ],
            { width: serialW },
          ),
          cell([p([run("ASPIRANTE A OFICIAL", 16, true)], { align: AlignmentType.CENTER })], {
            width: titleW,
            align: "center",
          }),
          cell([p([run("EJB", 18, true)], { align: AlignmentType.CENTER })], {
            width: ejbW,
            align: "center",
          }),
        ],
      }),
    ],
  });

  const mid = new Table({
    width: { size: RIGHT_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [huellaW, traitsW],
    rows: [
      new TableRow({
        height: { value: 1680, rule: HeightRule.ATLEAST },
        children: [
          cell(
            [
              p([run(" ")], { after: 0 }),
              p([run("Huella dactilar", 12, false)], { align: AlignmentType.CENTER }),
            ],
            {
              width: huellaW,
              borders: box(INK, 12),
              align: "bottom",
              margins: { top: 80, bottom: 80, left: 40, right: 40 },
            },
          ),
          cell(
            [
              new Table({
                width: { size: traitsW, type: WidthType.DXA },
                layout: TableLayoutType.FIXED,
                columnWidths: [traitLabelW, traitValW],
                rows: [
                  traitLine("CABELLO:", card.cabello, traitLabelW, traitValW),
                  traitLine("GRUPO SANGUÍNEO:", card.grupoSanguineo, traitLabelW, traitValW),
                  traitLine("OJOS:", card.ojos, traitLabelW, traitValW),
                  traitLine("COLOR DE PIEL:", card.colorPiel, traitLabelW, traitValW),
                ],
              }),
            ],
            { width: traitsW, align: "center" },
          ),
        ],
      }),
    ],
  });

  const cargo = convocatoria.directorCargo;
  const cargoMid = cargo.indexOf("FORMACIÓN");
  const cargo1 = cargoMid >= 0 ? cargo.slice(0, cargoMid + "FORMACIÓN".length).trim() : cargo;
  const cargo2 = cargoMid >= 0 ? cargo.slice(cargoMid + "FORMACIÓN".length).trim() : "";

  return cell(
    [
      titleBar,
      mid,
      p([run(" ")], { before: 40 }),
      p([run("________________________________", 14, false)], { align: AlignmentType.CENTER, after: 20 }),
      p([run(convocatoria.directorNombre || " ", 14, true)], { align: AlignmentType.CENTER, after: 20 }),
      p([run(cargo1, 13, true)], { align: AlignmentType.CENTER, after: 0 }),
      cargo2 ? p([run(cargo2, 13, true)], { align: AlignmentType.CENTER, after: 40 }) : p([run(" ")]),
      p([run(BOLETA_EMERGENCIA_INSTITUCIONAL, 12, true)], {
        align: AlignmentType.CENTER,
        before: 80,
        line: 220,
      }),
      p([run(BOLETA_ARMAS, 13, false)], { align: AlignmentType.CENTER, before: 80, line: 220 }),
    ],
    {
      width: RIGHT_W,
      align: "top",
      borders: { ...noBorders, left: line(BLUE, 12) },
      margins: { top: 40, bottom: 40, left: 50, right: 50 },
    },
  );
}

function flagStripe() {
  return new Table({
    width: { size: FLAG_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [FLAG_W],
    rows: [
      new TableRow({
        height: { value: 2000, rule: HeightRule.EXACT },
        children: [cell([p([run(" ")])], { width: FLAG_W, fill: FLAG_Y, margins: { top: 0, bottom: 0, left: 0, right: 0 } })],
      }),
      new TableRow({
        height: { value: 2000, rule: HeightRule.EXACT },
        children: [cell([p([run(" ")])], { width: FLAG_W, fill: FLAG_B, margins: { top: 0, bottom: 0, left: 0, right: 0 } })],
      }),
      new TableRow({
        height: { value: 2000, rule: HeightRule.EXACT },
        children: [cell([p([run(" ")])], { width: FLAG_W, fill: FLAG_R, margins: { top: 0, bottom: 0, left: 0, right: 0 } })],
      }),
    ],
  });
}

function boletaPage(
  card: BoletaPermisoCard,
  convocatoria: BoletaPermisoConvocatoriaInfo,
  logoCefoa: Buffer | null,
  logoEjercito: Buffer | null,
) {
  const body = new Table({
    width: { size: BODY_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [LEFT_W, RIGHT_W],
    rows: [
      new TableRow({
        children: [
          leftColumn(card, convocatoria, logoCefoa, logoEjercito),
          rightColumn(card, convocatoria),
        ],
      }),
    ],
  });

  const inner = new Table({
    width: { size: CARD_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [FLAG_W, BODY_W],
    rows: [
      new TableRow({
        children: [
          cell([flagStripe()], {
            width: FLAG_W,
            align: "center",
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
          }),
          cell([body], { width: BODY_W, margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
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
        children: [
          cell([inner], {
            width: CARD_W,
            borders: box(BLUE, 18),
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
          }),
        ],
      }),
    ],
  });
}

function pageOfTwo(
  top: BoletaPermisoCard,
  bottom: BoletaPermisoCard | null,
  convocatoria: BoletaPermisoConvocatoriaInfo,
  logoCefoa: Buffer | null,
  logoEjercito: Buffer | null,
) {
  const topCell = cell([boletaPage(top, convocatoria, logoCefoa, logoEjercito)], {
    width: CARD_W,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  const bottomCell = cell(
    bottom
      ? [boletaPage(bottom, convocatoria, logoCefoa, logoEjercito)]
      : [p([run(" ")])],
    { width: CARD_W, margins: { top: 0, bottom: 0, left: 0, right: 0 } },
  );
  return new Table({
    width: { size: CARD_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [CARD_W],
    rows: [
      new TableRow({
        height: { value: CARD_H, rule: HeightRule.ATLEAST },
        children: [topCell],
      }),
      new TableRow({
        height: { value: GAP, rule: HeightRule.EXACT },
        children: [
          cell([p([run(" ")])], {
            width: CARD_W,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
          }),
        ],
      }),
      new TableRow({
        height: { value: CARD_H, rule: HeightRule.ATLEAST },
        children: [bottomCell],
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
  const cards = input.cards;
  if (!cards.length) {
    throw new Error("No hay personal para generar boletas.");
  }

  const pairs: Array<[BoletaPermisoCard, BoletaPermisoCard | null]> = [];
  for (let i = 0; i < cards.length; i += 2) {
    pairs.push([cards[i]!, cards[i + 1] ?? null]);
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 16 },
        },
      },
    },
    sections: pairs.map(([top, bottom]) => ({
      properties: {
        page: {
          size: {
            width: PAGE_W,
            height: PAGE_H,
          },
          margin: { top: "2.54cm", right: "2.54cm", bottom: "2.54cm", left: "2.54cm" },
        },
      },
      children: [pageOfTwo(top, bottom, input.convocatoria, input.logoCefoa, input.logoEjercito)],
    })),
  });
  return Buffer.from(await Packer.toBuffer(doc));
}
