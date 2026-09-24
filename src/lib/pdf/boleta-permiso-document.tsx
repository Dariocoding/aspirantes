import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  BOLETA_ARMAS,
  BOLETA_RECOMENDACION,
  type BoletaControlFila,
  type BoletaPermisoCard,
  type BoletaPermisoConvocatoriaInfo,
} from "@src/lib/pdf/boleta-permiso";
import {
  FICHA_TECNICA_PDF_FONT_FAMILY,
  registerFichaTecnicaPdfFonts,
} from "@src/lib/pdf/register-ficha-tecnica-fonts";

registerFichaTecnicaPdfFonts();
Font.registerHyphenationCallback((word) => [word]);

const FONT = FICHA_TECNICA_PDF_FONT_FAMILY;
const INK = "#000000";
const GAP = 12;
const PAGE_PAD = 72;
const PAGE_W = 612;
const INNER_W = PAGE_W - PAGE_PAD * 2;
const CARD_H = (792 - PAGE_PAD * 2 - GAP) / 2;
const FLAG_W = 18;
const HALF_W = INNER_W / 2;
const HEADER_PAD_X = 4;
/** Alto común. El ancho sale de la proporción real de cada PNG (608×900 y 500×500). */
const LOGO_H = 50;
const LOGO_EJERCITO_W = Math.round(((LOGO_H * 608) / 900) * 10) / 10;
const LOGO_CEFOA_W = LOGO_H;
const HEADER_TEXT_W = HALF_W - HEADER_PAD_X * 2 - LOGO_EJERCITO_W - LOGO_CEFOA_W - 4;
const BODY_PAD_X = 6;
const PHOTO_W = 56;
const BODY_W = HALF_W - FLAG_W - 2;
const IDENT_TEXT_W = BODY_W - BODY_PAD_X * 2 - PHOTO_W - 6;

function img(data: Buffer, format: "png" | "jpg") {
  return { data: Buffer.from(data), format };
}

