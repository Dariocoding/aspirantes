"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@src/lib/apps/routes";
import { writeAuditLog } from "@src/lib/audit/log";
import type { InventarioActionState } from "@src/lib/action-types";
import { requirePermission } from "@src/lib/auth/guards";
import type { AreaInventario } from "@src/generated/prisma";
import { INVENTARIO_AREAS } from "@src/lib/inventario/area";
import { prisma } from "@src/lib/prisma";
import {
  inventarioItemCreateSchema,
  inventarioItemUpdateSchema,
  inventarioMovimientoSchema,
} from "@src/lib/validators/inventario";
import {
  InventarioImagenError,
  parseInventarioImagenFile,
  removeInventarioImagen,
  shouldRemoveInventarioImagen,
  uploadInventarioImagen,
} from "@src/lib/storage/inventario-imagen";
import { zodFieldErrors } from "@src/lib/zod-errors";

function imagenFieldError(message: string): InventarioActionState {
  return { ok: false, errors: { imagen: message } };
}

async function applyInventarioImagenFromForm(
  formData: FormData,
  itemId: string,
  area: string,
  previousKey: string | null,
): Promise<InventarioActionState | { imagenKey: string | null }> {
  const file = parseInventarioImagenFile(formData);
  const quitar = shouldRemoveInventarioImagen(formData);

  if (file && quitar) {
    return imagenFieldError("No puede subir una imagen nueva y quitar la actual a la vez.");
  }

  if (quitar) {
    await removeInventarioImagen(previousKey);
    await prisma.inventarioItem.update({
      where: { id: itemId },
      data: { imagenKey: null },
    });
    return { imagenKey: null };
  }

  if (!file) {
    return { imagenKey: previousKey };
  }

  try {
    const newKey = await uploadInventarioImagen(file, area, itemId);
    await prisma.inventarioItem.update({
      where: { id: itemId },
      data: { imagenKey: newKey },
    });
    if (previousKey && previousKey !== newKey) {
      await removeInventarioImagen(previousKey);
    }
    return { imagenKey: newKey };
  } catch (e) {
    if (e instanceof InventarioImagenError) {
      return imagenFieldError(e.message);
    }
    throw e;
  }
}

function revalidateInventarioArea(area: AreaInventario) {
  revalidatePath(routes.inventario.home);
  revalidatePath(INVENTARIO_AREAS[area].route);
}

async function requireInventarioWrite(area: AreaInventario) {
  return requirePermission(INVENTARIO_AREAS[area].writePermission);
}

export async function createInventarioItem(
  _prev: InventarioActionState,
  formData: FormData,
): Promise<InventarioActionState> {
  const raw = {
    area: formData.get("area"),
    nombre: formData.get("nombre"),
    unidad: formData.get("unidad"),
    stockInicial: formData.get("stockInicial"),
    stockMinimo: formData.get("stockMinimo"),
    descripcion: formData.get("descripcion"),
  };

  const parsed = inventarioItemCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: zodFieldErrors(parsed.error) };
  }

  const d = parsed.data;
  const session = await requireInventarioWrite(d.area);

  let created!: { id: string; nombre: string; stockActual: number };

  try {
    created = await prisma.$transaction(async (tx) => {
      const item = await tx.inventarioItem.create({
        data: {
          nombre: d.nombre,
          unidad: d.unidad,
          area: d.area,
          stockActual: d.stockInicial,
          stockMinimo: d.stockMinimo,
          descripcion: d.descripcion,
        },
        select: { id: true, nombre: true, stockActual: true },
      });

      if (d.stockInicial > 0) {
        await tx.inventarioMovimiento.create({
          data: {
            itemId: item.id,
            tipo: "ENTRADA",
            cantidad: d.stockInicial,
            motivo: "Stock inicial",
            stockAntes: 0,
            stockDespues: d.stockInicial,
            userId: session.user.id,
          },
        });
      }

      return item;
    });
  } catch (e: unknown) {
    const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code?: string }).code) : "";
    if (code === "P2002") {
      return { ok: false, errors: { nombre: "Ya existe un ítem con ese nombre." } };
    }
    throw e;
  }

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action: "INVENTARIO_ITEM_CREATE",
    entityType: "INVENTARIO_ITEM",
    entityId: created.id,
    metadata: { area: d.area, nombre: created.nombre, stockInicial: d.stockInicial },
  });

  const imagenResult = await applyInventarioImagenFromForm(
    formData,
    created.id,
    d.area,
    null,
  );
  if ("ok" in imagenResult && imagenResult.ok === false) {
    return imagenResult;
  }

  revalidateInventarioArea(d.area);
  return { ok: true, errors: {} };
}

