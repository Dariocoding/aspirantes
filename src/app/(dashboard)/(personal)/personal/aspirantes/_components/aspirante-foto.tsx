"use client";

import { Camera, CheckCircle2, FileImage, FileText, Trash2, Upload, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@src/components/ui/button";
import {
  ASPIRANTE_FOTO_FORM,
  acceptAttrForKind,
  fileLooksAllowed,
  fileLooksPdf,
  formatErrorForKind,
  formatHelpForKind,
  isPdfObjectKey,
  type AspiranteFotoKind,
} from "@src/lib/storage/aspirante-foto";
import {
  assignFileToInput,
  compressAspiranteUpload,
  formatFileSize,
} from "@src/lib/storage/compress-image-client";
import { cn } from "@src/lib/utils";

export function aspiranteFotoUrl(
  aspiranteId: string,
  kind: AspiranteFotoKind = "perfil",
): string {
  const q = kind === "perfil" ? "" : `?tipo=${kind}`;
  return `/api/aspirantes/foto/${aspiranteId}${q}`;
}

const THUMB_SIZE = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-28 w-28",
} as const;

const DOC_THUMB = "h-28 w-40";

function AspiranteFotoImage({
  src,
  alt,
  className,
  iconSize = "md",
  rounded = "full",
}: {
  src: string;
  alt: string;
  className?: string;
  iconSize?: "sm" | "md" | "lg";
  rounded?: "full" | "md";
}) {
  const [failed, setFailed] = useState(false);
  const placeholderIcon =
    iconSize === "lg" ? "h-10 w-10" : iconSize === "sm" ? "h-4 w-4" : "h-5 w-5";
  const radius = rounded === "full" ? "rounded-full" : "rounded-md";

  if (failed) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center border border-slate-200 bg-linear-to-br from-slate-50 to-slate-100 text-slate-400",
          radius,
          className,
        )}
        aria-hidden
      >
        {rounded === "full" ? (
          <UserRound className={placeholderIcon} />
        ) : (
          <FileImage className={placeholderIcon} />
        )}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL firmada vía redirect en API propia
    <img
      src={src}
      alt={alt}
      className={cn(
        "shrink-0 border border-slate-200/90 object-cover shadow-sm",
        radius,
        className,
      )}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function AspiranteFotoThumbnail({
  aspiranteId,
  fotoKey,
  nombre,
  size = "md",
  kind = "perfil",
}: {
  aspiranteId: string;
  fotoKey: string | null;
  nombre: string;
  size?: "sm" | "md" | "lg";
  kind?: AspiranteFotoKind;
}) {
  const box = THUMB_SIZE[size];

  if (!fotoKey) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-linear-to-br from-slate-50 to-slate-100 text-slate-400",
          box,
        )}
        aria-hidden
      >
        <UserRound className={size === "sm" ? "h-4 w-4" : size === "lg" ? "h-10 w-10" : "h-5 w-5"} />
      </div>
    );
  }

  return (
    <AspiranteFotoImage
      src={aspiranteFotoUrl(aspiranteId, kind)}
      alt={`Foto de ${nombre}`}
      className={box}
      iconSize={size === "lg" ? "lg" : size}
    />
  );
}

const KIND_COPY: Record<
  AspiranteFotoKind,
  { title: string; help: string; aria: string }
> = {
  perfil: {
    title: "Foto del aspirante",
    help: `Opcional. ${formatHelpForKind("perfil")}`,
    aria: "foto del aspirante",
  },
  cedula: {
    title: "Foto de la cédula",
    help: `Imagen legible de la cédula de identidad. ${formatHelpForKind("cedula")}`,
    aria: "foto de la cédula",
  },
  titulo: {
    title: "Foto del título",
    help: `Fondo negro / título universitario. ${formatHelpForKind("titulo")}`,
    aria: "foto del título",
  },
  tituloAuth: {
    title: "Autenticación del título",
    help: `Certificado del fondo negro o autenticación del título. ${formatHelpForKind("tituloAuth")}`,
    aria: "autenticación del título",
  },
  notas: {
    title: "Notas certificadas",
    help: `Notas originales certificadas. ${formatHelpForKind("notas")}`,
    aria: "notas certificadas",
  },
};

