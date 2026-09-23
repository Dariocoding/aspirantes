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
  BOLETA_RECOMENDACION,
  formatVenceBoleta,
  type BoletaPermisoCard,
  type BoletaPermisoConvocatoriaInfo,
} from "@src/lib/pdf/boleta-permiso";

const INK = "000000";
const BLUE = "1F4E79";
const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE };
const splitBorders = { ...noBorders, right: { style: BorderStyle.SINGLE, size: 12, color: BLUE, space: 0 } };

/** Carta 8.5×11 in, márgenes 2,54 cm. Dos boletas por hoja. */
const TWIP_IN = 1440;
const PAGE_W = Math.round(8.5 * TWIP_IN);
const PAGE_H = Math.round(11 * TWIP_IN);
const MARGIN = TWIP_IN;
const GAP = 200;
const CARD_W = PAGE_W - MARGIN * 2;
const CARD_H = Math.floor((PAGE_H - MARGIN * 2 - GAP) / 2);
const LEFT_W = 5000;
const RIGHT_W = CARD_W - LEFT_W;

const H_HEADER = 1320;
const H_ID = 2100;
const H_MID = 1760;
const H_FOOT = CARD_H - H_HEADER - H_ID - H_MID;

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
    spacing: { before: opts.before ?? 0, after: opts.after ?? 20, line: opts.line ?? 230 },
    children,
  });
}

function run(text: string, size = 15, bold = false) {
  return new TextRun({ text, font: "Arial", size, bold, color: INK });
}

function cell(
  children: Array<Paragraph | Table>,
  opts: {
    width: number;
    fill?: string;
    borders?: CellBorders;
    align?: "top" | "center" | "bottom";
    margins?: { top: number; bottom: number; left: number; right: number };
  },
) {
  return new TableCell({
    width: { size: opts.width, type: WidthType.DXA },
    verticalAlign: opts.align ?? "top",
    shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill } : undefined,
    borders: opts.borders ?? noBorders,
    margins: opts.margins ?? { top: 60, bottom: 40, left: 80, right: 70 },
    children: children.length ? children : [p([run(" ")])],
  });
}

function row(height: number, children: TableCell[]) {
  return new TableRow({
    height: { value: height, rule: HeightRule.EXACT },
    children,
  });
}

function imagePara(data: Buffer, type: "png" | "jpg", width: number, height: number) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 0, before: 0 },
    children: [new ImageRun({ type, data, transformation: { width, height } })],
  });
}

function headerCell(
  convocatoria: BoletaPermisoConvocatoriaInfo,
  logoCefoa: Buffer | null,
  logoEjercito: Buffer | null,
) {
  const logoW = 700;
  const textW = LEFT_W - logoW * 2;
  return cell(
    [
      new Table({
        width: { size: LEFT_W - 160, type: WidthType.DXA },
        layout: TableLayoutType.FIXED,
        columnWidths: [logoW, textW, logoW],
        rows: [
          new TableRow({
            children: [
              cell(logoCefoa ? [imagePara(logoCefoa, "png", 40, 48)] : [p([run(" ")])], {
                width: logoW,
                align: "center",
                margins: { top: 20, bottom: 20, left: 10, right: 10 },
              }),
              cell(
                convocatoria.headerLines.map((line) =>
                  p([run(line, 12, true)], { align: AlignmentType.CENTER, after: 8, line: 200 }),
                ),
                { width: textW, align: "center", margins: { top: 20, bottom: 20, left: 20, right: 20 } },
              ),
              cell(logoEjercito ? [imagePara(logoEjercito, "png", 40, 48)] : [p([run(" ")])], {
                width: logoW,
                align: "center",
                margins: { top: 20, bottom: 20, left: 10, right: 10 },
              }),
            ],
          }),
        ],
      }),
    ],
    { width: LEFT_W, borders: splitBorders, align: "center" },
  );
}

function serialCell(card: BoletaPermisoCard) {
  const serialW = 1300;
  const ejbW = 800;
  const titleW = RIGHT_W - serialW - ejbW - 160;
  return cell(
    [
      new Table({
        width: { size: RIGHT_W - 160, type: WidthType.DXA },
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
                { width: serialW, margins: { top: 20, bottom: 20, left: 20, right: 20 } },
              ),
              cell([p([run("ASPIRANTE A OFICIAL", 16, true)], { align: AlignmentType.CENTER })], {
                width: titleW,
                align: "center",
              }),
              cell([p([run("EJB", 16, true)], { align: AlignmentType.CENTER })], {
                width: ejbW,
                align: "center",
              }),
            ],
          }),
        ],
      }),
    ],
    { width: RIGHT_W, align: "center" },
  );
}

