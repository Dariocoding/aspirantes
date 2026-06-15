"use client";

import { createAspirante, updateAspirante } from "@src/app/actions/aspirantes";
import { AspiranteFichaEvaluacionFields } from "@dashboard/aspirantes/_components/aspirante-ficha-evaluacion-fields";
import { Button } from "@src/components/ui/button";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import { SuccessCelebrationDialog } from "@src/components/ui/success-celebration-dialog";
import { Textarea } from "@src/components/ui/textarea";
import type { AspiranteActionState } from "@src/lib/action-types";
import { aspiranteInitialActionState } from "@src/lib/action-types";
import { cn } from "@src/lib/utils";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type RegistroSubmitIntent = "finalize" | null;

function ErrorList({ errors }: { errors: Record<string, string> }) {
  const formMsg = errors._form;
  const entries = Object.entries(errors).filter(([k]) => k !== "_form");
  return (
    <>
      {formMsg ? (
        <p className="md:col-span-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {formMsg}
        </p>
      ) : null}
      {entries.length ? (
        <ul className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 md:col-span-2">
          {entries.map(([k, v]) => (
            <li key={k}>
              <span className="font-medium">{k}:</span> {v}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

type ConvocatoriaResumen = { codigo: string; nombre: string };

/** Datos serializables desde el servidor para modo edición */
export type AspiranteRegistroInitial = {
  id: string;
  unidadPostulante: string;
  calificacionAdmision: "APTO" | "NO_APTO" | "EN_EVALUACION";
  nombres: string;
  apellidos: string;
  cedula: string;
  edad: number;
  sexo: "MASCULINO" | "FEMENINO";
  fechaNacimiento: string;
  lugarNacimiento: string;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  hijosCantidad: number;
  estaturaCm: number | null;
  pesoKg: number | null;
  tipoSangre: string | null;
  alergias: string | null;
  condicionesMedicas: string | null;
  discapacidad: string | null;
  observaciones: string | null;
  contactoNombre: string;
  contactoParentesco: string;
  contactoTelefono: string;
  contactoDireccion: string | null;
  /** JSON almacenado en BD (`fichaEvaluacion`); el cliente lo parsea con el catálogo actual. */
  fichaEvaluacion?: unknown | null;
};

const STEPS = [
  {
    title: "Identidad",
    description: "Nombre, unidad postulante, admisión y nacimiento",
  },
  { title: "Contacto", description: "Ubicación y comunicación" },
  { title: "Salud y físico", description: "Medidas y antecedentes" },
  { title: "Emergencia", description: "Persona de contacto" },
  {
    title: "Expediente y evaluaciones",
    description: "Revisión, prueba física y examen médico",
  },
] as const;

export function AspiranteRegistroForm({
  canWrite: write,
  convocatoriaActiva,
  initial,
}: {
  canWrite: boolean;
  convocatoriaActiva: ConvocatoriaResumen | null;
  initial?: AspiranteRegistroInitial | null;
}) {
  const isEdit = Boolean(initial?.id);
  const [step, setStep] = useState(0);
  const router = useRouter();

  const serverAction = useMemo(
    () => (isEdit ? updateAspirante : createAspirante),
    [isEdit],
  );
  const [state, formAction, isPending] = useActionState<
    AspiranteActionState,
    FormData
  >(serverAction, aspiranteInitialActionState);
  const [celebrateOpen, setCelebrateOpen] = useState(false);
  /** Solo true tras pulsar guardar final: no usar `isPending` solo para la UI (puede no corresponder a este envío). */
  const [finalizeUiPending, setFinalizeUiPending] = useState(false);
  const registroSubmitIntentRef = useRef<RegistroSubmitIntent>(null);
  const prevIsPendingRef = useRef(false);

  useEffect(() => {
    if (prevIsPendingRef.current && !isPending) {
      const intent = registroSubmitIntentRef.current;
      registroSubmitIntentRef.current = null;
      setFinalizeUiPending(false);
      if (state.ok && intent === "finalize") {
        setCelebrateOpen(true);
      }
    }
    prevIsPendingRef.current = isPending;
  }, [isPending, state.ok]);

  const onCelebrateOpenChange = useCallback(
    (open: boolean) => {
      setCelebrateOpen(open);
      if (!open) {
        router.refresh();
      }
    },
    [router, setCelebrateOpen],
  );
  const formRef = useRef<HTMLFormElement>(null);

  const defaults = useMemo(
    () => ({
      unidadPostulante: initial?.unidadPostulante ?? "",
      calificacionAdmision: initial?.calificacionAdmision ?? "EN_EVALUACION",
      nombres: initial?.nombres ?? "",
      apellidos: initial?.apellidos ?? "",
      cedula: initial?.cedula ?? "",
      edad: initial != null ? String(initial.edad) : "",
      sexo: initial?.sexo ?? "MASCULINO",
      fechaNacimiento: initial?.fechaNacimiento ?? "",
      lugarNacimiento: initial?.lugarNacimiento ?? "",
      hijosCantidad: initial != null ? String(initial.hijosCantidad) : "0",
      telefono: initial?.telefono ?? "",
      correo: initial?.correo ?? "",
      direccion: initial?.direccion ?? "",
      estaturaCm: initial?.estaturaCm != null ? String(initial.estaturaCm) : "",
      pesoKg: initial?.pesoKg != null ? String(initial.pesoKg) : "",
      tipoSangre: initial?.tipoSangre ?? "",
      alergias: initial?.alergias ?? "",
      condicionesMedicas: initial?.condicionesMedicas ?? "",
      discapacidad: initial?.discapacidad ?? "",
      observaciones: initial?.observaciones ?? "",
      contactoNombre: initial?.contactoNombre ?? "",
      contactoParentesco: initial?.contactoParentesco ?? "",
      contactoTelefono: initial?.contactoTelefono ?? "",
      contactoDireccion: initial?.contactoDireccion ?? "",
    }),
    [initial],
  );

  if (!write) {
    return (
      <p className="text-sm text-slate-600">
        Su rol es de solo consulta: no puede registrar ni editar aspirantes.
      </p>
    );
  }

  const lastStep = step === STEPS.length - 1;

  function validateStep(index: number) {
    const form = formRef.current;
    if (!form) return false;
    const fs = form.querySelector(
      `fieldset[data-registro-step="${index}"]`,
    ) as HTMLFieldSetElement | null;
    if (!fs) return false;
    fs.hidden = false;
    const ok = fs.checkValidity();
    if (!ok) {
      setStep(index);
      fs.reportValidity();
      return false;
    }
    fs.hidden = step !== index;
    return true;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function goPrev() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <>
      <SuccessCelebrationDialog
        open={celebrateOpen}
        onOpenChange={onCelebrateOpenChange}
        variant={isEdit ? "saved" : "created"}
        title={isEdit ? "Ficha actualizada" : "Aspirante registrado"}
        description={
          isEdit
            ? "Los datos del aspirante quedaron guardados correctamente."
            : "El nuevo registro se incorporó al censo de la convocatoria activa."
        }
      />
      <form
        ref={formRef}
        action={formAction}
        className="space-y-5"
        onSubmit={(e) => {
          const form = e.currentTarget;
          let firstInvalid: number | null = null;
          for (let i = 0; i < STEPS.length; i++) {
            const fs = form.querySelector(
              `fieldset[data-registro-step="${i}"]`,
            ) as HTMLFieldSetElement | null;
            if (!fs) continue;
            fs.hidden = false;
            if (!fs.checkValidity()) {
              e.preventDefault();
              firstInvalid = i;
              setStep(i);
              fs.reportValidity();
              break;
            }
          }
          if (firstInvalid !== null) {
            registroSubmitIntentRef.current = null;
            setFinalizeUiPending(false);
            for (let i = 0; i < STEPS.length; i++) {
              const fs = form.querySelector(
                `fieldset[data-registro-step="${i}"]`,
              ) as HTMLFieldSetElement | null;
              if (fs) fs.hidden = firstInvalid !== i;
            }
          } else {
            for (let i = 0; i < STEPS.length; i++) {
              const fs = form.querySelector(
                `fieldset[data-registro-step="${i}"]`,
              ) as HTMLFieldSetElement | null;
              if (fs) fs.hidden = step !== i;
            }
            registroSubmitIntentRef.current = "finalize";
            setFinalizeUiPending(true);
          }
        }}
      >
        {initial?.id ? (
          <input type="hidden" name="aspiranteId" value={initial.id} />
        ) : null}

        <nav
          aria-label="Pasos del formulario"
          className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
        >
          {STEPS.map((s, i) => {
            const stepperItem = (
              <>
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums",
                    step === i
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-700",
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{s.title}</span>
                  <span
                    className={cn(
                      "block truncate",
                      step === i ? "text-slate-200" : "text-slate-500",
                    )}
                  >
                    {s.description}
                  </span>
                </span>
              </>
            );
            const stepperClass = cn(
              "flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors sm:flex-initial sm:min-w-[140px]",
              step === i
                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-700",
              isEdit && step !== i
                ? "cursor-pointer hover:border-slate-300 hover:bg-slate-50"
                : "cursor-default",
            );

            if (isEdit) {
              return (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setStep(i)}
                  className={stepperClass}
                >
                  {stepperItem}
                </button>
              );
            }

            return (
              <div
                key={s.title}
                className={stepperClass}
                aria-current={step === i ? "step" : undefined}
                title="Use «Anterior» y «Siguiente» para moverse entre pasos en un registro nuevo."
              >
                {stepperItem}
              </div>
            );
          })}
        </nav>

        <div className="grid gap-3 md:grid-cols-2">
          <ErrorList errors={state.errors} />
          {convocatoriaActiva ? (
            <p className="md:col-span-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <span className="font-medium text-slate-900">
                Convocatoria activa:
              </span>{" "}
              {convocatoriaActiva.nombre}{" "}
              <span className="font-mono text-xs text-slate-500">
                ({convocatoriaActiva.codigo})
              </span>
            </p>
          ) : (
            <p className="md:col-span-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              No hay convocatoria activa. Un administrador debe definir y
              activar un período de ingreso en{" "}
              <span className="font-medium">Convocatorias</span> antes de
              registrar aspirantes.
            </p>
          )}
        </div>

        <fieldset
          data-registro-step={0}
          hidden={step !== 0}
          className="min-w-0 space-y-3 border-0 p-0"
          aria-labelledby="step-1-title"
        >
          <p id="step-1-title" className="sr-only">
            Paso 1: {STEPS[0].title}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Nombres</Label>
              <Input
                name="nombres"
                required
                defaultValue={defaults.nombres}
                autoComplete="given-name"
              />
            </div>
            <div>
              <Label>Apellidos</Label>
              <Input
                name="apellidos"
                required
                defaultValue={defaults.apellidos}
                autoComplete="family-name"
              />
            </div>
            <div>
              <Label>Cédula</Label>
              <Input
                name="cedula"
                required
                inputMode="numeric"
                defaultValue={defaults.cedula}
              />
            </div>
            <div>
              <Label>Sexo</Label>
              <select
                name="sexo"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
                defaultValue={defaults.sexo}
              >
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
              </select>
            </div>
            <div>
              <Label>Fecha de Nacimiento</Label>
              <Input
                name="fechaNacimiento"
                type="date"
                required
                defaultValue={defaults.fechaNacimiento}
              />
            </div>
            <div>
              <Label>Lugar de Nacimiento</Label>
              <Input
                name="lugarNacimiento"
                required
                defaultValue={defaults.lugarNacimiento}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Unidad postulante</Label>
              <Input
                name="unidadPostulante"
                required
                defaultValue={defaults.unidadPostulante}
                placeholder="Ej.: 12 BRIGADA, COMANDO AV, CGEB..."
                autoComplete="organization"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Calificación de admisión</Label>
              <select
                name="calificacionAdmision"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
                defaultValue={defaults.calificacionAdmision}
              >
                <option value="EN_EVALUACION">En evaluación</option>
                <option value="APTO">Apto</option>
                <option value="NO_APTO">No apto</option>
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset
          data-registro-step={1}
          hidden={step !== 1}
          className="min-w-0 space-y-3 border-0 p-0"
          aria-labelledby="step-2-title"
        >
          <p id="step-2-title" className="sr-only">
            Paso 2: {STEPS[1].title}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Edad</Label>
              <Input
                name="edad"
                type="number"
                required
                defaultValue={defaults.edad}
              />
            </div>
            <div>
              <Label>Hijos</Label>
              <Input
                name="hijosCantidad"
                type="number"
                defaultValue={defaults.hijosCantidad}
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                name="telefono"
                type="tel"
                defaultValue={defaults.telefono}
              />
            </div>
            <div>
              <Label>Correo</Label>
              <Input
                name="correo"
                type="email"
                defaultValue={defaults.correo}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Dirección</Label>
              <Textarea name="direccion" defaultValue={defaults.direccion} />
            </div>
          </div>
        </fieldset>

        <fieldset
          data-registro-step={2}
          hidden={step !== 2}
          className="min-w-0 space-y-3 border-0 p-0"
          aria-labelledby="step-3-title"
        >
          <p id="step-3-title" className="sr-only">
            Paso 3: {STEPS[2].title}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Estatura (cm)</Label>
              <Input
                name="estaturaCm"
                type="number"
                step="0.01"
                defaultValue={defaults.estaturaCm}
              />
            </div>
            <div>
              <Label>Peso (kg)</Label>
              <Input
                name="pesoKg"
                type="number"
                step="0.01"
                defaultValue={defaults.pesoKg}
              />
            </div>
            <div>
              <Label>Tipo de Sangre</Label>
              <Input name="tipoSangre" defaultValue={defaults.tipoSangre} />
            </div>
            <div>
              <Label>Alergias</Label>
              <Input name="alergias" defaultValue={defaults.alergias} />
            </div>
            <div className="md:col-span-2">
              <Label>Condiciones Médicas</Label>
              <Textarea
                name="condicionesMedicas"
                defaultValue={defaults.condicionesMedicas}
              />
            </div>
            <div>
              <Label>Discapacidad</Label>
              <Input name="discapacidad" defaultValue={defaults.discapacidad} />
            </div>
            <div className="md:col-span-2">
              <Label>Observaciones</Label>
              <Textarea
                name="observaciones"
                defaultValue={defaults.observaciones}
              />
            </div>
          </div>
        </fieldset>

        <fieldset
          data-registro-step={3}
          hidden={step !== 3}
          className="min-w-0 space-y-3 border-0 p-0"
          aria-labelledby="step-4-title"
        >
          <p id="step-4-title" className="sr-only">
            Paso 4: {STEPS[3].title}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Contacto de Emergencia</Label>
              <Input
                name="contactoNombre"
                required
                defaultValue={defaults.contactoNombre}
              />
            </div>
            <div>
              <Label>Parentesco</Label>
              <Input
                name="contactoParentesco"
                required
                defaultValue={defaults.contactoParentesco}
              />
            </div>
            <div>
              <Label>Teléfono de Emergencia</Label>
              <Input
                name="contactoTelefono"
                type="tel"
                required
                defaultValue={defaults.contactoTelefono}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Dirección de Emergencia</Label>
              <Textarea
                name="contactoDireccion"
                defaultValue={defaults.contactoDireccion}
              />
            </div>
          </div>
        </fieldset>

        <fieldset
          data-registro-step={4}
          hidden={step !== 4}
          className="min-w-0 space-y-3 border-0 p-0"
          aria-labelledby="step-5-title"
        >
          <p id="step-5-title" className="sr-only">
            Paso 5: {STEPS[4].title}
          </p>
          <p className="text-xs text-slate-600">
            Los requisitos y tablas provienen de un catálogo en sistema: al
            actualizar listados, los formularios nuevos reflejan los cambios sin
            migraciones de columnas.
          </p>
          <AspiranteFichaEvaluacionFields
            initialJson={initial?.fichaEvaluacion ?? null}
          />
        </fieldset>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200/90 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Paso{" "}
            <span className="font-semibold tabular-nums text-slate-800">
              {step + 1}
            </span>{" "}
            de {STEPS.length}
          </p>
          <div className="flex flex-wrap gap-2">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={goPrev}>
                Anterior
              </Button>
            ) : null}
            {!lastStep ? (
              <Button
                type="button"
                className="bg-slate-900 hover:bg-slate-800"
                onClick={goNext}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                type="submit"
                className="gap-2 bg-slate-900 hover:bg-slate-800"
                disabled={!convocatoriaActiva || finalizeUiPending}
              >
                {finalizeUiPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    {isEdit ? "Guardando..." : "Registrando..."}
                  </>
                ) : isEdit ? (
                  "Guardar cambios"
                ) : (
                  "Guardar aspirante"
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </>
  );
}
