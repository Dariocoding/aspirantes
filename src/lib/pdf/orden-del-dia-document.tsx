import { Font, Image, Page, StyleSheet, Text, View, Document } from "@react-pdf/renderer";
import type { OrdenDelDiaData } from "@src/lib/roles-servicio/orden-del-dia/build-orden";
import { textoCitaApa } from "@src/lib/roles-servicio/orden-del-dia/apa";
import {
  FICHA_TECNICA_PDF_FONT_FAMILY,
  registerFichaTecnicaPdfFonts,
} from "@src/lib/pdf/register-ficha-tecnica-fonts";

registerFichaTecnicaPdfFonts();
Font.registerHyphenationCallback((word) => [word]);

const FONT = FICHA_TECNICA_PDF_FONT_FAMILY;
const INK = "#000000";
/** Gris de encabezado de tabla (igual en diurnos y nocturnos). */
const TABLE_HEADER_BG = "#c8c8c8";
const PAGE_W = 612;
const PAGE_H = 792;
const PAD_X = 40;
const PAD_Y = 36;
const CONTENT_H = PAGE_H - PAD_Y * 2;

const s = StyleSheet.create({
  page: {
    fontFamily: FONT,
    color: INK,
    width: PAGE_W,
    height: PAGE_H,
    paddingTop: PAD_Y,
    paddingBottom: PAD_Y,
    paddingLeft: PAD_X,
    paddingRight: PAD_X,
    backgroundColor: "#FFFFFF",
    fontSize: 9,
    lineHeight: 1.3,
  },
  /** Columna a altura fija de carta: reparte bloques de arriba a abajo. */
  sheet: {
    height: CONTENT_H,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  block: {
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoSlot: {
    width: 52,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 48, height: 60, objectFit: "contain" },
  headerTexts: { flex: 1, paddingHorizontal: 6 },
  hLine: {
    fontSize: 6.8,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 1.15,
    textTransform: "uppercase",
  },
  metaBlock: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  metaLine: {
    fontSize: 7.4,
    fontWeight: "bold",
    textAlign: "right",
    textTransform: "uppercase",
    lineHeight: 1.25,
  },
  tituloOrden: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    textDecoration: "underline",
  },
  sectionTitle: {
    marginBottom: 6,
    fontSize: 9.5,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  subSection: {
    marginBottom: 5,
    fontSize: 8.5,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  /** Ocupa el hueco entre membrete y servicios; reparte las 3 citas. */
  transcripciones: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: "column",
    justifyContent: "space-evenly",
    paddingVertical: 4,
  },
  quoteBlock: { marginBottom: 4 },
  quoteHead: { fontSize: 8.4, fontWeight: "bold", marginBottom: 3 },
  quoteText: { fontSize: 8.2, textAlign: "justify", lineHeight: 1.45 },
  quoteAttr: {
    marginTop: 3,
    fontSize: 7.6,
    textAlign: "right",
    fontWeight: "bold",
  },
  /** Misma caja de tabla para diurnos y nocturnos. */
  table: {
    width: "100%",
    borderWidth: 0.9,
    borderColor: INK,
  },
  row: {
    flexDirection: "row",
    width: "100%",
  },
  th: {
    borderRightWidth: 0.9,
    borderBottomWidth: 0.9,
    borderColor: INK,
    backgroundColor: TABLE_HEADER_BG,
    paddingVertical: 4,
    paddingHorizontal: 3,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 18,
  },
  thLast: {
    borderRightWidth: 0,
  },
  td: {
    borderRightWidth: 0.9,
    borderBottomWidth: 0.9,
    borderColor: INK,
    paddingVertical: 3.5,
    paddingHorizontal: 3,
    justifyContent: "center",
    minHeight: 16,
  },
  tdLast: {
    borderRightWidth: 0,
  },
  tdLastRow: {
    borderBottomWidth: 0,
  },
  thText: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
  },
  cellCenter: { fontSize: 7.5, textAlign: "center" },
  cellLeft: { fontSize: 7.5, textAlign: "left" },
  continuacionFoot: {
    fontSize: 8.5,
    fontWeight: "bold",
    textAlign: "right",
    textTransform: "uppercase",
  },
  page2Top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  /** El resto de la hoja 2, debajo del encabezado de continuación. */
  page2Body: {
    flexGrow: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    marginTop: 12,
  },
  continuacionHead: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  bodyText: {
    fontSize: 8,
    textAlign: "justify",
    lineHeight: 1.45,
    textTransform: "uppercase",
  },
  particular: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  cumplase: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1,
  },
  firma: {
    marginTop: 40,
    alignItems: "center",
  },
  firmaNombre: { fontSize: 9.5, fontWeight: "bold", textAlign: "center" },
  firmaGrado: { marginTop: 5, fontSize: 9, fontWeight: "bold", textAlign: "center" },
  firmaCargo: {
    marginTop: 4,
    fontSize: 7.5,
    fontWeight: "bold",
    textAlign: "center",
    maxWidth: 420,
    lineHeight: 1.3,
  },
});

