"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, type ReactNode } from "react";
import { HeartPulse, Images, LifeBuoy, Loader2, Phone, UserRound, UserPlus } from "lucide-react";
import { createAspirante, updateAspiranteQuick } from "@src/app/actions/aspirantes";
import { AspiranteFotoField } from "@dashboard/aspirantes/_components/aspirante-foto";
import { Button, buttonVariants } from "@src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import { Textarea } from "@src/components/ui/textarea";
import { SuccessCelebrationDialog } from "@src/components/ui/success-celebration-dialog";
import { aspiranteInitialActionState } from "@src/lib/action-types";
import { routes } from "@src/lib/apps/routes";
import { hasRealBirthDate } from "@src/lib/date";
import { labelPeloton, type PelotonResumen } from "@src/lib/pelotones";
import { ASPIRANTE_FOTO_FORM } from "@src/lib/storage/aspirante-foto";
import { cn } from "@src/lib/utils";

export type AspiranteQuickInitial = {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  sexo: "MASCULINO" | "FEMENINO";
  fechaNacimientoIso: string;
  lugarNacimiento: string;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  pelotonId: string | null;
  contactoNombre: string | null;
  contactoParentesco: string | null;
  contactoTelefono: string | null;
  contactoDireccion: string | null;
  estaturaCm: number | null;
  pesoKg: number | null;
  tipoSangre: string | null;
  tallaGorra: string | null;
  tallaCamisa: string | null;
  tallaPantalon: string | null;
  tallaCalzado: string | null;
  tensionArterial: string | null;
  alergias: string | null;
  condicionesMedicas: string | null;
  discapacidad: string | null;
  observaciones: string | null;
  fotoKey?: string | null;
  fotoEsquelaKey?: string | null;
  fotoCedulaKey?: string | null;
  fotoTituloKey?: string | null;
  fotoTituloAutenticacionKey?: string | null;
  fotoNotasKey?: string | null;
};

type Mode = "create" | "edit";
type QuickTab = "identidad" | "contacto" | "emergencia" | "salud" | "archivos";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  pelotones: PelotonResumen[];
  initial?: AspiranteQuickInitial | null;
};

const TABS: { id: QuickTab; label: string; icon: typeof UserRound }[] = [
  { id: "identidad", label: "Identidad", icon: UserRound },
  { id: "contacto", label: "Contacto", icon: Phone },
  { id: "emergencia", label: "Emergencia", icon: LifeBuoy },
  { id: "salud", label: "Médicos", icon: HeartPulse },
  { id: "archivos", label: "Archivos", icon: Images },
];

const selectClass =
  "flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function fechaInputFromIso(iso: string | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!hasRealBirthDate(d)) return "";
  return iso.slice(0, 10);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-700">{message}</p>;
}

function tabForError(errors: Record<string, string>): QuickTab | null {
  const keys = Object.keys(errors).filter((k) => k !== "_form");
  const fotoKeys = Object.values(ASPIRANTE_FOTO_FORM).map((item) => item.file);
  if (keys.some((k) => fotoKeys.includes(k))) return "archivos";
  if (keys.some((k) => k.startsWith("contacto"))) return "emergencia";
  if (
    keys.some((k) =>
      [
        "estaturaCm",
        "pesoKg",
        "tensionArterial",
        "tipoSangre",
        "tallaGorra",
        "tallaCamisa",
        "tallaPantalon",
        "tallaCalzado",
        "alergias",
        "condicionesMedicas",
        "discapacidad",
        "observaciones",
      ].includes(k),
    )
  ) {
    return "salud";
  }
  if (keys.some((k) => ["telefono", "correo", "direccion"].includes(k))) return "contacto";
  if (keys.length) return "identidad";
  return null;
}

