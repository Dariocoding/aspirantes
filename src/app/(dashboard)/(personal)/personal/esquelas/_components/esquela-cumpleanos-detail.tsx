"use client";

import { EsquelaDetalleToolbar } from "@dashboard/esquelas/_components/esquela-detalle-toolbar";
import { downloadCumpleanosJpeg } from "@dashboard/esquelas/_components/export-cumpleanos-jpeg";

export function EsquelaCumpleanosDownloadButton({
  nombre,
  fotoSrc,
  fileName,
}: {
  nombre: string;
  fotoSrc: string | null;
  fileName: string;
}) {
  return (
    <EsquelaDetalleToolbar onDownloadImage={() => downloadCumpleanosJpeg(nombre, fotoSrc, fileName)} />
  );
}