function identityCell(card: BoletaPermisoCard) {
  const photoW = 1500;
  const identW = LEFT_W - photoW - 180;
  return cell(
    [
      new Table({
        width: { size: LEFT_W - 160, type: WidthType.DXA },
        layout: TableLayoutType.FIXED,
        columnWidths: [photoW, identW],
        rows: [
          new TableRow({
            children: [
              cell(
                [
                  card.foto
                    ? imagePara(card.foto.data, card.foto.format === "png" ? "png" : "jpg", 68, 88)
                    : p([run("FOTO", 18, true)], { align: AlignmentType.CENTER }),
                ],
                {
                  width: photoW,
                  borders: box(INK, 10),
                  align: "center",
                  margins: { top: 40, bottom: 40, left: 40, right: 40 },
                },
              ),
              cell(
                [
                  p([run("ASPIRANTE A OFICIAL", 15, true)], { after: 30 }),
                  p([run("NOMBRES:", 13, true)], { after: 8 }),
                  p([run(card.nombres.toLocaleUpperCase("es"), 15, true)], { after: 30 }),
                  p([run("APELLIDOS:", 13, true)], { after: 8 }),
                  p([run(card.apellidos.toLocaleUpperCase("es"), 15, true)], { after: 30 }),
                  p([run("C.I.V:  ", 13, true), run(card.cedula, 15, true)]),
                ],
                { width: identW, align: "center", margins: { top: 20, bottom: 20, left: 80, right: 20 } },
              ),
            ],
          }),
        ],
      }),
    ],
    { width: LEFT_W, borders: splitBorders, align: "center" },
  );
}

function traitsCell(card: BoletaPermisoCard) {
  const huellaW = 1400;
  const traitsW = RIGHT_W - huellaW - 200;
  const labelW = 1750;
  const valueW = traitsW - labelW;
  const trait = (label: string, value: string) =>
    new TableRow({
      children: [
        cell([p([run(label, 13, true)])], {
          width: labelW,
          margins: { top: 50, bottom: 50, left: 40, right: 20 },
        }),
        cell([p([run(value, 13, false)])], {
          width: valueW,
          margins: { top: 50, bottom: 50, left: 20, right: 20 },
        }),
      ],
    });

  return cell(
    [
      new Table({
        width: { size: RIGHT_W - 160, type: WidthType.DXA },
        layout: TableLayoutType.FIXED,
        columnWidths: [huellaW, traitsW],
        rows: [
          new TableRow({
            children: [
              cell(
                [
                  p([run(" ")], { after: 0 }),
                  p([run("Huella dactilar", 11, false)], { align: AlignmentType.CENTER, after: 0 }),
                ],
                {
                  width: huellaW,
                  borders: box(INK, 10),
                  align: "bottom",
                  margins: { top: 40, bottom: 40, left: 30, right: 30 },
                },
              ),
              cell(
                [
                  new Table({
                    width: { size: traitsW, type: WidthType.DXA },
                    layout: TableLayoutType.FIXED,
                    columnWidths: [labelW, valueW],
                    rows: [
                      trait("CABELLO:", card.cabello),
                      trait("GRUPO SANGUÍNEO:", card.grupoSanguineo),
                      trait("OJOS:", card.ojos),
                      trait("COLOR DE PIEL:", card.colorPiel),
                    ],
                  }),
                ],
                { width: traitsW, align: "center", margins: { top: 20, bottom: 20, left: 40, right: 10 } },
              ),
            ],
          }),
        ],
      }),
    ],
    { width: RIGHT_W, align: "center" },
  );
}

function addressCell(card: BoletaPermisoCard, convocatoria: BoletaPermisoConvocatoriaInfo) {
  return cell(
    [
      p([run(formatVenceBoleta(convocatoria.anio), 11, true)], { after: 40 }),
      p([run("DIRECCIÓN DOMICILIARIA:", 12, true)], { after: 8 }),
      p([run(card.direccion === "—" ? "" : card.direccion, 12, false)], { after: 40, line: 220 }),
      p([run("TELEFONO:", 12, true)], { after: 8 }),
      p([run(card.telefono === "—" ? "" : card.telefono, 12, false)], { after: 40 }),
      p([run("DIRECCIÓN DE EMERGENCIA:", 12, true)], { after: 8 }),
      p([run(card.emergenciaDireccion === "—" ? "" : card.emergenciaDireccion, 12, false)], { after: 40, line: 220 }),
      p([run("TELÉFONO DE EMERGENCIA:", 12, true)], { after: 8 }),
      p([run(card.emergenciaTelefono === "—" ? "" : card.emergenciaTelefono, 12, false)]),
    ],
    { width: LEFT_W, borders: splitBorders },
  );
}

