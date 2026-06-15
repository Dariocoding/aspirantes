import type { AreaInventario } from "@src/generated/prisma";
import { prisma } from "@src/lib/prisma";

export type InventarioStats = {
  totalItems: number;
  activos: number;
  stockBajo: number;
  sinStock: number;
  movimientosHoy: number;
  ultimoMovimiento: Date | null;
};

export type InventarioStockAlertItem = {
  id: string;
  nombre: string;
  unidad: string;
  stockActual: number;
  stockMinimo: number | null;
};

const MOVIMIENTOS_PREVIEW = 8;

export async function getInventarioStats(area: AreaInventario): Promise<InventarioStats> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [items, movimientosHoy, ultimoMovimiento] = await Promise.all([
    prisma.inventarioItem.findMany({
      where: { area },
      select: { activo: true, stockActual: true, stockMinimo: true },
    }),
    prisma.inventarioMovimiento.count({
      where: {
        item: { area },
        createdAt: { gte: startOfDay },
      },
    }),
    prisma.inventarioMovimiento.findFirst({
      where: { item: { area } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const activos = items.filter((i) => i.activo).length;
  const stockBajo = items.filter(
    (i) => i.activo && i.stockMinimo != null && i.stockActual <= i.stockMinimo,
  ).length;
  const sinStock = items.filter((i) => i.activo && i.stockActual <= 0).length;

  return {
    totalItems: items.length,
    activos,
    stockBajo,
    sinStock,
    movimientosHoy,
    ultimoMovimiento: ultimoMovimiento?.createdAt ?? null,
  };
}

export async function getInventarioStockAlerts(
  area: AreaInventario,
  limit = 5,
): Promise<InventarioStockAlertItem[]> {
  const items = await prisma.inventarioItem.findMany({
    where: {
      area,
      activo: true,
    },
    orderBy: [{ stockActual: "asc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      unidad: true,
      stockActual: true,
      stockMinimo: true,
    },
  });

  return items
    .filter((i) => i.stockActual <= 0 || (i.stockMinimo != null && i.stockActual <= i.stockMinimo))
    .slice(0, limit);
}

export async function getInventarioRecentMovimientos(area: AreaInventario, limit = MOVIMIENTOS_PREVIEW) {
  return prisma.inventarioMovimiento.findMany({
    where: { item: { area } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      tipo: true,
      cantidad: true,
      createdAt: true,
      item: { select: { nombre: true, unidad: true } },
      user: { select: { name: true, email: true } },
    },
  });
}