const s = StyleSheet.create({
  page: {
    fontFamily: FONT,
    color: INK,
    paddingTop: PAGE_PAD,
    paddingBottom: PAGE_PAD,
    paddingLeft: PAGE_PAD,
    paddingRight: PAGE_PAD,
    backgroundColor: "#FFFFFF",
  },
  stack: {
    flex: 1,
    justifyContent: "space-between",
  },
  card: {
    width: INNER_W,
    height: CARD_H,
    borderWidth: 1.4,
    borderColor: INK,
    flexDirection: "row",
  },
  reverso: {
    width: HALF_W,
    height: "100%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 8,
  },
  portada: {
    width: HALF_W,
    height: "100%",
    borderLeftWidth: 1.2,
    borderLeftColor: INK,
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: HEADER_PAD_X,
    overflow: "hidden",
  },
  logoEjercito: { width: LOGO_EJERCITO_W, height: LOGO_H, objectFit: "contain" },
  logoCefoa: { width: LOGO_CEFOA_W, height: LOGO_H, objectFit: "contain" },
  headerTexts: { width: HEADER_TEXT_W },
  hLine: { fontSize: 6, textAlign: "center", fontWeight: "bold", lineHeight: 1.15 },
  bodyRow: {
    flexGrow: 1,
    flexDirection: "row",
    minHeight: 0,
  },
  flagCol: {
    width: FLAG_W,
    height: "100%",
    overflow: "hidden",
  },
  flag: {
    width: FLAG_W,
    height: "100%",
    objectFit: "fill",
  },
  body: {
    width: BODY_W,
    paddingTop: 4,
    paddingBottom: 6,
    paddingLeft: BODY_PAD_X,
    paddingRight: BODY_PAD_X,
    overflow: "hidden",
  },
  grow: { flexGrow: 1 },
  ident: { flexDirection: "row", marginBottom: 6 },
  photoBox: {
    width: PHOTO_W,
    height: 72,
    borderWidth: 1,
    borderColor: INK,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  photo: { width: PHOTO_W - 2, height: 70, objectFit: "cover" },
  photoPh: { fontSize: 9, fontWeight: "bold" },
  identCol: { width: IDENT_TEXT_W, justifyContent: "center" },
  identTitle: { fontSize: 7.5, fontWeight: "bold", marginBottom: 3 },
  identLabel: { fontSize: 6.5, fontWeight: "bold", marginTop: 2 },
  identValue: { fontSize: 7.5, fontWeight: "bold" },
  vence: { fontSize: 7, fontWeight: "bold", marginBottom: 6, marginTop: 2 },
  fieldLabel: { fontSize: 7, fontWeight: "bold", marginTop: 5 },
  fieldValue: { fontSize: 7, lineHeight: 1.25, marginTop: 1 },
  rec: { fontSize: 6.2, textAlign: "center", lineHeight: 1.25 },
  titleBar: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  serialCol: { width: 62 },
  serial: { fontSize: 7, fontWeight: "bold" },
  titleMid: { flex: 1, fontSize: 8, fontWeight: "bold", textAlign: "center" },
  ejb: { width: 28, fontSize: 9, fontWeight: "bold", textAlign: "center" },
  mid: { flexDirection: "row", marginBottom: 10 },
  huellaCol: { width: 64, marginRight: 8 },
  huellaBox: {
    width: 62,
    height: 88,
    borderWidth: 1,
    borderColor: INK,
  },
  huellaCap: { fontSize: 6, textAlign: "center", marginTop: 3 },
  traits: { flex: 1, justifyContent: "space-between", paddingVertical: 2 },
  traitRow: { flexDirection: "row", justifyContent: "space-between" },
  traitLabel: { fontSize: 7, fontWeight: "bold", width: "58%" },
  traitVal: { fontSize: 7, width: "42%" },
  directorBlock: { marginBottom: 8, alignItems: "center" },
  line: { fontSize: 8, textAlign: "center", marginBottom: 3 },
  director: { fontSize: 8.5, fontWeight: "bold", textAlign: "center" },
  cargo: { fontSize: 7.5, fontWeight: "bold", textAlign: "center", lineHeight: 1.25 },
  emerg: { fontSize: 6.2, fontWeight: "bold", textAlign: "center", lineHeight: 1.25 },
  armas: { fontSize: 6.6, textAlign: "center", marginTop: 6, lineHeight: 1.25 },
  controlPage: {
    fontFamily: FONT,
    color: INK,
    paddingTop: 28,
    paddingBottom: 24,
    paddingLeft: 28,
    paddingRight: 28,
    backgroundColor: "#FFFFFF",
  },
  controlTitle: { fontSize: 12, fontWeight: "bold", textAlign: "center", marginBottom: 4 },
  controlWho: { fontSize: 8, fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  table: { borderWidth: 1, borderColor: INK, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { flexDirection: "row" },
  th: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: INK,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
    paddingVertical: 3,
    minHeight: 36,
  },
  td: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: INK,
    justifyContent: "center",
    paddingHorizontal: 3,
    minHeight: 32,
  },
  thText: { fontSize: 6, fontWeight: "bold", textAlign: "center", lineHeight: 1.15 },
  tdText: { fontSize: 7.5, textAlign: "center" },
});

const CONTROL_COLS = [
  { key: "n", label: "N°", width: 28 },
  { key: "tipo", label: "TIPO DE PERMISO", width: 78 },
  { key: "dur", label: "DURACIÓN", width: 52 },
  { key: "desde", label: "DESDE", width: 64 },
  { key: "hasta", label: "HASTA", width: 64 },
  { key: "fp", label: "FIRMA DEL CMDTE DE PELOTÓN", width: 112 },
  { key: "fc", label: "FIRMA DEL CMDTE DEL CUERPO DEL CEFOA", width: 113 },
  { key: "fs", label: "FIRMA DEL SUB-DIRECTOR DEL CEFOA", width: 112 },
  { key: "fd", label: "FIRMA DEL DIRECTOR DEL CEFOA", width: 113 },
] as const;

const CONTROL_ROWS = 10;

function controlPagesFor(card: BoletaPermisoCard): BoletaControlFila[][] {
  const filled = card.control ?? [];
  const total = Math.max(CONTROL_ROWS, filled.length);
  const pages: BoletaControlFila[][] = [];
  for (let i = 0; i < total; i += CONTROL_ROWS) {
    const slice: BoletaControlFila[] = [];
    for (let r = 0; r < CONTROL_ROWS && i + r < total; r++) {
      slice.push(filled[i + r] ?? { tipo: "", duracion: "", desde: "", hasta: "" });
    }
    pages.push(slice);
  }
  return pages;
}

function ControlPermisoPage({
  card,
  rows,
  startAt,
}: {
  card: BoletaPermisoCard;
  rows: BoletaControlFila[];
  startAt: number;
}) {
  return (
    <Page size="LETTER" orientation="landscape" style={s.controlPage}>
      <Text style={s.controlTitle}>CONTROL DE PERMISO</Text>
      <Text style={s.controlWho}>
        {`Serial ${card.serial}  ·  ${card.apellidos.toLocaleUpperCase("es")}, ${card.nombres.toLocaleUpperCase("es")}  ·  C.I. ${card.cedula}`}
      </Text>
      <View style={s.table}>
        <View style={s.tr}>
          {CONTROL_COLS.map((col) => (
            <View key={col.key} style={[s.th, { width: col.width }]}>
              <Text style={s.thText}>{col.label}</Text>
            </View>
          ))}
        </View>
        {rows.map((row, index) => (
          <View key={`${card.id}-${startAt + index}`} style={s.tr}>
            <View style={[s.td, { width: CONTROL_COLS[0]!.width }]}>
              <Text style={s.tdText}>{String(startAt + index + 1)}</Text>
            </View>
            <View style={[s.td, { width: CONTROL_COLS[1]!.width }]}>
              <Text style={s.tdText}>{row.tipo}</Text>
            </View>
            <View style={[s.td, { width: CONTROL_COLS[2]!.width }]}>
              <Text style={s.tdText}>{row.duracion}</Text>
            </View>
            <View style={[s.td, { width: CONTROL_COLS[3]!.width }]}>
              <Text style={s.tdText}>{row.desde}</Text>
            </View>
            <View style={[s.td, { width: CONTROL_COLS[4]!.width }]}>
              <Text style={s.tdText}>{row.hasta}</Text>
            </View>
            <View style={[s.td, { width: CONTROL_COLS[5]!.width }]} />
            <View style={[s.td, { width: CONTROL_COLS[6]!.width }]} />
            <View style={[s.td, { width: CONTROL_COLS[7]!.width }]} />
            <View style={[s.td, { width: CONTROL_COLS[8]!.width }]} />
          </View>
        ))}
      </View>
    </Page>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value === "—" ? " " : value}</Text>
    </View>
  );
}