type ColDef = {
  key: string;
  label: string;
  width: string;
  align: "left" | "center";
};

function Crest({ src }: { src: string | null }) {
  return (
    <View style={s.logoSlot}>
      {src ? <Image src={{ uri: src }} style={s.logo} /> : null}
    </View>
  );
}

function MembreteHeader({
  data,
  logoIzq,
  logoDer,
}: {
  data: OrdenDelDiaData;
  logoIzq: string | null;
  logoDer: string | null;
}) {
  const { independencia, federacion, revolucion } = data.aniversarios;
  return (
    <View style={s.block} wrap={false}>
      <View style={s.header}>
        <Crest src={logoIzq} />
        <View style={s.headerTexts}>
          {data.lineasMembrete.map((line, index) => (
            <Text key={`${index}-${line}`} style={s.hLine}>
              {line}
            </Text>
          ))}
        </View>
        <Crest src={logoDer} />
      </View>
      <View style={s.metaBlock}>
        <Text style={s.metaLine}>
          {data.lugar}, {data.fechaDocumento}
        </Text>
        <Text style={s.metaLine}>
          {independencia}º DE LA INDEPENDENCIA Y {federacion}º DE LA FEDERACIÓN
        </Text>
        <Text style={s.metaLine}>{revolucion}º DE LA REVOLUCIÓN</Text>
      </View>
      <Text style={s.tituloOrden}>Orden del día Nº. {data.numeroOrden}</Text>
    </View>
  );
}

function Transcripciones({ data }: { data: OrdenDelDiaData }) {
  const items = [
    { n: 1, t: data.transcripciones.libertador },
    { n: 2, t: data.transcripciones.comandante },
    { n: 3, t: data.transcripciones.ley },
  ];
  return (
    <View style={s.transcripciones} wrap={false}>
      <Text style={s.sectionTitle}>A. TRANSCRIPCIONES</Text>
      {items.map(({ n, t }) => (
        <View key={t.id} style={s.quoteBlock} wrap={false}>
          <Text style={s.quoteHead}>
            {n}. {t.titulo}
          </Text>
          <Text style={s.quoteText}>{textoCitaApa(t)}</Text>
          {t.atribucion ? <Text style={s.quoteAttr}>{t.atribucion}</Text> : null}
        </View>
      ))}
    </View>
  );
}

