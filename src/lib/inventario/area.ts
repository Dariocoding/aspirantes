import type { AreaInventario } from "@src/generated/prisma";
import { routes } from "@src/lib/apps/routes";
import { Permission, type PermissionKey } from "@src/lib/auth/permissions";

export type InventarioAreaConfig = {
  area: AreaInventario;
  title: string;
  subtitle: string;
  route: string;
  readPermission: PermissionKey;
  writePermission: PermissionKey;
};

export const INVENTARIO_AREAS: Record<AreaInventario, InventarioAreaConfig> = {
  RANCHO: {
    area: "RANCHO",
    title: "Inventario del rancho",
    subtitle: "Existencias, entradas y salidas de insumos en el rancho.",
    route: routes.inventario.rancho,
    readPermission: Permission.INVENTARIO_RANCHO_READ,
    writePermission: Permission.INVENTARIO_RANCHO_WRITE,
  },
};

export const INVENTARIO_UNIDADES = [
  { value: "unidades", label: "Unidades" },
  { value: "kg", label: "Kilogramos (kg)" },
  { value: "g", label: "Gramos (g)" },
  { value: "litros", label: "Litros (L)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "cajas", label: "Cajas" },
  { value: "paquetes", label: "Paquetes" },
  { value: "sacos", label: "Sacos" },
] as const;

export function labelUnidad(unidad: string): string {
  return INVENTARIO_UNIDADES.find((u) => u.value === unidad)?.label ?? unidad;
}

export function formatCantidad(value: number, unidad?: string): string {
  const formatted = Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/\.?0+$/, "");
  return unidad ? `${formatted} ${unidad}` : formatted;
}
