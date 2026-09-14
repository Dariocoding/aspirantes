"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileImage, LoaderCircle, Replace, Trash2, Upload } from "lucide-react";
import { updateAspiranteDocumentoFoto } from "@src/app/actions/aspirantes";
import { Button } from "@src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import { ASPIRANTE_FOTO_FORM, type AspiranteFotoKind } from "@src/lib/storage/aspirante-foto";
import { aspiranteFotoUrl } from "@dashboard/aspirantes/_components/aspirante-foto";
import { cn } from "@src/lib/utils";

export type CensusDocumentoKind = Exclude<AspiranteFotoKind, "perfil">;

export const CENSUS_DOCUMENTO_META: Record<
  CensusDocumentoKind,
  { short: string; title: string; help: string }
> = {
  cedula: {
    short: "Cédula",
    title: "Cédula de identidad",
    help: "Imagen legible de la cédula. JPEG, PNG, WebP o GIF.",
  },
  titulo: {
    short: "Fondo negro",
    title: "Título (fondo negro)",
    help: "Copia del título universitario en fondo negro.",
  },
  tituloAuth: {
    short: "Autenticación",
    title: "Autenticación del título",
    help: "Certificado del fondo negro o autenticación del título.",
  },
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aspiranteId: string;
  nombreCompleto: string;
  kind: CensusDocumentoKind;
  hasFoto: boolean;
  canWrite: boolean;
  onHasFotoChange: (hasFoto: boolean) => void;
};

export function AspiranteDocumentoViewer({
  open,
  onOpenChange,
  aspiranteId,
  nombreCompleto,
  kind,
  hasFoto,
  canWrite,
  onHasFotoChange,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [bust, setBust] = useState(0);
  const meta = CENSUS_DOCUMENTO_META[kind];

  useEffect(() => {
    if (!open) {
      setError(null);
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
      fd.set("aspiranteId", aspiranteId);
      fd.set("kind", kind);
      setError(null);
      startTransition(async () => {
        const result = await updateAspiranteDocumentoFoto(fd);
        if (!result.ok) {
          const msg = result.errors._form ?? Object.values(result.errors)[0] ?? "No se pudo guardar el documento.";
          setError(msg);
          return;
        }
        onHasFotoChange(Boolean(result.hasFoto));
        setBust(Date.now());
        setLocalPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      });
    },
    [aspiranteId, kind, onHasFotoChange, router],
  );

  const onFile = useCallback(
    (file: File | undefined) => {
      if (!file || !canWrite) return;
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      const fd = new FormData();
      fd.set(ASPIRANTE_FOTO_FORM[kind].file, file);
      submit(fd);
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
            accept={ACCEPT}
            className="sr-only"
            disabled={!canWrite || isPending}
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={isPending || (!canWrite && !showViewer)}
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
              onFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "relative flex min-h-[min(58vh,28rem)] w-full items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white",
              canWrite && !showViewer ? "cursor-pointer hover:border-slate-300 hover:bg-slate-50" : "cursor-default",
              !showViewer && "border-dashed border-slate-300 bg-slate-50",
            )}
          >
            {showViewer ? (
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
                  <FileImage className="h-7 w-7" aria-hidden />
                </span>
                <span className="text-sm font-medium text-slate-800">
                  {canWrite ? "Aún no hay documento. Haga clic o suelte el archivo aquí." : "No hay documento cargado."}
                </span>
                {canWrite ? (
                  <span className="text-xs text-slate-500">JPEG, PNG, WebP o GIF</span>
                ) : null}
              </span>
            )}
            {isPending ? (
              <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                <LoaderCircle className="h-8 w-8 animate-spin text-slate-700" aria-hidden />
                <span className="sr-only">Guardando documento</span>
              </span>
            ) : null}
          </button>
        </div>

        {error ? <p className="px-5 pt-3 text-sm text-red-600">{error}</p> : null}

        <DialogFooter className="sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {hasFoto ? "Documento cargado." : "Pendiente de carga."}
          </p>
          {canWrite ? (
            <div className="flex flex-wrap justify-end gap-2">
              {hasFoto ? (
                <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={onQuitar}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Quitar
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                disabled={isPending}
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
