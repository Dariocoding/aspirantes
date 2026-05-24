import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  MANUAL_USUARIO_SUBTITLE,
  MANUAL_USUARIO_TITLE,
  manualUsuarioIntro,
  manualUsuarioResumenRoles,
  manualUsuarioSections,
} from "@/lib/manual-usuario-content";
import { ESQUELA_PDF_FONT_FAMILY, registerEsquelaPdfFonts } from "@/lib/pdf/register-esquela-pdf-fonts";

registerEsquelaPdfFonts();

const C = {
  ink: "#0f172a",
  inkMuted: "#475569",
  border: "#cbd5e1",
  band: "#00247e",
  paper: "#ffffff",
} as const;

const styles = StyleSheet.create({
  page: {
    fontFamily: ESQUELA_PDF_FONT_FAMILY,
    fontSize: 10,
    color: C.ink,
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 44,
    backgroundColor: C.paper,
  },
  topStripe: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: C.band,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
    color: C.ink,
  },
  subtitle: {
    fontSize: 9.5,
    color: C.inkMuted,
    marginBottom: 16,
    lineHeight: 1.35,
  },
  h2: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
    color: C.band,
  },
  p: {
    fontSize: 10,
    lineHeight: 1.45,
    marginBottom: 8,
    color: C.ink,
  },
  bullet: {
    fontSize: 9.5,
    lineHeight: 1.4,
    marginBottom: 4,
    paddingLeft: 10,
    color: C.ink,
  },
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  trHead: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  th: {
    flex: 1,
    fontSize: 8,
    fontWeight: "bold",
    padding: 5,
    color: C.ink,
  },
  td: {
    flex: 1,
    fontSize: 7.5,
    padding: 5,
    color: C.ink,
    lineHeight: 1.25,
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 44,
    right: 44,
    fontSize: 8,
    color: C.inkMuted,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 6,
  },
});

export type ManualUsuarioPdfDocumentProps = {
  /** ISO date (YYYY-MM-DD) para pie de página. */
  generatedOn: string;
};

export function ManualUsuarioPdfDocument({ generatedOn }: ManualUsuarioPdfDocumentProps) {
  return (
    <Document title={MANUAL_USUARIO_TITLE} author="FANB — Gestión de aspirantes">
      <Page size="A4" style={styles.page}>
        <View style={styles.topStripe} fixed />
        <Text style={styles.title}>{MANUAL_USUARIO_TITLE}</Text>
        <Text style={styles.subtitle}>{MANUAL_USUARIO_SUBTITLE}</Text>
        {manualUsuarioIntro.map((t, i) => (
          <Text key={`intro-${i}`} style={styles.p}>
            {t}
          </Text>
        ))}
        <Text style={styles.h2}>Resumen por rol</Text>
        <View style={styles.table}>
          <View style={styles.trHead}>
            <Text style={[styles.th, { flex: 0.9 }]}>Rol</Text>
            <Text style={[styles.th, { flex: 1.1 }]}>Censo</Text>
            <Text style={[styles.th, { flex: 0.55 }]}>Export.</Text>
            <Text style={[styles.th, { flex: 1.15 }]}>Administración</Text>
          </View>
          {manualUsuarioResumenRoles.map((r) => (
            <View key={r.rol} style={styles.tr} wrap={false}>
              <Text style={[styles.td, { flex: 0.9 }]}>{r.rol}</Text>
              <Text style={[styles.td, { flex: 1.1 }]}>{r.censo}</Text>
              <Text style={[styles.td, { flex: 0.55 }]}>{r.export}</Text>
              <Text style={[styles.td, { flex: 1.15 }]}>{r.config}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.footer} fixed>
          Documento generado el {generatedOn}. Uso interno.
        </Text>
      </Page>

      {manualUsuarioSections.map((sec) => (
        <Page key={sec.id} size="A4" style={styles.page}>
          <View style={styles.topStripe} fixed />
          <Text style={styles.h2}>{sec.title}</Text>
          {sec.paragraphs.map((t, i) => (
            <Text key={`${sec.id}-p-${i}`} style={styles.p}>
              {t}
            </Text>
          ))}
          {sec.bullets?.map((b, i) => (
            <Text key={`${sec.id}-b-${i}`} style={styles.bullet}>
              {"\u2022 "}
              {b}
            </Text>
          ))}
          <Text style={styles.footer} fixed>
            Documento generado el {generatedOn}. Uso interno.
          </Text>
        </Page>
      ))}
    </Document>
  );
}
