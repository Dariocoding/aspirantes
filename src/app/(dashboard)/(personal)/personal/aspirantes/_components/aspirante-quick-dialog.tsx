"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { GraduationCap, HeartPulse, Images, LifeBuoy, Loader2, Phone, ScanFace, UserRound, UserPlus } from "lucide-react";
import { createAspirante, updateAspiranteQuick } from "@src/app/actions/aspirantes";
import { AspiranteFotoField } from "@dashboard/aspirantes/_components/aspirante-foto";
import { CatalogSelect, catalogOptions } from "@dashboard/aspirantes/_components/catalog-select";
import { RedSocialField } from "@dashboard/aspirantes/_components/red-social-field";
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
import {
  COLOR_CABELLO_LABELS,
  COLOR_CABELLO_VALUES,
  COLOR_OJOS_LABELS,
  COLOR_OJOS_VALUES,
  COLOR_PIEL_LABELS,
  COLOR_PIEL_VALUES,
  FACTOR_RH_LABELS,
  FACTOR_RH_VALUES,
  FORMA_LABIOS_LABELS,
  FORMA_LABIOS_VALUES,
  FORMA_NARIZ_LABELS,
  FORMA_NARIZ_VALUES,
  SENA_PARTICULAR_LABELS,
  SENA_PARTICULAR_VALUES,
  TIPO_SANGRE_GRUPO_LABELS,
  TIPO_SANGRE_GRUPO_VALUES,
  parseFactorRh,
  parseTipoSangreGrupo,
} from "@src/lib/aspirantes/senaletica";
import {
  TIPO_ESTUDIO_LABELS,
  TIPO_ESTUDIO_VALUES,
  normalizeTipoEstudio,
} from "@src/lib/aspirantes/tipo-estudio";
import {
  TALLA_CAMISA_ALMILLA_LABELS,
  TALLA_CAMISA_ALMILLA_VALUES,
  TALLA_GORRA_QUEPIS_LABELS,
  TALLA_GORRA_QUEPIS_VALUES,
  TALLA_UNIFORME_OLIVA_FEM_VALUES,
  TALLA_UNIFORME_OLIVA_LABELS,
  TALLA_UNIFORME_OLIVA_MAS_VALUES,
  TALLA_UNIFORME_PATRIOTA_LABELS,
  TALLA_UNIFORME_PATRIOTA_VALUES,
} from "@src/lib/aspirantes/tallas-familia";

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
  factorRh: string | null;
  colorCabello: string | null;
  formaLabios: string | null;
  formaNariz: string | null;
  colorOjos: string | null;
  colorPiel: string | null;
  senaParticular: string | null;
  instagram: string | null;
  twitter: string | null;
  facebook: string | null;
  padresVenezolanos: boolean | null;
  madreNombres: string | null;
  madreApellidos: string | null;
  madreCedula: string | null;
  madreFechaNacimientoIso: string | null;
  padreNombres: string | null;
  padreApellidos: string | null;
  padreCedula: string | null;
  padreFechaNacimientoIso: string | null;
  poseeVehiculoPropio: boolean | null;
  poseeViviendaPropia: boolean | null;
  carnetPatriaSerial: string | null;
  carnetPatriaCodigo: string | null;
  cuentaNominaBanfanb: string | null;
  tallaGorra: string | null;
  tallaCamisa: string | null;
  tallaPantalon: string | null;
  tallaCalzado: string | null;
  tallaUniformePatriota: string | null;
  tallaUniformeOliva: string | null;
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
  tipoEstudio?: string | null;
  nombreUniversidad?: string | null;
  tituloUniversidad?: string | null;
  paisUniversidad?: string | null;
  nucleoUniversidad?: string | null;
  anioIngresoUniversidad?: number | null;
  anioEgresoUniversidad?: number | null;
};

