import { Font, Image, Page, StyleSheet, Text, View, Document } from "@react-pdf/renderer";
import type { OrdenDelDiaData } from "@src/lib/roles-servicio/orden-del-dia/build-orden";
import {
  FICHA_TECNICA_PDF_FONT_FAMILY,
  registerFichaTecnicaPdfFonts,
} from "@src/lib/pdf/register-ficha-tecnica-fonts";

registerFichaTecnicaPdfFonts();
Font.registerHyphenationCallback((word) => [word]);

const FONT = FICHA_TECNICA_PDF_FONT_FAMILY;
const INK = "#000000";
const HEADER_BG = "#d1d5db";

const s = StyleSheet.create({
  page: {
    fontFamily: FONT,
    color: INK,
    paddingTop: 32,
    paddingBottom: 32,
    paddingLeft: 40,
    paddingRight: 40,
    backgroundColor: "#FFFFFF",
    fontSize: 9,
    lineHeight: 1.3,
    flexDirection: "column",
  },
  sheet: {
    flexGrow: 1,
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  logoSlot: {
    width: 54,
    height: 66,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 50, height: 62, objectFit: "contain" },
  logoSmall: { width: 42, height: 52, objectFit: "contain" },
  headerTexts: { flex: 1, paddingHorizontal: 8 },
  hLine: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 1.18,
    textTransform: "uppercase",
  },
  metaBlock: {
    marginTop: 6,
    marginBottom: 2,
    alignItems: "flex-end",
  },
  metaLine: {
    fontSize: 7.5,
    fontWeight: "bold",
    textAlign: "right",
    textTransform: "uppercase",
    lineHeight: 1.25,
  },
  tituloOrden: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    textDecoration: "underline",
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 5,
    fontSize: 9.5,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  subSection: {
    marginTop: 4,
    marginBottom: 4,
    fontSize: 8.5,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  quoteBlock: { marginBottom: 7 },
  quoteHead: { fontSize: 8.2, fontWeight: "bold", marginBottom: 2 },
  quoteText: { fontSize: 8, textAlign: "justify", lineHeight: 1.35 },
  quoteAttr: {
    marginTop: 2,
    fontSize: 7.5,
    textAlign: "right",
    fontWeight: "bold",
  },
  table: {
    marginTop: 2,
    borderTopWidth: 0.8,
    borderLeftWidth: 0.8,
    borderColor: INK,
  },
  row: { flexDirection: "row" },
  th: {
    borderRightWidth: 0.8,
    borderBottomWidth: 0.8,
    borderColor: INK,
    backgroundColor: HEADER_BG,
    paddingVertical: 3.5,
    paddingHorizontal: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  td: {
    borderRightWidth: 0.8,
    borderBottomWidth: 0.8,
    borderColor: INK,
    paddingVertical: 3,
    paddingHorizontal: 3,
    justifyContent: "center",
  },
  thText: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
  },
  tdText: { fontSize: 7.4, textAlign: "center" },
  tdTextLeft: { fontSize: 7.4, textAlign: "left" },
  spacer: { flexGrow: 1, minHeight: 8 },
  continuacionFoot: {
    marginTop: 10,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "right",
  },
  page2Top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  continuacionHead: {
    fontSize: 9,
    fontWeight: "bold",
  },
  bodyText: { fontSize: 8, textAlign: "justify", lineHeight: 1.4 },
  particular: { marginTop: 3, fontSize: 8.5, fontWeight: "bold" },
  cumplase: {
    marginTop: 22,
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.8,
  },
  firma: { marginTop: 28, alignItems: "center" },
  firmaNombre: { fontSize: 9, fontWeight: "bold", textAlign: "center" },
  firmaGrado: { marginTop: 4, fontSize: 8.5, fontWeight: "bold", textAlign: "center" },
  firmaCargo: {
    marginTop: 3,
    fontSize: 7.4,
    fontWeight: "bold",
    textAlign: "center",
    maxWidth: 400,
    lineHeight: 1.3,
  },
});

function Crest({ src, small = false }: { src: string | null; small?: boolean }) {
  return (
    <View style={s.logoSlot}>
      {src ? <Image src={{ uri: src }} style={small ? s.logoSmall : s.logo} /> : null}
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
    <View wrap={false}>
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
    <View wrap={false}>
      <Text style={s.sectionTitle}>A. TRANSCRIPCIONES</Text>
      {items.map(({ n, t }) => (
        <View key={t.id} style={s.quoteBlock} wrap={false}>
          <Text style={s.quoteHead}>
            {n}. {t.titulo}
          </Text>
          <Text style={s.quoteText}>{t.texto}</Text>
          {t.atribucion ? <Text style={s.quoteAttr}>{t.atribucion}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function TablaDiurnos({ filas }: { filas: OrdenDelDiaData["diurnos"] }) {
  const cols = ["7%", "36%", "17%", "40%"] as const;
  const filasMostrar =
    filas.length > 0
      ? filas
      : [{ nro: 1, servicio: "SIN ASIGNACIONES", grado: "—", nombres: "OMITIR" }];

  return (
    <View style={s.table} wrap={false}>
      <View style={s.row} wrap={false}>
        {["Nº", "SERVICIO", "GRADO O JQUIA", "NOMBRES Y APELLIDOS"].map((h, i) => (
          <View key={h} style={[s.th, { width: cols[i] }]}>
            <Text style={s.thText}>{h}</Text>
          </View>
        ))}
      </View>
      {filasMostrar.map((fila) => (
        <View key={`d-${fila.nro}-${fila.servicio}`} style={s.row} wrap={false}>
          <View style={[s.td, { width: cols[0] }]}>
            <Text style={s.tdText}>{fila.nro}</Text>
          </View>
          <View style={[s.td, { width: cols[1] }]}>
            <Text style={s.tdTextLeft}>{fila.servicio}</Text>
          </View>
          <View style={[s.td, { width: cols[2] }]}>
            <Text style={s.tdText}>{fila.grado}</Text>
          </View>
          <View style={[s.td, { width: cols[3] }]}>
            <Text style={s.tdTextLeft}>{fila.nombres}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function TablaNocturnos({ filas }: { filas: OrdenDelDiaData["nocturnos"] }) {
  const cols = ["6%", "10%", "30%", "16%", "38%"] as const;
  const filasMostrar =
    filas.length > 0
      ? filas
      : [
          {
            nro: 1,
            turno: "—",
            servicio: "SIN ASIGNACIONES",
            grado: "—",
            nombres: "OMITIR",
          },
        ];

  return (
    <View style={s.table} wrap={false}>
      <View style={s.row} wrap={false}>
        {["Nº", "TURNO", "SERVICIO", "GRADO O JQUIA", "NOMBRES Y APELLIDOS"].map((h, i) => (
          <View key={h} style={[s.th, { width: cols[i] }]}>
            <Text style={s.thText}>{h}</Text>
          </View>
        ))}
      </View>
      {filasMostrar.map((fila) => (
        <View
          key={`n-${fila.nro}-${fila.servicio}-${fila.turno}`}
          style={s.row}
          wrap={false}
        >
          <View style={[s.td, { width: cols[0] }]}>
            <Text style={s.tdText}>{fila.nro}</Text>
          </View>
          <View style={[s.td, { width: cols[1] }]}>
            <Text style={s.tdText}>{fila.turno}</Text>
          </View>
          <View style={[s.td, { width: cols[2] }]}>
            <Text style={s.tdTextLeft}>{fila.servicio}</Text>
          </View>
          <View style={[s.td, { width: cols[3] }]}>
            <Text style={s.tdText}>{fila.grado}</Text>
          </View>
          <View style={[s.td, { width: cols[4] }]}>
            <Text style={s.tdTextLeft}>{fila.nombres}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Exactamente 2 hojas por orden (wrap={false} evita páginas extra por desborde).
 * Hoja 1: membrete + transcripciones + diurnos.
 * Hoja 2: continuación + nocturnos + disposiciones + firma.
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
      <Page size="LETTER" style={s.page} wrap={false}>
        <View style={s.sheet}>
          <MembreteHeader data={data} logoIzq={logoIzq} logoDer={logoDer} />
          <Transcripciones data={data} />
          <View wrap={false}>
            <Text style={s.sectionTitle}>B. SERVICIOS</Text>
            <Text style={s.subSection}>{data.diurnosTitulo}</Text>
            <TablaDiurnos filas={data.diurnos} />
          </View>
          <View style={s.spacer} />
          <Text style={s.continuacionFoot}>CONTINUACIÓN...</Text>
        </View>
      </Page>

      <Page size="LETTER" style={s.page} wrap={false}>
        <View style={s.sheet}>
          <View style={s.page2Top} wrap={false}>
            <Text style={s.continuacionHead}>...CONTINUACIÓN</Text>
            <Crest src={logoDer ?? logoIzq} small />
          </View>

          <View wrap={false}>
            <Text style={s.subSection}>{data.nocturnosTitulo}</Text>
            <TablaNocturnos filas={data.nocturnos} />
          </View>

          <View wrap={false}>
            <Text style={s.sectionTitle}>C. DISPOSICIONES DE CARÁCTER GENERAL</Text>
            <Text style={s.bodyText}>{data.disposicionGeneral}</Text>

            <Text style={s.sectionTitle}>D. DISPOSICIONES DE CARÁCTER PARTICULAR</Text>
            <Text style={s.particular}>{data.disposicionParticular}</Text>
          </View>

          <View style={s.spacer} />

          <View wrap={false}>
            <Text style={s.cumplase}>CÚMPLASE</Text>
            <View style={s.firma}>
              <Text style={s.firmaNombre}>{data.directorNombre}</Text>
              <Text style={s.firmaGrado}>{data.directorGrado}</Text>
              <Text style={s.firmaCargo}>{data.directorCargo}</Text>
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
