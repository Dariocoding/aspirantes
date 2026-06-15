import type { AreaInventario, Prisma } from "@src/generated/prisma";
import { prisma } from "@src/lib/prisma";

const MOVIMIENTOS_LIMIT = 50;

export const INVENTARIO_ITEMS_PAGE_SIZE = 10;

export type InventarioItemsSort = "nombre" | "stock";
export type InventarioItemsSortDir = "asc" | "desc";

export type InventarioItemsQuery = {
  page?: number;
  sort?: InventarioItemsSort;
  dir?: InventarioItemsSortDir;
  q?: string;
};

export type InventarioItemsSearchParams = {
  page?: string;
  sort?: string;
  dir?: string;
  q?: string;
};

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

export function parseInventarioItemsSearchParams(
  sp: InventarioItemsSearchParams,
): Required<InventarioItemsQuery> {
  const parsedPage = Number.parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const sort: InventarioItemsSort = sp.sort === "stock" ? "stock" : "nombre";
  const dir: InventarioItemsSortDir = sp.dir === "desc" ? "desc" : "asc";
  const q = sp.q?.trim() ?? "";
  return { page, sort, dir, q };
}

export function inventarioListHref(
  route: string,
  opts: InventarioItemsQuery & { page?: number },
): string {
  const params = new URLSearchParams();
  const q = opts.q?.trim();
  if (q) params.set("q", q);
  const sort = opts.sort ?? "nombre";
  const dir = opts.dir ?? "asc";
  if (sort !== "nombre" || dir !== "asc") {
    params.set("sort", sort);
    params.set("dir", dir);
  }
  if (opts.page != null && opts.page > 1) params.set("page", String(opts.page));
  const qs = params.toString();
  return qs ? `${route}?${qs}` : route;
}

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
