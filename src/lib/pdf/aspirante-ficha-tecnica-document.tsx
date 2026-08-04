import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { FichaEvaluacionState } from "@src/lib/aspirantes/ficha-evaluacion";

const GREEN = "#1B5E20";
const BORDER = "#111111";
const LABEL = "#111111";

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
    fontSize: 7,
    color: LABEL,
  },
  main: {
    flex: 1,
    padding: 10,
    paddingRight: 6,
    gap: 4,
  },
  sidebar: {
    width: 52,
    backgroundColor: GREEN,
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 4,
  },
  foto: {
    width: 42,
    height: 52,
    objectFit: "cover",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    marginBottom: 8,
  },
  fotoPlaceholder: {
    width: 42,
    height: 52,
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  photoPlaceholderText: {
    color: GREEN,
    fontSize: 5,
    textAlign: "center",
  },
  verticalLetters: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 1,
  },
  verticalLetter: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    gap: 4,
  },
  col: {
    flex: 1,
    gap: 4,
  },
  box: {
    borderWidth: 1,
    borderColor: BORDER,
  },
  boxPad: {
    borderWidth: 1,
    borderColor: BORDER,
    padding: 4,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    textTransform: "uppercase",
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 2,
    alignItems: "flex-end",
  },
  fieldLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    textTransform: "uppercase",
    marginRight: 3,
  },
  fieldValue: {
    flex: 1,
    fontSize: 7,
    textTransform: "uppercase",
    borderBottomWidth: 0.5,
    borderBottomColor: "#888",
    paddingBottom: 1,
  },
  table: {
    borderWidth: 1,
    borderColor: BORDER,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#999",
    minHeight: 14,
  },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 5.5,
    textTransform: "uppercase",
    padding: 2,
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
  },
  td: {
    fontSize: 6,
    textTransform: "uppercase",
    padding: 2,
    borderRightWidth: 0.5,
    borderRightColor: "#CCC",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    gap: 4,
  },
  checkLabel: {
    flex: 1,
    fontSize: 6,
    textTransform: "uppercase",
  },
  checkPair: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  checkbox: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: "center",
    alignItems: "center",
  },
  checkX: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
  },
  checkCaption: {
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
  },
  fisicoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  fisicoCell: {
    width: "33.33%",
    borderWidth: 0.5,
    borderColor: BORDER,
    padding: 3,
    minHeight: 22,
  },
  fisicoLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 5.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  fisicoValue: {
    fontSize: 8,
    textAlign: "center",
  },
  apreciacionBody: {
    fontSize: 6.5,
    lineHeight: 1.35,
    textAlign: "justify",
    minHeight: 48,
  },
  gradoRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  headerBand: {
    borderWidth: 1,
    borderColor: BORDER,
    padding: 4,
    marginBottom: 2,
    backgroundColor: "#F9FAFB",
  },
  headerBandText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  smallMuted: {
    fontSize: 5.5,
    color: "#555",
    marginTop: 2,
  },
});

function dash(v: string | null | undefined): string {
  const t = (v ?? "").trim();
  return t.length ? t : " ";
}

function formatCedulaVe(cedula: string): string {
  const digits = cedula.replace(/\D/g, "");
  if (!digits) return " ";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function Check({ checked }: { checked: boolean }) {
  return (
    <View style={styles.checkbox}>
      {checked ? <Text style={styles.checkX}>X</Text> : null}
    </View>
  );
}

function SiNo({ value }: { value: boolean | null }) {
  return (
    <View style={styles.checkPair}>
      <View style={styles.checkItem}>
        <Text style={styles.checkCaption}>SI</Text>
        <Check checked={value === true} />
      </View>
      <View style={styles.checkItem}>
        <Text style={styles.checkCaption}>NO</Text>
        <Check checked={value === false} />
      </View>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}:</Text>
      <Text style={styles.fieldValue}>{dash(value)}</Text>
    </View>
  );
}