export async function updateInventarioItem(
  _prev: InventarioActionState,
  formData: FormData,
): Promise<InventarioActionState> {
  const raw = {
    id: formData.get("id"),
    nombre: formData.get("nombre"),
    unidad: formData.get("unidad"),
    stockMinimo: formData.get("stockMinimo"),
    descripcion: formData.get("descripcion"),
    activo: formData.get("activo"),
  };

  const parsed = inventarioItemUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: zodFieldErrors(parsed.error) };
  }

  const d = parsed.data;
  const existing = await prisma.inventarioItem.findUnique({
    where: { id: d.id },
    select: { area: true, nombre: true, imagenKey: true },
  });
  if (!existing) {
    return { ok: false, errors: { id: "Ítem no encontrado." } };
  }

  const session = await requireInventarioWrite(existing.area);

  try {
    await prisma.inventarioItem.update({
      where: { id: d.id },
      data: {
        nombre: d.nombre,
        unidad: d.unidad,
        stockMinimo: d.stockMinimo,
        descripcion: d.descripcion,
        activo: d.activo,
      },
    });
  } catch (e: unknown) {
    const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code?: string }).code) : "";
    if (code === "P2002") {
      return { ok: false, errors: { nombre: "Ya existe un ítem con ese nombre." } };
    }
    throw e;
  }

  const imagenResult = await applyInventarioImagenFromForm(
    formData,
    d.id,
    existing.area,
    existing.imagenKey,
  );
  if ("ok" in imagenResult && imagenResult.ok === false) {
    return imagenResult;
  }

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action: "INVENTARIO_ITEM_UPDATE",
    entityType: "INVENTARIO_ITEM",
    entityId: d.id,
    metadata: { area: existing.area, nombre: d.nombre, activo: d.activo },
  });

  revalidateInventarioArea(existing.area);
  return { ok: true, errors: {} };
}

export async function registrarInventarioMovimiento(
  _prev: InventarioActionState,
  formData: FormData,
): Promise<InventarioActionState> {
  const raw = {
    itemId: formData.get("itemId"),
    tipo: formData.get("tipo"),
    cantidad: formData.get("cantidad"),
    motivo: formData.get("motivo"),
    notas: formData.get("notas"),
  };

  const parsed = inventarioMovimientoSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: zodFieldErrors(parsed.error) };
  }

  const d = parsed.data;
  const item = await prisma.inventarioItem.findUnique({
    where: { id: d.itemId },
    select: { id: true, area: true, nombre: true, stockActual: true, activo: true },
  });

  if (!item) {
    return { ok: false, errors: { itemId: "Ítem no encontrado." } };
  }
  if (!item.activo) {
    return { ok: false, errors: { itemId: "El ítem está inactivo." } };
  }

  const session = await requireInventarioWrite(item.area);

  const stockAntes = item.stockActual;
  const delta = d.tipo === "ENTRADA" ? d.cantidad : -d.cantidad;
  const stockDespues = stockAntes + delta;

  if (stockDespues < 0) {
    return {
      ok: false,
      errors: { cantidad: `Stock insuficiente. Disponible: ${stockAntes}.` },
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.inventarioMovimiento.create({
      data: {
        itemId: item.id,
        tipo: d.tipo,
        cantidad: d.cantidad,
        motivo: d.motivo,
        notas: d.notas,
        stockAntes,
        stockDespues,
        userId: session.user.id,
      },
    });
    await tx.inventarioItem.update({
      where: { id: item.id },
      data: { stockActual: stockDespues },
    });
  });

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action: d.tipo === "ENTRADA" ? "INVENTARIO_ENTRADA" : "INVENTARIO_SALIDA",
    entityType: "INVENTARIO_ITEM",
    entityId: item.id,
    metadata: {
      area: item.area,
      nombre: item.nombre,
      cantidad: d.cantidad,
      stockAntes,
      stockDespues,
      motivo: d.motivo,
    },
  });

  revalidateInventarioArea(item.area);
  return { ok: true, errors: {} };
}

export async function deleteInventarioItem(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const item = await prisma.inventarioItem.findUnique({
    where: { id },
    select: { area: true, nombre: true, imagenKey: true },
  });
  if (!item) return;

  const session = await requireInventarioWrite(item.area);

  await removeInventarioImagen(item.imagenKey);
  await prisma.inventarioItem.delete({ where: { id } });

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action: "INVENTARIO_ITEM_DELETE",
    entityType: "INVENTARIO_ITEM",
    entityId: id,
    metadata: { area: item.area, nombre: item.nombre },
  });

  revalidateInventarioArea(item.area);
}