/** Tabla única: mismo borde, gris y tipografía para diurnos y nocturnos. */
function ServiciosTable({
  columns,
  rows,
}: {
  columns: readonly ColDef[];
  rows: readonly Record<string, string | number>[];
}) {
  const lastCol = columns.length - 1;
  const lastRow = rows.length - 1;

  return (
    <View style={s.table} wrap={false}>
      <View style={s.row} wrap={false}>
        {columns.map((col, i) => (
          <View
            key={col.key}
            style={[s.th, { width: col.width }, i === lastCol ? s.thLast : {}]}
          >
            <Text style={s.thText}>{col.label}</Text>
          </View>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={`r-${ri}`} style={s.row} wrap={false}>
          {columns.map((col, ci) => (
            <View
              key={col.key}
              style={[
                s.td,
                { width: col.width },
                ci === lastCol ? s.tdLast : {},
                ri === lastRow ? s.tdLastRow : {},
              ]}
            >
              <Text style={col.align === "center" ? s.cellCenter : s.cellLeft}>
                {String(row[col.key] ?? "")}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const COLS_DIURNOS: readonly ColDef[] = [
  { key: "nro", label: "Nº", width: "8%", align: "center" },
  { key: "servicio", label: "SERVICIO", width: "34%", align: "left" },
  { key: "grado", label: "GRADO O JQUIA", width: "18%", align: "center" },
  { key: "nombres", label: "NOMBRES Y APELLIDOS", width: "40%", align: "left" },
];

const COLS_NOCTURNOS: readonly ColDef[] = [
  { key: "nro", label: "Nº", width: "7%", align: "center" },
  { key: "turno", label: "TURNO", width: "10%", align: "center" },
  { key: "servicio", label: "SERVICIO", width: "28%", align: "left" },
  { key: "grado", label: "GRADO O JQUIA", width: "17%", align: "center" },
  { key: "nombres", label: "NOMBRES Y APELLIDOS", width: "38%", align: "left" },
];

function TablaDiurnos({ filas }: { filas: OrdenDelDiaData["diurnos"] }) {
  const rows =
    filas.length > 0
      ? filas.map((f) => ({
          nro: f.nro,
          servicio: f.servicio,
          grado: f.grado,
          nombres: f.nombres,
        }))
      : [{ nro: 1, servicio: "SIN ASIGNACIONES", grado: "—", nombres: "OMITIR" }];

  return <ServiciosTable columns={COLS_DIURNOS} rows={rows} />;
}

function TablaNocturnos({ filas }: { filas: OrdenDelDiaData["nocturnos"] }) {
  const rows =
    filas.length > 0
      ? filas.map((f) => ({
          nro: f.nro,
          turno: f.turno,
          servicio: f.servicio,
          grado: f.grado,
          nombres: f.nombres,
        }))
      : [
          {
            nro: 1,
            turno: "—",
            servicio: "SIN ASIGNACIONES",
            grado: "—",
            nombres: "OMITIR",
          },
        ];

  return <ServiciosTable columns={COLS_NOCTURNOS} rows={rows} />;
}

/**
 * Exactamente 2 hojas carta por orden.
 * justifyContent: space-between reparte bloques en toda la altura.
 */
function OrdenDelDiaPages({
  data,
  logoIzq,
  logoDer,
}: {
  data: OrdenDelDiaData;
  logoIzq: string | null;
  logoDer: string | null;
}) {
  return (
    <>
      <Page size={[PAGE_W, PAGE_H]} style={s.page} wrap={false}>
        <View style={s.sheet}>
          <MembreteHeader data={data} logoIzq={logoIzq} logoDer={logoDer} />

          <Transcripciones data={data} />

          <View style={s.block} wrap={false}>
            <Text style={s.sectionTitle}>B. SERVICIOS</Text>
            <Text style={s.subSection}>{data.diurnosTitulo}</Text>
            <TablaDiurnos filas={data.diurnos} />
          </View>

          <Text style={s.continuacionFoot}>CONTINUACIÓN...</Text>
        </View>
      </Page>

      <Page size={[PAGE_W, PAGE_H]} style={s.page} wrap={false}>
        <View style={[s.sheet, { justifyContent: "flex-start" }]}>
          <View style={s.page2Top} wrap={false}>
            <Crest src={logoIzq} />
            <Text style={s.continuacionHead}>...CONTINUACIÓN</Text>
            <Crest src={logoDer} />
          </View>

          <View style={s.page2Body}>
            <View style={s.block} wrap={false}>
              <Text style={s.subSection}>{data.nocturnosTitulo}</Text>
              <TablaNocturnos filas={data.nocturnos} />
            </View>

            <View style={s.block} wrap={false}>
              <Text style={s.sectionTitle}>C. DISPOSICIONES DE CARÁCTER GENERAL</Text>
              <Text style={s.bodyText}>{data.disposicionGeneral}</Text>
            </View>

            <View style={s.block} wrap={false}>
              <Text style={s.sectionTitle}>D. DISPOSICIONES DE CARÁCTER PARTICULAR</Text>
              <Text style={s.particular}>{data.disposicionParticular}</Text>
            </View>

            <View style={s.block} wrap={false}>
              <Text style={s.cumplase}>CÚMPLASE</Text>
              <View style={s.firma}>
                <Text style={s.firmaNombre}>{data.directorNombre}</Text>
                <Text style={s.firmaGrado}>{data.directorGrado}</Text>
                <Text style={s.firmaCargo}>{data.directorCargo}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </>
  );
}

export function OrdenDelDiaPdfDocument({
  ordenes,
  logoIzq,
  logoDer,
  titulo,
}: {
  ordenes: OrdenDelDiaData[];
  logoIzq: string | null;
  logoDer: string | null;
  titulo?: string;
}) {
  const primera = ordenes[0];
  const docTitle =
    titulo ??
    (ordenes.length === 1 && primera
      ? `Orden del día Nº. ${primera.numeroOrden}`
      : "Órdenes del día");

  return (
    <Document title={docTitle}>
      {ordenes.map((data) => (
        <OrdenDelDiaPages
          key={`${data.anio}-${data.mes}-${data.dia}`}
          data={data}
          logoIzq={logoIzq}
          logoDer={logoDer}
        />
      ))}
    </Document>
  );
}
