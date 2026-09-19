"use client";

import {
  CUMPLEANOS_GOLD,
  CUMPLEANOS_LAYOUT,
  layoutHonoreeName,
} from "@src/lib/pdf/esquela-cumpleanos-layout";

const SCRIPT_FONT = "GreatVibesPoster, cursive";

function GoldScriptLine({ text, sizeCqw }: { text: string; sizeCqw: string }) {
  const face = {
    fontFamily: SCRIPT_FONT,
    fontSize: `${sizeCqw}cqw`,
    letterSpacing: CUMPLEANOS_LAYOUT.nameLetterSpacingEm,
    lineHeight: 1.28,
    textAlign: "center" as const,
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
          color: CUMPLEANOS_GOLD.dark,
          transform: `translateY(${CUMPLEANOS_LAYOUT.nameDepthEm}em)`,
        }}
      >
        {text}
      </span>
      <span
        className="relative block"
        style={{
          ...face,
          backgroundImage: CUMPLEANOS_GOLD.css,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
          WebkitTextStroke: `0.022em ${CUMPLEANOS_GOLD.stroke}`,
          paintOrder: "stroke fill",
          filter: "drop-shadow(0 0.035em 0.05em rgba(28,18,6,0.32))",
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
}: {
  nombre: string;
  fotoSrc: string | null;
}) {
  const { lines, fontSize } = layoutHonoreeName(nombre);
  const sizeCqw = ((fontSize / 595.28) * 100).toFixed(3);

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
      {/* eslint-disable-next-line @next/next/no-img-element -- plantilla estática local */}
      <img
        src="/images/esquelas/cumpleanos-plantilla.jpg"
        alt=""
        className="absolute inset-0 z-0 h-full w-full object-cover"
      />
      {fotoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- foto del aspirante vía API propia
        <img
          src={fotoSrc}
          alt=""
          className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 object-contain"
          style={{
            top: `${CUMPLEANOS_LAYOUT.photoCenterYPct * 100}%`,
            width: `${CUMPLEANOS_LAYOUT.photoWidthPct * 100}%`,
            height: `${CUMPLEANOS_LAYOUT.photoHeightPct * 100}%`,
          }}
        />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- corona extraída de la plantilla */}
      <img
        src="/images/esquelas/corona-laurel.png"
        alt=""
        className="pointer-events-none absolute inset-0 z-20 h-full w-full object-cover"
      />
      <div
        className="absolute z-30 flex flex-col items-center"
        style={{
          top: `${CUMPLEANOS_LAYOUT.nameTopPct * 100}%`,
          left: `${((1 - CUMPLEANOS_LAYOUT.nameWidthPct) / 2) * 100}%`,
          width: `${CUMPLEANOS_LAYOUT.nameWidthPct * 100}%`,
        }}
      >
        {lines.map((line) => (
          <GoldScriptLine key={line} text={line} sizeCqw={sizeCqw} />
        ))}
      </div>
    </div>
  );
}
