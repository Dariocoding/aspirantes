import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { sexoEtiqueta } from "@src/lib/aspirantes/census";
import { labelTipoEstudioNivel } from "@src/lib/aspirantes/tipo-estudio";

export type AspiranteCensoPdfRow = {
  nombres: string;
  apellidos: string;
  unidadPostulante: string;
  tituloUniversidad: string | null;
  tipoEstudio: string | null;
  cedula: string;
  sexo: string;
  edad: number;
  fechaNacimiento: Date;
};

export type AspirantesCensoPdfProps = {
  convocatoriaNombre: string;
  anio: number;
  generatedAt: string;
  rows: AspiranteCensoPdfRow[];
};

const COL = {
  n: "22%",
  u: "16%",
  car: "22%",
  ced: "12%",
  sx: "10%",
  ed: "6%",
  fn: "12%",
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

function sexoBg(sexo: string) {
  return sexo === "FEMENINO" ? "#fff1f2" : "#f0f9ff";
}

function formatCarreraConNivel(titulo: string | null, tipoEstudio: string | null): string {
  const carrera = (titulo ?? "").trim() || "—";
  if (carrera === "—") return carrera;
  const nivel = labelTipoEstudioNivel(tipoEstudio);
  return nivel ? `${carrera} (${nivel})` : carrera;
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
      <Text style={[styles.th, { width: COL.car }]}>Carrera</Text>
      <Text style={[styles.th, { width: COL.ced }]}>Cédula</Text>
      <Text style={[styles.th, { width: COL.sx }]}>Sexo</Text>
      <Text style={[styles.th, { width: COL.ed }]}>Ed.</Text>
      <Text style={[styles.th, { width: COL.fn, borderRightWidth: 0 }]}>Nac.</Text>
    </View>
  );
}

function DataRow({ r, zebra }: { r: AspiranteCensoPdfRow; zebra: boolean }) {
  const bg = zebra ? "#f8fafc" : "#ffffff";
  const nombre = `${r.nombres} ${r.apellidos}`.trim();
  const unidad = (r.unidadPostulante ?? "").trim() || "—";
  const carrera = formatCarreraConNivel(r.tituloUniversidad, r.tipoEstudio);
  return (
    <View style={[styles.row, { backgroundColor: bg }]} wrap={false}>
      <Text style={[styles.cell, { width: COL.n, fontWeight: "bold" }]}>{nombre}</Text>
      <Text style={[styles.cell, { width: COL.u }]}>{unidad}</Text>
      <Text style={[styles.cell, { width: COL.car }]}>{carrera}</Text>
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
  anio,
  generatedAt,
  rows,
}: AspirantesCensoPdfProps) {
  const chunks = chunkRows(rows, ROWS_FIRST, ROWS_REST);

  return (
    <Document title={`Censo ${convocatoriaNombre}`} author="FANB Aspirantes">
      {chunks.map((pageRows, pageIdx) => (
        <Page key={pageIdx} size="A4" orientation="landscape" style={styles.page}>
          {pageIdx === 0 ? (
            <>
              <View style={styles.band} fixed />
              <View style={styles.titleBlock}>
                <Text style={styles.title}>Censo de aspirantes</Text>
                <Text style={styles.subtitle}>
                  {convocatoriaNombre} · {anio}
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
                Censo (continuación) · {convocatoriaNombre} · Pág. {pageIdx + 1}/{chunks.length}
              </Text>
            </View>
          )}

          <TableHead />

          {pageRows.length === 0 ? (
            <Text
              style={{
                marginTop: 12,
                fontSize: 8,
                color: "#64748b",
                textAlign: "center",
              }}
            >
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
