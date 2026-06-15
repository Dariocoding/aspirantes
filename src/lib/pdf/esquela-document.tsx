import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { ESQUELA_PDF_FONT_FAMILY, registerEsquelaPdfFonts } from "@src/lib/pdf/register-esquela-pdf-fonts";

registerEsquelaPdfFonts();

/** Cromática alineada con `src/lib/branding.ts` (FANB). */
const C = {
  yellow: "#ffcf00",
  blue: "#00247e",
  red: "#cf142b",
  ink: "#0a1628",
  inkMuted: "#334155",
  paper: "#fbf9f6",
  card: "#ffffff",
  border: "#c9b896",
  gold: "#8b6914",
  footerBar: "#0f172a",
} as const;

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    fontFamily: ESQUELA_PDF_FONT_FAMILY,
    color: C.ink,
    backgroundColor: C.paper,
    minHeight: "100%",
  },
  flagBand: {
    flexDirection: "column",
    width: "100%",
  },
  stripeY: { height: 6, backgroundColor: C.yellow, width: "100%" },
  stripeB: { height: 6, backgroundColor: C.blue, width: "100%" },
  stripeR: { height: 6, backgroundColor: C.red, width: "100%" },
  goldRule: {
    height: 2,
    backgroundColor: C.gold,
    opacity: 0.85,
    width: "100%",
  },
  headerBlock: {
    paddingHorizontal: 42,
    paddingTop: 22,
    paddingBottom: 18,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
  },
  logoWrap: {
    width: 86,
    height: 108,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 82,
    objectFit: "contain",
  },
  headerTexts: {
    flex: 1,
    flexDirection: "column",
    gap: 3,
    paddingLeft: 4,
    borderLeftWidth: 3,
    borderLeftColor: C.blue,
    paddingVertical: 2,
    paddingHorizontal: 12,
  },
  lineInstitution1: {
    fontSize: 7.5,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: C.inkMuted,
    fontWeight: "bold",
  },
  lineInstitution2: {
    fontSize: 8,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: C.ink,
    fontWeight: "bold",
  },
  lineInstitution3: {
    fontSize: 7,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: C.blue,
    marginTop: 2,
    fontWeight: "bold",
  },
  refRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
  },
  refLabel: {
    fontSize: 8,
    color: C.inkMuted,
    letterSpacing: 0.4,
  },
  refValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: C.ink,
    letterSpacing: 0.5,
  },
  bodyWrap: {
    flex: 1,
    paddingHorizontal: 42,
    paddingTop: 26,
    paddingBottom: 20,
  },
  docKindPill: {
    alignSelf: "center",
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "#fffdf8",
    marginBottom: 14,
  },
  docKindText: {
    fontSize: 8,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: C.gold,
    fontWeight: "bold",
  },
  titleCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderLeftWidth: 5,
    borderLeftColor: C.blue,
    paddingVertical: 18,
    paddingHorizontal: 22,
    marginBottom: 20,
  },
  titleMain: {
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
    color: C.ink,
    lineHeight: 1.35,
    marginBottom: 6,
  },
  titleSub: {
    fontSize: 9,
    textAlign: "center",
    color: C.inkMuted,
    lineHeight: 1.4,
  },
  cuerpoFrame: {
    borderWidth: 1,
    borderColor: "#e8e4dc",
    backgroundColor: "#fffefb",
    paddingVertical: 20,
    paddingHorizontal: 24,
    minHeight: 120,
    marginBottom: 18,
  },
  cuerpoText: {
    fontSize: 11.5,
    lineHeight: 1.75,
    textAlign: "justify",
    color: C.ink,
  },
  fechaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 28,
  },
  fechaLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: C.inkMuted,
    fontWeight: "bold",
  },
  fechaBox: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  fechaValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: C.blue,
    letterSpacing: 0.3,
  },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 36,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  sigCol: {
    flex: 1,
    alignItems: "center",
  },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: C.ink,
    width: "100%",
    marginBottom: 6,
    height: 28,
  },
  sigCaption: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: C.inkMuted,
    textAlign: "center",
  },
  motto: {
    marginTop: 22,
    textAlign: "center",
    fontSize: 9,
    fontStyle: "italic",
    color: C.blue,
    letterSpacing: 0.6,
  },
  footer: {
    backgroundColor: C.footerBar,
    paddingVertical: 12,
    paddingHorizontal: 42,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    fontSize: 7.5,
    color: "#e2e8f0",
    maxWidth: "62%",
    lineHeight: 1.45,
  },
  footerRight: {
    fontSize: 7,
    color: "#94a3b8",
    textAlign: "right",
    letterSpacing: 0.3,
  },
});

