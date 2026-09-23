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
const split = { ...noBorders, right: { style: BorderStyle.SINGLE, size: 12, color: BLUE, space: 0 } };

/** Carta 8.5×11 in, márgenes 2,54 cm. Dos boletas por hoja. */
const TWIP_IN = 1440;
const PAGE_W = Math.round(8.5 * TWIP_IN);
const PAGE_H = Math.round(11 * TWIP_IN);
const MARGIN = TWIP_IN;
const GAP = 180;
const CARD_W = PAGE_W - MARGIN * 2;
const CARD_H = Math.floor((PAGE_H - MARGIN * 2 - GAP) / 2);
const LEFT_W = 5100;
const RIGHT_W = CARD_W - LEFT_W;
const H_FOOT = 980;
const H_BODY = CARD_H - H_FOOT;
const PAD = { top: 70, bottom: 50, left: 90, right: 80 } as const;

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
    borders?: CellBorders;
    align?: "top" | "center" | "bottom";
    margins?: { top: number; bottom: number; left: number; right: number };
    rowSpan?: number;
  },
) {
  return new TableCell({
    width: { size: opts.width, type: WidthType.DXA },
    verticalAlign: opts.align ?? "top",
    borders: opts.borders ?? noBorders,
    margins: opts.margins ?? { top: 40, bottom: 40, left: 40, right: 40 },
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

function tbl(width: number, cols: number[], rows: TableRow[]) {
  return new Table({
    width: { size: width, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: cols,
    rows,
  });
}

function leftBody(
  card: BoletaPermisoCard,
  convocatoria: BoletaPermisoConvocatoriaInfo,
  logoCefoa: Buffer | null,
  logoEjercito: Buffer | null,
) {
  const inner = LEFT_W - PAD.left - PAD.right;
  const logoW = 780;
  const textW = inner - logoW * 2;
  const photoW = 1680;
  const identW = inner - photoW;

  const header = tbl(inner, [logoW, textW, logoW], [
    new TableRow({
      children: [
        cell(logoCefoa ? [imagePara(logoCefoa, "png", 46, 56)] : [p([run(" ")])], {
          width: logoW,
          align: "center",
          margins: { top: 0, bottom: 0, left: 0, right: 10 },
        }),
        cell(
          convocatoria.headerLines.map((line) =>
            p([run(line, 13, true)], { align: AlignmentType.CENTER, after: 10, line: 200 }),
          ),
          { width: textW, align: "center", margins: { top: 0, bottom: 0, left: 20, right: 20 } },
        ),
        cell(logoEjercito ? [imagePara(logoEjercito, "png", 46, 56)] : [p([run(" ")])], {
          width: logoW,
          align: "center",
          margins: { top: 0, bottom: 0, left: 10, right: 0 },
        }),
      ],
    }),
  ]);

  const identity = tbl(inner, [photoW, identW], [
    new TableRow({
      children: [
        cell(
          [
            card.foto
              ? imagePara(card.foto.data, card.foto.format === "png" ? "png" : "jpg", 78, 100)
              : p([run("FOTO", 18, true)], { align: AlignmentType.CENTER }),
          ],
          {
            width: photoW,
            borders: box(INK, 10),
            align: "center",
            margins: { top: 50, bottom: 50, left: 50, right: 50 },
          },
        ),
        cell(
          [
            p([run("ASPIRANTE A OFICIAL", 16, true)], { after: 40 }),
            p([run("NOMBRES:", 14, true)], { after: 6 }),
            p([run(card.nombres.toLocaleUpperCase("es"), 16, true)], { after: 36 }),
            p([run("APELLIDOS:", 14, true)], { after: 6 }),
            p([run(card.apellidos.toLocaleUpperCase("es"), 16, true)], { after: 36 }),
            p([run("C.I.V:  ", 14, true), run(card.cedula, 16, true)]),
          ],
          { width: identW, align: "center", margins: { top: 10, bottom: 10, left: 90, right: 10 } },
        ),
      ],
    }),
  ]);

  const field = (label: string, value: string) => [
    p([run(label, 13, true)], { before: 70, after: 8 }),
    p([run(value === "—" ? "" : value, 13, false)], { after: 8, line: 220 }),
  ];

  return cell(
    [
      header,
      p([run(" ")], { after: 40 }),
      identity,
      p([run(formatVenceBoleta(convocatoria.anio), 11, true)], { before: 50, after: 20 }),
      ...field("DIRECCIÓN DOMICILIARIA:", card.direccion),
      ...field("TELEFONO:", card.telefono),
      ...field("DIRECCIÓN DE EMERGENCIA:", card.emergenciaDireccion),
      ...field("TELÉFONO DE EMERGENCIA:", card.emergenciaTelefono),
    ],
    { width: LEFT_W, borders: split, align: "top", margins: PAD },
  );
}

function rightBody(card: BoletaPermisoCard, convocatoria: BoletaPermisoConvocatoriaInfo) {
  const inner = RIGHT_W - PAD.left - PAD.right;
  const serialW = 1280;
  const ejbW = 820;
  const titleW = inner - serialW - ejbW;
  const huellaW = 1500;
  const traitsW = inner - huellaW - 80;
  const labelW = 1880;
  const valueW = traitsW - labelW;

  const titleBar = tbl(inner, [serialW, titleW, ejbW], [
    new TableRow({
      children: [
        cell(
          [
            p([run("Serial:", 12, true), run(card.serial, 15, true)], { after: 4 }),
            p([run("CEFOA", 12, true)], { after: 0 }),
          ],
          { width: serialW, margins: { top: 0, bottom: 0, left: 0, right: 10 } },
        ),
        cell([p([run("ASPIRANTE A OFICIAL", 16, true)], { align: AlignmentType.CENTER, after: 0 })], {
          width: titleW,
          align: "center",
          margins: { top: 20, bottom: 20, left: 10, right: 10 },
        }),
        cell([p([run("EJB", 16, true)], { align: AlignmentType.CENTER, after: 0 })], {
          width: ejbW,
          align: "center",
          margins: { top: 20, bottom: 20, left: 0, right: 0 },
        }),
      ],
    }),
  ]);

  const trait = (label: string, value: string) =>
    new TableRow({
      children: [
        cell([p([run(label, 13, true)], { after: 0 })], {
          width: labelW,
          margins: { top: 90, bottom: 90, left: 20, right: 20 },
        }),
        cell([p([run(value, 13, false)], { after: 0 })], {
          width: valueW,
          margins: { top: 90, bottom: 90, left: 10, right: 10 },
        }),
      ],
    });

  const huellaBox = tbl(huellaW, [huellaW], [
    new TableRow({
      height: { value: 2100, rule: HeightRule.EXACT },
      children: [
        cell([p([run(" ")], { after: 0 })], {
          width: huellaW,
          borders: box(INK, 10),
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        }),
      ],
    }),
  ]);

  const mid = tbl(inner, [huellaW, traitsW], [
    new TableRow({
      children: [
        cell(
          [
            huellaBox,
            p([run("Huella dactilar", 11, false)], { align: AlignmentType.CENTER, before: 20, after: 0 }),
          ],
          { width: huellaW, align: "top", margins: { top: 0, bottom: 0, left: 0, right: 40 } },
        ),
        cell(
          [
            tbl(traitsW, [labelW, valueW], [
              trait("CABELLO:", card.cabello),
              trait("GRUPO SANGUÍNEO:", card.grupoSanguineo),
              trait("OJOS:", card.ojos),
              trait("COLOR DE PIEL:", card.colorPiel),
            ]),
          ],
          { width: traitsW, align: "center", margins: { top: 0, bottom: 0, left: 20, right: 0 } },
        ),
      ],
    }),
  ]);

  return cell(
    [
      titleBar,
      p([run(" ")], { after: 80 }),
      mid,
      p([run(" ")], { before: 180, after: 0 }),
      p([run("______________________________", 14, false)], { align: AlignmentType.CENTER, after: 12 }),
      p([run(convocatoria.directorNombre || " ", 13, true)], { align: AlignmentType.CENTER, after: 10 }),
      p([run("DIRECTOR DEL CURSO ESPECIAL DE FORMACIÓN", 12, true)], {
        align: AlignmentType.CENTER,
        after: 4,
      }),
      p([run("DE OFICIALES EN LA CATEGORÍA DE ASIMILADOS", 12, true)], {
        align: AlignmentType.CENTER,
        after: 0,
      }),
    ],
    { width: RIGHT_W, align: "top", margins: PAD },
  );
}

function boletaCard(
  card: BoletaPermisoCard,
  convocatoria: BoletaPermisoConvocatoriaInfo,
  logoCefoa: Buffer | null,
  logoEjercito: Buffer | null,
) {
  const inner = tbl(CARD_W, [LEFT_W, RIGHT_W], [
    new TableRow({
      height: { value: H_BODY, rule: HeightRule.EXACT },
      children: [
        leftBody(card, convocatoria, logoCefoa, logoEjercito),
        rightBody(card, convocatoria),
      ],
    }),
    new TableRow({
      height: { value: H_FOOT, rule: HeightRule.EXACT },
      children: [
        cell(
          [p([run(BOLETA_RECOMENDACION, 12, false)], { align: AlignmentType.CENTER, line: 220 })],
          { width: LEFT_W, borders: split, align: "center", margins: PAD },
        ),
        cell(
          [
            p([run("EN CASO DE EMERGENCIA FAVOR INFORMAR A LOS TELÉFONOS.", 11, true)], {
              align: AlignmentType.CENTER,
              after: 8,
              line: 200,
            }),
            p([run("(0412) 396-8855, (0416) 642-7379, (0416) 232-3997", 11, true)], {
              align: AlignmentType.CENTER,
              after: 30,
            }),
            p([run(BOLETA_ARMAS, 12, false)], { align: AlignmentType.CENTER, line: 210 }),
          ],
          { width: RIGHT_W, align: "center", margins: PAD },
        ),
      ],
    }),
  ]);

  return tbl(CARD_W, [CARD_W], [
    new TableRow({
      children: [
        cell([inner], {
          width: CARD_W,
          borders: box(BLUE, 16),
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        }),
      ],
    }),
  ]);
}

function pageOfTwo(
  top: BoletaPermisoCard,
  bottom: BoletaPermisoCard | null,
  convocatoria: BoletaPermisoConvocatoriaInfo,
  logoCefoa: Buffer | null,
  logoEjercito: Buffer | null,
) {
  return tbl(CARD_W, [CARD_W], [
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
        cell([p([run(" ")])], { width: CARD_W, margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
      ],
    }),
    new TableRow({
      height: { value: CARD_H, rule: HeightRule.EXACT },
      children: [
        cell(
          bottom ? [boletaCard(bottom, convocatoria, logoCefoa, logoEjercito)] : [p([run(" ")])],
          { width: CARD_W, margins: { top: 0, bottom: 0, left: 0, right: 0 } },
        ),
      ],
    }),
  ]);
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
      default: { document: { run: { font: "Arial", size: 15 } } },
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
