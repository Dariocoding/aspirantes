"use client";

import { ArrowDownLeft, ArrowUpRight, ChefHat, Package, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useActionState, useCallback, useState, type ReactNode } from "react";
import { SuccessCelebrationDialog } from "@src/components/ui/success-celebration-dialog";
import {
  createInventarioItem,
  deleteInventarioItem,
  registrarInventarioMovimiento,
  updateInventarioItem,
} from "@src/app/actions/inventario";
import { Button, buttonVariants } from "@src/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@src/components/ui/dialog";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/components/ui/select";
import { Textarea } from "@src/components/ui/textarea";
import { useCelebrateOnOkTransition } from "@src/hooks/use-celebrate-on-ok-transition";
import type { InventarioActionState } from "@src/lib/action-types";
import { inventarioInitialActionState } from "@src/lib/action-types";
import type { AreaInventario } from "@src/generated/prisma";
import { INVENTARIO_AREAS, INVENTARIO_UNIDADES, type InventarioAreaConfig } from "@src/lib/inventario/area";
import {
  InventarioImagenField,
  InventarioItemThumbnail,
} from "@dashboard/inventario/_components/inventario-item-imagen";
import { cn } from "@src/lib/utils";

export type InventarioItemRow = {
  id: string;
  nombre: string;
  unidad: string;
  stockActual: number;
  stockMinimo: number | null;
  descripcion: string | null;
  imagenKey: string | null;
  activo: boolean;
};

export type InventarioMovimientoRow = {
  id: string;
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
  motivo: string | null;
  notas: string | null;
  stockAntes: number;
  stockDespues: number;
  createdAt: Date;
  item: { nombre: string; unidad: string };
  user: { name: string | null; email: string | null } | null;
};

