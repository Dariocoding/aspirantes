import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  BOLETA_ARMAS,
  BOLETA_RECOMENDACION,
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
const LOGO_W = 34;
const HEADER_PAD_X = 4;
const HEADER_TEXT_W = HALF_W - HEADER_PAD_X * 2 - LOGO_W * 2 - 2;
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
  logo: { width: LOGO_W, height: 42, objectFit: "contain" },
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
  vence: { fontSize: 6.5, fontWeight: "bold", marginBottom: 6, marginTop: 2 },
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
  director: { fontSize: 7.5, fontWeight: "bold", textAlign: "center" },
  cargo: { fontSize: 6.6, fontWeight: "bold", textAlign: "center", lineHeight: 1.25 },
  emerg: { fontSize: 6.2, fontWeight: "bold", textAlign: "center", lineHeight: 1.25 },
  armas: { fontSize: 6.6, textAlign: "center", marginTop: 6, lineHeight: 1.25 },
});

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value === "—" ? " " : value}</Text>
    </View>
  );
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
          <Text style={s.cargo}>DIRECTOR DEL CURSO ESPECIAL DE FORMACIÓN</Text>
          <Text style={s.cargo}>DE OFICIALES EN LA CATEGORÍA DE ASIMILADOS</Text>
        </View>
        <View style={s.grow} />
        <Text style={s.emerg}>EN CASO DE EMERGENCIA FAVOR INFORMAR A LOS TELÉFONOS.</Text>
        <Text style={s.emerg}>(0412) 396-8855, (0416) 642-7379, (0416) 232-3997</Text>
        <Text style={s.armas}>{BOLETA_ARMAS}</Text>
      </View>

      <View style={s.portada}>
        <View style={s.header}>
          {logoCefoa ? <Image src={img(logoCefoa, "png")} style={s.logo} /> : <View style={s.logo} />}
          <View style={s.headerTexts}>
            {convocatoria.headerLines.map((line) => (
              <Text key={line} style={s.hLine}>
                {line}
              </Text>
            ))}
          </View>
          {logoEjercito ? (
            <Image src={img(logoEjercito, "png")} style={s.logo} />
          ) : (
            <View style={s.logo} />
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
        <Field label="TELEFONO:" value={card.telefono} />
        <Field label="DIRECCIÓN DE EMERGENCIA:" value={card.emergenciaDireccion} />
        <Field label="TELÉFONO DE EMERGENCIA:" value={card.emergenciaTelefono} />
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
    </Document>
  );
}
