import "server-only";

import { Prisma, TipoEsquela } from "@src/generated/prisma";
import {
  BUNDLED_ESQUELA_FONDO_SRC,
  BUNDLED_ESQUELA_OVERLAY_SRC,
  DEFAULT_ESQUELA_PLANTILLA_LAYOUT,
  parseEsquelaPlantillaLayout,
  plantillaArchivoUrl,
  type EsquelaPlantillaLayout,
} from "@src/lib/pdf/esquela-plantilla-layout";
import { prisma } from "@src/lib/prisma";

export type ResolvedEsquelaPlantilla = {
  id: string;
  nombre: string;
  layout: EsquelaPlantillaLayout;
  fondoSrc: string;
  overlaySrc: string | null;
  hasCustomFondo: boolean;
  hasCustomOverlay: boolean;
  fondoKey: string | null;
  overlayKey: string | null;
  updatedAt: Date;
};

export async function getOrCreateCumpleanosPlantilla() {
  return prisma.esquelaPlantilla.upsert({
    where: { tipo: TipoEsquela.CUMPLEANOS },
    create: {
      tipo: TipoEsquela.CUMPLEANOS,
      nombre: "Cumpleaños",
      layout: DEFAULT_ESQUELA_PLANTILLA_LAYOUT as unknown as Prisma.InputJsonValue,
    },
    update: {},
  });
}

export async function resolveCumpleanosPlantilla(): Promise<ResolvedEsquelaPlantilla> {
  const row = await getOrCreateCumpleanosPlantilla();
  const layout = parseEsquelaPlantillaLayout(row.layout);
  const version = row.updatedAt;
  return {
    id: row.id,
    nombre: row.nombre,
    layout,
    fondoSrc: row.fondoKey ? plantillaArchivoUrl("fondo", version) : BUNDLED_ESQUELA_FONDO_SRC,
    overlaySrc: layout.overlayEnabled
      ? row.overlayKey
        ? plantillaArchivoUrl("overlay", version)
        : BUNDLED_ESQUELA_OVERLAY_SRC
      : null,
    hasCustomFondo: Boolean(row.fondoKey),
    hasCustomOverlay: Boolean(row.overlayKey),
    fondoKey: row.fondoKey,
    overlayKey: row.overlayKey,
    updatedAt: row.updatedAt,
  };
}