export type AspiranteFichaTecnicaPdfProps = {
  nombres: string;
  apellidos: string;
  cedula: string;
  edad: number;
  sexo: "MASCULINO" | "FEMENINO";
  telefono: string | null;
  hijosCantidad: number;
  unidadPostulante: string;
  convocatoriaNombre: string;
  convocatoriaCodigo: string;
  /** JPEG/PNG buffer para @react-pdf; null si no hay foto usable. */
  foto: Buffer | null;
  ficha: FichaEvaluacionState;
  /** Campos aún no modelados en BD — se dejan en blanco o con valor opcional. */
  estadoCivil?: string | null;
  especialidad?: string | null;
  nivelEducativo?: string | null;
  ordenMerito?: string | null;
  cmdteCursoNombre?: string | null;
  cmdteCursoTelefono?: string | null;
  apreciacionGeneral?: string | null;
  inscritoSacs?: boolean | null;
  sacsPorQue?: string | null;
  otorgamientoGrado?: "CAP_TN" | "PTTE_TF" | "TTE_TC" | null;
  investigacionAdministrativa?: boolean | null;
  investigacionPenalMilitar?: boolean | null;
  investigacionJudicial?: boolean | null;
  juicioAbierto?: boolean | null;
  registroSipol?: boolean | null;
  estudios?: Array<{
    universidad: string;
    titulo: string;
    pais: string;
    anioIngreso: string;
    anioEgreso: string;
    nucleo: string;
  }>;
  cursosRealizados?: string[];
};

function valorPrueba(
  ficha: FichaEvaluacionState,
  id: string,
  sexo: "MASCULINO" | "FEMENINO",
): string {
  const fila = ficha.pruebaFisica.filas[id];
  if (!fila) return "";
  const prefer = sexo === "FEMENINO" ? fila.datosF || fila.datosM : fila.datosM || fila.datosF;
  return (prefer || fila.calificacion || "").trim();
}

const SIDEBAR_TITLE = "EJÉRCITO BOLIVARIANO";

