"use client";

import { Camera, ImageIcon, Package, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@src/components/ui/button";
import { cn } from "@src/lib/utils";

export function inventarioImagenUrl(itemId: string): string {
  return `/api/inventario/imagen/${itemId}`;
}

const THUMB_SIZE = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-28 w-28",
} as const;

function InventarioItemImage({
  src,
  alt,
  className,
  iconSize = "md",
}: {
  src: string;
  alt: string;
  className?: string;
  iconSize?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const placeholderIcon =
    iconSize === "lg" ? "h-10 w-10" : iconSize === "sm" ? "h-4 w-4" : "h-5 w-5";

  if (failed) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-linear-to-br from-amber-50 to-slate-50 text-amber-700/70",
          className,
        )}
        aria-hidden
      >
        <Package className={placeholderIcon} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL firmada vía redirect en API propia
    <img
      src={src}
      alt={alt}
      className={cn("shrink-0 rounded-full border border-slate-200/90 object-cover shadow-sm", className)}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function InventarioItemThumbnail({
  itemId,
  imagenKey,
  nombre,
  size = "md",
}: {
  itemId: string;
  imagenKey: string | null;
  nombre: string;
  size?: "sm" | "md";
}) {
  const box = THUMB_SIZE[size];

  if (!imagenKey) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-linear-to-br from-slate-50 to-slate-100 text-slate-400",
          box,
        )}
        aria-hidden
      >
        <ImageIcon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
      </div>
    );
  }

  return (
    <InventarioItemImage
      src={inventarioImagenUrl(itemId)}
      alt={`Foto de ${nombre}`}
      className={box}
      iconSize={size}
    />
  );
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function InventarioImagenField({
  id,
  itemId,
  imagenKey,
  nombre = "ítem",
}: {
  id: string;
  itemId?: string;
  imagenKey?: string | null;
  nombre?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [quitar, setQuitar] = useState(false);

  const hasStoredImagen = Boolean(itemId && imagenKey && !quitar);
  const storedUrl = hasStoredImagen && itemId ? inventarioImagenUrl(itemId) : null;
  const displayUrl = previewUrl ?? storedUrl;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const openPicker = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQuitar(false);
    setFileLabel(file.name);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const onQuitar = () => {
    setQuitar(true);
    setFileLabel(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const onRestaurar = () => {
    setQuitar(false);
  };

  const showStoredRemoved = Boolean(imagenKey && quitar && !previewUrl);

  return (
    <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-start">
      <div className="flex flex-col items-center gap-2 sm:items-start">
        <button
          type="button"
          onClick={openPicker}
          className={cn(
            "group relative flex shrink-0 items-center justify-center rounded-full",
            THUMB_SIZE.lg,
            "ring-2 ring-slate-200/90 ring-offset-2 ring-offset-white transition-shadow hover:ring-amber-300/80 focus-visible:outline-none focus-visible:ring-amber-400",
          )}
          aria-label={displayUrl ? "Cambiar foto del ítem" : "Subir foto del ítem"}
        >
          {displayUrl ? (
            <InventarioItemImage
              src={displayUrl}
              alt={`Vista previa de ${nombre}`}
              className={THUMB_SIZE.lg}
              iconSize="lg"
            />
          ) : (
            <div
              className={cn(
                "flex items-center justify-center rounded-full border border-dashed border-slate-300 bg-linear-to-br from-amber-50/90 via-white to-slate-50 text-slate-400",
                THUMB_SIZE.lg,
              )}
            >
              <Package className="h-10 w-10 text-amber-800/35" aria-hidden />
            </div>
          )}

          <span
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-slate-900/55 text-white opacity-0 transition-opacity",
              "group-hover:opacity-100 group-focus-visible:opacity-100",
            )}
          >
            <Camera className="h-5 w-5" aria-hidden />
            <span className="text-[10px] font-medium tracking-wide uppercase">
              {displayUrl ? "Cambiar" : "Subir"}
            </span>
          </span>
        </button>
        <p className="text-center text-[11px] text-slate-500 sm:text-left">Pulse el círculo o use los botones</p>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <p className="text-sm font-medium text-slate-800">Foto del ítem</p>
          <p className="mt-0.5 text-xs leading-snug text-slate-500">
            Opcional. Ayuda a identificar el producto en la tabla. JPEG, PNG, WebP o GIF · máx. 5 MB.
          </p>
        </div>

        {fileLabel ? (
          <p className="truncate rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
            <span className="font-medium text-slate-500">Archivo: </span>
            {fileLabel}
          </p>
        ) : null}

        {showStoredRemoved ? (
          <p className="rounded-md border border-amber-200/80 bg-amber-50/80 px-2.5 py-1.5 text-xs text-amber-950">
            La imagen guardada se quitará al guardar.{" "}
            <button
              type="button"
              onClick={onRestaurar}
              className="font-medium text-amber-900 underline-offset-2 hover:underline"
            >
              Deshacer
            </button>
          </p>
        ) : hasStoredImagen ? (
          <p className="text-xs text-slate-600">Imagen actual en el sistema. Suba otra para reemplazarla.</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5 shadow-xs" onClick={openPicker}>
            <Upload className="h-3.5 w-3.5" aria-hidden />
            {displayUrl ? "Cambiar foto" : "Elegir foto"}
          </Button>

          {(hasStoredImagen || previewUrl) && !showStoredRemoved ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-slate-600 hover:text-red-700"
              onClick={onQuitar}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Quitar foto
            </Button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          id={id}
          name="imagen"
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={onFileChange}
        />

        {imagenKey && quitar ? <input type="hidden" name="quitarImagen" value="1" /> : null}
      </div>
    </div>
  );
}
