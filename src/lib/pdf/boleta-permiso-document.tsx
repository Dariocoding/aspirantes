import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  BOLETA_ARMAS,
  BOLETA_RECOMENDACION,
  formatVenceBoleta,
  type BoletaPermisoCard,
  type BoletaPermisoConvocatoriaInfo,
} from "@src/lib/pdf/boleta-permiso";
import {
  FICHA_TECNICA_PDF_FONT_FAMILY,
  registerFichaTecnicaPdfFonts,
} from "@src/lib/pdf/register-ficha-tecnica-fonts";

registerFichaTecnicaPdfFonts();

const FONT = FICHA_TECNICA_PDF_FONT_FAMILY;
const BLUE = "#1F4E79";
const INK = "#000000";
const GAP = 12;

function img(data: Buffer, format: "png" | "jpg") {
  return { data: Buffer.from(data), format };
}

const s = StyleSheet.create({
  page: {
    fontFamily: FONT,
    color: INK,
    padding: 72,
    backgroundColor: "#FFFFFF",
  },
  stack: {
    flex: 1,
    justifyContent: "space-between",
  },
  card: {
    width: "100%",
    height: (792 - 144 - GAP) / 2,
    borderWidth: 1.4,
    borderColor: BLUE,
    flexDirection: "row",
  },
  left: {
    width: "54%",
    height: "100%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 8,
  },
  right: {
    width: "46%",
    height: "100%",
    borderLeftWidth: 1.2,
    borderLeftColor: BLUE,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    paddingRight: 10,
  },
  grow: { flexGrow: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logo: { width: 36, height: 44, objectFit: "contain" },
  headerTexts: { flex: 1, paddingHorizontal: 4 },
  hLine: { fontSize: 6.4, textAlign: "center", fontWeight: "bold", lineHeight: 1.2 },
  ident: { flexDirection: "row", marginBottom: 6 },
  photoBox: {
    width: 72,
    height: 92,
    borderWidth: 1,
    borderColor: INK,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  photo: { width: 70, height: 90, objectFit: "cover" },
  photoPh: { fontSize: 9, fontWeight: "bold" },
  identCol: { flex: 1, justifyContent: "center" },
  identTitle: { fontSize: 8, fontWeight: "bold", marginBottom: 4 },
  identLabel: { fontSize: 7, fontWeight: "bold", marginTop: 3 },
  identValue: { fontSize: 8, fontWeight: "bold" },
  vence: { fontSize: 6.5, fontWeight: "bold", marginBottom: 6, marginTop: 2 },
  fieldLabel: { fontSize: 7, fontWeight: "bold", marginTop: 5 },
  fieldValue: { fontSize: 7, lineHeight: 1.25, marginTop: 1 },
  rec: { fontSize: 6.8, textAlign: "center", lineHeight: 1.3 },
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
}: {
  card: BoletaPermisoCard;
  convocatoria: BoletaPermisoConvocatoriaInfo;
  logoCefoa: Buffer | null;
  logoEjercito: Buffer | null;
}) {
  return (
    <View style={s.card} wrap={false}>
      <View style={s.left}>
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

        <Text style={s.vence}>{formatVenceBoleta(convocatoria.anio)}</Text>
        <Field label="DIRECCIÓN DOMICILIARIA:" value={card.direccion} />
        <Field label="TELEFONO:" value={card.telefono} />
        <Field label="DIRECCIÓN DE EMERGENCIA:" value={card.emergenciaDireccion} />
        <Field label="TELÉFONO DE EMERGENCIA:" value={card.emergenciaTelefono} />
        <View style={s.grow} />
        <Text style={s.rec}>{BOLETA_RECOMENDACION}</Text>
      </View>

      <View style={s.right}>
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
    </View>
  );
}

export type BoletasPermisoPdfProps = {
  convocatoria: BoletaPermisoConvocatoriaInfo;
  cards: BoletaPermisoCard[];
  logoCefoa: Buffer | null;
  logoEjercito: Buffer | null;
};

export function BoletasPermisoPdfDocument({
  convocatoria,
  cards,
  logoCefoa,
  logoEjercito,
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
            />
            {bottom ? (
              <BoletaCard
                card={bottom}
                convocatoria={convocatoria}
                logoCefoa={logoCefoa}
                logoEjercito={logoEjercito}
              />
            ) : (
              <View style={{ height: (792 - 144 - GAP) / 2 }} />
            )}
          </View>
        </Page>
      ))}
    </Document>
  );
}
