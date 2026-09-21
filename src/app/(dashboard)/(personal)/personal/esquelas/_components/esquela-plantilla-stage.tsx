"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EsquelaCumpleanosPoster } from "@dashboard/esquelas/_components/esquela-cumpleanos-poster";
import {
  cloneEsquelaPlantillaLayout,
  pctBoxStyle,
  type EsquelaPlantillaLayout,
  type EsquelaRectPct,
} from "@src/lib/pdf/esquela-plantilla-layout";
import { cn } from "@src/lib/utils";

export type PlantillaBoxId = "photo" | "name";

type Handle = "move" | "nw" | "ne" | "sw" | "se";

type DragState = {
  box: PlantillaBoxId;
  handle: Handle;
  startX: number;
  startY: number;
  start: EsquelaRectPct;
};

function clampBox(box: EsquelaRectPct): EsquelaRectPct {
  const widthPct = Math.min(1, Math.max(0.04, box.widthPct));
  const heightPct = Math.min(1, Math.max(0.04, box.heightPct));
  return {
    widthPct,
    heightPct,
    leftPct: Math.min(1 - widthPct, Math.max(0, box.leftPct)),
    topPct: Math.min(1 - heightPct, Math.max(0, box.topPct)),
  };
}

function applyDrag(
  start: EsquelaRectPct,
  handle: Handle,
  dx: number,
  dy: number,
): EsquelaRectPct {
  if (handle === "move") {
    return clampBox({ ...start, leftPct: start.leftPct + dx, topPct: start.topPct + dy });
  }
  let left = start.leftPct;
  let top = start.topPct;
  let right = start.leftPct + start.widthPct;
  let bottom = start.topPct + start.heightPct;
  if (handle.includes("w")) left = start.leftPct + dx;
  if (handle.includes("e")) right = start.leftPct + start.widthPct + dx;
  if (handle.includes("n")) top = start.topPct + dy;
  if (handle.includes("s")) bottom = start.topPct + start.heightPct + dy;
  return clampBox({
    leftPct: Math.min(left, right),
    topPct: Math.min(top, bottom),
    widthPct: Math.abs(right - left),
    heightPct: Math.abs(bottom - top),
  });
}

function HandleDot({
  className,
  cursor,
  onPointerDown,
}: {
  className: string;
  cursor: string;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute z-10 h-2.5 w-2.5 rounded-full border border-white bg-sky-700 shadow",
        className,
      )}
      style={{ cursor }}
      onPointerDown={onPointerDown}
    />
  );
}

function BoxOverlay({
  id,
  label,
  box,
  selected,
  onSelect,
  onHandleDown,
}: {
  id: PlantillaBoxId;
  label: string;
  box: EsquelaRectPct;
  selected: boolean;
  onSelect: () => void;
  onHandleDown: (handle: Handle, e: React.PointerEvent) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onPointerDown={(e) => {
        onSelect();
        onHandleDown("move", e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
      className={cn(
        "absolute z-40 box-border cursor-move border-2",
        selected
          ? "border-sky-500 bg-sky-400/15"
          : "border-amber-300/80 bg-amber-200/10 hover:border-amber-400",
      )}
      style={pctBoxStyle(box)}
    >
      <span
        className={cn(
          "pointer-events-none absolute -top-5 left-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
          selected ? "bg-sky-700 text-white" : "bg-black/70 text-white",
        )}
      >
        {label}
      </span>
      {selected ? (
        <>
          <HandleDot className="-left-1 -top-1" cursor="nwse-resize" onPointerDown={(e) => onHandleDown("nw", e)} />
          <HandleDot className="-right-1 -top-1" cursor="nesw-resize" onPointerDown={(e) => onHandleDown("ne", e)} />
          <HandleDot className="-bottom-1 -left-1" cursor="nesw-resize" onPointerDown={(e) => onHandleDown("sw", e)} />
          <HandleDot className="-bottom-1 -right-1" cursor="nwse-resize" onPointerDown={(e) => onHandleDown("se", e)} />
        </>
      ) : null}
    </div>
  );
}

export function EsquelaPlantillaStage({
  nombre,
  fotoSrc,
  fondoSrc,
  overlaySrc,
  layout,
  selected,
  onSelect,
  onLayoutChange,
  interactive,
}: {
  nombre: string;
  fotoSrc: string | null;
  fondoSrc: string;
  overlaySrc: string | null;
  layout: EsquelaPlantillaLayout;
  selected: PlantillaBoxId;
  onSelect: (id: PlantillaBoxId) => void;
  onLayoutChange: (next: EsquelaPlantillaLayout) => void;
  interactive: boolean;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const [drag, setDrag] = useState<DragState | null>(null);

  const begin = useCallback(
    (box: PlantillaBoxId, handle: Handle, e: React.PointerEvent) => {
      if (!interactive) return;
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      setDrag({
        box,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        start: { ...layout[box] },
      });
    },
    [interactive, layout],
  );

  useEffect(() => {
    if (!drag) return;

    const onMove = (e: PointerEvent) => {
      const el = stageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return;
      const dx = (e.clientX - drag.startX) / rect.width;
      const dy = (e.clientY - drag.startY) / rect.height;
      const nextBox = applyDrag(drag.start, drag.handle, dx, dy);
      const next = cloneEsquelaPlantillaLayout(layoutRef.current);
      next[drag.box] = nextBox;
      onLayoutChange(next);
    };

    const onUp = () => setDrag(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [drag, onLayoutChange]);

  return (
    <div ref={stageRef} className="relative select-none">
      <EsquelaCumpleanosPoster
        nombre={nombre}
        fotoSrc={fotoSrc}
        fondoSrc={fondoSrc}
        overlaySrc={overlaySrc}
        layout={layout}
      />
      {interactive ? (
        <>
          <BoxOverlay
            id="photo"
            label="Foto"
            box={layout.photo}
            selected={selected === "photo"}
            onSelect={() => onSelect("photo")}
            onHandleDown={(handle, e) => begin("photo", handle, e)}
          />
          <BoxOverlay
            id="name"
            label="Nombre"
            box={layout.name}
            selected={selected === "name"}
            onSelect={() => onSelect("name")}
            onHandleDown={(handle, e) => begin("name", handle, e)}
          />
        </>
      ) : null}
    </div>
  );
}
