import "server-only";

import type { AreaInventario, Prisma } from "@src/generated/prisma";
import { prisma } from "@src/lib/prisma";
import {
  INVENTARIO_ITEMS_PAGE_SIZE,
  parseInventarioItemsSearchParams,
  type InventarioItemsQuery,
  type InventarioItemsSort,
  type InventarioItemsSortDir,
} from "@src/lib/inventario/queries-shared";

export {
  INVENTARIO_ITEMS_PAGE_SIZE,
  inventarioListHref,
  parseInventarioItemsSearchParams,
  type InventarioItemsQuery,
  type InventarioItemsSearchParams,
  type InventarioItemsSort,
  type InventarioItemsSortDir,
} from "@src/lib/inventario/queries-shared";

const MOVIMIENTOS_LIMIT = 50;

const itemSelect = {
  id: true,
  nombre: true,
  unidad: true,
  stockActual: true,
  stockMinimo: true,
  descripcion: true,
  imagenKey: true,
  activo: true,
} as const;

function itemsWhere(area: AreaInventario, q: string): Prisma.InventarioItemWhereInput {
  const base: Prisma.InventarioItemWhereInput = { area };
  if (!q) return base;
  return {
    ...base,
    OR: [
      { nombre: { contains: q, mode: "insensitive" } },
      { descripcion: { contains: q, mode: "insensitive" } },
    ],
  };
}

function itemsOrderBy(
  sort: InventarioItemsSort,
  dir: InventarioItemsSortDir,
): Prisma.InventarioItemOrderByWithRelationInput {
  return sort === "stock" ? { stockActual: dir } : { nombre: dir };
}

async function getInventarioMovimientos(area: AreaInventario) {
  return prisma.inventarioMovimiento.findMany({
    where: { item: { area } },
    orderBy: { createdAt: "desc" },
    take: MOVIMIENTOS_LIMIT,
    select: {
      id: true,
      tipo: true,
      cantidad: true,
      motivo: true,
      notas: true,
      stockAntes: true,
      stockDespues: true,
      createdAt: true,
      item: { select: { nombre: true, unidad: true } },
      user: { select: { name: true, email: true } },
    },
  });
}

export async function countInventarioItemsNeedingAttention(area: AreaInventario) {
  const rows = await prisma.inventarioItem.findMany({
    where: { area, activo: true },
    select: { stockActual: true, stockMinimo: true },
  });
  return rows.filter(
    (i) => i.stockActual <= 0 || (i.stockMinimo != null && i.stockActual <= i.stockMinimo),
  ).length;
}

export async function getInventarioData(area: AreaInventario, query: InventarioItemsQuery = {}) {
  const { page, sort, dir, q } = parseInventarioItemsSearchParams({
    page: query.page != null ? String(query.page) : undefined,
    sort: query.sort,
    dir: query.dir,
    q: query.q,
  });

  const where = itemsWhere(area, q);
  const orderBy = itemsOrderBy(sort, dir);

  const [totalItems, totalInArea, movimientos, alertCount] = await Promise.all([
    prisma.inventarioItem.count({ where }),
    prisma.inventarioItem.count({ where: { area } }),
    getInventarioMovimientos(area),
    countInventarioItemsNeedingAttention(area),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / INVENTARIO_ITEMS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const items = await prisma.inventarioItem.findMany({
    where,
    orderBy,
    skip: (safePage - 1) * INVENTARIO_ITEMS_PAGE_SIZE,
    take: INVENTARIO_ITEMS_PAGE_SIZE,
    select: itemSelect,
  });

  return {
    items,
    movimientos,
    totalItems,
    totalInArea,
    totalPages,
    page: safePage,
    pageSize: INVENTARIO_ITEMS_PAGE_SIZE,
    listQuery: { page: safePage, sort, dir, q },
    alertCount,
  };
}
