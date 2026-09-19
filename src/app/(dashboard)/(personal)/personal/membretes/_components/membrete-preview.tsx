import { INSTITUTION_LOGO_SRC } from "@src/lib/branding";
import type { MembreteLogoKind } from "@src/lib/membrete";
import { cn } from "@src/lib/utils";

type Props = {
  lineas: string[];
  logoIzq: MembreteLogoKind;
  logoDer: MembreteLogoKind;
  className?: string;
};

function Crest({ side }: { side: "left" | "right" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={INSTITUTION_LOGO_SRC}
      alt=""
      className={cn(
        "absolute top-1/2 h-14 w-14 -translate-y-1/2 object-contain sm:h-16 sm:w-16",
        side === "left" ? "left-2" : "right-2",
      )}
    />
  );
}

export function MembretePreview({ lineas, logoIzq, logoDer, className }: Props) {
  const shown = lineas.length ? lineas : ["(Sin renglones)"];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-slate-200 bg-white px-16 py-3 text-center shadow-xs",
        className,
      )}
    >
      {logoIzq === "cefoa" ? <Crest side="left" /> : null}
      {logoDer === "cefoa" ? <Crest side="right" /> : null}
      <div className="space-y-0.5">
        {shown.map((line, i) => (
          <p
            key={`${i}-${line}`}
            className={cn(
              "leading-snug text-slate-800",
              i === 0 ? "text-[13px] font-semibold" : "text-[11px]",
              !lineas.length && "italic text-slate-400",
            )}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
