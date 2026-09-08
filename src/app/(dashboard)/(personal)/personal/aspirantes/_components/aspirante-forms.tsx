"use client";

import { createAspirante, updateAspirante } from "@src/app/actions/aspirantes";
import { AspiranteFichaEvaluacionFields } from "@dashboard/aspirantes/_components/aspirante-ficha-evaluacion-fields";
import { AspiranteFotoField } from "@dashboard/aspirantes/_components/aspirante-foto";
import { Button } from "@src/components/ui/button";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import { SuccessCelebrationDialog } from "@src/components/ui/success-celebration-dialog";
import { Textarea } from "@src/components/ui/textarea";
import type { AspiranteActionState } from "@src/lib/action-types";
import { aspiranteInitialActionState } from "@src/lib/action-types";
import { ESTADO_CIVIL_LABELS, ESTADO_CIVIL_VALUES, isEstadoCivilValue } from "@src/lib/aspirantes/estado-civil";
import type { TipoEstudioValue } from "@src/lib/aspirantes/tipo-estudio";
import {
  normalizeTipoEstudio,
  TIPO_ESTUDIO_LABELS,
  TIPO_ESTUDIO_VALUES,
} from "@src/lib/aspirantes/tipo-estudio";
import { cn } from "@src/lib/utils";
import type { PelotonResumen } from "@src/lib/pelotones";
import { labelPeloton } from "@src/lib/pelotones";
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

function formStr(fd: FormData, name: string) {
  const v = fd.get(name);
  return typeof v === "string" ? v.trim() : "";
}

function formNumOrNull(fd: FormData, name: string) {
  const s = formStr(fd, name);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * React 19 reinicia inputs no controlados tras un action exitoso, volviendo al
 * defaultValue del primer montaje. Capturamos el seed enviado para remontar el
 * formulario de edición con lo que sí se guardó (p. ej. grado educativo).
 */
function seedFromForm(
  form: HTMLFormElement,
  prev: AspiranteRegistroInitial,
): AspiranteRegistroInitial {
  const fd = new FormData(form);
  const estadoCivilRaw = formStr(fd, "estadoCivil");
  const calificacionRaw = formStr(fd, "calificacionAdmision");
  const sexoRaw = formStr(fd, "sexo");
  const hijos = formNumOrNull(fd, "hijosCantidad");

  return {
    ...prev,
    unidadPostulante: formStr(fd, "unidadPostulante"),
    calificacionAdmision:
      calificacionRaw === "APTO" ||
      calificacionRaw === "NO_APTO" ||
      calificacionRaw === "EN_EVALUACION"
        ? calificacionRaw
        : prev.calificacionAdmision,
    nombres: formStr(fd, "nombres") || prev.nombres,
    apellidos: formStr(fd, "apellidos"),
    cedula: formStr(fd, "cedula") || prev.cedula,
    sexo: sexoRaw === "FEMENINO" ? "FEMENINO" : "MASCULINO",
    fechaNacimiento: formStr(fd, "fechaNacimiento"),
    lugarNacimiento: formStr(fd, "lugarNacimiento"),
    direccion: formStr(fd, "direccion") || null,
    telefono: formStr(fd, "telefono") || null,
    correo: formStr(fd, "correo") || null,
    hijosCantidad: hijos != null ? hijos : 0,
    estadoCivil: isEstadoCivilValue(estadoCivilRaw) ? estadoCivilRaw : null,
    pelotonId: formStr(fd, "pelotonId") || null,
    estaturaCm: formNumOrNull(fd, "estaturaCm"),
    pesoKg: formNumOrNull(fd, "pesoKg"),
    tensionArterial: formStr(fd, "tensionArterial") || null,
    tipoSangre: formStr(fd, "tipoSangre") || null,
    alergias: formStr(fd, "alergias") || null,
    condicionesMedicas: formStr(fd, "condicionesMedicas") || null,
    discapacidad: formStr(fd, "discapacidad") || null,
    observaciones: formStr(fd, "observaciones") || null,
    contactoNombre: formStr(fd, "contactoNombre"),
    contactoParentesco: formStr(fd, "contactoParentesco"),
    contactoTelefono: formStr(fd, "contactoTelefono"),
    contactoDireccion: formStr(fd, "contactoDireccion") || null,
    tipoEstudio: normalizeTipoEstudio(formStr(fd, "tipoEstudio")),
    nombreUniversidad: formStr(fd, "nombreUniversidad") || null,
    tituloUniversidad: formStr(fd, "tituloUniversidad") || null,
    paisUniversidad: formStr(fd, "paisUniversidad") || null,
    nucleoUniversidad: formStr(fd, "nucleoUniversidad") || null,
    anioIngresoUniversidad: formNumOrNull(fd, "anioIngresoUniversidad"),
    anioEgresoUniversidad: formNumOrNull(fd, "anioEgresoUniversidad"),
  };
}

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
  sexo: "MASCULINO" | "FEMENINO";
  fechaNacimiento: string;
  lugarNacimiento: string;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  hijosCantidad: number;
  estadoCivil?: "SOLTERO" | "CASADO" | "DIVORCIADO" | "VIUDO" | "UNION_ESTABLE" | null;
  pelotonId?: string | null;
  estaturaCm: number | null;
  pesoKg: number | null;
  tensionArterial: string | null;
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
  fotoKey?: string | null;
  fotoCedulaKey?: string | null;
  fotoTituloKey?: string | null;
  tipoEstudio?: TipoEstudioValue | null;
  nombreUniversidad?: string | null;
  tituloUniversidad?: string | null;
  paisUniversidad?: string | null;
  nucleoUniversidad?: string | null;
  anioIngresoUniversidad?: number | null;
  anioEgresoUniversidad?: number | null;
};

