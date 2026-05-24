import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  calificacionAdmisionEtiqueta,
  sexoEtiqueta,
} from "@/lib/aspirantes/census";

export type AspiranteCensoPdfRow = {
  nombres: string;
  apellidos: string;
  unidadPostulante: string;
  calificacionAdmision: string;
  convocatoriaCodigo: string;
  convocatoriaNombre: string;
  convocatoriaActiva: boolean;
  cedula: string;
  sexo: string;
  edad: number;
  fechaNacimiento: Date;
};

export type AspirantesCensoPdfProps = {
  convocatoriaNombre: string;
  convocatoriaCodigo: string;
  anio: number;
  generatedAt: string;
  rows: AspiranteCensoPdfRow[];
};

const COL = {
  n: "22%",
  u: "15%",
  adm: "10%",
  cc: "9%",
  cn: "14%",
  ced: "10%",
  sx: "7%",
  ed: "5%",
  fn: "8%",
} as const;

const styles = StyleSheet.create({
  page: {
    paddingTop: 18,
    paddingBottom: 30,
    paddingHorizontal: 20,
    fontFamily: "Helvetica",
    fontSize: 7,
    color: "#0f172a",
  },
  band: {
    height: 4,
    backgroundColor: "#0f172a",
    marginBottom: 8,
  },
  titleBlock: {
    marginBottom: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 7.5,
    color: "#475569",
    marginTop: 2,
  },
  meta: {
    fontSize: 6.5,
    color: "#64748b",
    marginTop: 4,
  },
  thead: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#334155",
  },
  th: {
    fontSize: 6,
    fontWeight: "bold",
    color: "#f8fafc",
    paddingVertical: 4,
    paddingHorizontal: 2,
    textTransform: "uppercase",
    borderRightWidth: 0.5,
    borderRightColor: "#475569",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.35,
    borderBottomColor: "#e2e8f0",
  },
  cell: {
    fontSize: 6.5,
    paddingVertical: 3,
    paddingHorizontal: 2,
    borderRightWidth: 0.35,
    borderRightColor: "#f1f5f9",
  },
  cellMono: {
    fontSize: 6.5,
    fontFamily: "Courier",
    paddingVertical: 3,
    paddingHorizontal: 2,
    borderRightWidth: 0.35,
    borderRightColor: "#f1f5f9",
  },
  foot: {
    position: "absolute",
    bottom: 8,
    left: 20,
    right: 20,
    fontSize: 6,
    color: "#94a3b8",
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 4,
  },
  miniHead: {
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
  },
  miniTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#1e293b",
  },
});

function calificacionBg(code: string) {
  if (code === "APTO") return "#d1fae5";
  if (code === "NO_APTO") return "#fee2e2";
  return "#fef3c7";
}

function calificacionFg(code: string) {
  if (code === "APTO") return "#065f46";
  if (code === "NO_APTO") return "#991b1b";
  return "#92400e";
}

function sexoBg(sexo: string) {
  return sexo === "FEMENINO" ? "#fff1f2" : "#f0f9ff";
}

function chunkRows<T>(arr: T[], first: number, rest: number): T[][] {
  if (arr.length === 0) return [[]];
  const pages: T[][] = [];
  let i = 0;
  pages.push(arr.slice(0, first));
  i = first;
  while (i < arr.length) {
    pages.push(arr.slice(i, i + rest));
    i += rest;
  }
  return pages;
}

const ROWS_FIRST = 26;
const ROWS_REST = 32;

function TableHead() {
  return (
    <View style={styles.thead} wrap={false}>
      <Text style={[styles.th, { width: COL.n }]}>Nombre</Text>
      <Text style={[styles.th, { width: COL.u }]}>Unidad</Text>
      <Text style={[styles.th, { width: COL.adm }]}>Adm.</Text>
      <Text style={[styles.th, { width: COL.cc }]}>Cód.</Text>
      <Text style={[styles.th, { width: COL.cn }]}>Conv.</Text>
      <Text style={[styles.th, { width: COL.ced }]}>Cédula</Text>
      <Text style={[styles.th, { width: COL.sx }]}>Sexo</Text>
      <Text style={[styles.th, { width: COL.ed }]}>Ed.</Text>
      <Text style={[styles.th, { width: COL.fn, borderRightWidth: 0 }]}>Nac.</Text>
    </View>
  );
}