function ErrorList({ errors }: { errors: Record<string, string> }) {
  const entries = Object.entries(errors);
  if (!entries.length) return null;
  const labels: Record<string, string> = {
    nombre: "Nombre",
    unidad: "Unidad",
    stockInicial: "Stock inicial",
    stockMinimo: "Stock mínimo",
    descripcion: "Descripción",
    imagen: "Imagen",
    cantidad: "Cantidad",
    motivo: "Motivo",
  };
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 md:col-span-2"
    >
      <ul className="space-y-1">
        {entries.map(([k, v]) => (
          <li key={k}>
            <span className="font-medium">{labels[k] ?? k}:</span> {v}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3 md:col-span-2">
      <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</legend>
      {description ? <p className="-mt-1 text-xs text-slate-500">{description}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-slate-800">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-[11px] leading-snug text-slate-500">{hint}</p> : null}
    </div>
  );
}

function InventarioDialogHeader({
  title,
  description,
  areaConfig,
}: {
  title: string;
  description: string;
  areaConfig: InventarioAreaConfig;
}) {
  return (
    <DialogHeader className="shrink-0 gap-3">
      <div className="flex items-start gap-3 pr-8">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-200/80 bg-amber-50 text-amber-900">
          <ChefHat className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-base">{title}</DialogTitle>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
              {areaConfig.title}
            </span>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </div>
      </div>
    </DialogHeader>
  );
}

const inventarioItemDialogClass =
  "flex max-h-[min(calc(100dvh-2rem),720px)] max-w-lg flex-col gap-0 overflow-hidden p-0";

function InventarioItemFormScroll({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="grid gap-4 px-5 py-4">{children}</div>
    </div>
  );
}

function InventarioItemFormFooter({
  pending,
  submitLabel,
  pendingLabel,
}: {
  pending: boolean;
  submitLabel: string;
  pendingLabel: string;
}) {
  return (
    <DialogFooter className="shrink-0 border-t border-border bg-slate-50/90 backdrop-blur-sm">
      <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
      <Button type="submit" disabled={pending} className="gap-1.5">
        <Save className="h-4 w-4" aria-hidden />
        {pending ? pendingLabel : submitLabel}
      </Button>
    </DialogFooter>
  );
}

function UnidadSelect({ id, defaultUnidad }: { id: string; defaultUnidad?: string }) {
  const value = INVENTARIO_UNIDADES.some((u) => u.value === defaultUnidad) ? defaultUnidad! : "unidades";
  return (
    <Field label="Unidad de medida" htmlFor={id}>
      <Select name="unidad" defaultValue={value} required modal={false}>
        <SelectTrigger id={id} size="default" className="h-9 w-full min-w-0 shadow-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {INVENTARIO_UNIDADES.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function ItemCreateFormBody({ area, onDone }: { area: AreaInventario; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(createInventarioItem, inventarioInitialActionState);
  const [celebrateOpen, setCelebrateOpen] = useCelebrateOnOkTransition(state.ok);

  const onCelebrateOpenChange = useCallback(
    (open: boolean) => {
      setCelebrateOpen(open);
      if (!open) onDone();
    },
    [onDone, setCelebrateOpen],
  );

  return (
    <>
      <SuccessCelebrationDialog
        open={celebrateOpen}
        onOpenChange={onCelebrateOpenChange}
        variant="created"
        title="Ítem registrado"
        description="El producto quedó en el inventario con su información."
      />
      <form action={formAction} encType="multipart/form-data" className="flex min-h-0 flex-1 flex-col">
        <input type="hidden" name="area" value={area} />
        <InventarioItemFormScroll>
          <ErrorList errors={state.errors} />

          <FormSection title="Identificación" description="Foto opcional y nombre del producto.">
            <InventarioImagenField id="inv-imagen-create" />
            <Field label="Nombre del ítem" htmlFor="inv-nombre" className="sm:col-span-2">
              <Input
                id="inv-nombre"
                name="nombre"
                required
                maxLength={120}
                placeholder="Ej. Arroz, carne, detergente"
                className="shadow-xs"
              />
            </Field>
          </FormSection>

          <FormSection title="Existencias" description="Unidad de medida y cantidades iniciales.">
            <UnidadSelect id="inv-unidad-create" />
            <Field label="Stock inicial" htmlFor="inv-stock-inicial" hint="Cantidad al registrar.">
              <Input
                id="inv-stock-inicial"
                name="stockInicial"
                type="number"
                min={0}
                step="any"
                defaultValue={0}
                className="shadow-xs tabular-nums"
              />
            </Field>
            <Field
              label="Stock mínimo"
              htmlFor="inv-stock-min"
              hint="Opcional. Alertas de reposición."
              className="sm:col-span-2"
            >
              <Input
                id="inv-stock-min"
                name="stockMinimo"
                type="number"
                min={0}
                step="any"
                placeholder="Ej. 10"
                className="max-w-xs shadow-xs tabular-nums"
              />
            </Field>
          </FormSection>

          <FormSection title="Notas">
            <Field
              label="Descripción"
              htmlFor="inv-desc"
              className="sm:col-span-2"
              hint="Opcional. Marca, presentación u observaciones."
            >
              <Textarea
                id="inv-desc"
                name="descripcion"
                rows={2}
                maxLength={500}
                className="min-h-[64px] resize-y shadow-xs"
              />
            </Field>
          </FormSection>
        </InventarioItemFormScroll>

        <InventarioItemFormFooter
          pending={pending}
          submitLabel="Registrar ítem"
          pendingLabel="Guardando…"
        />
      </form>
    </>
  );
}

export function InventarioItemCreateDialog({
  area,
  canWrite,
}: {
  area: AreaInventario;
  canWrite: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!canWrite) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ size: "sm" }), "gap-1.5 shadow-sm")}>
        <Plus className="h-4 w-4" aria-hidden />
        Nuevo ítem
      </DialogTrigger>
      <DialogContent className={inventarioItemDialogClass}>
        <InventarioDialogHeader
          title="Nuevo ítem de inventario"
          description="Registre un producto o insumo con su unidad de medida y stock inicial."
          areaConfig={INVENTARIO_AREAS[area]}
        />
        <ItemCreateFormBody area={area} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ItemEditFormBody({
  item,
  onDone,
}: {
  item: InventarioItemRow;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateInventarioItem, inventarioInitialActionState);
  const [celebrateOpen, setCelebrateOpen] = useCelebrateOnOkTransition(state.ok);

  const onCelebrateOpenChange = useCallback(
    (open: boolean) => {
      setCelebrateOpen(open);
      if (!open) onDone();
    },
    [onDone, setCelebrateOpen],
  );

  return (
    <>
      <SuccessCelebrationDialog
        open={celebrateOpen}
        onOpenChange={onCelebrateOpenChange}
        variant="saved"
        title="Ítem actualizado"
        description="Los cambios del producto quedaron guardados."
      />
      <form action={formAction} encType="multipart/form-data" className="flex min-h-0 flex-1 flex-col">
        <input type="hidden" name="id" value={item.id} />
        <InventarioItemFormScroll>
          <ErrorList errors={state.errors} />

          <FormSection title="Identificación" description="Foto y datos principales. El stock se ajusta con entradas y salidas.">
            <InventarioImagenField
              id="inv-imagen-edit"
              itemId={item.id}
              imagenKey={item.imagenKey}
              nombre={item.nombre}
            />
            <Field label="Nombre" htmlFor="inv-edit-nombre" className="sm:col-span-2">
              <Input
                id="inv-edit-nombre"
                name="nombre"
                required
                defaultValue={item.nombre}
                maxLength={120}
                className="shadow-xs"
              />
            </Field>
            <UnidadSelect id="inv-unidad-edit" defaultUnidad={item.unidad} />
            <Field label="Stock mínimo" htmlFor="inv-edit-min" hint="Opcional. Alertas de reposición.">
              <Input
                id="inv-edit-min"
                name="stockMinimo"
                type="number"
                min={0}
                step="any"
                defaultValue={item.stockMinimo ?? ""}
                className="shadow-xs tabular-nums"
              />
            </Field>
          </FormSection>

          <FormSection title="Estado y notas">
            <Field label="Descripción" htmlFor="inv-edit-desc" className="sm:col-span-2" hint="Opcional.">
              <Textarea
                id="inv-edit-desc"
                name="descripcion"
                rows={2}
                defaultValue={item.descripcion ?? ""}
                maxLength={500}
                className="min-h-[64px] resize-y shadow-xs"
              />
            </Field>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 sm:col-span-2">
              <input
                type="checkbox"
                id="inv-edit-activo"
                name="activo"
                defaultChecked={item.activo}
                className="h-4 w-4 rounded border-slate-300"
              />
              <Label htmlFor="inv-edit-activo" className="text-sm font-normal text-slate-700">
                Ítem activo en inventario
              </Label>
            </div>
          </FormSection>
        </InventarioItemFormScroll>

        <InventarioItemFormFooter
          pending={pending}
          submitLabel="Guardar cambios"
          pendingLabel="Guardando…"
        />
      </form>
    </>
  );
}