function telefonosEnUno(principal: string, emergencia: string): string {
  const parts = [principal, emergencia]
    .map((v) => v.trim())
    .filter((v) => v && v !== "—");
  return [...new Set(parts)].join(", ");
}

function BoletaCard({
  card,
  convocatoria,
  logoCefoa,
  logoEjercito,
  bandera,
}: {
  card: BoletaPermisoCard;
  convocatoria: BoletaPermisoConvocatoriaInfo;
  logoCefoa: Buffer | null;
  logoEjercito: Buffer | null;
  bandera: Buffer | null;
}) {
  return (
    <View style={s.card} wrap={false}>
      <View style={s.reverso}>
        <View style={s.titleBar}>
          <View style={s.serialCol}>
            <Text style={s.serial}>Serial:{card.serial}</Text>
            <Text style={s.serial}>CEFOA</Text>
          </View>
          <Text style={s.titleMid}>ASPIRANTE A OFICIAL</Text>
          <Text style={s.ejb}>EJB</Text>
        </View>

        <View style={s.mid}>
          <View style={s.huellaCol}>
            <View style={s.huellaBox} />
            <Text style={s.huellaCap}>Huella dactilar</Text>
          </View>
          <View style={s.traits}>
            <View style={s.traitRow}>
              <Text style={s.traitLabel}>CABELLO:</Text>
              <Text style={s.traitVal}>{card.cabello}</Text>
            </View>
            <View style={s.traitRow}>
              <Text style={s.traitLabel}>GRUPO SANGUÍNEO:</Text>
              <Text style={s.traitVal}>{card.grupoSanguineo}</Text>
            </View>
            <View style={s.traitRow}>
              <Text style={s.traitLabel}>OJOS:</Text>
              <Text style={s.traitVal}>{card.ojos}</Text>
            </View>
            <View style={s.traitRow}>
              <Text style={s.traitLabel}>COLOR DE PIEL:</Text>
              <Text style={s.traitVal}>{card.colorPiel}</Text>
            </View>
          </View>
        </View>

        <View style={s.grow} />
        <View style={s.directorBlock}>
          <Text style={s.line}>______________________________</Text>
          <Text style={s.director}>{convocatoria.directorNombre || " "}</Text>
          <Text style={s.cargo}>DIRECTOR DEL CURSO ESPECIAL DE FORMACION</Text>
          <Text style={s.cargo}>
            {convocatoria.cursoNro
              ? `DE OFICIALES ASIMILADO Y ASIMILADO TÉCNICO N°${convocatoria.cursoNro}`
              : "DE OFICIALES ASIMILADO Y ASIMILADO TÉCNICO"}
          </Text>
        </View>
        <View style={s.grow} />
        <Text style={s.emerg}>EN CASO DE EMERGENCIA FAVOR INFORMAR A LOS TELÉFONOS.</Text>
        <Text style={s.emerg}>(0412) 396-8855, (0416) 642-7379, (0416) 232-3997</Text>
        <Text style={s.armas}>{BOLETA_ARMAS}</Text>
      </View>

      <View style={s.portada}>
        <View style={s.header}>
          {logoEjercito ? (
            <Image src={img(logoEjercito, "png")} style={s.logoEjercito} />
          ) : (
            <View style={s.logoEjercito} />
          )}
          <View style={s.headerTexts}>
            {convocatoria.headerLines.map((line) => (
              <Text key={line} style={s.hLine}>
                {line}
              </Text>
            ))}
          </View>
          {logoCefoa ? (
            <Image src={img(logoCefoa, "png")} style={s.logoCefoa} />
          ) : (
            <View style={s.logoCefoa} />
          )}
        </View>
        <View style={s.bodyRow}>
          {bandera ? (
            <View style={s.flagCol}>
              <Image src={img(bandera, "jpg")} style={s.flag} />
            </View>
          ) : null}
          <View style={bandera ? s.body : [s.body, { width: HALF_W - 2 }]}>
        <View style={s.ident}>
          <View style={s.photoBox}>
            {card.foto ? (
              <Image src={img(card.foto.data, card.foto.format)} style={s.photo} />
            ) : (
              <Text style={s.photoPh}>FOTO</Text>
            )}
          </View>
          <View style={s.identCol}>
            <Text style={s.identTitle}>ASPIRANTE A OFICIAL</Text>
            <Text style={s.identLabel}>NOMBRES:</Text>
            <Text style={s.identValue}>{card.nombres.toLocaleUpperCase("es")}</Text>
            <Text style={s.identLabel}>APELLIDOS:</Text>
            <Text style={s.identValue}>{card.apellidos.toLocaleUpperCase("es")}</Text>
            <Text style={s.identValue}>C.I.V:  {card.cedula}</Text>
          </View>
        </View>

        <Text style={s.vence}>{convocatoria.vence}</Text>
        <Field label="DIRECCIÓN DOMICILIARIA:" value={card.direccion} />
        <Field label="DIRECCIÓN DE EMERGENCIA:" value={card.emergenciaDireccion} />
        <Field label="TELÉFONOS:" value={telefonosEnUno(card.telefono, card.emergenciaTelefono)} />
        <View style={s.grow} />
        <Text style={s.rec}>{BOLETA_RECOMENDACION}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export type BoletasPermisoPdfProps = {
  convocatoria: BoletaPermisoConvocatoriaInfo;
  cards: BoletaPermisoCard[];
  logoCefoa: Buffer | null;
  logoEjercito: Buffer | null;
  bandera: Buffer | null;
};

export function BoletasPermisoPdfDocument({
  convocatoria,
  cards,
  logoCefoa,
  logoEjercito,
  bandera,
}: BoletasPermisoPdfProps) {
  const pages: Array<[BoletaPermisoCard, BoletaPermisoCard | null]> = [];
  for (let i = 0; i < cards.length; i += 2) {
    pages.push([cards[i]!, cards[i + 1] ?? null]);
  }

  return (
    <Document>
      {pages.map(([top, bottom]) => (
        <Page key={top.id} size="LETTER" style={s.page}>
          <View style={s.stack}>
            <BoletaCard
              card={top}
              convocatoria={convocatoria}
              logoCefoa={logoCefoa}
              logoEjercito={logoEjercito}
              bandera={bandera}
            />
            {bottom ? (
              <BoletaCard
                card={bottom}
                convocatoria={convocatoria}
                logoCefoa={logoCefoa}
                logoEjercito={logoEjercito}
                bandera={bandera}
              />
            ) : (
              <View style={{ height: CARD_H }} />
            )}
          </View>
        </Page>
      ))}
      {cards.length > 1
        ? cards.flatMap((card) => {
            const chunks = controlPagesFor(card);
            return chunks.map((rows, pageIndex) => (
              <ControlPermisoPage
                key={`${card.id}-control-${pageIndex}`}
                card={card}
                rows={rows}
                startAt={pageIndex * CONTROL_ROWS}
              />
            ));
          })
        : null}
    </Document>
  );
}
