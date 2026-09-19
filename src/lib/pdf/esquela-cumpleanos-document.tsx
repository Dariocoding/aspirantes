import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  CUMPLEANOS_GOLD,
  CUMPLEANOS_LAYOUT,
  CUMPLEANOS_PAGE_H,
  CUMPLEANOS_PAGE_W,
  layoutHonoreeName,
} from "@src/lib/pdf/esquela-cumpleanos-layout";
import {
  ESQUELA_SCRIPT_FONT_FAMILY,
  registerEsquelaPdfFonts,
} from "@src/lib/pdf/register-esquela-pdf-fonts";

registerEsquelaPdfFonts();

const photoW = CUMPLEANOS_PAGE_W * CUMPLEANOS_LAYOUT.photoWidthPct;
const photoH = CUMPLEANOS_PAGE_H * CUMPLEANOS_LAYOUT.photoHeightPct;
const photoLeft = (CUMPLEANOS_PAGE_W - photoW) / 2;
const photoTop = CUMPLEANOS_PAGE_H * CUMPLEANOS_LAYOUT.photoCenterYPct - photoH / 2;
const nameWidth = CUMPLEANOS_PAGE_W * CUMPLEANOS_LAYOUT.nameWidthPct;
const nameLeft = (CUMPLEANOS_PAGE_W - nameWidth) / 2;
const nameTop = CUMPLEANOS_PAGE_H * CUMPLEANOS_LAYOUT.nameTopPct;

const OUTLINE: Array<[number, number]> = [
  [-0.55, 0],
  [0.55, 0],
  [0, -0.55],
  [0, 0.55],
];

/** jpeg-js exige Buffer de Node (`readUInt16BE`); Uint8Array deja la página en blanco. */
function jpegSrc(data: Buffer) {
  return { data: Buffer.from(data), format: "jpg" as const };
}

function pngSrc(data: Buffer) {
  return { data: Buffer.from(data), format: "png" as const };
}

const styles = StyleSheet.create({
  page: {
    padding: 0,
    margin: 0,
  },
  canvas: {
    width: CUMPLEANOS_PAGE_W,
    height: CUMPLEANOS_PAGE_H,
    position: "relative",
  },
  bg: {
    width: CUMPLEANOS_PAGE_W,
    height: CUMPLEANOS_PAGE_H,
  },
  photo: {
    position: "absolute",
    left: photoLeft,
    top: photoTop,
    width: photoW,
    height: photoH,
    objectFit: "contain",
  },
  laurel: {
    position: "absolute",
    left: 0,
    top: 0,
    width: CUMPLEANOS_PAGE_W,
    height: CUMPLEANOS_PAGE_H,
  },
  nameWrap: {
    position: "absolute",
    left: nameLeft,
    top: nameTop,
    width: nameWidth,
    alignItems: "center",
  },
  lineBox: {
    width: nameWidth,
    alignItems: "center",
    marginBottom: 1,
  },
});

function ScriptLine({ text, fontSize }: { text: string; fontSize: number }) {
  const base = {
    fontFamily: ESQUELA_SCRIPT_FONT_FAMILY,
    fontSize,
    textAlign: "center" as const,
    width: nameWidth,
    letterSpacing: CUMPLEANOS_LAYOUT.nameLetterSpacingPt,
  };
  return (
    <View style={styles.lineBox}>
      <Text
        style={{
          ...base,
          color: CUMPLEANOS_GOLD.dark,
          position: "absolute",
          left: 0,
          top: fontSize * CUMPLEANOS_LAYOUT.nameDepthEm,
        }}
      >
        {text}
      </Text>
      {OUTLINE.map(([x, y]) => (
        <Text
          key={`${x},${y}`}
          style={{
            ...base,
            color: CUMPLEANOS_GOLD.stroke,
            position: "absolute",
            left: x,
            top: y,
          }}
        >
          {text}
        </Text>
      ))}
      <Text style={{ ...base, color: CUMPLEANOS_GOLD.fill }}>{text}</Text>
      <Text
        style={{
          ...base,
          color: CUMPLEANOS_GOLD.light,
          position: "absolute",
          left: 0,
          top: -0.4,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function HonoreeName({ nombre }: { nombre: string }) {
  const { lines, fontSize } = layoutHonoreeName(nombre);
  return (
    <View style={styles.nameWrap}>
      {lines.map((line) => (
        <ScriptLine key={line} text={line} fontSize={fontSize} />
      ))}
    </View>
  );
}

export type EsquelaCumpleanosPdfProps = {
  nombre: string;
  plantillaJpeg: Buffer;
  foto: { data: Buffer; format: "jpg" | "png" } | null;
  laurelPng: Buffer | null;
};

export function EsquelaCumpleanosPdfDocument({
  nombre,
  plantillaJpeg,
  foto,
  laurelPng,
}: EsquelaCumpleanosPdfProps) {
  const fotoSrc =
    foto?.format === "jpg" ? jpegSrc(foto.data) : foto ? pngSrc(foto.data) : null;
  return (
    <Document>
      <Page size={{ width: CUMPLEANOS_PAGE_W, height: CUMPLEANOS_PAGE_H }} style={styles.page} wrap={false}>
        <View style={styles.canvas}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
          <Image src={jpegSrc(plantillaJpeg)} style={styles.bg} />
          {fotoSrc ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
            <Image src={fotoSrc} style={styles.photo} />
          ) : null}
          {laurelPng ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
            <Image src={pngSrc(laurelPng)} style={styles.laurel} />
          ) : null}
          <HonoreeName nombre={nombre} />
        </View>
      </Page>
    </Document>
  );
}
