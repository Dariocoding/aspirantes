import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PrismaClient } from "../src/generated/prisma";
import { inventarioImagenKey } from "../src/lib/storage/inventario-imagen";
import { deleteObject, putObject } from "../src/lib/storage/s3";
import { INVENTARIO_SEED_ITEMS } from "./seed-inventario";

const ASSETS_DIR = path.join(__dirname, "seed-assets", "inventario");

/** Archivo JPEG en `prisma/seed-assets/inventario/` por nombre de ítem del catálogo. */
export const INVENTARIO_SEED_IMAGE_BY_NOMBRE: Record<string, string> = {
  "Arroz blanco": "arroz-blanco.jpg",
  "Harina de trigo": "harina-trigo.jpg",
  "Pasta corta": "pasta-corta.jpg",
  "Aceite vegetal": "aceite-vegetal.jpg",
  Azúcar: "azucar.jpg",
  Sal: "sal.jpg",
  "Carne de res": "carne-res.jpg",
  "Pollo entero": "pollo-entero.jpg",
  Huevos: "huevos.jpg",
  "Leche entera": "leche-entera.jpg",
  Cebolla: "cebolla.jpg",
  Tomate: "tomate.jpg",
  Papa: "papa.jpg",
  "Frijoles negros": "frijoles-negros.jpg",
  "Atún en lata": "atun-lata.jpg",
  "Detergente líquido": "detergente.jpg",
  Servilletas: "servilletas.jpg",
  "Café molido": "cafe-molido.jpg",
};

function hasS3Config(): boolean {
  return Boolean(
    process.env.S3_ENDPOINT?.trim() &&
      process.env.S3_ACCESS_KEY?.trim() &&
      process.env.S3_SECRET_KEY?.trim() &&
      process.env.S3_BUCKET_NAME?.trim(),
  );
}

/**
 * Sube la foto de semilla a R2/S3 y actualiza `imagenKey` en cada ítem del catálogo.
 * Idempotente: reemplaza la clave anterior si cambió la extensión o el ítem ya tenía foto.
 */
export async function seedInventarioImagenes(client: PrismaClient) {
  if (!hasS3Config()) {
    console.warn("[seed] Inventario imágenes: omitido (configure S3_ENDPOINT, claves y S3_BUCKET_NAME).");
    return;
  }

  const nombres = INVENTARIO_SEED_ITEMS.map((i) => i.nombre);
  const items = await client.inventarioItem.findMany({
    where: { nombre: { in: nombres } },
    select: { id: true, nombre: true, area: true, imagenKey: true },
  });

  let uploaded = 0;
  let skipped = 0;

  for (const item of items) {
    const fileName = INVENTARIO_SEED_IMAGE_BY_NOMBRE[item.nombre];
    if (!fileName) {
      skipped++;
      continue;
    }

    const filePath = path.join(ASSETS_DIR, fileName);
    let buffer: Buffer;
    try {
      buffer = await readFile(filePath);
    } catch {
      console.warn(`[seed] Inventario imágenes: no se encontró ${filePath}`);
      skipped++;
      continue;
    }

    if (buffer.length < 500) {
      console.warn(`[seed] Inventario imágenes: archivo inválido o vacío (${fileName})`);
      skipped++;
      continue;
    }

    const key = inventarioImagenKey(item.area, item.id, "jpg");

    try {
      await putObject(key, buffer, "image/jpeg");
      if (item.imagenKey && item.imagenKey !== key) {
        await deleteObject(item.imagenKey);
      }
      await client.inventarioItem.update({
        where: { id: item.id },
        data: { imagenKey: key },
      });
      uploaded++;
    } catch (e) {
      console.warn(`[seed] Inventario imágenes: error subiendo ${item.nombre}:`, e);
      skipped++;
    }
  }

  const expected = Object.keys(INVENTARIO_SEED_IMAGE_BY_NOMBRE).length;
  console.log(
    `[seed] Inventario imágenes: ${uploaded} subidas, ${skipped} omitidas (${items.length} ítems en BD, catálogo ${expected}).`,
  );
}
