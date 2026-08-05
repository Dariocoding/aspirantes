import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { FichaEvaluacionState } from "@src/lib/aspirantes/ficha-evaluacion";

/** Verde institucional del encabezado (aprox. sample oficial). */
const GREEN = "#1A5C2A";
const GREEN_SOFT = "#D8F0DC";
const RED_UNIT = "#C62828";
const BORDER = "#000000";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
    fontSize: 7,
    color: "#000000",
    padding: 10,
  },
  header: {
    backgroundColor: GREEN,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: BORDER,
    borderBottomWidth: 0,
  },
  headerText: {
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    textAlign: "center",
    letterSpacing: 1.2,
  },
  grid: {
    borderWidth: 1,
    borderColor: BORDER,
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
    padding: 3,
  },
  cellLast: {
    borderRightWidth: 0,
  },
  cellNoBottom: {
    borderBottomWidth: 0,
  },
  label: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 7.5,
    textTransform: "uppercase",
    marginTop: 1,
  },
  valueCenter: {
    fontSize: 7.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  valueRed: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: RED_UNIT,
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: 2,
  },
  sectionBanner: {
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderColor: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  sectionBannerText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  fotoWrap: {
    width: 88,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 3,
  },
  foto: {
    width: 78,
    height: 98,
    objectFit: "cover",
  },
  fotoPlaceholder: {
    width: 78,
    height: 98,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  meritoBox: {
    width: 88,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
    padding: 3,
    backgroundColor: GREEN_SOFT,
  },
  meritoLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 5.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  meritoValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: GREEN,
    textAlign: "center",
    marginTop: 2,
  },
  fieldRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: BORDER,
    minHeight: 16,
  },
  fieldLabelCell: {
    width: "42%",
    paddingHorizontal: 3,
    paddingVertical: 2,
    justifyContent: "center",
    borderRightWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FAFAFA",
  },
  fieldValueCell: {
    width: "58%",
    paddingHorizontal: 3,
    paddingVertical: 2,
    justifyContent: "center",
  },
  checkBox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
  },
  checkX: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
  siNo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  siNoCaption: {
    fontFamily: "Helvetica-Bold",
    fontSize: 5.5,
  },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 5.5,
    textTransform: "uppercase",
    textAlign: "center",
    padding: 2,
    borderRightWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#F3F4F6",
  },
  td: {
    fontSize: 6.5,
    textTransform: "uppercase",
    padding: 2,
    borderRightWidth: 1,
    borderColor: BORDER,
    textAlign: "center",
  },
  apreciacion: {
    fontSize: 6.5,
    lineHeight: 1.35,
    textAlign: "justify",
    textTransform: "uppercase",
    minHeight: 52,
  },
  fisicoLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 5.5,
    textTransform: "uppercase",
    width: "55%",
  },
  fisicoValue: {
    fontSize: 7,
    textAlign: "center",
    width: "45%",
  },
  gradoCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderColor: BORDER,
    paddingVertical: 3,
    gap: 2,
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