type Mode = "create" | "edit";
type QuickTab = "identidad" | "contacto" | "estudios" | "emergencia" | "rasgos" | "salud" | "archivos";

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
  { id: "estudios", label: "Estudios", icon: GraduationCap },
  { id: "emergencia", label: "Emergencia", icon: LifeBuoy },
  { id: "rasgos", label: "Rasgos", icon: ScanFace },
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
  if (
    keys.some((k) =>
      [
        "tipoEstudio",
        "nombreUniversidad",
        "tituloUniversidad",
        "paisUniversidad",
        "nucleoUniversidad",
        "anioIngresoUniversidad",
        "anioEgresoUniversidad",
      ].includes(k),
    )
  ) {
    return "estudios";
  }
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
        "tallaUniformePatriota",
        "tallaUniformeOliva",
        "alergias",
        "condicionesMedicas",
        "discapacidad",
        "observaciones",
      ].includes(k),
    )
  ) {
    return "salud";
  }
  if (
    keys.some((k) =>
      ["colorCabello", "formaLabios", "formaNariz", "colorOjos", "colorPiel", "senaParticular"].includes(k),
    )
  ) {
    return "rasgos";
  }
  if (keys.some((k) => ["madreNombres", "madreApellidos", "madreCedula", "madreFechaNacimiento", "padreNombres", "padreApellidos", "padreCedula", "padreFechaNacimiento", "padresVenezolanos"].includes(k))) {
    return "identidad";
  }
  if (
    keys.some((k) =>
      ["telefono", "correo", "direccion", "instagramEstado", "twitterEstado", "facebookEstado", "poseeVehiculoPropio", "poseeViviendaPropia", "carnetPatriaSerial", "carnetPatriaCodigo", "cuentaNominaBanfanb"].includes(k),
    )
  ) {
    return "contacto";
  }
  if (keys.length) return "identidad";
  return null;
}

