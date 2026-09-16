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
