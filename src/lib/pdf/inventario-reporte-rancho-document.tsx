import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  REPORTE_ESTADO_LABELS,
  type ReporteRanchoEstado,
  type ReporteRanchoMovimiento,
  type ReporteRanchoPreviewLinea,
} from "@src/lib/inventario/reporte-rancho";
import { labelUnidad } from "@src/lib/inventario/area";

export type InventarioReporteRanchoPdfProps = {
  fechaTexto: string;
  generadoTexto: string;
  autor: string;
  notas: string | null;
  lineas: ReporteRanchoPreviewLinea[];
  movimientos: ReporteRanchoMovimiento[];
  resumen: Record<ReporteRanchoEstado, number>;
};

const COL = {
  item: "28%",
  ayer: "14%",
  ent: "10%",
  sal: "10%",
  actual: "14%",
  estado: "14%",
  min: "10%",
} as const;

const styles = StyleSheet.create({
  page: {
    paddingTop: 18,
    paddingBottom: 30,
    paddingHorizontal: 20,
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: "#0f172a",
  },
  band: {
    height: 4,
    backgroundColor: "#92400e",
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 8,
    color: "#475569",
    marginTop: 2,
  },
  meta: {
    fontSize: 7,
    color: "#64748b",
    marginTop: 4,
    marginBottom: 10,
  },
  resumenRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  resumenBox: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    padding: 6,
    borderRadius: 2,
  },
  resumenLabel: {
    fontSize: 6,
    textTransform: "uppercase",
    color: "#64748b",
    fontWeight: "bold",
  },
  resumenValue: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#334155",
    marginBottom: 4,
    marginTop: 6,
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
  cellRight: {
    fontSize: 6.5,
    paddingVertical: 3,
    paddingHorizontal: 2,
    borderRightWidth: 0.35,
    borderRightColor: "#f1f5f9",
    textAlign: "right",
  },
  notas: {
    marginBottom: 8,
    padding: 6,
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    fontSize: 7,
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
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function fmtQty(value: number, unidad: string): string {
  const n = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
  return `${n} ${labelUnidad(unidad)}`;
}

function fmtTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function InventarioTable({ lineas }: { lineas: ReporteRanchoPreviewLinea[] }) {
  return (
    <View>
      <View style={styles.thead}>
        <Text style={[styles.th, { width: COL.item }]}>Ítem</Text>
        <Text style={[styles.th, { width: COL.ayer }]}>Existía ayer</Text>
        <Text style={[styles.th, { width: COL.ent }]}>Entradas</Text>
        <Text style={[styles.th, { width: COL.sal }]}>Salidas</Text>
        <Text style={[styles.th, { width: COL.actual }]}>Al reportar</Text>
        <Text style={[styles.th, { width: COL.estado }]}>Estado</Text>
        <Text style={[styles.th, { width: COL.min, borderRightWidth: 0 }]}>Mín.</Text>
      </View>
      {lineas.map((linea) => (
        <View key={linea.itemId} style={styles.row} wrap={false}>
          <Text style={[styles.cell, { width: COL.item }]}>{linea.nombre}</Text>
          <Text style={[styles.cellRight, { width: COL.ayer }]}>{fmtQty(linea.stockAyer, linea.unidad)}</Text>
          <Text style={[styles.cellRight, { width: COL.ent }]}>
            {linea.entradas > 0 ? fmtQty(linea.entradas, linea.unidad) : "—"}
          </Text>
          <Text style={[styles.cellRight, { width: COL.sal }]}>
            {linea.salidas > 0 ? fmtQty(linea.salidas, linea.unidad) : "—"}
          </Text>
          <Text style={[styles.cellRight, { width: COL.actual }]}>
            {fmtQty(linea.stockReportado, linea.unidad)}
          </Text>
          <Text style={[styles.cell, { width: COL.estado }]}>{REPORTE_ESTADO_LABELS[linea.estado]}</Text>
          <Text style={[styles.cellRight, { width: COL.min, borderRightWidth: 0 }]}>
            {linea.stockMinimo != null ? fmtQty(linea.stockMinimo, linea.unidad) : "—"}
          </Text>
        </View>
      ))}
    </View>
  );
}

function MovimientosTable({ movimientos }: { movimientos: ReporteRanchoMovimiento[] }) {
  if (movimientos.length === 0) {
    return <Text style={{ fontSize: 7, color: "#64748b" }}>Sin movimientos registrados en este día.</Text>;
  }

  return (
    <View>
      <View style={styles.thead}>
        <Text style={[styles.th, { width: "12%" }]}>Hora</Text>
        <Text style={[styles.th, { width: "26%" }]}>Ítem</Text>
        <Text style={[styles.th, { width: "12%" }]}>Tipo</Text>
        <Text style={[styles.th, { width: "14%" }]}>Cantidad</Text>
        <Text style={[styles.th, { width: "14%" }]}>Antes</Text>
        <Text style={[styles.th, { width: "14%" }]}>Después</Text>
        <Text style={[styles.th, { width: "8%", borderRightWidth: 0 }]}>Usuario</Text>
      </View>
      {movimientos.map((mov) => (
        <View key={mov.id} style={styles.row} wrap={false}>
          <Text style={[styles.cell, { width: "12%" }]}>{fmtTime(mov.createdAt)}</Text>
          <Text style={[styles.cell, { width: "26%" }]}>{mov.itemNombre}</Text>
          <Text style={[styles.cell, { width: "12%" }]}>{mov.tipo === "ENTRADA" ? "Entrada" : "Salida"}</Text>
          <Text style={[styles.cellRight, { width: "14%" }]}>{fmtQty(mov.cantidad, mov.unidad)}</Text>
          <Text style={[styles.cellRight, { width: "14%" }]}>{fmtQty(mov.stockAntes, mov.unidad)}</Text>
          <Text style={[styles.cellRight, { width: "14%" }]}>{fmtQty(mov.stockDespues, mov.unidad)}</Text>
          <Text style={[styles.cell, { width: "8%", borderRightWidth: 0 }]}>{mov.userName ?? "—"}</Text>
        </View>
      ))}
    </View>
  );
}

export function InventarioReporteRanchoPdfDocument({
  fechaTexto,
  generadoTexto,
  autor,
  notas,
  lineas,
  movimientos,
  resumen,
}: InventarioReporteRanchoPdfProps) {
  return (
    <Document title={`Reporte rancho ${fechaTexto}`} author={autor}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.band} />
        <Text style={styles.title}>Reporte diario — Inventario del rancho</Text>
        <Text style={styles.subtitle}>Control de existencias, movimientos y faltantes</Text>
        <Text style={styles.meta}>
          Fecha del reporte: {fechaTexto} · Generado: {generadoTexto} · Por: {autor}
        </Text>

        <View style={styles.resumenRow}>
          {(["QUEDA", "FALTA", "NO_HAY"] as const).map((estado) => (
            <View key={estado} style={styles.resumenBox}>
              <Text style={styles.resumenLabel}>{REPORTE_ESTADO_LABELS[estado]}</Text>
              <Text style={styles.resumenValue}>{resumen[estado]}</Text>
            </View>
          ))}
        </View>

        {notas ? (
          <View style={styles.notas}>
            <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Observaciones</Text>
            <Text>{notas}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Existencias por ítem</Text>
        <InventarioTable lineas={lineas} />

        <Text style={styles.sectionTitle}>Movimientos del día</Text>
        <MovimientosTable movimientos={movimientos} />

        <View style={styles.foot} fixed>
          <Text>Sistema de control de inventario — FANB Aspirantes</Text>
          <Text render={({ pageNumber, totalPages }) => `Pág. ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
