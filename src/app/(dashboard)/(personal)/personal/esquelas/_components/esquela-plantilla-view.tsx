"use client";

import { RotateCcw, Save } from "lucide-react";
import { useActionState, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  resetEsquelaPlantillaLayout,
  saveEsquelaPlantilla,
} from "@src/app/actions/esquela-plantilla";
import {
  EsquelaPlantillaStage,
  type PlantillaBoxId,
} from "@dashboard/esquelas/_components/esquela-plantilla-stage";
import { Button } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import { esquelaPlantillaInitialActionState } from "@src/lib/action-types";
import {
  BUNDLED_ESQUELA_FONDO_SRC,
  BUNDLED_ESQUELA_OVERLAY_SRC,
  cloneEsquelaPlantillaLayout,
  DEFAULT_ESQUELA_PLANTILLA_LAYOUT,
  type EsquelaPlantillaLayout,
  type EsquelaRectPct,
} from "@src/lib/pdf/esquela-plantilla-layout";

export type EsquelaPlantillaViewProps = {
  canWrite: boolean;
  layout: EsquelaPlantillaLayout;
  fondoSrc: string;
  overlaySrc: string | null;
  hasCustomFondo: boolean;
  hasCustomOverlay: boolean;
};

function pctInput(value: number): string {
  return (value * 100).toFixed(1);
}

function parsePct(raw: string, fallback: number): number {
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, n)) / 100;
}

function FieldPct({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[11px] text-slate-500">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        step="0.1"
        min={0}
        max={100}
        disabled={disabled}
        value={pctInput(value)}
        onChange={(e) => onChange(parsePct(e.target.value, value))}
      />
    </div>
  );
}