export function AspiranteFichaTecnicaPdfDocument(props: AspiranteFichaTecnicaPdfProps) {
  const nombreCompleto = `${props.nombres} ${props.apellidos}`.trim().toUpperCase();
  const estudios = props.estudios?.length
    ? props.estudios
    : [
        { universidad: "", titulo: "", pais: "", anioIngreso: "", anioEgreso: "", nucleo: "" },
        { universidad: "", titulo: "", pais: "", anioIngreso: "", anioEgreso: "", nucleo: "" },
      ];

  const fisica = [
    { label: "CARRERA", value: valorPrueba(props.ficha, "potencia_aerobica_2400m", props.sexo) },
    { label: "BARRA FIJA", value: valorPrueba(props.ficha, "barra_fija_dominada", props.sexo) },
    { label: "ABDOMINAL", value: valorPrueba(props.ficha, "abdominales_60", props.sexo) },
    { label: "FLEXIONES", value: valorPrueba(props.ficha, "flexiones_60", props.sexo) },
    { label: "PISCINA", value: valorPrueba(props.ficha, "natacion_50m", props.sexo) },
    {
      label: "TOTAL",
      value: (props.ficha.pruebaFisica.calificacionObtenida || "").trim(),
    },
  ];

  return (
    <Document
      title={`Ficha técnica — ${nombreCompleto}`}
      author="Ejército Bolivariano"
      subject="Ficha técnica de aspirante"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.main}>
          <View style={styles.headerBand}>
            <Text style={styles.headerBandText}>
              Ficha técnica del aspirante · {props.convocatoriaNombre} ({props.convocatoriaCodigo})
            </Text>
          </View>

          <View style={styles.row}>
            {/* Columna izquierda */}
            <View style={[styles.col, { flex: 1.15 }]}>
              <View style={styles.boxPad}>
                <Field label="Unidad quien postula" value={props.unidadPostulante} />
              </View>

              <View style={styles.boxPad}>
                <Text style={styles.sectionTitle}>Estudios conducentes a título universitario</Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, { width: "28%" }]}>Universidad</Text>
                    <Text style={[styles.th, { width: "24%" }]}>Título</Text>
                    <Text style={[styles.th, { width: "12%" }]}>País</Text>
                    <Text style={[styles.th, { width: "10%" }]}>Ingreso</Text>
                    <Text style={[styles.th, { width: "10%" }]}>Egreso</Text>
                    <Text style={[styles.th, { width: "16%", borderRightWidth: 0 }]}>Núcleo</Text>
                  </View>
                  {estudios.map((e, i) => (
                    <View key={i} style={styles.tableRow}>
                      <Text style={[styles.td, { width: "28%" }]}>{dash(e.universidad)}</Text>
                      <Text style={[styles.td, { width: "24%" }]}>{dash(e.titulo)}</Text>
                      <Text style={[styles.td, { width: "12%" }]}>{dash(e.pais)}</Text>
                      <Text style={[styles.td, { width: "10%" }]}>{dash(e.anioIngreso)}</Text>
                      <Text style={[styles.td, { width: "10%" }]}>{dash(e.anioEgreso)}</Text>
                      <Text style={[styles.td, { width: "16%", borderRightWidth: 0 }]}>
                        {dash(e.nucleo)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.boxPad}>
                <Text style={styles.sectionTitle}>Cursos realizados</Text>
                {(props.cursosRealizados?.length ? props.cursosRealizados : ["", ""]).map((c, i) => (
                  <Text key={i} style={[styles.fieldValue, { marginBottom: 3 }]}>
                    {dash(c)}
                  </Text>
                ))}
              </View>

              <View style={styles.boxPad}>
                <View style={[styles.fieldRow, { alignItems: "center" }]}>
                  <Text style={[styles.fieldLabel, { marginRight: 8 }]}>Inscrito en el SACS</Text>
                  <SiNo value={props.inscritoSacs ?? null} />
                </View>
                <Field label="¿Por qué?" value={props.sacsPorQue ?? ""} />
              </View>

              <View style={[styles.boxPad, { flex: 1 }]}>
                <Text style={styles.sectionTitle}>Apreciación general</Text>
                <Text style={styles.apreciacionBody}>
                  {dash(props.apreciacionGeneral) === " "
                    ? ""
                    : props.apreciacionGeneral}
                </Text>
                {!props.apreciacionGeneral?.trim() ? (
                  <Text style={styles.smallMuted}>
                    (Pendiente de cargar en el sistema — se imprimirá cuando esté disponible.)
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Columna derecha (antes de la barra verde) */}
            <View style={[styles.col, { flex: 1 }]}>
              <View style={styles.boxPad}>
                <Field label="Nombres y apellidos" value={nombreCompleto} />
                <Field label="Cédula de identidad" value={formatCedulaVe(props.cedula)} />
                <Field label="Edad" value={`${props.edad} AÑOS`} />
                <Field label="Estado civil" value={props.estadoCivil ?? ""} />
                <Field
                  label="Hijos"
                  value={String(props.hijosCantidad).padStart(2, "0")}
                />
                <Field label="Especialidad" value={props.especialidad ?? ""} />
                <Field label="Nivel educativo" value={props.nivelEducativo ?? ""} />
                <Field label="N° de teléfono aspirante" value={props.telefono ?? ""} />
              </View>

              <View style={styles.boxPad}>
                <Field label="Orden de mérito" value={props.ordenMerito ?? ""} />
                <Field label="Nombre del Cmdte de curso" value={props.cmdteCursoNombre ?? ""} />
                <Field label="Teléfono del Cmdte de curso" value={props.cmdteCursoTelefono ?? ""} />
              </View>

              <View style={styles.boxPad}>
                <Text style={styles.sectionTitle}>Régimen disciplinario / antecedentes</Text>
                {(
                  [
                    ["Investigación administrativa", props.investigacionAdministrativa],
                    ["Investigación penal militar", props.investigacionPenalMilitar],
                    ["Investigación judicial", props.investigacionJudicial],
                    ["Juicio abierto", props.juicioAbierto],
                    ["Registro SIPOL", props.registroSipol],
                  ] as const
                ).map(([label, val]) => (
                  <View key={label} style={styles.checkRow}>
                    <Text style={styles.checkLabel}>{label}</Text>
                    <SiNo value={val ?? null} />
                  </View>
                ))}
              </View>

              <View style={styles.boxPad}>
                <Text style={styles.sectionTitle}>Resultados de evaluación física</Text>
                <View style={styles.fisicoGrid}>
                  {fisica.map((f) => (
                    <View key={f.label} style={styles.fisicoCell}>
                      <Text style={styles.fisicoLabel}>{f.label}</Text>
                      <Text style={styles.fisicoValue}>{dash(f.value)}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.boxPad}>
                <Text style={styles.sectionTitle}>Otorgamiento de grado</Text>
                <View style={styles.gradoRow}>
                  {(
                    [
                      ["CAP/TN", "CAP_TN"],
                      ["PTTE/TF", "PTTE_TF"],
                      ["TTE/TC", "TTE_TC"],
                    ] as const
                  ).map(([label, key]) => (
                    <View key={key} style={styles.checkItem}>
                      <Text style={styles.checkCaption}>{label}</Text>
                      <Check checked={props.otorgamientoGrado === key} />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sidebar}>
          {props.foto ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
            <Image src={props.foto} style={styles.foto} />
          ) : (
            <View style={styles.fotoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>SIN{"\n"}FOTO</Text>
            </View>
          )}
          <View style={styles.verticalLetters}>
            {SIDEBAR_TITLE.split("").map((ch, i) => (
              <Text key={`${ch}-${i}`} style={styles.verticalLetter}>
                {ch === " " ? "·" : ch}
              </Text>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
