import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  FICHA_TECNICA_PDF_FONT_FAMILY,
  registerFichaTecnicaPdfFonts,
} from "@src/lib/pdf/register-ficha-tecnica-fonts";

registerFichaTecnicaPdfFonts();

const FONT = FICHA_TECNICA_PDF_FONT_FAMILY;

export type ConstanciaEstudiosPerson = {
  nombres: string;
  apellidos: string;
  cedula: string;
  trato: string;
  fechaNacimiento: string;
  tipoEstudio: string;
  universidad: string;
  nucleo: string;
  titulo: string;
  pais: string;
  anioIngreso: string;
  anioEgreso: string;
  unidad: string;
  peloton: string;
  convocatoriaNombre: string;
  convocatoriaCodigo: string;
  convocatoriaAnio: string;
  comandante: string;
};

const styles = StyleSheet.create({
  page: {
    fontFamily: FONT,
    fontSize: 11,
    color: "#0f172a",
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 48,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  logo: {
    width: 58,
    height: 58,
    objectFit: "contain",
  },
  headerText: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  inst: {
    fontSize: 8,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  instBold: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
    marginTop: 2,
  },
  rule: {
    marginTop: 8,
    marginBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: "#14532d",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    textAlign: "center",
    color: "#334155",
    marginBottom: 16,
  },
  body: {
    fontSize: 11,
    lineHeight: 1.45,
    textAlign: "justify",
    marginBottom: 14,
  },
  table: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    marginBottom: 22,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  rowLast: {
    flexDirection: "row",
  },
  label: {
    width: "32%",
    backgroundColor: "#f8fafc",
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#334155",
  },
  value: {
    width: "68%",
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 10,
  },
  sign: {
    marginTop: 28,
    alignItems: "center",
  },
  signLine: {
    width: 220,
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
    marginBottom: 4,
  },
  signName: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  signRole: {
    fontSize: 8,
    textAlign: "center",
    color: "#334155",
    textTransform: "uppercase",
  },
  place: {
    marginTop: 18,
    fontSize: 10,
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 7.5,
    color: "#64748b",
    textAlign: "center",
  },
});

function Field({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={last ? styles.rowLast : styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value.trim() || "—"}</Text>
    </View>
  );
}

function ConstanciaPage({
  person,
  emitidaEn,
  logoCefoa,
  logoEjercito,
}: {
  person: ConstanciaEstudiosPerson;
  emitidaEn: string;
  logoCefoa: string | null;
  logoEjercito: string | null;
}) {
  const nombre = `${person.nombres} ${person.apellidos}`.replace(/\s+/g, " ").trim();
  const curso = [person.convocatoriaNombre, person.convocatoriaCodigo, person.convocatoriaAnio]
    .filter((part) => part.trim())
    .join(" · ");

  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        {logoEjercito ? <Image src={logoEjercito} style={styles.logo} /> : <View style={styles.logo} />}
        <View style={styles.headerText}>
          <Text style={styles.inst}>República Bolivariana de Venezuela</Text>
          <Text style={styles.inst}>Ministerio del Poder Popular para la Defensa</Text>
          <Text style={styles.instBold}>Ejército Bolivariano</Text>
          <Text style={styles.inst}>Dirección de Educación del Ejército</Text>
        </View>
        {logoCefoa ? <Image src={logoCefoa} style={styles.logo} /> : <View style={styles.logo} />}
      </View>
      <View style={styles.rule} />
      <Text style={styles.title}>CONSTANCIA DE ESTUDIOS</Text>
      <Text style={styles.subtitle}>{curso || "Curso de formación"}</Text>
      <Text style={styles.body}>
        {`Quien suscribe hace constar que ${person.trato} ${nombre}, titular de la cédula de identidad N° ${person.cedula}, se encuentra inscrito en ${person.convocatoriaNombre || "el curso"}, correspondiente al año ${person.convocatoriaAnio || "en curso"}. Los estudios registrados en el censo corresponden a ${person.tipoEstudio}, cursados en ${person.universidad}${person.titulo.trim() ? `, con el título de ${person.titulo}` : ""}.`}
      </Text>
      <View style={styles.table}>
        <Field label="Apellidos y nombres" value={nombre} />
        <Field label="Cédula" value={person.cedula} />
        <Field label="Fecha de nacimiento" value={person.fechaNacimiento} />
        <Field label="Nivel de estudio" value={person.tipoEstudio} />
        <Field label="Título" value={person.titulo} />
        <Field label="Universidad" value={person.universidad} />
        <Field label="Núcleo / sede" value={person.nucleo} />
        <Field label="País" value={person.pais} />
        <Field label="Año de ingreso" value={person.anioIngreso} />
        <Field label="Año de egreso" value={person.anioEgreso} />
        <Field label="Unidad postulante" value={person.unidad} />
        <Field label="Pelotón" value={person.peloton} />
        <Field label="Convocatoria" value={curso} last />
      </View>
      <Text style={styles.place}>{`Caracas, ${emitidaEn}`}</Text>
      <View style={styles.sign}>
        <View style={styles.signLine} />
        <Text style={styles.signName}>{person.comandante.trim() || "Comandante del curso"}</Text>
        <Text style={styles.signRole}>Comandante del curso</Text>
      </View>
      <Text style={styles.footer}>
        Formato provisional. Se sustituirá por el modelo oficial cuando esté disponible.
      </Text>
    </Page>
  );
}

export function ConstanciaEstudiosPdfDocument({
  people,
  emitidaEn,
  logoCefoa,
  logoEjercito,
}: {
  people: ConstanciaEstudiosPerson[];
  emitidaEn: string;
  logoCefoa: string | null;
  logoEjercito: string | null;
}) {
  return (
    <Document title="Constancia de estudios" author="FANB Aspirantes">
      {people.map((person) => (
        <ConstanciaPage
          key={`${person.cedula}-${person.convocatoriaCodigo}`}
          person={person}
          emitidaEn={emitidaEn}
          logoCefoa={logoCefoa}
          logoEjercito={logoEjercito}
        />
      ))}
    </Document>
  );
}