function AspiranteQuickForm({
  mode,
  pelotones,
  initial,
  onClose,
  onSaved,
}: {
  mode: Mode;
  pelotones: PelotonResumen[];
  initial?: AspiranteQuickInitial | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = mode === "edit";
  const action = isEdit ? updateAspiranteQuick : createAspirante;
  const [state, formAction, pending] = useActionState(action, aspiranteInitialActionState);
  const [tab, setTab] = useState<QuickTab>("identidad");
  const savedRef = useRef(false);

  useEffect(() => {
    if (!state.ok || savedRef.current) return;
    savedRef.current = true;
    onSaved();
  }, [state.ok, onSaved]);

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
          <div className="grid grid-cols-4 gap-0.5 rounded-md border border-slate-200 bg-slate-100/80 p-0.5 sm:grid-cols-7">
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
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-padres-ve">Padres venezolanos</Label>
                <select
                  id="quick-padres-ve"
                  name="padresVenezolanos"
                  defaultValue={
                    initial?.padresVenezolanos === true ? "SI" : initial?.padresVenezolanos === false ? "NO" : ""
                  }
                  className={selectClass}
                >
                  <option value="">Sin indicar</option>
                  <option value="SI">Sí</option>
                  <option value="NO">No</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-madre-nombres">Nombres de la madre</Label>
                <Input
                  id="quick-madre-nombres"
                  name="madreNombres"
                  defaultValue={initial?.madreNombres ?? ""}
                  className="h-8"
                />
                <FieldError message={state.errors.madreNombres} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-madre-apellidos">Apellidos de la madre</Label>
                <Input
                  id="quick-madre-apellidos"
                  name="madreApellidos"
                  defaultValue={initial?.madreApellidos ?? ""}
                  className="h-8"
                />
                <FieldError message={state.errors.madreApellidos} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-madre-cedula">Cédula de la madre</Label>
                <Input
                  id="quick-madre-cedula"
                  name="madreCedula"
                  inputMode="numeric"
                  defaultValue={initial?.madreCedula ?? ""}
                  placeholder="Solo dígitos, 6 a 12"
                  className="h-8"
                />
                <FieldError message={state.errors.madreCedula} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-madre-fecha">Fecha de nacimiento de la madre</Label>
                <Input
                  id="quick-madre-fecha"
                  name="madreFechaNacimiento"
                  type="date"
                  defaultValue={fechaInputFromIso(initial?.madreFechaNacimientoIso ?? undefined)}
                  className="h-8"
                />
                <FieldError message={state.errors.madreFechaNacimiento} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-padre-nombres">Nombres del padre</Label>
                <Input
                  id="quick-padre-nombres"
                  name="padreNombres"
                  defaultValue={initial?.padreNombres ?? ""}
                  className="h-8"
                />
                <FieldError message={state.errors.padreNombres} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-padre-apellidos">Apellidos del padre</Label>
                <Input
                  id="quick-padre-apellidos"
                  name="padreApellidos"
                  defaultValue={initial?.padreApellidos ?? ""}
                  className="h-8"
                />
                <FieldError message={state.errors.padreApellidos} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-padre-cedula">Cédula del padre</Label>
                <Input
                  id="quick-padre-cedula"
                  name="padreCedula"
                  inputMode="numeric"
                  defaultValue={initial?.padreCedula ?? ""}
                  placeholder="Solo dígitos, 6 a 12"
                  className="h-8"
                />
                <FieldError message={state.errors.padreCedula} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-padre-fecha">Fecha de nacimiento del padre</Label>
                <Input
                  id="quick-padre-fecha"
                  name="padreFechaNacimiento"
                  type="date"
                  defaultValue={fechaInputFromIso(initial?.padreFechaNacimientoIso ?? undefined)}
                  className="h-8"
                />
                <FieldError message={state.errors.padreFechaNacimiento} />
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
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-vehiculo">Posee vehículo propio</Label>
                <select
                  id="quick-vehiculo"
                  name="poseeVehiculoPropio"
                  defaultValue={
                    initial?.poseeVehiculoPropio === true ? "SI" : initial?.poseeVehiculoPropio === false ? "NO" : ""
                  }
                  className={selectClass}
                >
                  <option value="">Sin indicar</option>
                  <option value="SI">Sí</option>
                  <option value="NO">No</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-vivienda">Posee vivienda propia</Label>
                <select
                  id="quick-vivienda"
                  name="poseeViviendaPropia"
                  defaultValue={
                    initial?.poseeViviendaPropia === true ? "SI" : initial?.poseeViviendaPropia === false ? "NO" : ""
                  }
                  className={selectClass}
                >
                  <option value="">Sin indicar</option>
                  <option value="SI">Sí</option>
                  <option value="NO">No</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-carnet-serial">Serial del carnet de la patria</Label>
                <Input
                  id="quick-carnet-serial"
                  name="carnetPatriaSerial"
                  defaultValue={initial?.carnetPatriaSerial ?? ""}
                  className="h-8"
                />
                <FieldError message={state.errors.carnetPatriaSerial} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-carnet-codigo">Código del carnet de la patria</Label>
                <Input
                  id="quick-carnet-codigo"
                  name="carnetPatriaCodigo"
                  defaultValue={initial?.carnetPatriaCodigo ?? ""}
                  className="h-8"
                />
                <FieldError message={state.errors.carnetPatriaCodigo} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="quick-cuenta-banfanb">Número de cuenta nómina BANFANB</Label>
                <Input
                  id="quick-cuenta-banfanb"
                  name="cuentaNominaBanfanb"
                  inputMode="numeric"
                  defaultValue={initial?.cuentaNominaBanfanb ?? ""}
                  placeholder="Solo dígitos"
                  className="h-8"
                />
                <FieldError message={state.errors.cuentaNominaBanfanb} />
              </div>
              <RedSocialField
                id="quick-instagram"
                label="Instagram"
                estadoName="instagramEstado"
                usuarioName="instagramUsuario"
                stored={initial?.instagram}
              />
              <RedSocialField
                id="quick-twitter"
                label="Twitter / X"
                estadoName="twitterEstado"
                usuarioName="twitterUsuario"
                stored={initial?.twitter}
              />
              <RedSocialField
                id="quick-facebook"
                label="Facebook"
                estadoName="facebookEstado"
                usuarioName="facebookUsuario"
                stored={initial?.facebook}
              />
            </div>
          </fieldset>

          <fieldset hidden={tab !== "estudios"} className="border-0 p-0">
            <legend className="sr-only">Estudios</legend>
            <p className="mb-2.5 text-[11px] text-slate-500">
              Estudios conducentes a título universitario. Opcional; si completa alguno, indique grado, universidad y título.
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="quick-tipo-estudio">Grado educativo</Label>
                <select
                  id="quick-tipo-estudio"
                  name="tipoEstudio"
                  defaultValue={normalizeTipoEstudio(initial?.tipoEstudio) ?? ""}
                  className={selectClass}
                >
                  <option value="">Sin indicar</option>
                  {TIPO_ESTUDIO_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {TIPO_ESTUDIO_LABELS[v]}
                    </option>
                  ))}
                </select>
                <FieldError message={state.errors.tipoEstudio} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="quick-universidad">Universidad</Label>
                <Input
                  id="quick-universidad"
                  name="nombreUniversidad"
                  defaultValue={initial?.nombreUniversidad ?? ""}
                  placeholder="Universidad, instituto o centro de estudios"
                  className="h-8"
                />
                <FieldError message={state.errors.nombreUniversidad} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-titulo">Título</Label>
                <Input
                  id="quick-titulo"
                  name="tituloUniversidad"
                  defaultValue={initial?.tituloUniversidad ?? ""}
                  placeholder="Ej.: Abogada, Ingeniero"
                  className="h-8"
                />
                <FieldError message={state.errors.tituloUniversidad} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-pais-universidad">País</Label>
                <Input
                  id="quick-pais-universidad"
                  name="paisUniversidad"
                  defaultValue={initial?.paisUniversidad ?? ""}
                  placeholder="Ej.: Venezuela"
                  className="h-8"
                />
                <FieldError message={state.errors.paisUniversidad} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-anio-ingreso">Año de ingreso</Label>
                <Input
                  id="quick-anio-ingreso"
                  name="anioIngresoUniversidad"
                  type="number"
                  inputMode="numeric"
                  min={1950}
                  max={2100}
                  placeholder="Ej.: 2018"
                  defaultValue={
                    initial?.anioIngresoUniversidad != null ? String(initial.anioIngresoUniversidad) : ""
                  }
                  className="h-8"
                />
                <FieldError message={state.errors.anioIngresoUniversidad} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-anio-egreso">Año de egreso</Label>
                <Input
                  id="quick-anio-egreso"
                  name="anioEgresoUniversidad"
                  type="number"
                  inputMode="numeric"
                  min={1950}
                  max={2100}
                  placeholder="Ej.: 2023"
                  defaultValue={
                    initial?.anioEgresoUniversidad != null ? String(initial.anioEgresoUniversidad) : ""
                  }
                  className="h-8"
                />
                <FieldError message={state.errors.anioEgresoUniversidad} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="quick-nucleo">Núcleo</Label>
                <Input
                  id="quick-nucleo"
                  name="nucleoUniversidad"
                  defaultValue={initial?.nucleoUniversidad ?? ""}
                  placeholder="Ej.: Dtto. Capital"
                  className="h-8"
                />
                <FieldError message={state.errors.nucleoUniversidad} />
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

          <fieldset hidden={tab !== "rasgos"} className="border-0 p-0">
            <legend className="sr-only">Rasgos físicos</legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <CatalogSelect
                id="quick-cabello"
                name="colorCabello"
                label="Cabello"
                value={initial?.colorCabello}
                options={catalogOptions(COLOR_CABELLO_VALUES, COLOR_CABELLO_LABELS)}
              />
              <CatalogSelect
                id="quick-labios"
                name="formaLabios"
                label="Boca / labios"
                value={initial?.formaLabios}
                options={catalogOptions(FORMA_LABIOS_VALUES, FORMA_LABIOS_LABELS)}
              />
              <CatalogSelect
                id="quick-nariz"
                name="formaNariz"
                label="Nariz"
                value={initial?.formaNariz}
                options={catalogOptions(FORMA_NARIZ_VALUES, FORMA_NARIZ_LABELS)}
              />
              <CatalogSelect
                id="quick-ojos"
                name="colorOjos"
                label="Ojos"
                value={initial?.colorOjos}
                options={catalogOptions(COLOR_OJOS_VALUES, COLOR_OJOS_LABELS)}
              />
              <CatalogSelect
                id="quick-piel"
                name="colorPiel"
                label="Piel"
                value={initial?.colorPiel}
                options={catalogOptions(COLOR_PIEL_VALUES, COLOR_PIEL_LABELS)}
              />
              <CatalogSelect
                id="quick-senas"
                name="senaParticular"
                label="Señas particulares"
                value={initial?.senaParticular}
                options={catalogOptions(SENA_PARTICULAR_VALUES, SENA_PARTICULAR_LABELS)}
              />
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
              <CatalogSelect
                id="quick-sangre"
                name="tipoSangre"
                label="Tipo de sangre"
                value={parseTipoSangreGrupo(initial?.tipoSangre)}
                options={catalogOptions(TIPO_SANGRE_GRUPO_VALUES, TIPO_SANGRE_GRUPO_LABELS)}
              />
              <CatalogSelect
                id="quick-rh"
                name="factorRh"
                label="Factor RH"
                value={initial?.factorRh ?? parseFactorRh(initial?.tipoSangre)}
                options={catalogOptions(FACTOR_RH_VALUES, FACTOR_RH_LABELS)}
              />
              <CatalogSelect
                id="quick-patriota"
                name="tallaUniformePatriota"
                label="Talla uniforme patriota"
                value={initial?.tallaUniformePatriota}
                options={catalogOptions(TALLA_UNIFORME_PATRIOTA_VALUES, TALLA_UNIFORME_PATRIOTA_LABELS)}
              />
              <CatalogSelect
                id="quick-oliva"
                name="tallaUniformeOliva"
                label="Uniforme verde oliva / interior de cuartel"
                value={initial?.tallaUniformeOliva}
                groups={[
                  {
                    label: "Femenino",
                    options: catalogOptions(TALLA_UNIFORME_OLIVA_FEM_VALUES, TALLA_UNIFORME_OLIVA_LABELS),
                  },
                  {
                    label: "Masculino",
                    options: catalogOptions(TALLA_UNIFORME_OLIVA_MAS_VALUES, TALLA_UNIFORME_OLIVA_LABELS),
                  },
                ]}
              />
              <CatalogSelect
                id="quick-camisa"
                name="tallaCamisa"
                label="Camisa / almilla"
                value={initial?.tallaCamisa}
                options={catalogOptions(TALLA_CAMISA_ALMILLA_VALUES, TALLA_CAMISA_ALMILLA_LABELS)}
              />
              <CatalogSelect
                id="quick-gorra"
                name="tallaGorra"
                label="Gorra / toca / quepis / boina"
                value={initial?.tallaGorra}
                options={catalogOptions(TALLA_GORRA_QUEPIS_VALUES, TALLA_GORRA_QUEPIS_LABELS)}
              />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-calzado">Talla calzado</Label>
                <Input id="quick-calzado" name="tallaCalzado" defaultValue={initial?.tallaCalzado ?? ""} className="h-8" placeholder="42" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-pantalon">Talla pantalón (otra)</Label>
                <Input id="quick-pantalon" name="tallaPantalon" defaultValue={initial?.tallaPantalon ?? ""} className="h-8" />
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
  const router = useRouter();
  const isEdit = mode === "edit";
  const [celebrateOpen, setCelebrateOpen] = useState(false);

  useEffect(() => {
    if (open) setCelebrateOpen(false);
  }, [open]);

  const onSaved = useCallback(() => {
    setCelebrateOpen(true);
  }, []);

  const formOpen = open && !celebrateOpen;

  return (
    <>
      <Dialog open={formOpen} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-h-[min(90dvh,760px)] w-[calc(100vw-1.5rem)] max-w-2xl gap-0 overflow-hidden sm:max-w-3xl"
          key={isEdit ? initial?.id ?? "edit" : "create"}
        >
          <DialogHeader className="px-4 py-3">
            <DialogTitle>{isEdit ? "Edición rápida" : "Registro rápido"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Nombres, apellidos y cédula son obligatorios; el resto es opcional."
                : "Nombres, apellidos y cédula bastan. Puede añadir estudios, contacto de emergencia, médicos y archivos."}
            </DialogDescription>
          </DialogHeader>
          {formOpen ? (
            <AspiranteQuickForm
              key={isEdit ? initial?.id ?? "edit" : "create"}
              mode={mode}
              pelotones={pelotones}
              initial={initial}
              onClose={() => onOpenChange(false)}
              onSaved={onSaved}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <SuccessCelebrationDialog
        open={celebrateOpen}
        onOpenChange={(next) => {
          setCelebrateOpen(next);
          if (!next) {
            onOpenChange(false);
            router.refresh();
          }
        }}
        variant={isEdit ? "saved" : "created"}
        title={isEdit ? "Datos actualizados" : "Aspirante registrado"}
        description={
          isEdit
            ? "Identidad, contacto, estudios, salud y archivos quedaron guardados. Las evaluaciones no se tocaron."
            : "Ya figura en el censo. Puede completar evaluaciones después."
        }
      />
    </>
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