export function InventarioItemEditDialog({
  item,
  area,
  open,
  onOpenChange,
}: {
  item: InventarioItemRow | null;
  area: AreaInventario;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const onDone = useCallback(() => onOpenChange(false), [onOpenChange]);
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={inventarioItemDialogClass}>
        <InventarioDialogHeader
          title="Editar ítem"
          description="Actualice los datos del producto. El stock se ajusta con entradas y salidas."
          areaConfig={INVENTARIO_AREAS[area]}
        />
        <ItemEditFormBody item={item} onDone={onDone} />
      </DialogContent>
    </Dialog>
  );
}

function MovimientoFormBody({
  item,
  tipo,
  onDone,
}: {
  item: InventarioItemRow;
  tipo: "ENTRADA" | "SALIDA";
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(registrarInventarioMovimiento, inventarioInitialActionState);
  const [celebrateOpen, setCelebrateOpen] = useCelebrateOnOkTransition(state.ok);
  const isEntrada = tipo === "ENTRADA";

  const onCelebrateOpenChange = useCallback(
    (open: boolean) => {
      setCelebrateOpen(open);
      if (!open) onDone();
    },
    [onDone, setCelebrateOpen],
  );

  return (
    <>
      <SuccessCelebrationDialog
        open={celebrateOpen}
        onOpenChange={onCelebrateOpenChange}
        variant="saved"
        title={isEntrada ? "Entrada registrada" : "Salida registrada"}
        description="El movimiento de stock quedó aplicado al ítem."
      />
    <form action={formAction} className="flex flex-col">
      <input type="hidden" name="itemId" value={item.id} />
      <input type="hidden" name="tipo" value={tipo} />
      <div className="space-y-4 px-5 py-4">
        <ErrorList errors={state.errors} />
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5">
          <InventarioItemThumbnail
            itemId={item.id}
            imagenKey={item.imagenKey}
            nombre={item.nombre}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">{item.nombre}</p>
            <p className="text-xs text-slate-500">
              Stock actual:{" "}
              <span className="font-semibold tabular-nums text-slate-800">{item.stockActual}</span> {item.unidad}
            </p>
          </div>
        </div>
        <Field label="Cantidad" htmlFor={`mov-cant-${tipo}`}>
          <Input
            id={`mov-cant-${tipo}`}
            name="cantidad"
            type="number"
            min={0.01}
            step="any"
            required
            autoFocus
            className="shadow-xs tabular-nums"
          />
        </Field>
        <Field label="Motivo" htmlFor={`mov-motivo-${tipo}`} hint="Opcional. Ej. compra, consumo, merma.">
          <Input
            id={`mov-motivo-${tipo}`}
            name="motivo"
            placeholder={isEntrada ? "Ej. Compra, donación" : "Ej. Consumo diario, merma"}
            maxLength={200}
            className="shadow-xs"
          />
        </Field>
        <Field label="Notas" htmlFor={`mov-notas-${tipo}`} hint="Opcional.">
          <Textarea id={`mov-notas-${tipo}`} name="notas" rows={2} maxLength={500} className="min-h-[72px] resize-none shadow-xs" />
        </Field>
      </div>
      <DialogFooter className="bg-slate-50/80">
        <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
        <Button
          type="submit"
          disabled={pending}
          variant={isEntrada ? "default" : "secondary"}
          className="gap-1.5"
        >
          {isEntrada ? (
            <ArrowDownLeft className="h-4 w-4" aria-hidden />
          ) : (
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          )}
          {pending ? "Registrando…" : isEntrada ? "Registrar entrada" : "Registrar salida"}
        </Button>
      </DialogFooter>
    </form>
    </>
  );
}

export function InventarioMovimientoDialog({
  item,
  area,
  tipo,
  canWrite,
}: {
  item: InventarioItemRow;
  area: AreaInventario;
  tipo: "ENTRADA" | "SALIDA";
  canWrite: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!canWrite || !item.activo) return null;

  const isEntrada = tipo === "ENTRADA";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ size: "sm", variant: isEntrada ? "default" : "outline" }),
          "gap-1.5 shadow-sm",
        )}
      >
        {isEntrada ? (
          <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        )}
        {isEntrada ? "Entrada" : "Salida"}
      </DialogTrigger>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <InventarioDialogHeader
          title={isEntrada ? "Entrada de stock" : "Salida de stock"}
          description={
            isEntrada
              ? "Incremente las existencias del ítem seleccionado."
              : "Registre el consumo o retiro. No se permiten salidas mayores al stock disponible."
          }
          areaConfig={INVENTARIO_AREAS[area]}
        />
        <MovimientoFormBody item={item} tipo={tipo} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function InventarioEditTriggerButton({
  item,
  onEdit,
}: {
  item: InventarioItemRow;
  onEdit: (item: InventarioItemRow) => void;
}) {
  return (
    <Button type="button" variant="outline" size="sm" className="gap-1.5 shadow-sm" onClick={() => onEdit(item)}>
      <Pencil className="h-3.5 w-3.5" aria-hidden />
      Editar
    </Button>
  );
}
