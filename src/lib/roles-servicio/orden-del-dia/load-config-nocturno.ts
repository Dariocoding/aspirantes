import { prisma } from "@src/lib/prisma";
import {
  ORDEN_NOCTURNO_CONFIG_ID,
  defaultOrdenNocturnoConfig,
  normalizeOrdenNocturnoConfig,
  type OrdenNocturnoConfig,
} from "@src/lib/roles-servicio/orden-del-dia/config-nocturno";

export async function loadOrdenNocturnoConfig(): Promise<OrdenNocturnoConfig> {
  const row = await prisma.ordenNocturnoConfig.findUnique({
    where: { id: ORDEN_NOCTURNO_CONFIG_ID },
  });
  if (!row) return defaultOrdenNocturnoConfig();
  return normalizeOrdenNocturnoConfig(row.config);
}

export async function saveOrdenNocturnoConfig(
  config: OrdenNocturnoConfig,
): Promise<OrdenNocturnoConfig> {
  const normalized = normalizeOrdenNocturnoConfig(config);
  await prisma.ordenNocturnoConfig.upsert({
    where: { id: ORDEN_NOCTURNO_CONFIG_ID },
    create: { id: ORDEN_NOCTURNO_CONFIG_ID, config: normalized },
    update: { config: normalized },
  });
  return normalized;
}
