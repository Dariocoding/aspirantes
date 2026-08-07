import type { ReactNode } from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { FichaEvaluacionState } from "@src/lib/aspirantes/ficha-evaluacion";
import {
  FICHA_TECNICA_PDF_FONT_FAMILY,
  registerFichaTecnicaPdfFonts,
} from "@src/lib/pdf/register-ficha-tecnica-fonts";

/**
 * Diseño anclado a referencia-form.png (649×479 px).
 * Grilla con HLine/VLine continuas (sin bordes por celda → sin rayas abiertas).
 */
const REF_W = 649;
const REF_H = 479;
const PAGE_W = 842;
const SCALE = PAGE_W / REF_W;
const PAGE_H = Math.round(REF_H * SCALE);

const C = {
  banner: "#006600",
  orden: "#D7E4BD",
  fotoBg: "#7BE3FF",
  border: "#000000",
  white: "#FFFFFF",
  black: "#000000",
} as const;

const FONT = FICHA_TECNICA_PDF_FONT_FAMILY;

function edge(px: number): number {
  return Math.round(px * SCALE);
}

function u(px: number): number {
  return edge(px);
}

registerFichaTecnicaPdfFonts();

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    fontFamily: FONT,
    fontSize: u(8),
    color: C.black,
  },
  root: {
    width: PAGE_W,
    height: PAGE_H,
    position: "relative",
  },
  cellText: {
    fontFamily: FONT,
    fontSize: u(7.5),
    color: C.black,
  },
  cellBold: {
    fontFamily: FONT,
    fontWeight: "bold",
    fontSize: u(7.5),
    color: C.black,
  },
  cellBoldSm: {
    fontFamily: FONT,
    fontWeight: "bold",
    fontSize: u(7),
    color: C.black,
  },
  sectionTitle: {
    fontFamily: FONT,
    fontWeight: "bold",
    fontSize: u(8),
    textAlign: "center",
    textTransform: "uppercase",
  },
  bannerText: {
    fontFamily: FONT,
    fontWeight: "bold",
    fontSize: u(22),
    color: C.white,
    textAlign: "center",
    letterSpacing: 1,
  },
  upper: {
    textTransform: "uppercase",
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

/** Contenido sin bordes; la grilla va con HLine/VLine. */
function Cell({
  x,
  y,
  w,
  h,
  bg,
  children,
  pad = 2,
  align = "flex-start",
  justify = "center",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  bg?: string;
  children?: ReactNode;
  pad?: number;
  align?: "flex-start" | "center" | "flex-end";
  justify?: "flex-start" | "center" | "flex-end";
}) {
  const left = edge(x);
  const top = edge(y);
  const width = Math.max(edge(x + w) - left, 1);
  const height = Math.max(edge(y + h) - top, 1);
  return (
    <View
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        backgroundColor: bg,
        padding: edge(pad),
        alignItems: align,
        justifyContent: justify,
      }}
    >
      {children}
    </View>
  );
}

