"use client";

import {
  CUMPLEANOS_GOLD,
  CUMPLEANOS_LAYOUT,
  layoutHonoreeName,
} from "@src/lib/pdf/esquela-cumpleanos-layout";

export function EsquelaCumpleanosPoster({
  nombre,
  fotoSrc,
}: {
  nombre: string;
  fotoSrc: string | null;
}) {
  const { rank, lines, fontSize } = layoutHonoreeName(nombre);
  const sizeCqw = ((fontSize / 595.28) * 100).toFixed(3);
  const goldText = {
    fontFamily: "SatisfyPoster, cursive",
    backgroundImage: CUMPLEANOS_GOLD.css,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
    WebkitTextStroke: `0.45px ${CUMPLEANOS_GOLD.stroke}`,
    paintOrder: "stroke fill",
    letterSpacing: CUMPLEANOS_LAYOUT.nameLetterSpacingEm,
    filter: "drop-shadow(0 1px 1px rgba(30,20,6,0.55))",
    lineHeight: 1.18,
    textAlign: "center" as const,
    fontSize: `${sizeCqw}cqw`,
    width: "100%",
    margin: 0,
  };

  return (
    <div className="@container relative aspect-3/4 w-full overflow-hidden bg-slate-900 shadow-lg ring-1 ring-black/10">
      <style>{`
        @font-face {
          font-family: "SatisfyPoster";
          src: url("/fonts/Satisfy-Regular.woff2") format("woff2"),
            url("/fonts/Satisfy-Regular.woff") format("woff");
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
        <p style={goldText}>{rank}</p>
        {lines.map((line) => (
          <p key={line} style={goldText}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
