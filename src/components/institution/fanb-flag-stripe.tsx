import { FANB_FLAG_HEX } from "@/lib/branding";
import { cn } from "@/lib/utils";

/** Franja tricolor (amarillo · azul · rojo) — misma pieza visual en sidebar y login. */
export function FanbFlagStripe({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-1.5 w-full shrink-0 shadow-sm", className)} aria-hidden>
      <div
        className="h-full min-w-0 flex-1"
        style={{ backgroundColor: FANB_FLAG_HEX.yellow }}
      />
      <div
        className="h-full min-w-0 flex-1"
        style={{ backgroundColor: FANB_FLAG_HEX.blue }}
      />
      <div
        className="h-full min-w-0 flex-1"
        style={{ backgroundColor: FANB_FLAG_HEX.red }}
      />
    </div>
  );
}
