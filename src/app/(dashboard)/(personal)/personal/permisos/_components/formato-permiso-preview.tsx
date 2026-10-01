import { EJERCITO_LOGO_SRC, INSTITUTION_LOGO_SRC } from "@src/lib/branding";
import type { MembreteLogoKind } from "@src/lib/membrete";
import type { FormatoPermisoPresentacion } from "@src/lib/pdf/formato-permiso";
import { cn } from "@src/lib/utils";

function logoSrc(kind: MembreteLogoKind): string | null {
  if (kind === "cefoa") return INSTITUTION_LOGO_SRC;
  if (kind === "ejercito") return EJERCITO_LOGO_SRC;
  return null;
}

function Cell({
  children,
  className,
  span,
}: {
  children: string;
  className?: string;
  span?: number;
}) {
  const empty = !children.trim();
  return (
    <div
      className={cn(
        "flex min-h-7 items-center justify-center border-r border-b border-black px-1 py-1 text-center",
        span === 4 && "col-span-4 justify-start text-left",
        className,
      )}
    >
      <span className={cn("font-semibold", empty && "font-normal text-slate-300")}>{empty ? "—" : children}</span>
    </div>
  );
}

export function FormatoPermisoPreview({ presentacion }: { presentacion: FormatoPermisoPresentacion }) {
  const left = logoSrc(presentacion.logoIzq);
  const right = logoSrc(presentacion.logoDer);
  return (
    <div className="bg-white p-3 text-black shadow-sm ring-1 ring-slate-200">
      <div className="border-2 border-black px-2 pt-2 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-16 w-14 shrink-0 items-center justify-center">
            {left ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={left} alt="" className="max-h-16 max-w-14 object-contain" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1 space-y-0.5 text-center">
            {presentacion.lineas.map((line, index) => (
              <p key={`${index}-${line}`} className="text-[9px] leading-tight font-bold">
                {line}
              </p>
            ))}
          </div>
          <div className="flex h-16 w-14 shrink-0 items-center justify-center">
            {right ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={right} alt="" className="max-h-16 max-w-14 object-contain" />
            ) : null}
          </div>
        </div>

        <p className="mt-2 text-center text-sm font-bold tracking-wide underline">{presentacion.titulo}</p>
        {presentacion.anulado ? (
          <p className="text-center text-[11px] font-bold text-rose-800">ANULADO</p>
        ) : null}

        <div
          className="mt-2 grid border-t border-l border-black text-[9px] leading-tight"
          style={{ gridTemplateColumns: "1.15fr 1.45fr 1.3fr 1.25fr 1.7fr" }}
        >
          <Cell className="min-h-6 font-bold">JERARQUÍA</Cell>
          <Cell>APELLIDOS</Cell>
          <Cell>NOMBRES</Cell>
          <Cell>CÉDULA IDENTIDAD</Cell>
          <Cell>COMPAÑÍA</Cell>
          <Cell className="min-h-8 text-[10px]">{presentacion.jerarquia}</Cell>
          <Cell className="text-[10px]">{presentacion.apellidos}</Cell>
          <Cell className="text-[10px]">{presentacion.nombres}</Cell>
          <Cell className="text-[10px]">{presentacion.cedula}</Cell>
          <Cell className="text-[10px]">{presentacion.compania}</Cell>
          <Cell>DURACIÓN</Cell>
          <Cell>DESDE</Cell>
          <Cell>HASTA</Cell>
          <Cell>TIPO PERMISO</Cell>
          <Cell>TELÉFONO HABITACIÓN</Cell>
          <Cell className="min-h-8 text-[10px]">{presentacion.duracion}</Cell>
          <Cell className="text-[10px]">{presentacion.desde}</Cell>
          <Cell className="text-[10px]">{presentacion.hasta}</Cell>
          <Cell className="text-[10px]">{presentacion.tipo}</Cell>
          <Cell className="text-[10px]">{presentacion.telefono}</Cell>
          <Cell className="min-h-8">DIRECCIÓN HABITACIÓN:</Cell>
          <Cell span={4} className="text-[10px]">
            {presentacion.direccion}
          </Cell>
        </div>

        <div className="mt-4 space-y-0.5 text-center">
          <p className="text-[11px] font-bold">{presentacion.firmanteNombre.trim() || " "}</p>
          <p className="text-[10px] leading-snug font-bold">{presentacion.firmanteCargo.trim() || " "}</p>
        </div>
        {presentacion.nota ? (
          <p className="mt-4 text-[9px] leading-snug font-medium">{presentacion.nota}</p>
        ) : null}
      </div>
    </div>
  );
}
