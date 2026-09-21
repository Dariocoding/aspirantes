import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { CUMPLEANOS_PAGE_H, CUMPLEANOS_PAGE_W, layoutHonoreeName } from "@src/lib/pdf/esquela-cumpleanos-layout";
import {
  DEFAULT_ESQUELA_PLANTILLA_LAYOUT,
  layoutNameMaxWidthPt,
  type EsquelaPlantillaLayout,
} from "@src/lib/pdf/esquela-plantilla-layout";
import {
  ESQUELA_PDF_FONT_FAMILY,
  ESQUELA_SCRIPT_FONT_FAMILY,
  registerEsquelaPdfFonts,
} from "@src/lib/pdf/register-esquela-pdf-fonts";

registerEsquelaPdfFonts();

function fauxBoldOffsets(emPx: number): Array<[number, number]> {
  const r = emPx;
  const d = emPx * 0.72;
  return [
    [-r, 0],
    [r, 0],
    [0, -r],
    [0, r],
    [-d, -d],
    [d, -d],
    [-d, d],
    [d, d],
  ];
}

/** jpeg-js exige Buffer de Node (`readUInt16BE`); Uint8Array deja la página en blanco. */
function jpegSrc(data: Buffer) {
  return { data: Buffer.from(data), format: "jpg" as const };
}

function pngSrc(data: Buffer) {
  return { data: Buffer.from(data), format: "png" as const };
}

const pageStyles = StyleSheet.create({
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
  laurel: {
    position: "absolute",
    left: 0,
    top: 0,
    width: CUMPLEANOS_PAGE_W,
    height: CUMPLEANOS_PAGE_H,
  },
});

function ScriptLine({
  text,
  fontSize,
  width,
  layout,
}: {
  text: string;
  fontSize: number;
  width: number;
  layout: EsquelaPlantillaLayout;
}) {
  const gold = layout.gold;
  const family = layout.nameStyle === "plain" ? ESQUELA_PDF_FONT_FAMILY : ESQUELA_SCRIPT_FONT_FAMILY;
  const align = layout.nameAlign;
  const base = {
    fontFamily: family,
    fontSize,
    textAlign: align,
    width,
    letterSpacing: layout.nameLetterSpacingEm * fontSize,
  };

  if (layout.nameStyle === "plain") {
    return (
      <View style={{ width, alignItems: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center", marginBottom: 1 }}>
        <Text style={{ ...base, color: layout.nameColor }}>{text}</Text>
      </View>
    );
  }

  const stroke = fontSize * layout.nameExportStrokeEm;
  const bold = fontSize * layout.nameExportFauxBoldEm;
  const shadowY = fontSize * layout.nameExportShadowYEm;
  return (
    <View style={{ width, alignItems: "center", marginBottom: 1 }}>
      <Text
        style={{
          ...base,
          color: "#2a1808",
          opacity: 0.5,
          position: "absolute",
          left: 0,
          top: shadowY,
        }}
      >
        {text}
      </Text>
      <Text
        style={{
          ...base,
          color: gold.dark,
          position: "absolute",
          left: 0,
          top: fontSize * layout.nameDepthEm,
        }}
      >
        {text}
      </Text>
      {fauxBoldOffsets(stroke).map(([x, y]) => (
        <Text
          key={`s${x},${y}`}
          style={{
            ...base,
            color: gold.stroke,
            position: "absolute",
            left: x,
            top: y,
          }}
        >
          {text}
        </Text>
      ))}
      {fauxBoldOffsets(bold).map(([x, y]) => (
        <Text
          key={`b${x},${y}`}
          style={{
            ...base,
            color: gold.dark,
            position: "absolute",
            left: x,
            top: y,
          }}
        >
          {text}
        </Text>
      ))}
      <Text style={{ ...base, color: gold.dark }}>{text}</Text>
    </View>
  );
}

function HonoreeName({ nombre, layout }: { nombre: string; layout: EsquelaPlantillaLayout }) {
  const nameWidth = CUMPLEANOS_PAGE_W * layout.name.widthPct;
  const nameLeft = CUMPLEANOS_PAGE_W * layout.name.leftPct;
  const nameTop = CUMPLEANOS_PAGE_H * layout.name.topPct;
  const { lines, fontSize } = layoutHonoreeName(nombre, layoutNameMaxWidthPt(layout), {
    maxFontPt: layout.nameMaxFontPt,
    minFontPt: layout.nameMinFontPt,
  });
  const alignItems =
    layout.nameAlign === "left" ? "flex-start" : layout.nameAlign === "right" ? "flex-end" : "center";
  return (
    <View
      style={{
        position: "absolute",
        left: nameLeft,
        top: nameTop,
        width: nameWidth,
        alignItems,
      }}
    >
      {lines.map((line) => (
        <ScriptLine key={line} text={line} fontSize={fontSize} width={nameWidth} layout={layout} />
      ))}
    </View>
  );
}

export type EsquelaCumpleanosPdfProps = {
  nombre: string;
  plantilla: { data: Buffer; format: "jpg" | "png" };
  foto: { data: Buffer; format: "jpg" | "png" } | null;
  laurelPng: Buffer | null;
  layout?: EsquelaPlantillaLayout;
};

export function EsquelaCumpleanosPdfDocument({
  nombre,
  plantilla,
  foto,
  laurelPng,
  layout = DEFAULT_ESQUELA_PLANTILLA_LAYOUT,
}: EsquelaCumpleanosPdfProps) {
  const plantillaSrc =
    plantilla.format === "jpg" ? jpegSrc(plantilla.data) : pngSrc(plantilla.data);
  const fotoSrc =
    foto?.format === "jpg" ? jpegSrc(foto.data) : foto ? pngSrc(foto.data) : null;
  const photoW = CUMPLEANOS_PAGE_W * layout.photo.widthPct;
  const photoH = CUMPLEANOS_PAGE_H * layout.photo.heightPct;
  const photoLeft = CUMPLEANOS_PAGE_W * layout.photo.leftPct;
  const photoTop = CUMPLEANOS_PAGE_H * layout.photo.topPct;

  return (
    <Document>
      <Page size={{ width: CUMPLEANOS_PAGE_W, height: CUMPLEANOS_PAGE_H }} style={pageStyles.page} wrap={false}>
        <View style={pageStyles.canvas}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
          <Image src={plantillaSrc} style={pageStyles.bg} />
          {fotoSrc ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
            <Image
              src={fotoSrc}
              style={{
                position: "absolute",
                left: photoLeft,
                top: photoTop,
                width: photoW,
                height: photoH,
                objectFit: layout.photoFit,
              }}
            />
          ) : null}
          {laurelPng ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
            <Image src={pngSrc(laurelPng)} style={pageStyles.laurel} />
          ) : null}
          <HonoreeName nombre={nombre} layout={layout} />
        </View>
      </Page>
    </Document>
  );
}
