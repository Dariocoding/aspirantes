import type { AreaInventario, PrismaClient } from "../src/generated/prisma";
import { seedInventarioImagenes } from "./seed-inventario-imagenes";

/** Catálogo base de insumos para el área Rancho (idempotente por nombre + área). */
export const INVENTARIO_SEED_ITEMS: ReadonlyArray<{
  nombre: string;
  unidad: string;
  stockActual: number;
  stockMinimo: number | null;
  descripcion?: string;
}> = [
  {
    nombre: "Arroz blanco",
    unidad: "kg",
    stockActual: 80,
    stockMinimo: 25,
    descripcion: "Grano largo para consumo diario.",
  },
  {
    nombre: "Harina de trigo",
    unidad: "kg",
    stockActual: 40,
    stockMinimo: 15,
    descripcion: "Todo uso, panadería y repostería básica.",
  },
  {
    nombre: "Pasta corta",
    unidad: "kg",
    stockActual: 30,
    stockMinimo: 10,
  },
  {
    nombre: "Aceite vegetal",
    unidad: "litros",
    stockActual: 24,
    stockMinimo: 8,
  },
  {
    nombre: "Azúcar",
    unidad: "kg",
    stockActual: 35,
    stockMinimo: 12,
  },
  {
    nombre: "Sal",
    unidad: "kg",
    stockActual: 10,
    stockMinimo: 3,
  },
  {
    nombre: "Carne de res",
    unidad: "kg",
    stockActual: 12,
    stockMinimo: 20,
    descripcion: "Ejemplo de alerta: por debajo del mínimo.",
  },
  {
    nombre: "Pollo entero",
    unidad: "kg",
    stockActual: 22,
    stockMinimo: 10,
  },
  {
    nombre: "Huevos",
    unidad: "unidades",
    stockActual: 360,
    stockMinimo: 120,
  },
  {
    nombre: "Leche entera",
    unidad: "litros",
    stockActual: 18,
    stockMinimo: 10,
  },
  {
    nombre: "Cebolla",
    unidad: "kg",
    stockActual: 12,
    stockMinimo: 5,
  },
  {
    nombre: "Tomate",
    unidad: "kg",
    stockActual: 8,
    stockMinimo: 5,
  },
  {
    nombre: "Papa",
    unidad: "kg",
    stockActual: 45,
    stockMinimo: 15,
  },
  {
    nombre: "Frijoles negros",
    unidad: "kg",
    stockActual: 25,
    stockMinimo: 10,
  },
  {
    nombre: "Atún en lata",
    unidad: "unidades",
    stockActual: 48,
    stockMinimo: 24,
  },
  {
    nombre: "Detergente líquido",
    unidad: "litros",
    stockActual: 6,
    stockMinimo: 4,
    descripcion: "Limpieza de cocina y utensilios.",
  },
  {
    nombre: "Servilletas",
    unidad: "paquetes",
    stockActual: 20,
    stockMinimo: 8,
  },
  {
    nombre: "Café molido",
    unidad: "kg",
    stockActual: 0,
    stockMinimo: 2,
    descripcion: "Ejemplo de ítem sin stock.",
  },
];

const INVENTARIO_SEED_AREA: AreaInventario = "RANCHO";

/**
 * Ítems de inventario iniciales para desarrollo y demos.
 * No sobrescribe ítems existentes (clave única nombre + área).
 */
export async function seedInventario(client: PrismaClient) {
  const inserted = await client.inventarioItem.createMany({
    data: INVENTARIO_SEED_ITEMS.map((item) => ({
      nombre: item.nombre,
      unidad: item.unidad,
      stockActual: item.stockActual,
      stockMinimo: item.stockMinimo,
      descripcion: item.descripcion ?? null,
      area: INVENTARIO_SEED_AREA,
      activo: true,
    })),
    skipDuplicates: true,
  });

  const total = await client.inventarioItem.count({
    where: { area: INVENTARIO_SEED_AREA },
  });

  console.log(
    `Inventario (${INVENTARIO_SEED_AREA}): ${inserted.count} ítems nuevos en este paso; ${total} en tabla (catálogo base: ${INVENTARIO_SEED_ITEMS.length}).`,
  );

  await seedInventarioImagenes(client);
}