function AspiranteQuickForm({
  mode,
  pelotones,
  initial,
  onClose,
}: {
  mode: Mode;
  pelotones: PelotonResumen[];
  initial?: AspiranteQuickInitial | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const action = isEdit ? updateAspiranteQuick : createAspirante;
  const [state, formAction, pending] = useActionState(action, aspiranteInitialActionState);
  const [celebrateOpen, setCelebrateOpen] = useState(false);
  const [tab, setTab] = useState<QuickTab>("identidad");

  useEffect(() => {
    if (state.ok) setCelebrateOpen(true);
  }, [state.ok]);

  useEffect(() => {
    if (state.ok) return;
    const next = tabForError(state.errors);
    if (next) setTab(next);
  }, [state.errors, state.ok]);

  const fichaHref = initial?.id
    ? `${routes.personal.aspirantesGestion}?edit=${encodeURIComponent(initial.id)}`
    : routes.personal.aspirantesGestion;

  return (
    <>
      <SuccessCelebrationDialog
        open={celebrateOpen}
        onOpenChange={(open) => {
          setCelebrateOpen(open);
          if (!open) {
            onClose();
            router.refresh();
          }
        }}
        variant={isEdit ? "saved" : "created"}
        title={isEdit ? "Datos actualizados" : "Aspirante registrado"}
        description={
          isEdit
            ? "Identidad, contacto, salud y archivos quedaron guardados. Estudios y evaluaciones no se tocaron."
            : "Ya figura en el censo. Puede completar estudios y evaluaciones después."
        }
      />
      <form
        action={formAction}
        className="flex flex-col"
        onInvalidCapture={(e) => {
          const name = (e.target as HTMLInputElement).name;
          if (name === "nombres" || name === "apellidos" || name === "cedula") {
            setTab("identidad");
          }
        }}
      >
        {isEdit && initial ? <input type="hidden" name="aspiranteId" value={initial.id} /> : null}

        <div className="shrink-0 px-4 pt-0 pb-2">
          <div className="grid grid-cols-5 gap-0.5 rounded-md border border-slate-200 bg-slate-100/80 p-0.5">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors",
                    active
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
                  )}
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-h-[min(58dvh,34rem)] overflow-y-auto px-4 pb-3">
          {state.errors._form ? (
            <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {state.errors._form}
            </p>
          ) : null}

          <fieldset hidden={tab !== "identidad"} className="border-0 p-0">
            <legend className="sr-only">Identidad</legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-nombres">
                  Nombres <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="quick-nombres"
                  name="nombres"
                  required
                  defaultValue={initial?.nombres ?? ""}
                  className="h-8"
                />
                <FieldError message={state.errors.nombres} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-apellidos">
                  Apellidos <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="quick-apellidos"
                  name="apellidos"
                  required
                  defaultValue={initial?.apellidos ?? ""}
                  className="h-8"
                />
                <FieldError message={state.errors.apellidos} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-cedula">
                  Cédula <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="quick-cedula"
                  name="cedula"
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  defaultValue={initial?.cedula ?? ""}
                  placeholder="Solo dígitos, 6 a 12"
                  className="h-8"
                />
                <FieldError message={state.errors.cedula} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-sexo">Sexo</Label>
                <select
                  id="quick-sexo"
                  name="sexo"
                  defaultValue={initial?.sexo ?? "MASCULINO"}
                  className={selectClass}
                >
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-nacimiento">Fecha de nacimiento</Label>
                <Input
                  id="quick-nacimiento"
                  name="fechaNacimiento"
                  type="date"
                  defaultValue={fechaInputFromIso(initial?.fechaNacimientoIso)}
                  className="h-8"
                />
                <FieldError message={state.errors.fechaNacimiento} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-lugar">Lugar de nacimiento</Label>
                <Input
                  id="quick-lugar"
                  name="lugarNacimiento"
                  defaultValue={initial?.lugarNacimiento ?? ""}
                  className="h-8"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-peloton">Pelotón</Label>
                <select
                  id="quick-peloton"
                  name="pelotonId"
                  defaultValue={initial?.pelotonId ?? ""}
                  className={selectClass}
                >
                  <option value="">Sin asignar</option>
                  {pelotones.map((p) => (
                    <option key={p.id} value={p.id}>
                      {labelPeloton(p)}
                    </option>
                  ))}
                </select>
                <FieldError message={state.errors.pelotonId} />
              </div>
            </div>
          </fieldset>

          <fieldset hidden={tab !== "contacto"} className="border-0 p-0">
            <legend className="sr-only">Contacto del aspirante</legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-telefono">Teléfono</Label>
                <Input
                  id="quick-telefono"
                  name="telefono"
                  defaultValue={initial?.telefono ?? ""}
                  className="h-8"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-correo">Correo</Label>
                <Input
                  id="quick-correo"
                  name="correo"
                  type="email"
                  defaultValue={initial?.correo ?? ""}
                  className="h-8"
                />
                <FieldError message={state.errors.correo} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="quick-direccion">Dirección</Label>
                <Input
                  id="quick-direccion"
                  name="direccion"
                  defaultValue={initial?.direccion ?? ""}
                  className="h-8"
                />
              </div>
            </div>
          </fieldset>

          <fieldset hidden={tab !== "emergencia"} className="border-0 p-0">
            <legend className="sr-only">Contacto de emergencia</legend>
            <p className="mb-2.5 text-[11px] text-slate-500">
              Persona a avisar si ocurre un incidente. Opcional en el registro rápido.
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-contacto-nombre">Nombre</Label>
                <Input
                  id="quick-contacto-nombre"
                  name="contactoNombre"
                  defaultValue={initial?.contactoNombre ?? ""}
                  className="h-8"
                />
                <FieldError message={state.errors.contactoNombre} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-contacto-parentesco">Parentesco</Label>
                <Input
                  id="quick-contacto-parentesco"
                  name="contactoParentesco"
                  defaultValue={initial?.contactoParentesco ?? ""}
                  className="h-8"
                />
                <FieldError message={state.errors.contactoParentesco} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-contacto-telefono">Teléfono</Label>
                <Input
                  id="quick-contacto-telefono"
                  name="contactoTelefono"
                  defaultValue={initial?.contactoTelefono ?? ""}
                  className="h-8"
                />
                <FieldError message={state.errors.contactoTelefono} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-contacto-direccion">Dirección</Label>
                <Input
                  id="quick-contacto-direccion"
                  name="contactoDireccion"
                  defaultValue={initial?.contactoDireccion ?? ""}
                  className="h-8"
                />
                <FieldError message={state.errors.contactoDireccion} />
              </div>
            </div>
          </fieldset>

          <fieldset hidden={tab !== "salud"} className="border-0 p-0">
            <legend className="sr-only">Datos médicos</legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-estatura">Estatura (cm)</Label>
                <Input
                  id="quick-estatura"
                  name="estaturaCm"
                  type="number"
                  step="0.01"
                  defaultValue={initial?.estaturaCm != null ? String(initial.estaturaCm) : ""}
                  className="h-8"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-peso">Peso (kg)</Label>
                <Input
                  id="quick-peso"
                  name="pesoKg"
                  type="number"
                  step="0.01"
                  defaultValue={initial?.pesoKg != null ? String(initial.pesoKg) : ""}
                  className="h-8"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-tension">Tensión arterial</Label>
                <Input
                  id="quick-tension"
                  name="tensionArterial"
                  placeholder="120/80"
                  defaultValue={initial?.tensionArterial ?? ""}
                  className="h-8"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-sangre">Tipo de sangre</Label>
                <Input id="quick-sangre" name="tipoSangre" defaultValue={initial?.tipoSangre ?? ""} className="h-8" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-gorra">Talla gorra</Label>
                <Input id="quick-gorra" name="tallaGorra" defaultValue={initial?.tallaGorra ?? ""} className="h-8" placeholder="S, M, L…" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-camisa">Talla camisa</Label>
                <Input id="quick-camisa" name="tallaCamisa" defaultValue={initial?.tallaCamisa ?? ""} className="h-8" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-pantalon">Talla pantalón</Label>
                <Input id="quick-pantalon" name="tallaPantalon" defaultValue={initial?.tallaPantalon ?? ""} className="h-8" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-calzado">Talla calzado</Label>
                <Input id="quick-calzado" name="tallaCalzado" defaultValue={initial?.tallaCalzado ?? ""} className="h-8" placeholder="42" />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="quick-alergias">Alergias</Label>
                <Input id="quick-alergias" name="alergias" defaultValue={initial?.alergias ?? ""} className="h-8" />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="quick-discapacidad">Discapacidad</Label>
                <Input
                  id="quick-discapacidad"
                  name="discapacidad"
                  defaultValue={initial?.discapacidad ?? ""}
                  className="h-8"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="quick-condiciones">Condiciones médicas</Label>
                <Textarea
                  id="quick-condiciones"
                  name="condicionesMedicas"
                  defaultValue={initial?.condicionesMedicas ?? ""}
                  className="min-h-16"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="quick-observaciones">Observaciones</Label>
                <Textarea
                  id="quick-observaciones"
                  name="observaciones"
                  defaultValue={initial?.observaciones ?? ""}
                  className="min-h-16"
                />
              </div>
            </div>
          </fieldset>

          <fieldset hidden={tab !== "archivos"} className="border-0 p-0">
            <legend className="sr-only">Archivos</legend>
            <p className="mb-2.5 text-[11px] text-slate-500">
              Foto de carnet, foto de esquela y documentos. Pulse para ver, arrastre para subir, o quite lo que no corresponda.
              Se guardan al registrar.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <AspiranteFotoField
                id="quick-foto-perfil"
                aspiranteId={initial?.id}
                fotoKey={initial?.fotoKey}
                nombre={`${initial?.nombres ?? ""} ${initial?.apellidos ?? ""}`.trim() || "aspirante"}
                kind="perfil"
                layout="compact"
                serverError={state.errors[ASPIRANTE_FOTO_FORM.perfil.file]}
              />
              <AspiranteFotoField
                id="quick-foto-esquela"
                aspiranteId={initial?.id}
                fotoKey={initial?.fotoEsquelaKey}
                nombre={`${initial?.nombres ?? ""} ${initial?.apellidos ?? ""}`.trim() || "aspirante"}
                kind="esquela"
                layout="compact"
                serverError={state.errors[ASPIRANTE_FOTO_FORM.esquela.file]}
              />
              <AspiranteFotoField
                id="quick-foto-cedula"
                aspiranteId={initial?.id}
                fotoKey={initial?.fotoCedulaKey}
                nombre="cédula"
                kind="cedula"
                layout="compact"
                serverError={state.errors[ASPIRANTE_FOTO_FORM.cedula.file]}
              />
              <AspiranteFotoField
                id="quick-foto-titulo"
                aspiranteId={initial?.id}
                fotoKey={initial?.fotoTituloKey}
                nombre="título"
                kind="titulo"
                layout="compact"
                serverError={state.errors[ASPIRANTE_FOTO_FORM.titulo.file]}
              />
              <AspiranteFotoField
                id="quick-foto-titulo-auth"
                aspiranteId={initial?.id}
                fotoKey={initial?.fotoTituloAutenticacionKey}
                nombre="autenticación del título"
                kind="tituloAuth"
                layout="compact"
                serverError={state.errors[ASPIRANTE_FOTO_FORM.tituloAuth.file]}
              />
              <AspiranteFotoField
                id="quick-foto-notas"
                aspiranteId={initial?.id}
                fotoKey={initial?.fotoNotasKey}
                nombre="notas certificadas"
                kind="notas"
                layout="compact"
                serverError={state.errors[ASPIRANTE_FOTO_FORM.notas.file]}
              />
            </div>
          </fieldset>
        </div>

        <DialogFooter className="gap-2 px-4 py-2.5 sm:justify-between">
          <Link
            href={fichaHref}
            prefetch={false}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 justify-start text-slate-600")}
          >
            {isEdit ? "Abrir ficha completa" : "Registro completo"}
          </Link>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="h-8" disabled={pending} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="h-8 gap-2 bg-slate-900 hover:bg-slate-800" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {pending ? "Guardando…" : isEdit ? "Guardar" : "Registrar"}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </>
  );
}

