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
  VerticalAlign,
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
const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE };

const PAGE_W = 11906;
const MARGIN = 360;
const GAP = 120;
const CARD_W = Math.floor((PAGE_W - MARGIN * 2 - GAP) / 2);
const LEFT_W = 3180;
const RIGHT_W = CARD_W - 80 - LEFT_W;

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
  } = {},
) {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.LEFT,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 0, line: 200 },
    children,
  });
}

function run(text: string, size = 12, bold = false) {
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
    margins: opts.margins ?? { top: 20, bottom: 20, left: 40, right: 40 },
    children: children.length ? children : [p([run(" ")])],
  });
}

function imagePara(data: Buffer, type: "png" | "jpg", width: number, height: number) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new ImageRun({ type, data, transformation: { width, height } })],
  });
}

function labeled(label: string, value: string, size = 12) {
  return p([run(label, size, true), run(` ${value}`, size, false)]);
}

function headerBlock(
  convocatoria: BoletaPermisoConvocatoriaInfo,
  logoCefoa: Buffer | null,
  logoEjercito: Buffer | null,
  width: number,
) {
  const logoW = 620;
  const textW = width - logoW * 2;
  return new Table({
    width: { size: width, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [logoW, textW, logoW],
    rows: [
      new TableRow({
        children: [
          cell(logoCefoa ? [imagePara(logoCefoa, "png", 28, 34)] : [p([run(" ")])], {
            width: logoW,
            align: "center",
          }),
          cell(
            convocatoria.headerLines.map((line, i) =>
              p([run(line, i === 0 || i === convocatoria.headerLines.length - 1 ? 10 : 9, true)], {
                align: AlignmentType.CENTER,
              }),
            ),
            { width: textW, align: "center" },
          ),
          cell(logoEjercito ? [imagePara(logoEjercito, "png", 28, 34)] : [p([run(" ")])], {
            width: logoW,
            align: "center",
          }),
        ],
      }),
    ],
  });
}

function leftColumn(
  card: BoletaPermisoCard,
  convocatoria: BoletaPermisoConvocatoriaInfo,
  logoCefoa: Buffer | null,
  logoEjercito: Buffer | null,
) {
  const photoW = 1100;
  const identW = LEFT_W - photoW;
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
                ? imagePara(card.foto.data, card.foto.format === "png" ? "png" : "jpg", 52, 66)
                : p([run("FOTO", 14, true)], { align: AlignmentType.CENTER }),
              p([run(formatVenceBoleta(convocatoria.anio), 10, true)], { align: AlignmentType.CENTER, before: 40 }),
            ],
            {
              width: photoW,
              borders: box(INK, 8),
              align: "center",
              margins: { top: 60, bottom: 40, left: 40, right: 40 },
            },
          ),
          cell(
            [
              p([run("ASPIRANTE A OFICIAL", 12, true)]),
              labeled("NOMBRES:", card.nombres.toLocaleUpperCase("es"), 12),
              labeled("APELLIDOS:", card.apellidos.toLocaleUpperCase("es"), 12),
              labeled("C.I.V:", card.cedula, 12),
            ],
            { width: identW, align: "center" },
          ),
        ],
      }),
    ],
  });

  return cell(
    [
      headerBlock(convocatoria, logoCefoa, logoEjercito, LEFT_W),
      identity,
      labeled("DIRECCIÓN DOMICILIARIA:", card.direccion, 11),
      labeled("TELEFONO:", card.telefono, 11),
      labeled("DIRECCIÓN DE EMERGENCIA:", card.emergenciaDireccion, 11),
      labeled("TELÉFONO DE EMERGENCIA:", card.emergenciaTelefono, 11),
      p([run(BOLETA_RECOMENDACION, 11, false)], { before: 80, align: AlignmentType.CENTER }),
    ],
    { width: LEFT_W, align: "top", margins: { top: 40, bottom: 40, left: 50, right: 40 } },
  );
}

