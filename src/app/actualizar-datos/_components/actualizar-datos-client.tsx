"use client";

import {
  updateAspiranteSelfService,
  verifyAspiranteSelfService,
} from "@src/app/actions/aspirantes-self-service";
import { AspiranteFotoField } from "@dashboard/aspirantes/_components/aspirante-foto";
import { Button } from "@src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@src/components/ui/card";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import { Textarea } from "@src/components/ui/textarea";
import type { AspiranteSelfServiceRecord, AspiranteSelfServiceState } from "@src/lib/action-types";
import { aspiranteSelfServiceInitialState } from "@src/lib/action-types";
import { FANB_INSTITUTION_PANEL } from "@src/lib/branding";
import { cn } from "@src/lib/utils";
import { CheckCircle2, IdCard, Loader2, Save, Search } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

function ErrorBanner({ errors }: { errors: Record<string, string> }) {
  const formMsg = errors._form;
  const entries = Object.entries(errors).filter(([k]) => k !== "_form");
  if (!formMsg && entries.length === 0) return null;
  return (
    <div className="space-y-2">
      {formMsg ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {formMsg}
        </p>
      ) : null}
      {entries.length ? (
        <ul className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {entries.map(([k, v]) => (
            <li key={k}>
              <span className="font-medium">{k}:</span> {v}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function VerifyForm({
  onVerified,
}: {
  onVerified: (record: AspiranteSelfServiceRecord) => void;
}) {
  const [state, formAction, pending] = useActionState<AspiranteSelfServiceState, FormData>(
    verifyAspiranteSelfService,
    aspiranteSelfServiceInitialState,
  );

  useEffect(() => {
    if (state.ok && state.record) onVerified(state.record);
  }, [state, onVerified]);

  return (
    <Card className={cn("w-full border-slate-200/90 shadow-lg", FANB_INSTITUTION_PANEL)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
          <IdCard className="h-5 w-5 text-amber-700" aria-hidden />
          Identifíquese
        </CardTitle>
        <CardDescription className="text-slate-600">
          Ingrese su cédula y fecha de nacimiento para cargar su ficha en la convocatoria activa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <ErrorBanner errors={state.errors} />
          <div className="space-y-2">
            <Label htmlFor="cedula">Cédula</Label>
            <Input
              id="cedula"
              name="cedula"
              required
              inputMode="numeric"
              autoComplete="off"
              placeholder="Solo números"
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
            <Input
              id="fechaNacimiento"
              name="fechaNacimiento"
              type="date"
              required
              className="bg-white"
            />
          </div>
          <Button type="submit" disabled={pending} className="w-full gap-2">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Search className="h-4 w-4" aria-hidden />
            )}
            Buscar mi ficha
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function EditForm({
  record,
  onReset,
}: {
  record: AspiranteSelfServiceRecord;
  onReset: () => void;
}) {
  const [state, formAction, pending] = useActionState<AspiranteSelfServiceState, FormData>(
    updateAspiranteSelfService,
    aspiranteSelfServiceInitialState,
  );
  const [savedFlash, setSavedFlash] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const defaults = state.record ?? record;

  useEffect(() => {
    if (state.ok) {
      setSavedFlash(true);
      setFormKey((k) => k + 1);
      const t = window.setTimeout(() => setSavedFlash(false), 4000);
      return () => window.clearTimeout(t);
    }
  }, [state]);

  return (
    <div className="w-full space-y-4">
      <Card className={cn("border-slate-200/90 shadow-lg", FANB_INSTITUTION_PANEL)}>
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">
            {defaults.nombres} {defaults.apellidos}
          </CardTitle>
          <CardDescription className="space-y-1 text-slate-600">
            <span className="block">
              Cédula <span className="font-mono font-semibold text-slate-800">{defaults.cedula}</span>
              {" · "}
              {defaults.sexo === "FEMENINO" ? "Femenino" : "Masculino"}
            </span>
            <span className="block text-xs">
              Convocatoria: {defaults.convocatoriaNombre}{" "}
              <span className="font-mono">({defaults.convocatoriaCodigo})</span>
              {defaults.unidadPostulante.trim() ? (
                <>
                  {" · "}Unidad: <strong className="text-slate-800">{defaults.unidadPostulante}</strong>
                </>
              ) : null}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      {savedFlash ? (
        <p className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          Datos guardados correctamente.
        </p>
      ) : null}

      <form key={formKey} action={formAction} encType="multipart/form-data" className="space-y-4">
        <input type="hidden" name="aspiranteId" value={defaults.aspiranteId} />
        <input type="hidden" name="cedula" value={defaults.cedula} />
        <input type="hidden" name="fechaNacimiento" value={defaults.fechaNacimiento} />

        <ErrorBanner errors={state.errors} />

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Documentos fotográficos</CardTitle>
            <CardDescription>
              Suba o actualice la foto personal, la cédula y el título (fondo negro).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <AspiranteFotoField
              id="self-foto-perfil"
              aspiranteId={defaults.aspiranteId}
              fotoKey={defaults.fotoKey}
              nombre={`${defaults.nombres} ${defaults.apellidos}`}
              kind="perfil"
              previewOnlyLocal
            />
            <AspiranteFotoField
              id="self-foto-cedula"
              aspiranteId={defaults.aspiranteId}
              fotoKey={defaults.fotoCedulaKey}
              nombre="cédula"
              kind="cedula"
              previewOnlyLocal
            />
            <AspiranteFotoField
              id="self-foto-titulo"
              aspiranteId={defaults.aspiranteId}
              fotoKey={defaults.fotoTituloKey}
              nombre="título"
              kind="titulo"
              previewOnlyLocal
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Identidad</CardTitle>
            <CardDescription>Puede corregir nombres y lugar de nacimiento.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nombres</Label>
              <Input name="nombres" required defaultValue={defaults.nombres} />
            </div>
            <div className="space-y-1.5">
              <Label>Apellidos</Label>
              <Input name="apellidos" required defaultValue={defaults.apellidos} />
            </div>
            <div className="space-y-1.5">
              <Label>Lugar de nacimiento</Label>
              <Input name="lugarNacimiento" required defaultValue={defaults.lugarNacimiento} />
            </div>
            <div className="space-y-1.5">
              <Label>Edad</Label>
              <Input
                name="edad"
                type="number"
                required
                min={16}
                max={80}
                defaultValue={defaults.edad}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contacto</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input name="telefono" defaultValue={defaults.telefono ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Correo</Label>
              <Input name="correo" type="email" defaultValue={defaults.correo ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Hijos</Label>
              <Input
                name="hijosCantidad"
                type="number"
                min={0}
                max={30}
                defaultValue={defaults.hijosCantidad}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Dirección</Label>
              <Textarea name="direccion" rows={2} defaultValue={defaults.direccion ?? ""} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Salud y datos físicos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Estatura (cm)</Label>
              <Input
                name="estaturaCm"
                type="number"
                step="0.1"
                defaultValue={defaults.estaturaCm ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Peso (kg)</Label>
              <Input name="pesoKg" type="number" step="0.1" defaultValue={defaults.pesoKg ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de sangre</Label>
              <Input name="tipoSangre" defaultValue={defaults.tipoSangre ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Alergias</Label>
              <Input name="alergias" defaultValue={defaults.alergias ?? ""} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Condiciones médicas</Label>
              <Textarea
                name="condicionesMedicas"
                rows={2}
                defaultValue={defaults.condicionesMedicas ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Discapacidad</Label>
              <Input name="discapacidad" defaultValue={defaults.discapacidad ?? ""} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Observaciones</Label>
              <Textarea name="observaciones" rows={2} defaultValue={defaults.observaciones ?? ""} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contacto de emergencia</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input name="contactoNombre" required defaultValue={defaults.contactoNombre} />
            </div>
            <div className="space-y-1.5">
              <Label>Parentesco</Label>
              <Input
                name="contactoParentesco"
                required
                defaultValue={defaults.contactoParentesco}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input name="contactoTelefono" required defaultValue={defaults.contactoTelefono} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Dirección</Label>
              <Input name="contactoDireccion" defaultValue={defaults.contactoDireccion ?? ""} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={onReset} className="bg-white">
            Buscar otra cédula
          </Button>
          <Button type="submit" disabled={pending} className="gap-2">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  );
}

export function ActualizarDatosClient() {
  const [record, setRecord] = useState<AspiranteSelfServiceRecord | null>(null);

  return (
    <div className="w-full max-w-2xl">
      {record ? (
        <EditForm record={record} onReset={() => setRecord(null)} />
      ) : (
        <VerifyForm onVerified={setRecord} />
      )}
    </div>
  );
}