export function AspiranteQuickDialog({ open, onOpenChange, mode, pelotones, initial }: DialogProps) {
  const isEdit = mode === "edit";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(90dvh,760px)] w-[calc(100vw-1.5rem)] max-w-2xl gap-0 overflow-hidden sm:max-w-2xl"
        key={isEdit ? initial?.id ?? "edit" : "create"}
      >
        <DialogHeader className="px-4 py-3">
          <DialogTitle>{isEdit ? "Edición rápida" : "Registro rápido"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Nombres, apellidos y cédula son obligatorios; el resto es opcional."
              : "Nombres, apellidos y cédula bastan. Puede añadir contacto de emergencia, médicos y archivos."}
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <AspiranteQuickForm
            key={isEdit ? initial?.id ?? "edit" : "create"}
            mode={mode}
            pelotones={pelotones}
            initial={initial}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function AspiranteQuickRegisterButton({
  pelotones,
  children,
}: {
  pelotones: PelotonResumen[];
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        size="sm"
        className="h-9 gap-2 bg-slate-900 px-3 shadow-sm hover:bg-slate-800"
        onClick={() => setOpen(true)}
      >
        {children ?? (
          <>
            <UserPlus className="h-4 w-4" aria-hidden />
            Registro
          </>
        )}
      </Button>
      <AspiranteQuickDialog open={open} onOpenChange={setOpen} mode="create" pelotones={pelotones} />
    </>
  );
}