export function AspiranteFotoField({
  id,
  aspiranteId,
  fotoKey,
  nombre = "aspirante",
  kind = "perfil",
  /** Si true, no usa URL de API (portal público: solo preview local / indicador). */
  previewOnlyLocal = false,
  /** URL firmada u otra URL directa para previsualizar la imagen ya guardada (p. ej. portal público). */
  storedPreviewUrl = null,
  /** Si true, no muestra la imagen guardada (solo estado “cargado” y preview local al elegir archivo). */
  hideStoredImage = false,
}: {
  id: string;
  aspiranteId?: string;
  fotoKey?: string | null;
  nombre?: string;
  kind?: AspiranteFotoKind;
  previewOnlyLocal?: boolean;
  storedPreviewUrl?: string | null;
  hideStoredImage?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const compressGenRef = useRef(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewIsPdf, setPreviewIsPdf] = useState(false);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [quitar, setQuitar] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  const formNames = ASPIRANTE_FOTO_FORM[kind];
  const copy = KIND_COPY[kind];
  const isDoc = kind !== "perfil";
  const thumbClass = isDoc ? DOC_THUMB : THUMB_SIZE.lg;
  const rounded = isDoc ? "md" : "full";

  const hasStoredFoto = Boolean(fotoKey && !quitar);
  const remoteStoredUrl =
    hasStoredFoto && !hideStoredImage
      ? !previewOnlyLocal && aspiranteId
        ? aspiranteFotoUrl(aspiranteId, kind)
        : storedPreviewUrl
      : null;
  // Documentos sensibles (cédula/título): nunca mostrar imagen; solo estado / nombre de archivo.
  const displayIsPdf = Boolean(previewUrl ? previewIsPdf : hasStoredFoto && isPdfObjectKey(fotoKey));
  const displayUrl = hideStoredImage || displayIsPdf ? null : previewUrl ?? remoteStoredUrl;
  const showUploadedStatus = Boolean(hideStoredImage && hasStoredFoto && !previewUrl);
  const showPendingReplace = Boolean(hideStoredImage && previewUrl);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!compressing) return;
    const form = inputRef.current?.form;
    if (!form) return;
    const onSubmit = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    form.addEventListener("submit", onSubmit, true);
    return () => form.removeEventListener("submit", onSubmit, true);
  }, [compressing]);

  const openPicker = () => {
    if (compressing) return;
    inputRef.current?.click();
  };

  const applyPreview = (file: File) => {
    setFileLabel(`${file.name} · ${formatFileSize(file.size)}`);
    setPreviewIsPdf(fileLooksPdf(file));
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    if (!fileLooksAllowed(file, kind)) {
      setLocalError(formatErrorForKind(kind));
      input.value = "";
      return;
    }

    const gen = ++compressGenRef.current;
    setLocalError(null);
    setQuitar(false);
    applyPreview(file);

    setCompressing(true);
    try {
      const compressed = await compressAspiranteUpload(file, kind);
      if (gen !== compressGenRef.current) return;
      if (input.isConnected) assignFileToInput(input, compressed);
      applyPreview(compressed);
    } catch {
      if (gen !== compressGenRef.current) return;
      // El original sigue en el input si la optimización falla.
    } finally {
      if (gen === compressGenRef.current) {
        setCompressing(false);
      }
    }
  };

  const onQuitar = () => {
    compressGenRef.current += 1;
    setCompressing(false);
    setQuitar(true);
    setFileLabel(null);
    setPreviewIsPdf(false);
    setLocalError(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const onRestaurar = () => {
    setQuitar(false);
  };

  const showStoredRemoved = Boolean(fotoKey && quitar && !previewUrl);
  const canChange = Boolean(displayUrl || hasStoredFoto || previewUrl);

  return (
    <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-start">
      <div className="flex flex-col items-center gap-2 sm:items-start">
        <button
          type="button"
          onClick={openPicker}
          disabled={compressing}
          className={cn(
            "group relative flex shrink-0 items-center justify-center",
            isDoc ? "rounded-md" : "rounded-full",
            thumbClass,
            "ring-2 ring-offset-2 ring-offset-white transition-shadow focus-visible:outline-none",
            showUploadedStatus || showPendingReplace
              ? "ring-emerald-300/90 hover:ring-emerald-400/90 focus-visible:ring-emerald-500"
              : "ring-slate-200/90 hover:ring-slate-400/80 focus-visible:ring-slate-500",
          )}
          aria-label={canChange ? `Cambiar ${copy.aria}` : `Subir ${copy.aria}`}
        >
          {displayUrl ? (
            <AspiranteFotoImage
              src={displayUrl}
              alt={`Vista previa de ${nombre}`}
              className={thumbClass}
              iconSize="lg"
              rounded={rounded}
            />
          ) : displayIsPdf && !hideStoredImage ? (
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 border border-slate-200 bg-linear-to-br from-slate-50 via-white to-slate-100 text-slate-600",
                isDoc ? "rounded-md" : "rounded-full",
                thumbClass,
              )}
            >
              <FileText className="h-8 w-8 text-slate-500" aria-hidden />
              <span className="text-[10px] font-semibold tracking-wide uppercase">PDF</span>
            </div>
          ) : showUploadedStatus || showPendingReplace ? (
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 border border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-emerald-50/80 text-emerald-700",
                isDoc ? "rounded-md" : "rounded-full",
                thumbClass,
              )}
            >
              <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden />
              <span className="text-[10px] font-semibold tracking-wide uppercase">
                {showPendingReplace ? "Listo" : "Cargado"}
              </span>
            </div>
          ) : (
            <div
              className={cn(
                "flex items-center justify-center border border-dashed border-slate-300 bg-linear-to-br from-slate-50 via-white to-slate-100 text-slate-400",
                isDoc ? "rounded-md" : "rounded-full",
                thumbClass,
              )}
            >
              {isDoc ? (
                <FileImage className="h-10 w-10 text-slate-400/80" aria-hidden />
              ) : (
                <UserRound className="h-10 w-10 text-slate-400/80" aria-hidden />
              )}
            </div>
          )}

          <span
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-1 bg-slate-900/55 text-white opacity-0 transition-opacity",
              isDoc ? "rounded-md" : "rounded-full",
              "group-hover:opacity-100 group-focus-visible:opacity-100",
            )}
          >
            <Camera className="h-5 w-5" aria-hidden />
            <span className="text-[10px] font-medium tracking-wide uppercase">
              {canChange ? "Cambiar" : "Subir"}
            </span>
          </span>
        </button>
        <p className="text-center text-[11px] text-slate-500 sm:text-left">
          {showUploadedStatus
            ? "Ya está en el sistema. Suba otra solo si desea reemplazarla."
            : showPendingReplace
              ? "Nueva imagen lista. Guarde para reemplazar la anterior."
              : "Pulse o use los botones"}
        </p>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <p className="text-sm font-medium text-slate-800">{copy.title}</p>
          <p className="mt-0.5 text-xs leading-snug text-slate-500">{copy.help}</p>
          {kind === "notas" ? (
            <p className="mt-1 text-[11px] text-slate-400">
              Imágenes y PDF se optimizan en el navegador (cada hoja del PDF) antes de enviarse.
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-slate-400">
              Las imágenes se optimizan en el navegador antes de enviarse.
            </p>
          )}
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
        ) : showUploadedStatus ? (
          <p className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50/90 px-2.5 py-2 text-xs text-emerald-950">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            <span>
              <span className="font-medium">Documento ya cargado.</span> No es necesario volver a
              subirlo; elija otra imagen solo si quiere reemplazarlo.
            </span>
          </p>
        ) : showPendingReplace ? (
          <p className="flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50/90 px-2.5 py-2 text-xs text-sky-950">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" aria-hidden />
            <span>
              <span className="font-medium">Archivo seleccionado.</span> Se guardará al enviar el
              formulario{hasStoredFoto ? " y reemplazará el documento actual" : ""}.
            </span>
          </p>
        ) : hasStoredFoto && !previewUrl ? (
          <p className="text-xs text-slate-600">Imagen actual en el sistema. Suba otra para reemplazarla.</p>
        ) : null}

        {localError ? <p className="text-xs text-red-600">{localError}</p> : null}
        {compressing ? (
          <p className="text-xs text-slate-500" aria-live="polite">
            Optimizando archivo…
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 shadow-xs"
            disabled={compressing}
            onClick={openPicker}
          >
            <Upload className="h-3.5 w-3.5" aria-hidden />
            {canChange ? "Cambiar" : kind === "notas" ? "Elegir archivo" : "Elegir imagen"}
          </Button>

          {(hasStoredFoto || previewUrl) && !showStoredRemoved ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-slate-600 hover:text-red-700"
              disabled={compressing}
              onClick={onQuitar}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Quitar
            </Button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          id={id}
          name={formNames.file}
          type="file"
          accept={acceptAttrForKind(kind)}
          className="sr-only"
          disabled={compressing}
          onChange={onFileChange}
        />

        {fotoKey && quitar ? <input type="hidden" name={formNames.quitar} value="1" /> : null}
      </div>
    </div>
  );
}