function formatPhone(tel: string | null | undefined): string {
  const d = (tel ?? "").replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 4)}-${d.slice(4)}`;
  if (d.length === 10) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return dash(tel);
}

function Check({ checked }: { checked: boolean }) {
  return (
    <View style={styles.checkBox}>{checked ? <Text style={styles.checkX}>X</Text> : null}</View>
  );
}

function SiNo({ value }: { value: boolean | null }) {
  return (
    <View style={styles.siNo}>
      <Text style={styles.siNoCaption}>SI</Text>
      <Check checked={value === true} />
      <Text style={styles.siNoCaption}>NO</Text>
      <Check checked={value === false} />
    </View>
  );
}

function FieldRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.fieldRow, last ? { borderBottomWidth: 0 } : {}]}>
      <View style={styles.fieldLabelCell}>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.fieldValueCell}>
        <Text style={styles.value}>{dash(value)}</Text>
      </View>
    </View>
  );
}

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
  foto: Buffer | null;
  ficha: FichaEvaluacionState;
  estadoCivil?: string | null;
  especialidad?: string | null;
  nivelEducativo?: string | null;
  ordenMerito?: string | null;
  cmdteCursoNombre?: string | null;
  cmdteCursoTelefono?: string | null;
  apreciacionGeneral?: string | null;
  estudioCulminado?: boolean | null;
  estudioCulminadoPorQue?: string | null;
  otorgamientoGrado?: "CAP_TN" | "PTTE_TF" | "TTE_TC" | null;
  investigacionAdministrativa?: boolean | null;
  investigacionPenalMilitar?: boolean | null;
  investigacionJudicial?: boolean | null;
  juicioAbierto?: boolean | null;
  registroSiipol?: boolean | null;
  estudios?: Array<{
    universidad: string;
    titulo: string;
    pais: string;
    anioIngreso: string;
    anioEgreso: string;
    nucleo: string;
  }>;
  cursosRealizados?: string | null;
};

export function AspiranteFichaTecnicaPdfDocument(props: AspiranteFichaTecnicaPdfProps) {
  const nombreCompleto = `${props.nombres} ${props.apellidos}`.trim().toUpperCase();
  const estudios = props.estudios?.length
    ? props.estudios
    : [
        { universidad: "", titulo: "", pais: "", anioIngreso: "", anioEgreso: "", nucleo: "" },
        { universidad: "", titulo: "", pais: "", anioIngreso: "", anioEgreso: "", nucleo: "" },
      ];

  const fisica = [
    {
      label: "CARRERA",
      value: valorPrueba(props.ficha, "potencia_aerobica_2400m", props.sexo) || "00:00",
    },
    {
      label: "BARRA",
      value: valorPrueba(props.ficha, "barra_fija_dominada", props.sexo) || "0",
    },
    {
      label: "ABDOMINAL",
      value: valorPrueba(props.ficha, "abdominales_60", props.sexo) || "0",
    },
    {
      label: "FLEXIONES",
      value: valorPrueba(props.ficha, "flexiones_60", props.sexo) || "0",
    },
    {
      label: "PISCINA",
      value: valorPrueba(props.ficha, "natacion_50m", props.sexo) || "0 M",
    },
    {
      label: "TOTAL",
      value: (props.ficha.pruebaFisica.calificacionObtenida || "").trim() || "00,00",
    },
  ];

  const disc = [
    ["INVESTIGACIÓN ADMINISTRATIVA", props.investigacionAdministrativa ?? false],
    ["INVESTIGACIÓN JUDICIAL", props.investigacionJudicial ?? false],
    ["REGISTRO SIIPOL", props.registroSiipol ?? false],
    ["INVESTIGACIÓN PENAL MILITAR", props.investigacionPenalMilitar ?? false],
    ["JUICIO ABIERTO", props.juicioAbierto ?? false],
  ] as const;

  return (
    <Document
      title={`Ficha técnica — ${nombreCompleto}`}
      author="Ejército Bolivariano"
      subject="Ficha técnica de aspirante"
    >
      <Page size="LETTER" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerText}>EJÉRCITO BOLIVARIANO</Text>
        </View>

        <View style={styles.grid}>
          {/* Fila superior: foto | datos | grado+física */}
          <View style={styles.row}>
            <View style={{ width: 88 }}>
              <View style={[styles.fotoWrap, { borderBottomWidth: 0 }]}>
                {props.foto ? (
                  // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
                  <Image src={props.foto} style={styles.foto} />
                ) : (
                  <View style={styles.fotoPlaceholder}>
                    <Text style={{ fontSize: 6, color: "#666" }}>SIN FOTO</Text>
                  </View>
                )}
              </View>
              <View style={styles.meritoBox}>
                <Text style={styles.meritoLabel}>Orden de mérito</Text>
                <Text style={styles.meritoValue}>{dash(props.ordenMerito) === " " ? "—" : props.ordenMerito}</Text>
              </View>
            </View>

            <View style={{ flex: 1.35, borderRightWidth: 1, borderColor: BORDER }}>
              <FieldRow label="Nombres y apellidos" value={nombreCompleto} />
              <FieldRow label="Cédula de identidad" value={formatCedulaVe(props.cedula)} />
              <FieldRow label="Edad" value={`${props.edad} AÑOS`} />
              <FieldRow label="Estado civil" value={props.estadoCivil ?? ""} />
              <FieldRow
                label="Hijos"
                value={String(props.hijosCantidad).padStart(2, "0")}
              />
              <FieldRow label="Especialidad" value={props.especialidad ?? ""} />
              <FieldRow label="Nivel educativo" value={props.nivelEducativo ?? ""} />
              <FieldRow
                label="N° de teléfono aspirante"
                value={formatPhone(props.telefono)}
                last
              />
            </View>

            <View style={{ width: 210 }}>
              <View style={[styles.sectionBanner, { borderRightWidth: 0 }]}>
                <Text style={styles.sectionBannerText}>Otorgamiento de grado</Text>
              </View>
              <View style={[styles.row, { borderBottomWidth: 1, borderColor: BORDER }]}>
                {(
                  [
                    ["CAP/TN", "CAP_TN"],
                    ["PTTE/TF", "PTTE_TF"],
                    ["TTE/TC", "TTE_TC"],
                  ] as const
                ).map(([label, key], i) => (
                  <View
                    key={key}
                    style={[styles.gradoCell, i === 2 ? { borderRightWidth: 0 } : {}]}
                  >
                    <Text style={styles.label}>{label}</Text>
                    <Check checked={props.otorgamientoGrado === key} />
                  </View>
                ))}
              </View>

              <View style={styles.sectionBanner}>
                <Text style={styles.sectionBannerText}>Resultados de evaluación física</Text>
              </View>
              {fisica.map((f, i) => (
                <View
                  key={f.label}
                  style={[
                    styles.row,
                    {
                      borderBottomWidth: i === fisica.length - 1 ? 0 : 1,
                      borderColor: BORDER,
                      paddingVertical: 2,
                      paddingHorizontal: 4,
                      alignItems: "center",
                    },
                  ]}
                >
                  <Text style={styles.fisicoLabel}>{f.label}</Text>
                  <Text style={styles.fisicoValue}>{f.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Cmdte */}
          <View style={styles.row}>
            <View style={[styles.cell, { flex: 1.6 }]}>
              <Text style={styles.label}>Nombre del Cmdte de curso</Text>
              <Text style={styles.value}>{dash(props.cmdteCursoNombre)}</Text>
            </View>
            <View style={[styles.cell, styles.cellLast, { flex: 1 }]}>
              <Text style={styles.label}>Teléfono del Cmdte de curso</Text>
              <Text style={styles.value}>{formatPhone(props.cmdteCursoTelefono)}</Text>
            </View>
          </View>

          {/* Régimen disciplinario */}
          <View style={[styles.sectionBanner, { borderRightWidth: 0 }]}>
            <Text style={styles.sectionBannerText}>Régimen disciplinario militar</Text>
          </View>
          <View style={styles.row}>
            {disc.map(([label, val], i) => (
              <View
                key={label}
                style={[
                  styles.cell,
                  i === disc.length - 1 ? styles.cellLast : {},
                  { flex: 1, alignItems: "center", gap: 3, paddingVertical: 4 },
                ]}
              >
                <Text style={[styles.label, { textAlign: "center", fontSize: 5 }]}>{label}</Text>
                <SiNo value={val} />
              </View>
            ))}
          </View>

          {/* Unidad + cursos */}
          <View style={styles.row}>
            <View style={[styles.cell, { width: "32%" }]}>
              <Text style={styles.label}>Unidad quien postula</Text>
              <Text style={styles.valueRed}>
                {dash(props.unidadPostulante) === " " ? "—" : props.unidadPostulante}
              </Text>
            </View>
            <View style={[styles.cell, styles.cellLast, { flex: 1 }]}>
              <Text style={styles.label}>Cursos realizados</Text>
              <Text style={styles.value}>{dash(props.cursosRealizados)}</Text>
            </View>
          </View>

          {/* Estudios */}
          <View style={[styles.sectionBanner, { borderRightWidth: 0 }]}>
            <Text style={styles.sectionBannerText}>
              Estudios conducentes a título universitario
            </Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 1, borderColor: BORDER }]}>
            <Text style={[styles.th, { width: "28%" }]}>Universidad</Text>
            <Text style={[styles.th, { width: "22%" }]}>Título</Text>
            <Text style={[styles.th, { width: "12%" }]}>País</Text>
            <Text style={[styles.th, { width: "12%" }]}>Año ingreso</Text>
            <Text style={[styles.th, { width: "12%" }]}>Año egreso</Text>
            <Text style={[styles.th, { width: "14%", borderRightWidth: 0 }]}>Núcleo</Text>
          </View>
          {estudios.map((e, i) => (
            <View
              key={i}
              style={[
                styles.row,
                {
                  borderBottomWidth: 1,
                  borderColor: BORDER,
                  minHeight: 14,
                },
              ]}
            >
              <Text style={[styles.td, { width: "28%", textAlign: "left" }]}>
                {dash(e.universidad)}
              </Text>
              <Text style={[styles.td, { width: "22%" }]}>{dash(e.titulo)}</Text>
              <Text style={[styles.td, { width: "12%" }]}>{dash(e.pais)}</Text>
              <Text style={[styles.td, { width: "12%" }]}>{dash(e.anioIngreso)}</Text>
              <Text style={[styles.td, { width: "12%" }]}>{dash(e.anioEgreso)}</Text>
              <Text style={[styles.td, { width: "14%", borderRightWidth: 0 }]}>
                {dash(e.nucleo)}
              </Text>
            </View>
          ))}

          {/* Estudio culminado */}
          <View style={styles.row}>
            <View
              style={[
                styles.cell,
                {
                  width: "40%",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                },
              ]}
            >
              <Text style={styles.label}>Estudio culminado</Text>
              <SiNo value={props.estudioCulminado ?? null} />
            </View>
            <View style={[styles.cell, styles.cellLast, { flex: 1 }]}>
              <Text style={styles.label}>¿Por qué?</Text>
              <Text style={styles.value}>{dash(props.estudioCulminadoPorQue)}</Text>
            </View>
          </View>

          {/* Apreciación */}
          <View style={[styles.sectionBanner, { borderRightWidth: 0, borderBottomWidth: 1 }]}>
            <Text style={styles.sectionBannerText}>Apreciación general</Text>
          </View>
          <View style={[styles.cell, styles.cellLast, styles.cellNoBottom, { padding: 6 }]}>
            <Text style={styles.apreciacion}>
              {props.apreciacionGeneral?.trim()
                ? props.apreciacionGeneral.trim().toUpperCase()
                : " "}
            </Text>
            {!props.apreciacionGeneral?.trim() ? (
              <Text style={{ fontSize: 5.5, color: "#666", marginTop: 4 }}>
                (Pendiente de registro en el sistema)
              </Text>
            ) : null}
          </View>
        </View>

        <Text
          style={{
            marginTop: 4,
            fontSize: 5.5,
            color: "#666",
            textAlign: "right",
          }}
        >
          {props.convocatoriaNombre} ({props.convocatoriaCodigo})
        </Text>
      </Page>
    </Document>
  );
}
