"use client";

import { EsquelaDetalleToolbar } from "@dashboard/esquelas/_components/esquela-detalle-toolbar";
import { downloadCumpleanosJpeg } from "@dashboard/esquelas/_components/export-cumpleanos-jpeg";
import type { EsquelaPlantillaLayout } from "@src/lib/pdf/esquela-plantilla-layout";

export function EsquelaCumpleanosDownloadButton({
  nombre,
  fotoSrc,
  fileName,
  fondoSrc,
  overlaySrc,
  layout,
}: {
  nombre: string;
  fotoSrc: string | null;
  fileName: string;
  fondoSrc: string;
  overlaySrc: string | null;
  layout: EsquelaPlantillaLayout;
}) {
  return (
    <EsquelaDetalleToolbar
      onDownloadImage={() =>
        downloadCumpleanosJpeg({
          nombre,
          fotoSrc,
          fileName,
          fondoSrc,
          overlaySrc,
          layout,
        })
      }
    />
  );
}