function HLine({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  const left = edge(Math.min(x1, x2));
  const top = edge(y);
  const width = Math.max(edge(Math.max(x1, x2)) - left, 1);
  return (
    <View
      style={{
        position: "absolute",
        left,
        top,
        width,
        height: 1,
        backgroundColor: C.border,
      }}
    />
  );
}

function VLine({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  const left = edge(x);
  const top = edge(Math.min(y1, y2));
  const height = Math.max(edge(Math.max(y1, y2)) - top, 1);
  return (
    <View
      style={{
        position: "absolute",
        left,
        top,
        width: 1,
        height,
        backgroundColor: C.border,
      }}
    />
  );
}

/** SI/NO en texto plano: evita el clip de Views pequeños sobre la "X". */
function SiNo({ value }: { value: boolean | null }) {
  const si = value === true ? "X" : " ";
  const no = value === false ? "X" : " ";
  return (
    <Text style={[styles.cellBold, { fontSize: u(8), lineHeight: 1 }]}>
      {`SI [${si}]  NO [${no}]`}
    </Text>
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
  debug?: boolean;
};

const G = {
  bannerX: 0,
  bannerY: 0,
  bannerW: 649,
  bannerH: 50,
  frameX: 4,
  frameY: 52,
  frameW: 642,
  frameH: 423,
  fotoX: 4,
  fotoY: 52,
  fotoW: 96,
  fotoH: 126,
  ordenY: 178,
  ordenH: 24,
  ordenLabelW: 72,
  persX: 100,
  persW: 299,
  persLabelW: 126,
  persRowHeights: [27, 15, 15, 14, 15, 21, 19, 24] as const,
  gradoX: 399,
  gradoW: 128,
  gradoHeaderH: 18,
  fisX: 527,
  fisW: 119,
  fisHeaderH: 18,
  fisLabelW: 72,
  cmdteY: 202,
  cmdteH: 26,
  cmdteLeftW: 400,
  phoneBoxW: 110,
  regY: 228,
  regH: 67,
  regLabelW: 93,
  uniY: 295,
  uniH: 30,
  uniLeftW: 320,
  estY: 325,
  estTitleH: 14,
  estHeadH: 14,
  estRowH: 60,
  culY: 413,
  culH: 25,
  culLeftW: 260,
  aprY: 438,
  aprH: 37,
} as const;

export function AspiranteFichaTecnicaPdfDocument(props: AspiranteFichaTecnicaPdfProps) {
  const nombreCompleto = `${props.nombres} ${props.apellidos}`.trim().toUpperCase();
  const estudios = props.estudios?.length
    ? props.estudios.slice(0, 1)
    : [{ universidad: "", titulo: "", pais: "", anioIngreso: "", anioEgreso: "", nucleo: "" }];

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

  const personal: Array<[string, string]> = [
    ["Nombres y Apellidos", nombreCompleto],
    ["Cédula de Identidad", formatCedulaVe(props.cedula)],
    ["Edad", `${props.edad} AÑOS`],
    ["Estado Civil", (props.estadoCivil ?? "").toUpperCase()],
    ["Hijos", String(props.hijosCantidad).padStart(2, "0")],
    ["Especialidad", (props.especialidad ?? "").toUpperCase()],
    ["Nivel Educativo", (props.nivelEducativo ?? "").toUpperCase()],
    ["N° de Teléfono Aspirante", formatPhone(props.telefono)],
  ];

  const grados: Array<[string, "CAP_TN" | "PTTE_TF" | "TTE_TC"]> = [
    ["CAP/ TN", "CAP_TN"],
    ["PTTE/ TF", "PTTE_TF"],
    ["TTE/ TC", "TTE_TC"],
  ];

  /** 3×2: SIIPOL en fila 3 col 1 con SI/NO; col 2 vacía. */
  const discRows: Array<Array<[string, boolean | null] | null>> = [
    [
      ["INVESTIGACIÓN ADMINISTRATIVA", props.investigacionAdministrativa ?? false],
      ["INVESTIGACIÓN PENAL MILITAR", props.investigacionPenalMilitar ?? false],
    ],
    [
      ["INVESTIGACIÓN JUDICIAL", props.investigacionJudicial ?? false],
      ["JUICIO ABIERTO", props.juicioAbierto ?? false],
    ],
    [["REGISTRO SIIPOL", props.registroSiipol ?? false], null],
  ];

  const est = estudios[0]!;
  /** Ancho de columnas: UNIVERSIDAD+TÍTULO bajo el título; PAÍS…NÚCLEO con rowspan de cabecera. */
  const estCols: Array<{ key: string; label: string; w: number; val: string }> = [
    { key: "universidad", label: "UNIVERSIDAD", w: 120, val: est.universidad },
    { key: "titulo", label: "TÍTULO", w: 200, val: est.titulo },
    { key: "pais", label: "PAÍS", w: 80, val: est.pais },
    { key: "ing", label: "AÑO INGRESO", w: 75, val: est.anioIngreso },
    { key: "egr", label: "AÑO EGRESO", w: 75, val: est.anioEgreso },
    { key: "nuc", label: "NÚCLEO", w: 92, val: est.nucleo },
  ];
  const estLeftCols = estCols.slice(0, 2);
  const estRightCols = estCols.slice(2);
  const estLeftW = estLeftCols.reduce((a, c) => a + c.w, 0);
  const estHeaderH = G.estTitleH + G.estHeadH;

  const topH = G.fotoH + G.ordenH;
  const gradoRowH = (topH - G.gradoHeaderH) / 3;
  const fisRowH = (topH - G.fisHeaderH) / 6;
  const fisLabelW = G.fisLabelW;

  const L = G.frameX;
  const R = G.frameX + G.frameW;
  const T = G.frameY;
  const B = G.frameY + G.frameH;
  const persSplitX = G.persX + G.persLabelW;
  const gradoCheckX = G.gradoX + G.gradoW - 28;
  const fisSplitX = G.fisX + fisLabelW;
  const midX = G.frameX + G.cmdteLeftW;
  const phoneX = R - G.phoneBoxW;
  const uniSplitX = G.frameX + G.uniLeftW;
  const regSplitX = G.frameX + G.regLabelW;
  const regMidX = regSplitX + (G.frameW - G.regLabelW) / 2;
  const culSplitX = G.frameX + G.culLeftW;
  const topBottom = G.cmdteY;

  const persYs: number[] = [G.fotoY];
  for (const h of G.persRowHeights) persYs.push(persYs[persYs.length - 1]! + h);

  const gradoInnerYs = [
    G.fotoY + G.gradoHeaderH + gradoRowH,
    G.fotoY + G.gradoHeaderH + 2 * gradoRowH,
  ];
  const fisInnerYs = Array.from(
    { length: 5 },
    (_, i) => G.fotoY + G.fisHeaderH + (i + 1) * fisRowH,
  );

  return (
    <Document
      title={`Ficha técnica — ${nombreCompleto}`}
      author="Ejército Bolivariano"
      subject="Ficha técnica de aspirante"
    >
      <Page size={{ width: PAGE_W, height: PAGE_H }} wrap={false} style={styles.page}>
        <View style={styles.root}>
          <View
            style={{
              position: "absolute",
              left: edge(G.bannerX + 2),
              top: edge(G.bannerY + 2),
              width: edge(G.bannerX + G.bannerW - 2) - edge(G.bannerX + 2),
              height: edge(G.bannerY + G.bannerH) - edge(G.bannerY + 2),
              backgroundColor: C.banner,
              borderRadius: edge(6),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={styles.bannerText}>EJÉRCITO BOLIVARIANO</Text>
          </View>

          {/* Foto */}
          <Cell
            x={G.fotoX}
            y={G.fotoY}
            w={G.fotoW}
            h={G.fotoH}
            bg={C.fotoBg}
            pad={2}
            align="center"
            justify="center"
          >
            {props.foto ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
              <Image
                src={props.foto}
                style={{
                  width: edge(G.fotoX + G.fotoW - 3) - edge(G.fotoX + 3),
                  height: edge(G.fotoY + G.fotoH - 3) - edge(G.fotoY + 3),
                  objectFit: "cover",
                }}
              />
            ) : (
              <Text style={{ fontSize: u(7), color: "#333" }}>SIN FOTO</Text>
            )}
          </Cell>

          <Cell
            x={G.fotoX}
            y={G.ordenY}
            w={G.ordenLabelW}
            h={G.ordenH}
            bg={C.orden}
            align="center"
            justify="center"
            pad={1}
          >
            <Text style={[styles.cellBoldSm, { textAlign: "center", fontSize: u(6.5) }]}>
              ORDEN DE MÉRITO
            </Text>
          </Cell>
          <Cell
            x={G.fotoX + G.ordenLabelW}
            y={G.ordenY}
            w={G.fotoW - G.ordenLabelW}
            h={G.ordenH}
            align="center"
            justify="center"
          >
            <Text style={[styles.cellBold, { fontSize: u(11) }]}>
              {dash(props.ordenMerito) === " " ? " " : props.ordenMerito}
            </Text>
          </Cell>

          {personal.map(([label, value], i) => {
            let y = G.fotoY;
            for (let r = 0; r < i; r++) y += G.persRowHeights[r]!;
            const h = G.persRowHeights[i]!;
            return (
              <View key={label}>
                <Cell x={G.persX} y={y} w={G.persLabelW} h={h} pad={2}>
                  <Text style={[styles.cellBold, styles.upper]}>{label}</Text>
                </Cell>
                <Cell x={persSplitX} y={y} w={G.persW - G.persLabelW} h={h} pad={2}>
                  <Text style={[styles.cellText, styles.upper]}>{dash(value)}</Text>
                </Cell>
              </View>
            );
          })}

          <Cell
            x={G.gradoX}
            y={G.fotoY}
            w={G.gradoW}
            h={G.gradoHeaderH}
            align="center"
            justify="center"
            pad={1}
          >
            <Text style={styles.sectionTitle}>OTORGAMIENTO DE GRADO</Text>
          </Cell>
          {grados.map(([label, key], i) => {
            const y = G.fotoY + G.gradoHeaderH + i * gradoRowH;
            const checked = props.otorgamientoGrado === key;
            return (
              <View key={key}>
                <Cell
                  x={G.gradoX}
                  y={y}
                  w={G.gradoW - 28}
                  h={gradoRowH}
                  align="center"
                  justify="center"
                >
                  <Text style={[styles.cellBold, { fontSize: u(8) }]}>{label}</Text>
                </Cell>
                <Cell x={gradoCheckX} y={y} w={28} h={gradoRowH} align="center" justify="center">
                  <Text style={[styles.cellBold, { fontSize: u(12) }]}>{checked ? "X" : " "}</Text>
                </Cell>
              </View>
            );
          })}

          <Cell
            x={G.fisX}
            y={G.fotoY}
            w={G.fisW}
            h={G.fisHeaderH}
            align="center"
            justify="center"
            pad={1}
          >
            <Text style={[styles.sectionTitle, { fontSize: u(7), lineHeight: 1.15 }]}>
              RESULTADOS{"\n"}DE EVALUACIÓN FÍSICA
            </Text>
          </Cell>
          {fisica.map((f, i) => {
            const y = G.fotoY + G.fisHeaderH + i * fisRowH;
            return (
              <View key={f.label}>
                <Cell x={G.fisX} y={y} w={fisLabelW} h={fisRowH} pad={2} justify="center">
                  <Text style={[styles.cellBoldSm, styles.upper]}>{f.label}</Text>
                </Cell>
                <Cell
                  x={fisSplitX}
                  y={y}
                  w={G.fisW - fisLabelW}
                  h={fisRowH}
                  pad={2}
                  align="center"
                  justify="center"
                >
                  <Text style={[styles.cellText, styles.upper]}>{f.value}</Text>
                </Cell>
              </View>
            );
          })}

          <Cell x={L} y={G.cmdteY} w={G.cmdteLeftW} h={G.cmdteH} pad={3} justify="center">
            <Text style={styles.cellText}>
              <Text style={styles.cellBold}>NOMBRE DEL CMDTE DE CURSO: </Text>
              <Text style={styles.upper}>{dash(props.cmdteCursoNombre)}</Text>
            </Text>
          </Cell>
          <Cell x={midX} y={G.cmdteY} w={phoneX - midX} h={G.cmdteH} pad={3} justify="center">
            <Text style={styles.cellBold}>TELÉFONO DEL CMDTE DE CURSO:</Text>
          </Cell>
          <Cell
            x={phoneX}
            y={G.cmdteY}
            w={G.phoneBoxW}
            h={G.cmdteH}
            pad={2}
            align="center"
            justify="center"
          >
            <Text style={[styles.cellBold, styles.upper]}>
              {formatPhone(props.cmdteCursoTelefono)}
            </Text>
          </Cell>

          <Cell
            x={L}
            y={G.regY}
            w={G.regLabelW}
            h={G.regH}
            pad={3}
            align="center"
            justify="center"
          >
            <Text style={[styles.cellBoldSm, { textAlign: "center", fontSize: u(6.5) }]}>
              RÉGIMEN DISCIPLINARIO MILITAR:
            </Text>
          </Cell>
          {discRows.flatMap((row, ri) => {
            const rowH = G.regH / 3;
            const y = G.regY + ri * rowH;
            const colW = (G.frameW - G.regLabelW) / 2;
            return row.map((item, ci) => {
              const x = regSplitX + ci * colW;
              if (!item) {
                return <Cell key={`empty-${ri}-${ci}`} x={x} y={y} w={colW} h={rowH} />;
              }
              const [label, val] = item;
              return (
                <Cell key={`${ri}-${label}`} x={x} y={y} w={colW} h={rowH} pad={2} justify="center">
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <Text
                      style={[
                        styles.cellBoldSm,
                        { fontSize: u(6), flexGrow: 1, marginRight: edge(4) },
                      ]}
                    >
                      {label}
                    </Text>
                    <SiNo value={val} />
                  </View>
                </Cell>
              );
            });
          })}

          <Cell x={L} y={G.uniY} w={G.uniLeftW} h={G.uniH} pad={3} justify="center">
            <Text style={styles.cellText}>
              <Text style={styles.cellBold}>UNIDAD QUIEN POSTULA: </Text>
              <Text style={[styles.upper, { fontWeight: "bold" }]}>
                {dash(props.unidadPostulante)}
              </Text>
            </Text>
          </Cell>
          <Cell
            x={uniSplitX}
            y={G.uniY}
            w={G.frameW - G.uniLeftW}
            h={G.uniH}
            pad={3}
            align="center"
            justify="center"
          >
            <Text style={styles.cellBold}>CURSOS REALIZADOS</Text>
            {props.cursosRealizados?.trim() ? (
              <Text style={[styles.cellText, styles.upper, { fontSize: u(6.5), marginTop: u(1) }]}>
                {props.cursosRealizados.trim()}
              </Text>
            ) : null}
          </Cell>

          {/* Título solo sobre UNIVERSIDAD+TÍTULO; PAÍS…NÚCLEO con rowspan (2 filas de cabecera). */}
          <Cell
            x={L}
            y={G.estY}
            w={estLeftW}
            h={G.estTitleH}
            pad={2}
            align="center"
            justify="center"
          >
            <Text style={[styles.cellBoldSm, { fontSize: u(7), textAlign: "center" }]}>
              ESTUDIOS CONDUCENTES A TÍTULO UNIVERSITARIO
            </Text>
          </Cell>
          {estLeftCols.map((col, i) => {
            const x = L + estLeftCols.slice(0, i).reduce((a, c) => a + c.w, 0);
            return (
              <Cell
                key={`h-${col.key}`}
                x={x}
                y={G.estY + G.estTitleH}
                w={col.w}
                h={G.estHeadH}
                pad={1}
                align="center"
                justify="center"
              >
                <Text style={[styles.cellBoldSm, { fontSize: u(6.5), textAlign: "center" }]}>
                  {col.label}
                </Text>
              </Cell>
            );
          })}
          {estRightCols.map((col, i) => {
            const x = L + estLeftW + estRightCols.slice(0, i).reduce((a, c) => a + c.w, 0);
            return (
              <Cell
                key={`h-${col.key}`}
                x={x}
                y={G.estY}
                w={col.w}
                h={estHeaderH}
                pad={1}
                align="center"
                justify="center"
              >
                <Text style={[styles.cellBoldSm, { fontSize: u(6.5), textAlign: "center" }]}>
                  {col.label}
                </Text>
              </Cell>
            );
          })}
          {estCols.map((col, i) => {
            const x = L + estCols.slice(0, i).reduce((a, c) => a + c.w, 0);
            return (
              <Cell
                key={`d-${col.key}`}
                x={x}
                y={G.estY + estHeaderH}
                w={col.w}
                h={G.estRowH}
                pad={2}
                align="center"
                justify="center"
              >
                <Text
                  style={[styles.cellText, styles.upper, { fontSize: u(7), textAlign: "center" }]}
                >
                  {dash(col.val)}
                </Text>
              </Cell>
            );
          })}

          <Cell x={L} y={G.culY} w={G.culLeftW} h={G.culH} pad={3} justify="center">
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.cellBold, { marginRight: u(6) }]}>ESTUDIO CULMINADO</Text>
              <SiNo value={props.estudioCulminado ?? true} />
            </View>
          </Cell>
          <Cell
            x={culSplitX}
            y={G.culY}
            w={G.frameW - G.culLeftW}
            h={G.culH}
            pad={3}
            justify="center"
          >
            <Text style={styles.cellText}>
              <Text style={styles.cellBold}>¿POR QUÉ? </Text>
              <Text style={styles.upper}>{dash(props.estudioCulminadoPorQue)}</Text>
            </Text>
          </Cell>

          <Cell
            x={L}
            y={G.aprY}
            w={G.frameW}
            h={G.aprH}
            pad={4}
            align="flex-start"
            justify="flex-start"
          >
            <Text style={[styles.cellBold, { marginBottom: u(3) }]}>APRECIACIÓN GENERAL</Text>
            <Text
              style={[
                styles.cellText,
                styles.upper,
                { fontSize: u(7), lineHeight: 1.35, textAlign: "justify" },
              ]}
            >
              {props.apreciacionGeneral?.trim()
                ? props.apreciacionGeneral.trim().toUpperCase()
                : " "}
            </Text>
          </Cell>

          {/* ——— Grilla continua ——— */}
          <HLine x1={L} x2={R} y={T} />
          <HLine x1={L} x2={R} y={B} />
          <VLine x={L} y1={T} y2={B} />
          <VLine x={R} y1={T} y2={B} />

          <VLine x={G.persX} y1={T} y2={topBottom} />
          <VLine x={persSplitX} y1={T} y2={topBottom} />
          <VLine x={G.gradoX} y1={T} y2={topBottom} />
          <VLine x={gradoCheckX} y1={G.fotoY + G.gradoHeaderH} y2={topBottom} />
          <VLine x={G.fisX} y1={T} y2={topBottom} />
          <VLine x={fisSplitX} y1={G.fotoY + G.fisHeaderH} y2={topBottom} />
          <VLine x={G.fotoX + G.ordenLabelW} y1={G.ordenY} y2={topBottom} />

          {persYs.slice(1, -1).map((y) => (
            <HLine key={`ph-${y}`} x1={G.persX} x2={G.gradoX} y={y} />
          ))}
          <HLine x1={L} x2={G.gradoX} y={G.ordenY} />
          <HLine x1={L} x2={R} y={topBottom} />
          <HLine x1={G.gradoX} x2={R} y={G.fotoY + G.gradoHeaderH} />
          {gradoInnerYs.map((y) => (
            <HLine key={`gh-${y}`} x1={G.gradoX} x2={G.fisX} y={y} />
          ))}
          {fisInnerYs.map((y) => (
            <HLine key={`fh-${y}`} x1={G.fisX} x2={R} y={y} />
          ))}

          <HLine x1={L} x2={R} y={G.cmdteY + G.cmdteH} />
          <VLine x={midX} y1={G.cmdteY} y2={G.cmdteY + G.cmdteH} />
          <VLine x={phoneX} y1={G.cmdteY} y2={G.cmdteY + G.cmdteH} />

          <HLine x1={L} x2={R} y={G.regY + G.regH} />
          <VLine x={regSplitX} y1={G.regY} y2={G.regY + G.regH} />
          <VLine x={regMidX} y1={G.regY} y2={G.regY + G.regH} />
          <HLine x1={regSplitX} x2={R} y={G.regY + G.regH / 3} />
          <HLine x1={regSplitX} x2={R} y={G.regY + (2 * G.regH) / 3} />

          <HLine x1={L} x2={R} y={G.uniY + G.uniH} />
          <VLine x={uniSplitX} y1={G.uniY} y2={G.uniY + G.uniH} />

          {/* Línea bajo el título: solo el bloque UNIVERSIDAD+TÍTULO */}
          <HLine x1={L} x2={L + estLeftW} y={G.estY + G.estTitleH} />
          <HLine x1={L} x2={R} y={G.estY + estHeaderH} />
          <HLine x1={L} x2={R} y={G.culY} />
          {/* Separador UNIVERSIDAD | TÍTULO: solo desde la subcabecera */}
          <VLine
            x={L + estLeftCols[0]!.w}
            y1={G.estY + G.estTitleH}
            y2={G.culY}
          />
          {/* Separadores TÍTULO|PAÍS|…|NÚCLEO: desde el tope (cabeceras con rowspan) */}
          {estRightCols.map((_, i) => {
            const x =
              L +
              estLeftW +
              estRightCols.slice(0, i).reduce((a, c) => a + c.w, 0);
            // i=0 es el borde izquierdo de PAÍS (= fin de TÍTULO)
            return <VLine key={`ev-r-${i}`} x={x} y1={G.estY} y2={G.culY} />;
          })}

          <HLine x1={L} x2={R} y={G.aprY} />
          <VLine x={culSplitX} y1={G.culY} y2={G.aprY} />

          {props.debug ? (
            <View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: PAGE_W,
                height: PAGE_H,
                borderWidth: 1,
                borderColor: "#FF0000",
              }}
            />
          ) : null}
        </View>
      </Page>
    </Document>
  );
}

export const FICHA_TECNICA_PAGE_SIZE = [PAGE_W, PAGE_H] as const;
export const FICHA_TECNICA_SCALE = SCALE;
