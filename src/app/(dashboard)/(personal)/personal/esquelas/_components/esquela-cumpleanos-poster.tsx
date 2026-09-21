"use client";

import { CUMPLEANOS_PAGE_W, layoutHonoreeName } from "@src/lib/pdf/esquela-cumpleanos-layout";
import {
  DEFAULT_ESQUELA_PLANTILLA_LAYOUT,
  goldGradientCss,
  layoutNameMaxWidthPt,
  pctBoxStyle,
  type EsquelaPlantillaLayout,
} from "@src/lib/pdf/esquela-plantilla-layout";

const SCRIPT_FONT = "GreatVibesPoster, cursive";
const PLAIN_FONT = "Urbanist, ui-sans-serif, system-ui, sans-serif";

function GoldScriptLine({
  text,
  sizeCqw,
  layout,
}: {
  text: string;
  sizeCqw: string;
  layout: EsquelaPlantillaLayout;
}) {
  const face = {
    fontFamily: SCRIPT_FONT,
    fontSize: `${sizeCqw}cqw`,
    letterSpacing: `${layout.nameLetterSpacingEm}em`,
    lineHeight: 1.28,
    textAlign: layout.nameAlign,
    width: "100%",
    margin: 0,
  };

  return (
    <span className="relative block w-full">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 select-none"
        style={{
          ...face,
          color: layout.gold.dark,
          transform: `translateY(${layout.nameDepthEm}em)`,
        }}
      >
        {text}
      </span>
      <span
        className="relative block"
        style={{
          ...face,
          backgroundImage: goldGradientCss(layout.gold),
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
          WebkitTextStroke: `${layout.nameStrokeEm}em ${layout.gold.stroke}`,
          paintOrder: "stroke fill",
          filter: "drop-shadow(0 0.04em 0.05em rgba(40,24,6,0.28))",
        }}
      >
        {text}
      </span>
    </span>
  );
}

export function EsquelaCumpleanosPoster({
  nombre,
  fotoSrc,
  fondoSrc = "/images/esquelas/cumpleanos-plantilla.jpg",
  overlaySrc = "/images/esquelas/corona-laurel.png",
  layout = DEFAULT_ESQUELA_PLANTILLA_LAYOUT,
}: {
  nombre: string;
  fotoSrc: string | null;
  fondoSrc?: string;
  overlaySrc?: string | null;
  layout?: EsquelaPlantillaLayout;
}) {
  const { lines, fontSize } = layoutHonoreeName(nombre, layoutNameMaxWidthPt(layout), {
    maxFontPt: layout.nameMaxFontPt,
    minFontPt: layout.nameMinFontPt,
  });
  const sizeCqw = ((fontSize / CUMPLEANOS_PAGE_W) * 100).toFixed(3);

  return (
    <div className="@container relative aspect-3/4 w-full overflow-hidden bg-slate-900 shadow-lg ring-1 ring-black/10">
      <style>{`
        @font-face {
          font-family: "GreatVibesPoster";
          src: url("/fonts/GreatVibes-Regular.ttf") format("truetype");
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
      `}</style>
      {/* eslint-disable-next-line @next/next/no-img-element -- plantilla configurable */}
      <img src={fondoSrc} alt="" className="absolute inset-0 z-0 h-full w-full object-cover" />
      {fotoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- foto del aspirante vía API propia
        <img
          src={fotoSrc}
          alt=""
          className="absolute z-10"
          style={{
            ...pctBoxStyle(layout.photo),
            objectFit: layout.photoFit,
          }}
        />
      ) : null}
      {overlaySrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- corona / capa
        <img
          src={overlaySrc}
          alt=""
          className="pointer-events-none absolute inset-0 z-20 h-full w-full object-cover"
        />
      ) : null}
      <div
        className="absolute z-30 flex flex-col"
        style={{
          left: `${layout.name.leftPct * 100}%`,
          top: `${layout.name.topPct * 100}%`,
          width: `${layout.name.widthPct * 100}%`,
          alignItems:
            layout.nameAlign === "left"
              ? "flex-start"
              : layout.nameAlign === "right"
                ? "flex-end"
                : "center",
        }}
      >
        {layout.nameStyle === "plain"
          ? lines.map((line) => (
              <p
                key={line}
                className="m-0 w-full"
                style={{
                  fontFamily: PLAIN_FONT,
                  fontSize: `${sizeCqw}cqw`,
                  letterSpacing: `${layout.nameLetterSpacingEm}em`,
                  lineHeight: 1.2,
                  textAlign: layout.nameAlign,
                  color: layout.nameColor,
                  fontWeight: 700,
                }}
              >
                {line}
              </p>
            ))
          : lines.map((line) => (
              <GoldScriptLine key={line} text={line} sizeCqw={sizeCqw} layout={layout} />
            ))}
      </div>
    </div>
  );
}
