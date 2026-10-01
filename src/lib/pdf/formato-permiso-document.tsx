import { Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { FormatoPermisoPresentacion } from "@src/lib/pdf/formato-permiso";
import {
  FICHA_TECNICA_PDF_FONT_FAMILY,
  registerFichaTecnicaPdfFonts,
} from "@src/lib/pdf/register-ficha-tecnica-fonts";

registerFichaTecnicaPdfFonts();
Font.registerHyphenationCallback((word) => [word]);

const FONT = FICHA_TECNICA_PDF_FONT_FAMILY;
const INK = "#000000";
const COLS = ["16%", "22%", "20%", "18%", "24%"] as const;

const s = StyleSheet.create({
  page: {
    fontFamily: FONT,
    color: INK,
    paddingTop: 28,
    paddingBottom: 28,
    paddingLeft: 28,
    paddingRight: 28,
    backgroundColor: "#FFFFFF",
  },
  frame: {
    borderWidth: 2.2,
    borderColor: INK,
    paddingTop: 8,
    paddingBottom: 10,
    paddingLeft: 8,
    paddingRight: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 78,
  },
  logoSlot: {
    width: 58,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 52, height: 68, objectFit: "contain" },
  headerTexts: { flex: 1, paddingHorizontal: 4 },
  hLine: { fontSize: 6.6, fontWeight: "bold", textAlign: "center", lineHeight: 1.15 },
  title: {
    marginTop: 8,
    marginBottom: 2,
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    textDecoration: "underline",
    letterSpacing: 0.6,
  },
  anulado: {
    marginBottom: 4,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    color: "#9f1239",
  },
  table: {
    marginTop: 8,
    borderTopWidth: 0.9,
    borderLeftWidth: 0.9,
    borderColor: INK,
  },
  row: { flexDirection: "row" },
  cell: {
    borderRightWidth: 0.9,
    borderBottomWidth: 0.9,
    borderColor: INK,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    paddingVertical: 4,
    minHeight: 18,
  },
  valueCell: { minHeight: 24 },
  addressLabel: { alignItems: "flex-start", minHeight: 28 },
  addressValue: { alignItems: "flex-start", justifyContent: "center", minHeight: 28 },
  label: { fontSize: 6.2, fontWeight: "bold", textAlign: "center" },
  value: { fontSize: 8, fontWeight: "bold", textAlign: "center" },
  addressText: { fontSize: 8, fontWeight: "bold", textAlign: "left" },
  sign: { marginTop: 16, alignItems: "center" },
  signName: { fontSize: 9, fontWeight: "bold", textAlign: "center" },
  signCargo: { marginTop: 2, fontSize: 8, fontWeight: "bold", textAlign: "center", lineHeight: 1.25 },
  nota: { marginTop: 14, fontSize: 7.2, textAlign: "left", lineHeight: 1.3 },
});

function shown(value: string): string {
  return value.trim() || " ";
}

function Crest({ src }: { src: string | null }) {
  return <View style={s.logoSlot}>{src ? <Image src={{ uri: src }} style={s.logo} /> : null}</View>;
}

function Cells({
  values,
  kind,
}: {
  values: readonly string[];
  kind: "label" | "value";
}) {
  return (
    <View style={s.row}>
      {values.map((value, index) => (
        <View
          key={`${kind}-${index}`}
          style={[s.cell, kind === "value" ? s.valueCell : {}, { width: COLS[index] }]}
        >
          <Text style={kind === "label" ? s.label : s.value}>{shown(value)}</Text>
        </View>
      ))}
    </View>
  );
}

export function FormatoPermisoPdfDocument({
  presentacion,
  logoIzq,
  logoDer,
}: {
  presentacion: FormatoPermisoPresentacion;
  logoIzq: string | null;
  logoDer: string | null;
}) {
  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.frame}>
        <View style={s.header}>
          <Crest src={logoIzq} />
          <View style={s.headerTexts}>
            {presentacion.lineas.map((line, index) => (
              <Text key={`${index}-${line}`} style={s.hLine}>
                {line}
              </Text>
            ))}
          </View>
          <Crest src={logoDer} />
        </View>

        <Text style={s.title}>{presentacion.titulo}</Text>
        {presentacion.anulado ? <Text style={s.anulado}>ANULADO</Text> : null}

        <View style={s.table}>
          <Cells
            kind="label"
            values={["JERARQUÍA", "APELLIDOS", "NOMBRES", "CÉDULA IDENTIDAD", "COMPAÑÍA"]}
          />
          <Cells
            kind="value"
            values={[
              presentacion.jerarquia,
              presentacion.apellidos,
              presentacion.nombres,
              presentacion.cedula,
              presentacion.compania,
            ]}
          />
          <Cells
            kind="label"
            values={["DURACIÓN", "DESDE", "HASTA", "TIPO PERMISO", "TELÉFONO HABITACIÓN"]}
          />
          <Cells
            kind="value"
            values={[
              presentacion.duracion,
              presentacion.desde,
              presentacion.hasta,
              presentacion.tipo,
              presentacion.telefono,
            ]}
          />
          <View style={s.row}>
            <View style={[s.cell, s.addressLabel, { width: COLS[0] }]}>
              <Text style={s.label}>DIRECCIÓN HABITACIÓN:</Text>
            </View>
            <View style={[s.cell, s.addressValue, { width: "84%" }]}>
              <Text style={s.addressText}>{shown(presentacion.direccion)}</Text>
            </View>
          </View>
        </View>

        <View style={s.sign}>
          <Text style={s.signName}>{shown(presentacion.firmanteNombre)}</Text>
          <Text style={s.signCargo}>{shown(presentacion.firmanteCargo)}</Text>
        </View>
        {presentacion.nota ? <Text style={s.nota}>{presentacion.nota}</Text> : null}
      </View>
    </Page>
  );
}