const STEPS = [
  {
    title: "Identidad",
    description: "Nombres y cédula bastan para el alta; el resto es opcional",
  },
  { title: "Contacto", description: "Ubicación y comunicación" },
  { title: "Estudios", description: "Universidad, título, país y núcleo" },
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
  pelotones = [],
  initial,
}: {
  canWrite: boolean;
  convocatoriaActiva: ConvocatoriaResumen | null;
  pelotones?: PelotonResumen[];
  initial?: AspiranteRegistroInitial | null;
}) {
  const isEdit = Boolean(initial?.id);
  const [step, setStep] = useState(0);
  const router = useRouter();
  /** Seed de defaultValue; se actualiza tras guardar para sobrevivir el reset de React 19. */
  const [seed, setSeed] = useState<AspiranteRegistroInitial | null | undefined>(initial);
  const [formKey, setFormKey] = useState(0);
  const pendingSeedRef = useRef<AspiranteRegistroInitial | null>(null);

  useEffect(() => {
    setSeed(initial);
  }, [initial]);

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
        if (isEdit && pendingSeedRef.current) {
          setSeed(pendingSeedRef.current);
          setFormKey((k) => k + 1);
        }
        pendingSeedRef.current = null;
        setCelebrateOpen(true);
      } else {
        pendingSeedRef.current = null;
      }
    }
    prevIsPendingRef.current = isPending;
  }, [isPending, state.ok, isEdit]);

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
      unidadPostulante: seed?.unidadPostulante ?? "",
      calificacionAdmision: seed?.calificacionAdmision ?? "EN_EVALUACION",
      nombres: seed?.nombres ?? "",
      apellidos: seed?.apellidos ?? "",
      cedula: seed?.cedula ?? "",
      sexo: seed?.sexo ?? "MASCULINO",
      fechaNacimiento: seed?.fechaNacimiento ?? "",
      lugarNacimiento: seed?.lugarNacimiento ?? "",
      hijosCantidad: seed != null ? String(seed.hijosCantidad) : "0",
      estadoCivil: seed?.estadoCivil ?? "",
      pelotonId: seed?.pelotonId ?? "",
      telefono: seed?.telefono ?? "",
      correo: seed?.correo ?? "",
      direccion: seed?.direccion ?? "",
      estaturaCm: seed?.estaturaCm != null ? String(seed.estaturaCm) : "",
      pesoKg: seed?.pesoKg != null ? String(seed.pesoKg) : "",
      tensionArterial: seed?.tensionArterial ?? "",
      tipoSangre: seed?.tipoSangre ?? "",
      alergias: seed?.alergias ?? "",
      condicionesMedicas: seed?.condicionesMedicas ?? "",
      discapacidad: seed?.discapacidad ?? "",
      observaciones: seed?.observaciones ?? "",
      contactoNombre: seed?.contactoNombre ?? "",
      contactoParentesco: seed?.contactoParentesco ?? "",
      contactoTelefono: seed?.contactoTelefono ?? "",
      contactoDireccion: seed?.contactoDireccion ?? "",
      tipoEstudio: seed?.tipoEstudio ?? "",
      nombreUniversidad: seed?.nombreUniversidad ?? "",
      tituloUniversidad: seed?.tituloUniversidad ?? "",
      paisUniversidad: seed?.paisUniversidad ?? "",
      nucleoUniversidad: seed?.nucleoUniversidad ?? "",
      anioIngresoUniversidad:
        seed?.anioIngresoUniversidad != null ? String(seed.anioIngresoUniversidad) : "",
      anioEgresoUniversidad:
        seed?.anioEgresoUniversidad != null ? String(seed.anioEgresoUniversidad) : "",
    }),
    [seed],
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
            : "El nuevo registro se incorporó al censo. Puede completar el resto de datos después."
        }
      />
      <form
        key={formKey}
        ref={formRef}
        action={formAction}
        encType="multipart/form-data"
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
            pendingSeedRef.current = null;
            for (let i = 0; i < STEPS.length; i++) {
              const fs = form.querySelector(
                `fieldset[data-registro-step="${i}"]`,
              ) as HTMLFieldSetElement | null;
              if (fs) fs.hidden = firstInvalid !== i;
            }
          } else {
            // Dejar todos los pasos visibles en el DOM durante el envío (FormData).
            // React volverá a aplicar hidden={step !== i} en el siguiente render.
            if (isEdit && seed?.id) {
              pendingSeedRef.current = seedFromForm(form, seed);
            } else {
              pendingSeedRef.current = null;
            }
            registroSubmitIntentRef.current = "finalize";
            setFinalizeUiPending(true);
          }
        }}
      >
        {seed?.id ? (
          <input type="hidden" name="aspiranteId" value={seed.id} />
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
            <AspiranteFotoField
              id="aspirante-foto"
              aspiranteId={seed?.id}
              fotoKey={seed?.fotoKey ?? initial?.fotoKey}
              nombre={`${defaults.nombres} ${defaults.apellidos}`.trim() || "aspirante"}
              kind="perfil"
            />
            <AspiranteFotoField
              id="aspirante-foto-cedula"
              aspiranteId={seed?.id}
              fotoKey={seed?.fotoCedulaKey ?? initial?.fotoCedulaKey}
              nombre="cédula"
              kind="cedula"
            />
            <AspiranteFotoField
              id="aspirante-foto-titulo"
              aspiranteId={seed?.id}
              fotoKey={seed?.fotoTituloKey ?? initial?.fotoTituloKey}
              nombre="título"
              kind="titulo"
            />
            <div>
              <Label>
                Nombres <span className="text-red-600">*</span>
              </Label>
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
                defaultValue={defaults.apellidos}
                autoComplete="family-name"
              />
            </div>
            <div>
              <Label>
                Cédula <span className="text-red-600">*</span>
              </Label>
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
                defaultValue={defaults.fechaNacimiento}
              />
            </div>
            <div>
              <Label>Lugar de Nacimiento</Label>
              <Input
                name="lugarNacimiento"
                defaultValue={defaults.lugarNacimiento}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Unidad postulante</Label>
              <Input
                name="unidadPostulante"
                defaultValue={defaults.unidadPostulante}
                placeholder="Ej.: 12 BRIGADA, COMANDO AV, CGEB..."
                autoComplete="organization"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Pelotón del curso</Label>
              {pelotones.length > 0 ? (
                <>
                  <select
                    name="pelotonId"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
                    defaultValue={defaults.pelotonId}
                  >
                    <option value="">Sin asignar</option>
                    {pelotones.map((p) => (
                      <option key={p.id} value={p.id}>
                        {labelPeloton(p)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Elija a cuál pelotón del curso pertenece este aspirante.
                  </p>
                </>
              ) : (
                <>
                  <input type="hidden" name="pelotonId" value="" />
                  <select
                    disabled
                    className="flex h-9 w-full rounded-md border border-input bg-slate-50 px-3 py-1 text-sm text-slate-500 shadow-xs outline-none"
                    defaultValue=""
                  >
                    <option value="">Sin pelotones en la convocatoria activa</option>
                  </select>
                  <p className="mt-1 text-xs text-amber-700">
                    Defina la cantidad de pelotones en Convocatorias (editar el período activo) para poder asignarlos
                    aquí.
                  </p>
                </>
              )}
            </div>
            <div className="md:col-span-2">
              <Label>Calificación de admisión</Label>
              <select
                name="calificacionAdmision"
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
              <Label>Hijos</Label>
              <Input
                name="hijosCantidad"
                type="number"
                defaultValue={defaults.hijosCantidad}
              />
            </div>
            <div>
              <Label htmlFor="estadoCivil">Estado civil</Label>
              <select
                id="estadoCivil"
                name="estadoCivil"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
                defaultValue={defaults.estadoCivil}
              >
                <option value="">Sin indicar</option>
                {ESTADO_CIVIL_VALUES.map((v) => (
                  <option key={v} value={v}>
                    {ESTADO_CIVIL_LABELS[v]}
                  </option>
                ))}
              </select>
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
            <div className="md:col-span-2">
              <Label>Grado educativo</Label>
              <select
                name="tipoEstudio"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
                defaultValue={defaults.tipoEstudio ?? ""}
              >
                <option value="">Sin indicar</option>
                {TIPO_ESTUDIO_VALUES.map((v) => (
                  <option key={v} value={v}>
                    {TIPO_ESTUDIO_LABELS[v]}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label>Universidad</Label>
              <Input
                name="nombreUniversidad"
                defaultValue={defaults.nombreUniversidad}
                placeholder="Universidad, instituto o centro de estudios"
              />
            </div>
            <div>
              <Label>Título</Label>
              <Input
                name="tituloUniversidad"
                defaultValue={defaults.tituloUniversidad}
                placeholder="Ej.: Abogada, Ingeniero"
              />
            </div>
            <div>
              <Label>País</Label>
              <Input
                name="paisUniversidad"
                defaultValue={defaults.paisUniversidad}
                placeholder="Ej.: Venezuela"
              />
            </div>
            <div>
              <Label>Año de ingreso</Label>
              <Input
                name="anioIngresoUniversidad"
                type="number"
                inputMode="numeric"
                min={1950}
                max={2100}
                placeholder="Ej.: 2018"
                defaultValue={defaults.anioIngresoUniversidad}
              />
            </div>
            <div>
              <Label>Año de egreso</Label>
              <Input
                name="anioEgresoUniversidad"
                type="number"
                inputMode="numeric"
                min={1950}
                max={2100}
                placeholder="Ej.: 2023"
                defaultValue={defaults.anioEgresoUniversidad}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Núcleo</Label>
              <Input
                name="nucleoUniversidad"
                defaultValue={defaults.nucleoUniversidad}
                placeholder="Ej.: Dtto. Capital"
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
              <Label>Tensión arterial</Label>
              <Input
                name="tensionArterial"
                defaultValue={defaults.tensionArterial}
                placeholder="Ej.: 120/80"
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
          data-registro-step={4}
          hidden={step !== 4}
          className="min-w-0 space-y-3 border-0 p-0"
          aria-labelledby="step-5-title"
        >
          <p id="step-5-title" className="sr-only">
            Paso 5: {STEPS[4].title}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Contacto de Emergencia</Label>
              <Input
                name="contactoNombre"
                defaultValue={defaults.contactoNombre}
              />
            </div>
            <div>
              <Label>Parentesco</Label>
              <Input
                name="contactoParentesco"
                defaultValue={defaults.contactoParentesco}
              />
            </div>
            <div>
              <Label>Teléfono de Emergencia</Label>
              <Input
                name="contactoTelefono"
                type="tel"
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
          data-registro-step={5}
          hidden={step !== 5}
          className="min-w-0 space-y-3 border-0 p-0"
          aria-labelledby="step-6-title"
        >
          <p id="step-6-title" className="sr-only">
            Paso 6: {STEPS[5].title}
          </p>
          <p className="text-xs text-slate-600">
            Los requisitos y tablas provienen de un catálogo en sistema: al
            actualizar listados, los formularios nuevos reflejan los cambios sin
            migraciones de columnas.
          </p>
          <AspiranteFichaEvaluacionFields
            initialJson={seed?.fichaEvaluacion ?? initial?.fichaEvaluacion ?? null}
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
                variant="outline"
                className="border-slate-200"
                onClick={goNext}
              >
                Siguiente
              </Button>
            ) : null}
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
          </div>
        </div>
      </form>
    </>
  );
}