function DataRow({
  r,
  zebra,
}: {
  r: AspiranteCensoPdfRow;
  zebra: boolean;
}) {
  const bg = zebra ? "#f8fafc" : "#ffffff";
  const nombre = `${r.nombres} ${r.apellidos}`.trim();
  const unidad = (r.unidadPostulante ?? "").trim() || "—";
  const convCod = r.convocatoriaActiva ? `${r.convocatoriaCodigo}*` : r.convocatoriaCodigo;
  return (
    <View style={[styles.row, { backgroundColor: bg }]} wrap={false}>
      <Text style={[styles.cell, { width: COL.n, fontWeight: "bold" }]}>{nombre}</Text>
      <Text style={[styles.cell, { width: COL.u }]}>{unidad}</Text>
      <Text
        style={[
          styles.cell,
          {
            width: COL.adm,
            backgroundColor: calificacionBg(r.calificacionAdmision),
            color: calificacionFg(r.calificacionAdmision),
            fontWeight: "bold",
            textAlign: "center",
          },
        ]}
      >
        {calificacionAdmisionEtiqueta(r.calificacionAdmision)}
      </Text>
      <Text style={[styles.cellMono, { width: COL.cc, textAlign: "center" }]}>{convCod}</Text>
      <Text style={[styles.cell, { width: COL.cn, fontSize: 6 }]}>{r.convocatoriaNombre}</Text>
      <Text style={[styles.cellMono, { width: COL.ced, textAlign: "center" }]}>{r.cedula}</Text>
      <Text
        style={[
          styles.cell,
          {
            width: COL.sx,
            backgroundColor: sexoBg(r.sexo),
            textAlign: "center",
            fontSize: 6,
          },
        ]}
      >
        {sexoEtiqueta(r.sexo)}
      </Text>
      <Text style={[styles.cell, { width: COL.ed, textAlign: "center" }]}>{r.edad}</Text>
      <Text style={[styles.cell, { width: COL.fn, textAlign: "center", borderRightWidth: 0 }]}>
        {r.fechaNacimiento.toLocaleDateString("es-VE")}
      </Text>
    </View>
  );
}

export function AspirantesCensoPdfDocument({
  convocatoriaNombre,
  convocatoriaCodigo,
  anio,
  generatedAt,
  rows,
}: AspirantesCensoPdfProps) {
  const chunks = chunkRows(rows, ROWS_FIRST, ROWS_REST);

  return (
    <Document title={`Censo ${convocatoriaCodigo}`} author="FANB Aspirantes">
      {chunks.map((pageRows, pageIdx) => (
        <Page key={pageIdx} size="A4" orientation="landscape" style={styles.page}>
          {pageIdx === 0 ? (
            <>
              <View style={styles.band} fixed />
              <View style={styles.titleBlock}>
                <Text style={styles.title}>Censo de aspirantes</Text>
                <Text style={styles.subtitle}>
                  {convocatoriaNombre} · {convocatoriaCodigo} · {anio}
                </Text>
                <Text style={styles.meta}>
                  Total registros: {rows.length} · Generado: {generatedAt}
                  {chunks.length > 1 ? ` · Pág. ${pageIdx + 1} de ${chunks.length}` : ""}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.miniHead} fixed>
              <Text style={styles.miniTitle}>
                Censo (continuación) · {convocatoriaCodigo} · Pág. {pageIdx + 1}/{chunks.length}
              </Text>
            </View>
          )}

          <TableHead />

          {pageRows.length === 0 ? (
            <Text style={{ marginTop: 12, fontSize: 8, color: "#64748b", textAlign: "center" }}>
              No hay aspirantes con los filtros aplicados.
            </Text>
          ) : (
            pageRows.map((r, i) => (
              <DataRow key={`p${pageIdx}-r${i}-${r.cedula}`} r={r} zebra={i % 2 === 0} />
            ))
          )}

          <Text style={styles.foot} fixed>
            FANB · Documento interno · Uso oficial
            {chunks.length > 1 ? ` · Página ${pageIdx + 1} de ${chunks.length}` : ""}
          </Text>
        </Page>
      ))}
    </Document>
  );
}