function rightColumn(card: BoletaPermisoCard, convocatoria: BoletaPermisoConvocatoriaInfo) {
  const serialW = 900;
  const titleW = RIGHT_W - serialW - 700;
  const ejbW = 700;
  const plusW = 520;
  const traitsW = RIGHT_W - plusW;
  const traitLabelW = Math.floor(traitsW * 0.62);
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
              p([run("Serial:", 10, true), run(card.serial, 12, true)]),
              p([run("CEFOA", 10, true)]),
            ],
            { width: serialW },
          ),
          cell([p([run("ASPIRANTE A OFICIAL", 12, true)], { align: AlignmentType.CENTER })], {
            width: titleW,
            align: "center",
          }),
          cell([p([run("EJB", 14, true)], { align: AlignmentType.CENTER })], {
            width: ejbW,
            align: "center",
          }),
        ],
      }),
    ],
  });

  const traitRow = (label: string, value: string) =>
    new TableRow({
      children: [
        cell([p([run(label, 11, true)])], {
          width: traitLabelW,
          borders: box(INK, 4),
          margins: { top: 30, bottom: 30, left: 50, right: 40 },
        }),
        cell([p([run(value, 11, false)])], {
          width: traitValW,
          borders: box(INK, 4),
          margins: { top: 30, bottom: 30, left: 50, right: 40 },
        }),
      ],
    });

  const traits = new Table({
    width: { size: RIGHT_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [plusW, traitsW],
    rows: [
      new TableRow({
        children: [
          cell([p([run("+", 28, true)], { align: AlignmentType.CENTER })], {
            width: plusW,
            borders: box(INK, 8),
            align: "center",
          }),
          cell(
            [
              new Table({
                width: { size: traitsW, type: WidthType.DXA },
                layout: TableLayoutType.FIXED,
                columnWidths: [traitLabelW, traitValW],
                rows: [
                  traitRow("CABELLO:", card.cabello),
                  traitRow("GRUPO SANGUÍNEO:", card.grupoSanguineo),
                  traitRow("OJOS:", card.ojos),
                  traitRow("COLOR DE PIEL:", card.colorPiel),
                ],
              }),
            ],
            { width: traitsW },
          ),
        ],
      }),
    ],
  });

  return cell(
    [
      titleBar,
      traits,
      cellNote("Huella dactilar", RIGHT_W),
      p([run(convocatoria.directorNombre || " ", 12, true)], { align: AlignmentType.CENTER, before: 80 }),
      p([run(convocatoria.directorCargo, 10, true)], { align: AlignmentType.CENTER, after: 60 }),
      p([run(BOLETA_EMERGENCIA_INSTITUCIONAL, 10, true)], { align: AlignmentType.CENTER, before: 40 }),
      p([run(BOLETA_ARMAS, 11, false)], { align: AlignmentType.CENTER, before: 80 }),
    ],
    { width: RIGHT_W, align: "top", margins: { top: 40, bottom: 40, left: 40, right: 50 } },
  );
}

function cellNote(text: string, width: number) {
  return new Table({
    width: { size: width, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [width],
    rows: [
      new TableRow({
        height: { value: 900, rule: HeightRule.ATLEAST },
        children: [
          cell([p([run(text, 10, false)], { align: AlignmentType.CENTER })], {
            width,
            borders: box(INK, 8),
            align: "bottom",
            margins: { top: 40, bottom: 40, left: 40, right: 40 },
          }),
        ],
      }),
    ],
  });
}

function boletaCard(
  card: BoletaPermisoCard,
  convocatoria: BoletaPermisoConvocatoriaInfo,
  logoCefoa: Buffer | null,
  logoEjercito: Buffer | null,
) {
  return new Table({
    width: { size: CARD_W, type: WidthType.DXA },
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
}

function wrapCard(inner: Table) {
  return new Table({
    width: { size: CARD_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [CARD_W],
    rows: [
      new TableRow({
        children: [
          cell([inner], {
            width: CARD_W,
            borders: box(BLUE, 16),
            margins: { top: 40, bottom: 40, left: 40, right: 40 },
          }),
        ],
      }),
    ],
  });
}

function emptyCard() {
  return cell([p([run(" ")])], { width: CARD_W });
}

function pageGrid(
  left: BoletaPermisoCard | null,
  right: BoletaPermisoCard | null,
  convocatoria: BoletaPermisoConvocatoriaInfo,
  logoCefoa: Buffer | null,
  logoEjercito: Buffer | null,
) {
  const make = (card: BoletaPermisoCard | null) =>
    card
      ? cell([wrapCard(boletaCard(card, convocatoria, logoCefoa, logoEjercito))], {
          width: CARD_W,
          margins: { top: 40, bottom: 40, left: 40, right: 40 },
        })
      : emptyCard();

  return new Table({
    width: { size: CARD_W * 2 + GAP, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [CARD_W, GAP, CARD_W],
    rows: [
      new TableRow({
        children: [make(left), cell([p([run(" ")])], { width: GAP }), make(right)],
      }),
      new TableRow({
        children: [make(left), cell([p([run(" ")])], { width: GAP }), make(right)],
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
  const pairs: Array<[BoletaPermisoCard | null, BoletaPermisoCard | null]> = [];
  for (let i = 0; i < input.cards.length; i += 2) {
    pairs.push([input.cards[i] ?? null, input.cards[i + 1] ?? null]);
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 12 },
        },
      },
    },
    sections: pairs.map(([left, right]) => ({
      properties: {
        page: {
          size: { width: PAGE_W, height: 16838 },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      children: [pageGrid(left, right, input.convocatoria, input.logoCefoa, input.logoEjercito)],
    })),
  });
  return Buffer.from(await Packer.toBuffer(doc));
}
