import { prisma } from "@src/lib/prisma";
import {
  ORDEN_NOCTURNO_CONFIG_ID,
  defaultOrdenNocturnoConfig,
  normalizeOrdenNocturnoConfig,
  type OrdenNocturnoConfig,
} from "@src/lib/roles-servicio/orden-del-dia/config-nocturno";

type ConfigPersistido = OrdenNocturnoConfig & {
  /** Marca de migración: Ronda/Rondín sin turno por defecto. */
  sinTurnoRondaRondinMigrated?: boolean;
};

function asPersistido(value: unknown): ConfigPersistido {
  const normalized = normalizeOrdenNocturnoConfig(value);
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    ...normalized,
    sinTurnoRondaRondinMigrated: raw.sinTurnoRondaRondinMigrated === true,
  };
}

async function persistConfig(config: ConfigPersistido): Promise<OrdenNocturnoConfig> {
  const normalized = normalizeOrdenNocturnoConfig(config);
  const payload: ConfigPersistido = {
    ...normalized,
    sinTurnoRondaRondinMigrated: config.sinTurnoRondaRondinMigrated === true,
  };
  await prisma.ordenNocturnoConfig.upsert({
    where: { id: ORDEN_NOCTURNO_CONFIG_ID },
    create: { id: ORDEN_NOCTURNO_CONFIG_ID, config: payload },
    update: { config: payload },
  });
  return normalized;
}

export async function loadOrdenNocturnoConfig(): Promise<OrdenNocturnoConfig> {
  const row = await prisma.ordenNocturnoConfig.findUnique({
    where: { id: ORDEN_NOCTURNO_CONFIG_ID },
  });
  if (!row) return defaultOrdenNocturnoConfig();

  const persisted = asPersistido(row.config);
  if (persisted.sinTurnoRondaRondinMigrated) {
    return normalizeOrdenNocturnoConfig(persisted);
  }

  // Una sola vez: el default antiguo ponía "1ER" en Ronda/Rondín.
  const raw = row.config && typeof row.config === "object" ? (row.config as Record<string, unknown>) : {};
  const migrated: ConfigPersistido = {
    ...persisted,
    rondaTurno: raw.rondaTurno === "1ER" || raw.rondaTurno === undefined ? "" : persisted.rondaTurno,
    rondinTurno: raw.rondinTurno === "1ER" || raw.rondinTurno === undefined ? "" : persisted.rondinTurno,
    sinTurnoRondaRondinMigrated: true,
  };
  return persistConfig(migrated);
}

export async function saveOrdenNocturnoConfig(
  config: OrdenNocturnoConfig,
): Promise<OrdenNocturnoConfig> {
  const row = await prisma.ordenNocturnoConfig.findUnique({
    where: { id: ORDEN_NOCTURNO_CONFIG_ID },
    select: { config: true },
  });
  const prev = asPersistido(row?.config);
  return persistConfig({
    ...normalizeOrdenNocturnoConfig(config),
    sinTurnoRondaRondinMigrated: prev.sinTurnoRondaRondinMigrated === true,
  });
}