function directorCell(convocatoria: BoletaPermisoConvocatoriaInfo) {
  const cargo = convocatoria.directorCargo;
  const at = cargo.indexOf("FORMACIÓN");
  const cargo1 = at >= 0 ? cargo.slice(0, at + "FORMACIÓN".length).trim() : cargo;
  const cargo2 = at >= 0 ? cargo.slice(at + "FORMACIÓN".length).trim() : "";
  return cell(
    [
      p([run(" ")], { after: 20 }),
      p([run("______________________________", 14, false)], { align: AlignmentType.CENTER, after: 16 }),
      p([run(convocatoria.directorNombre || " ", 13, true)], { align: AlignmentType.CENTER, after: 16 }),
      p([run(cargo1, 12, true)], { align: AlignmentType.CENTER, after: 0 }),
      cargo2
        ? p([run(cargo2, 12, true)], { align: AlignmentType.CENTER, after: 0 })
        : p([run(" ")]),
    ],
    { width: RIGHT_W, align: "center" },
  );
}

function recCell() {
  return cell(
    [p([run(BOLETA_RECOMENDACION, 12, false)], { align: AlignmentType.CENTER, line: 220 })],
    { width: LEFT_W, borders: splitBorders, align: "center" },
  );
}

function legalCell() {
  return cell(
    [
      p([run("EN CASO DE EMERGENCIA FAVOR INFORMAR A LOS TELÉFONOS.", 11, true)], {
        align: AlignmentType.CENTER,
        after: 12,
        line: 210,
      }),
      p([run("(0412) 396-8855, (0416) 642-7379, (0416) 232-3997", 11, true)], {
        align: AlignmentType.CENTER,
        after: 40,
      }),
      p([run(BOLETA_ARMAS, 12, false)], { align: AlignmentType.CENTER, line: 210 }),
    ],
    { width: RIGHT_W, align: "center" },
  );
}

function boletaCard(
  card: BoletaPermisoCard,
  convocatoria: BoletaPermisoConvocatoriaInfo,
  logoCefoa: Buffer | null,
  logoEjercito: Buffer | null,
) {
  const inner = new Table({
    width: { size: CARD_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [LEFT_W, RIGHT_W],
    rows: [
      row(H_HEADER, [headerCell(convocatoria, logoCefoa, logoEjercito), serialCell(card)]),
      row(H_ID, [identityCell(card), traitsCell(card)]),
      row(H_MID, [addressCell(card, convocatoria), directorCell(convocatoria)]),
      row(H_FOOT, [recCell(), legalCell()]),
    ],
  });

  return new Table({
    width: { size: CARD_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [CARD_W],
    rows: [
      new TableRow({
        height: { value: CARD_H, rule: HeightRule.EXACT },
        children: [
          cell([inner], {
            width: CARD_W,
            borders: box(BLUE, 16),
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
  return new Table({
    width: { size: CARD_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [CARD_W],
    rows: [
      new TableRow({
        height: { value: CARD_H, rule: HeightRule.EXACT },
        children: [
          cell([boletaCard(top, convocatoria, logoCefoa, logoEjercito)], {
            width: CARD_W,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
          }),
        ],
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
        height: { value: CARD_H, rule: HeightRule.EXACT },
        children: [
          cell(
            bottom
              ? [boletaCard(bottom, convocatoria, logoCefoa, logoEjercito)]
              : [p([run(" ")])],
            { width: CARD_W, margins: { top: 0, bottom: 0, left: 0, right: 0 } },
          ),
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
          run: { font: "Arial", size: 15 },
        },
      },
    },
    sections: pairs.map(([top, bottom]) => ({
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H },
          margin: { top: "2.54cm", right: "2.54cm", bottom: "2.54cm", left: "2.54cm" },
        },
      },
      children: [pageOfTwo(top, bottom, input.convocatoria, input.logoCefoa, input.logoEjercito)],
    })),
  });
  return Buffer.from(await Packer.toBuffer(doc));
}