export function EsquelaPlantillaView({
  canWrite,
  layout: savedLayout,
  fondoSrc: savedFondoSrc,
  overlaySrc: savedOverlaySrc,
  hasCustomFondo,
  hasCustomOverlay,
}: EsquelaPlantillaViewProps) {
  const router = useRouter();
  const [layout, setLayout] = useState(() => cloneEsquelaPlantillaLayout(savedLayout));
  const [selected, setSelected] = useState<PlantillaBoxId>("photo");
  const [nombreMuestra, setNombreMuestra] = useState("Asp/Ofic Nombre Apellido");
  const [fondoObjectUrl, setFondoObjectUrl] = useState<string | null>(null);
  const [overlayObjectUrl, setOverlayObjectUrl] = useState<string | null>(null);
  const [quitarFondo, setQuitarFondo] = useState(false);
  const [quitarOverlay, setQuitarOverlay] = useState(false);
  const [state, formAction, pending] = useActionState(
    saveEsquelaPlantilla,
    esquelaPlantillaInitialActionState,
  );

  useEffect(() => {
    setLayout(cloneEsquelaPlantillaLayout(savedLayout));
  }, [savedLayout]);

  useEffect(() => {
    if (!state.ok) return;
    setQuitarFondo(false);
    setQuitarOverlay(false);
    setFondoObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setOverlayObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    router.refresh();
  }, [state.ok, state.savedAt, router]);

  const fondoSrc = fondoObjectUrl
    ? fondoObjectUrl
    : quitarFondo
      ? BUNDLED_ESQUELA_FONDO_SRC
      : savedFondoSrc;
  const overlaySrc = !layout.overlayEnabled
    ? null
    : overlayObjectUrl
      ? overlayObjectUrl
      : quitarOverlay
        ? BUNDLED_ESQUELA_OVERLAY_SRC
        : savedOverlaySrc;

  const onLayoutChange = useCallback((next: EsquelaPlantillaLayout) => {
    setLayout(next);
  }, []);

  const patchBox = (id: PlantillaBoxId, patch: Partial<EsquelaRectPct>) => {
    const next = cloneEsquelaPlantillaLayout(layout);
    next[id] = { ...next[id], ...patch };
    setLayout(next);
  };

  const box = layout[selected];

  const layoutJson = useMemo(() => JSON.stringify(layout), [layout]);

  return (
    <form action={formAction} className="grid gap-5 xl:grid-cols-[minmax(0,22rem)_1fr]">
      <input type="hidden" name="layoutJson" value={layoutJson} />
      {quitarFondo ? <input type="hidden" name="quitarFondo" value="1" /> : null}
      {quitarOverlay ? <input type="hidden" name="quitarOverlay" value="1" /> : null}

      <div className="mx-auto w-full max-w-sm xl:mx-0">
        <EsquelaPlantillaStage
          nombre={nombreMuestra}
          fotoSrc={null}
          fondoSrc={fondoSrc}
          overlaySrc={overlaySrc}
          layout={layout}
          selected={selected}
          onSelect={setSelected}
          onLayoutChange={onLayoutChange}
          interactive={canWrite}
        />
        <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-500">
          Arrastre los recuadros de <span className="font-medium text-slate-700">Foto</span> y{" "}
          <span className="font-medium text-slate-700">Nombre</span>. La foto del aspirante se coloca
          en el recuadro al generar la esquela.
        </p>
      </div>

      <div className="space-y-4">
        <Card className="rounded-2xl border-slate-200/90 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Archivos de la plantilla</CardTitle>
            <CardDescription>
              Suba el fondo ceremonial. La corona puede ir dibujada en el fondo o como capa aparte,
              como está ahora.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fondo">Fondo (JPEG, PNG o WebP)</Label>
              <Input
                id="fondo"
                name="fondo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={!canWrite || pending}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setFondoObjectUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return file ? URL.createObjectURL(file) : null;
                  });
                  setQuitarFondo(false);
                }}
              />
              <div className="flex flex-wrap gap-2">
                {hasCustomFondo && !quitarFondo ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!canWrite}
                    onClick={() => {
                      setFondoObjectUrl((prev) => {
                        if (prev) URL.revokeObjectURL(prev);
                        return null;
                      });
                      setQuitarFondo(true);
                    }}
                  >
                    Volver al fondo original
                  </Button>
                ) : (
                  <p className="text-xs text-slate-500">Se usa el fondo empaquetado si no sube otro.</p>
                )}
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-1"
                checked={layout.overlayEnabled}
                disabled={!canWrite}
                onChange={(e) =>
                  setLayout({ ...cloneEsquelaPlantillaLayout(layout), overlayEnabled: e.target.checked })
                }
              />
              <span>
                Usar capa de corona (encima de la foto). Desactívela si la corona ya viene en el
                fondo que subió.
              </span>
            </label>

            {layout.overlayEnabled ? (
              <div className="space-y-1.5">
                <Label htmlFor="overlay">Capa / corona (PNG recomendado)</Label>
                <Input
                  id="overlay"
                  name="overlay"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={!canWrite || pending}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setOverlayObjectUrl((prev) => {
                      if (prev) URL.revokeObjectURL(prev);
                      return file ? URL.createObjectURL(file) : null;
                    });
                    setQuitarOverlay(false);
                  }}
                />
                {hasCustomOverlay && !quitarOverlay ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!canWrite}
                    onClick={() => {
                      setOverlayObjectUrl((prev) => {
                        if (prev) URL.revokeObjectURL(prev);
                        return null;
                      });
                      setQuitarOverlay(true);
                    }}
                  >
                    Volver a la corona original
                  </Button>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Posición y estilo</CardTitle>
            <CardDescription>
              El diseño actual (caligrafía dorada y foto en la corona) es el valor por defecto. Puede
              copiarlo o cambiarlo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombre-muestra">Nombre de prueba</Label>
              <Input
                id="nombre-muestra"
                value={nombreMuestra}
                onChange={(e) => setNombreMuestra(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={selected === "photo" ? "default" : "outline"}
                onClick={() => setSelected("photo")}
              >
                Recuadro foto
              </Button>
              <Button
                type="button"
                size="sm"
                variant={selected === "name" ? "default" : "outline"}
                onClick={() => setSelected("name")}
              >
                Recuadro nombre
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <FieldPct
                id="left"
                label="Izquierda %"
                value={box.leftPct}
                disabled={!canWrite}
                onChange={(n) => patchBox(selected, { leftPct: n })}
              />
              <FieldPct
                id="top"
                label="Arriba %"
                value={box.topPct}
                disabled={!canWrite}
                onChange={(n) => patchBox(selected, { topPct: n })}
              />
              <FieldPct
                id="width"
                label="Ancho %"
                value={box.widthPct}
                disabled={!canWrite}
                onChange={(n) => patchBox(selected, { widthPct: n })}
              />
              <FieldPct
                id="height"
                label="Alto %"
                value={box.heightPct}
                disabled={!canWrite}
                onChange={(n) => patchBox(selected, { heightPct: n })}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nameStyle">Estilo del nombre</Label>
                <select
                  id="nameStyle"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  disabled={!canWrite}
                  value={layout.nameStyle}
                  onChange={(e) =>
                    setLayout({
                      ...cloneEsquelaPlantillaLayout(layout),
                      nameStyle: e.target.value === "plain" ? "plain" : "goldScript",
                    })
                  }
                >
                  <option value="goldScript">Caligrafía dorada (actual)</option>
                  <option value="plain">Texto simple</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nameAlign">Alineación</Label>
                <select
                  id="nameAlign"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  disabled={!canWrite}
                  value={layout.nameAlign}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLayout({
                      ...cloneEsquelaPlantillaLayout(layout),
                      nameAlign: v === "left" || v === "right" ? v : "center",
                    });
                  }}
                >
                  <option value="center">Centro</option>
                  <option value="left">Izquierda</option>
                  <option value="right">Derecha</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="photoFit">Ajuste de la foto</Label>
                <select
                  id="photoFit"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  disabled={!canWrite}
                  value={layout.photoFit}
                  onChange={(e) =>
                    setLayout({
                      ...cloneEsquelaPlantillaLayout(layout),
                      photoFit: e.target.value === "cover" ? "cover" : "contain",
                    })
                  }
                >
                  <option value="contain">Contener (sin recortar)</option>
                  <option value="cover">Cubrir el recuadro</option>
                </select>
              </div>
            </div>

            {layout.nameStyle === "goldScript" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ColorField
                  id="gold-light"
                  label="Oro claro"
                  value={layout.gold.light}
                  disabled={!canWrite}
                  onChange={(v) =>
                    setLayout({
                      ...cloneEsquelaPlantillaLayout(layout),
                      gold: { ...layout.gold, light: v },
                    })
                  }
                />
                <ColorField
                  id="gold-fill"
                  label="Oro"
                  value={layout.gold.fill}
                  disabled={!canWrite}
                  onChange={(v) =>
                    setLayout({
                      ...cloneEsquelaPlantillaLayout(layout),
                      gold: { ...layout.gold, fill: v },
                    })
                  }
                />
                <ColorField
                  id="gold-dark"
                  label="Oro oscuro"
                  value={layout.gold.dark}
                  disabled={!canWrite}
                  onChange={(v) =>
                    setLayout({
                      ...cloneEsquelaPlantillaLayout(layout),
                      gold: { ...layout.gold, dark: v },
                    })
                  }
                />
                <ColorField
                  id="gold-stroke"
                  label="Contorno"
                  value={layout.gold.stroke}
                  disabled={!canWrite}
                  onChange={(v) =>
                    setLayout({
                      ...cloneEsquelaPlantillaLayout(layout),
                      gold: { ...layout.gold, stroke: v },
                    })
                  }
                />
              </div>
            ) : (
              <ColorField
                id="name-color"
                label="Color del texto"
                value={layout.nameColor}
                disabled={!canWrite}
                onChange={(v) =>
                  setLayout({ ...cloneEsquelaPlantillaLayout(layout), nameColor: v })
                }
              />
            )}
          </CardContent>
        </Card>

        {state.errors._form || state.errors.layoutJson ? (
          <p className="text-sm text-red-700" role="alert">
            {state.errors._form || state.errors.layoutJson}
          </p>
        ) : null}
        {state.ok ? <p className="text-sm text-emerald-800">Plantilla guardada.</p> : null}

        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="gap-1.5" disabled={pending}>
              <Save className="h-4 w-4" aria-hidden />
              {pending ? "Guardando…" : "Guardar plantilla"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              disabled={pending}
              onClick={() => setLayout(cloneEsquelaPlantillaLayout(DEFAULT_ESQUELA_PLANTILLA_LAYOUT))}
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Posiciones del afiche actual
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              disabled={pending}
              onClick={() => {
                void resetEsquelaPlantillaLayout().then((res) => {
                  if (res.ok) {
                    setLayout(cloneEsquelaPlantillaLayout(DEFAULT_ESQUELA_PLANTILLA_LAYOUT));
                    router.refresh();
                  }
                });
              }}
            >
              Restablecer en el servidor
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-600">Su rol es de solo consulta: no puede cambiar la plantilla.</p>
        )}
      </div>
    </form>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[11px] text-slate-500">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
        />
        <Input
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs"
        />
      </div>
    </div>
  );
}