export type EsquelaPdfProps = {
  titulo: string;
  cuerpo: string;
  fechaTexto: string;
  logoPng: Buffer | null;
  referencia: string;
};

export function EsquelaPdfDocument({ titulo, cuerpo, fechaTexto, logoPng, referencia }: EsquelaPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.flagBand}>
          <View style={styles.stripeY} />
          <View style={styles.stripeB} />
          <View style={styles.stripeR} />
        </View>
        <View style={styles.goldRule} />

        <View style={styles.headerBlock}>
          <View style={styles.headerRow}>
            <View style={styles.logoWrap}>
              {logoPng ? (
                <Image src={logoPng} style={styles.logo} />
              ) : (
                <View
                  style={{
                    width: 82,
                    height: 82,
                    borderWidth: 1,
                    borderColor: "#cbd5e1",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 7, color: C.inkMuted, textAlign: "center" }}>Logo{"\n"}institucional</Text>
                </View>
              )}
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.lineInstitution1}>República Bolivariana de Venezuela</Text>
              <Text style={styles.lineInstitution2}>Ministerio del Poder Popular para la Defensa</Text>
              <Text style={styles.lineInstitution2}>Fuerza Armada Nacional Bolivariana</Text>
              <Text style={styles.lineInstitution3}>Ejército Bolivariano — Gestión de personal</Text>
            </View>
          </View>
          <View style={styles.refRow}>
            <Text style={styles.refLabel}>Documento memorístico (esquela)</Text>
            <Text style={styles.refValue}>Ref. {referencia}</Text>
          </View>
        </View>

        <View style={styles.bodyWrap}>
          <View style={styles.docKindPill}>
            <Text style={styles.docKindText}>Memorándum ceremonial</Text>
          </View>

          <View style={styles.titleCard}>
            <Text style={styles.titleMain}>{titulo}</Text>
            <Text style={styles.titleSub}>
              Texto íntegro registrado en el sistema de gestión de aspirantes y efemérides institucionales.
            </Text>
          </View>

          <View style={styles.cuerpoFrame}>
            <Text style={styles.cuerpoText}>{cuerpo}</Text>
          </View>

          <View style={styles.fechaRow}>
            <Text style={styles.fechaLabel}>Fecha del acto / conmemoración</Text>
            <View style={styles.fechaBox}>
              <Text style={styles.fechaValue}>{fechaTexto}</Text>
            </View>
          </View>

          <View style={styles.signatures}>
            <View style={styles.sigCol}>
              <View style={styles.sigLine} />
              <Text style={styles.sigCaption}>Autoridad competente</Text>
              <Text style={[styles.sigCaption, { marginTop: 2, fontSize: 7 }]}>Nombre, grado y firma</Text>
            </View>
            <View style={styles.sigCol}>
              <View style={styles.sigLine} />
              <Text style={styles.sigCaption}>Unidad emisora</Text>
              <Text style={[styles.sigCaption, { marginTop: 2, fontSize: 7 }]}>Sello (si aplica)</Text>
            </View>
          </View>

          <Text style={styles.motto}>
            {`"Independencia, Federación y República Social" - lealtad a la Patria y al pueblo venezolano.`}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerLeft}>
              Documento generado electrónicamente por el sistema interno de censo y administración de aspirantes. Válido
              para archivo y difusión interna conforme a la normativa de la unidad. La reproducción alterada carece de
              valor oficial.
            </Text>
            <Text style={styles.footerRight}>
              FANB · Uso oficial{"\n"}
              No divulgar en medios no autorizados
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
