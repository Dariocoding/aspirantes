"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileImage, FileText, LoaderCircle, Replace, Trash2, Upload } from "lucide-react";
import { Button } from "@src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import {
  ASPIRANTE_FOTO_FORM,
  acceptAttrForKind,
  fileLooksAllowed,
  fileLooksPdf,
  formatErrorForKind,
  formatHelpForKind,
  type AspiranteDocumentoKind,
} from "@src/lib/storage/aspirante-foto";
import { prepareAspiranteUpload } from "@src/lib/storage/compress-image-client";
import { aspiranteFotoUrl } from "@dashboard/aspirantes/_components/aspirante-foto";
import { cn } from "@src/lib/utils";

export type CensusDocumentoKind = AspiranteDocumentoKind;

export const CENSUS_DOCUMENTO_META: Record<
  CensusDocumentoKind,
  { short: string; title: string; help: string }
> = {
  cedula: {
    short: "Cédula",
    title: "Cédula de identidad",
    help: `Imagen legible de la cédula. ${formatHelpForKind("cedula")}`,
  },
  titulo: {
    short: "Fondo negro",
    title: "Título (fondo negro)",
    help: `Copia del título universitario en fondo negro. ${formatHelpForKind("titulo")}`,
  },
  tituloAuth: {
    short: "Autenticación",
    title: "Autenticación del título",
    help: `Certificado del fondo negro o autenticación del título. ${formatHelpForKind("tituloAuth")}`,
  },
  notas: {
    short: "Notas",
    title: "Notas certificadas",
    help: `Notas originales certificadas. ${formatHelpForKind("notas")}`,
  },
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aspiranteId: string;
  nombreCompleto: string;
  kind: CensusDocumentoKind;
  hasFoto: boolean;
  storedIsPdf?: boolean;
  canWrite: boolean;
  onHasFotoChange: (hasFoto: boolean, isPdf: boolean) => void;
};

export function AspiranteDocumentoViewer({
  open,
  onOpenChange,
  aspiranteId,
  nombreCompleto,
  kind,
  hasFoto,
  storedIsPdf = false,
  canWrite,
  onHasFotoChange,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const compressGenRef = useRef(0);
  const [isPending, startTransition] = useTransition();
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [localIsPdf, setLocalIsPdf] = useState(false);
  const [bust, setBust] = useState(0);
  const meta = CENSUS_DOCUMENTO_META[kind];

  useEffect(() => {
    if (!open) {
      setError(null);
      setLocalIsPdf(false);
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const submit = useCallback(
    (fd: FormData) => {
      fd.set("kind", kind);
      setError(null);
      startTransition(async () => {
        try {
          const res = await fetch(
            `/api/aspirantes/foto/${encodeURIComponent(aspiranteId)}?tipo=${encodeURIComponent(kind)}`,
            { method: "POST", body: fd },
          );
          if (res.status === 413) {
            setError("El archivo es demasiado pesado para el servidor. Comprima el PDF o suba JPEG/PNG.");
            return;
          }
          const contentType = res.headers.get("content-type") ?? "";
          if (!contentType.includes("application/json")) {
            setError(
              `No se pudo guardar el documento (error ${res.status}). Recargue e intente de nuevo.`,
            );
            return;
          }
          const result = (await res.json()) as {
            ok?: boolean;
            errors?: Record<string, string>;
            hasFoto?: boolean;
            isPdf?: boolean;
          };
          if (!result.ok) {
            const msg =
              result.errors?._form ??
              Object.values(result.errors ?? {})[0] ??
              "No se pudo guardar el documento.";
            setError(msg);
            return;
          }
          onHasFotoChange(Boolean(result.hasFoto), Boolean(result.isPdf));
          setBust(Date.now());
          setLocalIsPdf(false);
          setLocalPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
          if (inputRef.current) inputRef.current.value = "";
          router.refresh();
        } catch (e) {
          const msg = e instanceof Error ? e.message : "No se pudo guardar el documento.";
          setError(
            /body exceeded|payload too large|413/i.test(msg)
              ? "El archivo es demasiado pesado para el servidor. Comprima el PDF o suba JPEG/PNG."
              : /load|fetch|network|failed/i.test(msg)
                ? "El servidor no respondió al guardar. Recargue e intente de nuevo."
                : msg,
          );
        }
      });
    },
    [aspiranteId, kind, onHasFotoChange, router],
  );

  const onFile = useCallback(
    async (picked: FileList | File[] | undefined) => {
      if (!picked || !canWrite) return;
      const files = Array.from(picked).filter((f) => f.size > 0);
      if (files.length === 0) return;
      if (files.some((file) => !fileLooksAllowed(file, kind))) {
        setError(formatErrorForKind(kind));
        return;
      }
      if (files.some((file) => file.size > 90 * 1024 * 1024)) {
        setError("El archivo supera 90 MB. Comprima el PDF o use una imagen JPEG/PNG.");
        return;
      }
      const gen = ++compressGenRef.current;
      setLocalIsPdf(fileLooksPdf(files[0]!));
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(files[0]!);
      });
      setCompressing(true);
      try {
        const compressed = await prepareAspiranteUpload(files, kind);
        if (gen !== compressGenRef.current) return;
        setLocalIsPdf(fileLooksPdf(compressed));
        setLocalPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(compressed);
        });
        const fd = new FormData();
        fd.set(ASPIRANTE_FOTO_FORM[kind].file, compressed);
        submit(fd);
      } catch (e) {
        if (gen !== compressGenRef.current) return;
        const msg = e instanceof Error ? e.message : "No se pudo optimizar el archivo.";
        setError(msg);
      } finally {
        if (gen === compressGenRef.current) setCompressing(false);
      }
    },
    [canWrite, kind, submit],
  );

  const onQuitar = useCallback(() => {
    if (!canWrite) return;
    const fd = new FormData();
    fd.set(ASPIRANTE_FOTO_FORM[kind].quitar, "1");
    submit(fd);
  }, [canWrite, kind, submit]);

  const storedUrl = hasFoto ? `${aspiranteFotoUrl(aspiranteId, kind)}&t=${bust}` : null;
  const displayUrl = localPreview ?? storedUrl;
  const showPdf = Boolean(displayUrl && (localPreview ? localIsPdf : storedIsPdf));
  const showViewer = Boolean(displayUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <DialogHeader className="pr-12">
          <DialogTitle>{meta.title}</DialogTitle>
          <DialogDescription>
            {nombreCompleto}
            {" · "}
            {canWrite ? meta.help : hasFoto ? "Solo lectura." : "No hay documento cargado."}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-slate-50 px-4 py-4">
          <input
            ref={inputRef}
            type="file"
            accept={acceptAttrForKind(kind)}
            multiple={kind === "notas"}
            className="sr-only"
            disabled={!canWrite || isPending || compressing}
            onChange={(e) => {
              onFile(e.target.files ?? undefined);
              e.target.value = "";
            }}
          />
          <div
            onClick={() => {
              if (canWrite && !showViewer) inputRef.current?.click();
            }}
            onDragOver={(e) => {
              if (!canWrite) return;
              e.preventDefault();
            }}
            onDrop={(e) => {
              if (!canWrite) return;
              e.preventDefault();
              onFile(e.dataTransfer.files);
            }}
            onKeyDown={(e) => {
              if (!canWrite || showViewer) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            role={canWrite && !showViewer ? "button" : undefined}
            tabIndex={canWrite && !showViewer ? 0 : undefined}
            className={cn(
              "relative flex min-h-[min(58vh,28rem)] w-full items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white",
              canWrite && !showViewer ? "cursor-pointer hover:border-slate-300 hover:bg-slate-50" : "cursor-default",
              !showViewer && "border-dashed border-slate-300 bg-slate-50",
            )}
          >
            {showViewer && showPdf ? (
              <iframe
                key={displayUrl}
                src={displayUrl ?? undefined}
                title={meta.title}
                className="h-[min(58vh,28rem)] w-full bg-white"
              />
            ) : showViewer ? (
              // eslint-disable-next-line @next/next/no-img-element -- visor de documento vía API propia
              <img
                key={displayUrl}
                src={displayUrl ?? undefined}
                alt={meta.title}
                className="max-h-[min(58vh,28rem)] max-w-full object-contain"
              />
            ) : (
              <span className="flex max-w-sm flex-col items-center gap-2 px-6 py-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
                  {kind === "notas" ? (
                    <FileText className="h-7 w-7" aria-hidden />
                  ) : (
                    <FileImage className="h-7 w-7" aria-hidden />
                  )}
                </span>
                <span className="text-sm font-medium text-slate-800">
                  {canWrite
                    ? kind === "notas"
                      ? "Aún no hay documento. Puede soltar varias fotos; se unirán en un PDF."
                      : "Aún no hay documento. Haga clic o suelte el archivo aquí."
                    : "No hay documento cargado."}
                </span>
                {canWrite ? <span className="text-xs text-slate-500">{formatHelpForKind(kind)}</span> : null}
              </span>
            )}
            {isPending || compressing ? (
              <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                <LoaderCircle className="h-8 w-8 animate-spin text-slate-700" aria-hidden />
                <span className="sr-only">
                  {compressing ? "Optimizando documento" : "Guardando documento"}
                </span>
              </span>
            ) : null}
          </div>
        </div>

        {error ? <p className="px-5 pt-3 text-sm text-red-600">{error}</p> : null}

        <DialogFooter className="sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {hasFoto ? "Documento cargado." : "Pendiente de carga."}
            {showViewer && showPdf && displayUrl ? (
              <>
                {" "}
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-slate-800 underline-offset-2 hover:underline"
                >
                  Abrir PDF
                </a>
              </>
            ) : null}
          </p>
          {canWrite ? (
            <div className="flex flex-wrap justify-end gap-2">
              {hasFoto ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending || compressing}
                  onClick={onQuitar}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Quitar
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                disabled={isPending || compressing}
                className="bg-slate-900 hover:bg-slate-800"
                onClick={() => inputRef.current?.click()}
              >
                {hasFoto ? (
                  <>
                    <Replace className="h-3.5 w-3.5" aria-hidden />
                    Reemplazar
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" aria-hidden />
                    Subir
                  </>
                )}
              </Button>
            </div>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
