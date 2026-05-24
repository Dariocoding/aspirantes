import {
  EXAMEN_MEDICO_ITEMS,
  parseFichaEvaluacion,
  PRUEBA_FISICA_FILAS,
  REVISION_EXPEDIENTE_ITEMS,
  type FichaEvaluacionState,
} from "@/lib/aspirantes/ficha-evaluacion";
import { calificacionAdmisionEtiqueta } from "@/lib/aspirantes/census";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

function calificacionAdmisionBadgeClass(c: string) {
  if (c === "APTO") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (c === "NO_APTO") return "border-red-200 bg-red-50 text-red-900";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

export type AspirantePerfilSerializado = {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  edad: number;
  sexo: "MASCULINO" | "FEMENINO";
  fechaNacimientoLabel: string;
  lugarNacimiento: string;
  unidadPostulante: string;
  calificacionAdmision: string;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  hijosCantidad: number;
  convocatoriaCodigo: string;
  convocatoriaNombre: string;
  convocatoriaAnio: number;
  convocatoriaActiva: boolean;
  estaturaCm: number | null;
  pesoKg: number | null;
  tipoSangre: string | null;
  alergias: string | null;
  condicionesMedicas: string | null;
  discapacidad: string | null;
  observaciones: string | null;
  contactoNombre: string | null;
  contactoParentesco: string | null;
  contactoTelefono: string | null;
  contactoDireccion: string | null;
  fichaEvaluacion: unknown | null;
};

function Campo({ label, value }: { label: string; value: string | null | undefined }) {
  const v = value?.trim();
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm text-slate-900">{v ? v : <span className="text-slate-400">—</span>}</p>
    </div>
  );
}

function FichaBloques({ ficha }: { ficha: FichaEvaluacionState }) {
  return (
    <div className="space-y-8">
      <section aria-labelledby="perfil-ficha-a">
        <h3 id="perfil-ficha-a" className="mb-2 text-sm font-semibold text-slate-900">
          A. Revisión de expediente
        </h3>
        <div className="space-y-3 md:hidden">
          {REVISION_EXPEDIENTE_ITEMS.map((row) => {
            const r = ficha.revision[row.id] ?? null;
            return (
              <div key={row.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex gap-2">
                  <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded bg-slate-100 px-1.5 text-xs font-semibold tabular-nums text-slate-700">
                    {row.numero}
                  </span>
                  <p className="min-w-0 flex-1 text-sm leading-snug text-slate-800">{row.texto}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <span
                    className={cn(
                      "inline-flex rounded-md border px-2 py-1 text-xs font-medium",
                      r === "SI" ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-500",
                    )}
                  >
                    Sí{r === "SI" ? " ✓" : ""}
                  </span>
                  <span
                    className={cn(
                      "inline-flex rounded-md border px-2 py-1 text-xs font-medium",
                      r === "NO" ? "border-red-300 bg-red-50 text-red-900" : "border-slate-200 bg-slate-50 text-slate-500",
                    )}
                  >
                    No{r === "NO" ? " ✓" : ""}
                  </span>
                  {r == null ? (
                    <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500">
                      Sin marcar
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
        <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm md:block">
          <table className="w-full min-w-0 table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-12" />
              <col />
              <col className="w-14" />
              <col className="w-14" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-2 py-2 text-left text-xs font-medium text-slate-600">N°</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Requisitos</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-slate-600">Sí</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-slate-600">No</th>
              </tr>
            </thead>
            <tbody>
              {REVISION_EXPEDIENTE_ITEMS.map((row) => {
                const r = ficha.revision[row.id] ?? null;
                return (
                  <tr key={row.id} className="border-b border-slate-100 align-top last:border-0">
                    <td className="px-2 py-2 tabular-nums text-slate-700">{row.numero}</td>
                    <td className="break-words px-3 py-2 text-slate-800">{row.texto}</td>
                    <td className="px-2 py-2 text-center text-slate-800">{r === "SI" ? "✓" : ""}</td>
                    <td className="px-2 py-2 text-center text-slate-800">{r === "NO" ? "✓" : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="perfil-ficha-b">
        <h3 id="perfil-ficha-b" className="mb-2 text-sm font-semibold text-slate-900">
          B. Prueba física
        </h3>
        <div className="space-y-3 md:hidden">
          {PRUEBA_FISICA_FILAS.map((def) => {
            const f = ficha.pruebaFisica.filas[def.id] ?? {
              datosM: "",
              datosF: "",
              calificacion: "",
              porcentaje: "",
              subtotal: "",
            };
            return (
              <div key={def.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">{def.prueba}</p>
                <p className="mt-1 text-xs leading-snug text-slate-600">{def.indicadorLabel}</p>
                <dl className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="shrink-0 text-slate-500">Datos (M)</dt>
                    <dd className="min-w-0 text-right text-xs tabular-nums text-slate-900">{f.datosM.trim() || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="shrink-0 text-slate-500">Datos (F)</dt>
                    <dd className="min-w-0 text-right text-xs tabular-nums text-slate-900">{f.datosF.trim() || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="shrink-0 text-slate-500">Calif.</dt>
                    <dd className="min-w-0 text-right text-xs text-slate-900">{f.calificacion.trim() || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="shrink-0 text-slate-500">%</dt>
                    <dd className="min-w-0 text-right text-xs tabular-nums text-slate-900">{f.porcentaje.trim() || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="shrink-0 text-slate-500">Subt.</dt>
                    <dd className="min-w-0 text-right text-xs tabular-nums text-slate-900">{f.subtotal.trim() || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                    <dt>Ref. %</dt>
                    <dd className="tabular-nums">{def.refPorcentaje}</dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
        <div className="hidden overflow-x-auto rounded-lg border border-slate-200 md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs whitespace-normal">Prueba</TableHead>
                <TableHead className="max-w-[14rem] text-xs whitespace-normal">Indicadores</TableHead>
                <TableHead className="text-center text-xs">Datos (F)</TableHead>
                <TableHead className="text-center text-xs">Datos (M)</TableHead>
                <TableHead className="text-center text-xs">Calif.</TableHead>
                <TableHead className="text-center text-xs">%</TableHead>
                <TableHead className="text-center text-xs">Subt.</TableHead>
                <TableHead className="text-center text-xs text-slate-500">Ref. %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PRUEBA_FISICA_FILAS.map((def) => {
                const f = ficha.pruebaFisica.filas[def.id] ?? {
                  datosM: "",
                  datosF: "",
                  calificacion: "",
                  porcentaje: "",
                  subtotal: "",
                };
                return (
                  <TableRow key={def.id}>
                    <TableCell className="max-w-[180px] whitespace-normal text-xs font-medium">{def.prueba}</TableCell>
                    <TableCell className="max-w-[14rem] whitespace-normal text-xs text-slate-600">{def.indicadorLabel}</TableCell>
                    <TableCell className="text-center text-xs tabular-nums">{f.datosM.trim() || "—"}</TableCell>
                    <TableCell className="text-center text-xs tabular-nums">{f.datosF.trim() || "—"}</TableCell>
                    <TableCell className="text-center text-xs">{f.calificacion.trim() || "—"}</TableCell>
                    <TableCell className="text-center text-xs tabular-nums">{f.porcentaje.trim() || "—"}</TableCell>
                    <TableCell className="text-center text-xs tabular-nums">{f.subtotal.trim() || "—"}</TableCell>
                    <TableCell className="text-center text-xs text-slate-500 tabular-nums">{def.refPorcentaje}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="mt-2 text-sm text-slate-800">
          <span className="font-semibold">Calificación obtenida:</span>{" "}
          {ficha.pruebaFisica.calificacionObtenida.trim() || (
            <span className="font-normal text-slate-400">—</span>
          )}
        </p>
      </section>

      <section aria-labelledby="perfil-ficha-c">
        <h3 id="perfil-ficha-c" className="mb-2 text-sm font-semibold text-slate-900">
          C. Examen médico
        </h3>
        <div className="space-y-3 md:hidden">
          {EXAMEN_MEDICO_ITEMS.map((row) => {
            const r = ficha.examenMedico[row.id] ?? { si: false, no: false, diagnostico: "" };
            return (
              <div key={row.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex gap-2">
                  <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded bg-slate-100 px-1.5 text-xs font-semibold tabular-nums text-slate-700">
                    {row.numero}
                  </span>
                  <p className="min-w-0 flex-1 text-sm leading-snug text-slate-800">{row.texto}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <span
                    className={cn(
                      "inline-flex rounded-md border px-2 py-1 text-xs font-medium",
                      r.si ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-500",
                    )}
                  >
                    Sí{r.si ? " ✓" : ""}
                  </span>
                  <span
                    className={cn(
                      "inline-flex rounded-md border px-2 py-1 text-xs font-medium",
                      r.no ? "border-red-300 bg-red-50 text-red-900" : "border-slate-200 bg-slate-50 text-slate-500",
                    )}
                  >
                    No{r.no ? " ✓" : ""}
                  </span>
                </div>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Diagnóstico / observaciones</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                    {r.diagnostico.trim() || "—"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="hidden overflow-x-auto rounded-lg border border-slate-200 md:block">
          <table className="w-full min-w-0 table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-12" />
              <col />
              <col className="w-12" />
              <col className="w-12" />
              <col className="min-w-[12rem]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-2 py-2 text-left text-xs font-medium text-slate-600">N°</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Prueba / estudio</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-slate-600">Sí</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-slate-600">No</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-slate-600">Diagnóstico / observaciones</th>
              </tr>
            </thead>
            <tbody>
              {EXAMEN_MEDICO_ITEMS.map((row) => {
                const r = ficha.examenMedico[row.id] ?? { si: false, no: false, diagnostico: "" };
                return (
                  <tr key={row.id} className="border-b border-slate-100 align-top last:border-0">
                    <td className="px-2 py-2 tabular-nums text-slate-700">{row.numero}</td>
                    <td className="break-words px-3 py-2 text-sm text-slate-800">{row.texto}</td>
                    <td className="px-2 py-2 text-center">{r.si ? "✓" : ""}</td>
                    <td className="px-2 py-2 text-center">{r.no ? "✓" : ""}</td>
                    <td className="break-words px-2 py-2 whitespace-pre-wrap text-sm text-slate-800">
                      {r.diagnostico.trim() || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function AspirantePerfilView({ a }: { a: AspirantePerfilSerializado }) {
  const ficha = parseFichaEvaluacion(a.fichaEvaluacion);
  const nombreCompleto = `${a.nombres} ${a.apellidos}`.trim();

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden shadow-sm ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">{nombreCompleto}</CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Cédula <span className="font-mono font-semibold text-slate-800">{a.cedula}</span>
                {" · "}
                {a.sexo === "FEMENINO" ? "Femenino" : "Masculino"}
                {" · "}
                <span className="tabular-nums">{a.edad}</span> años
              </CardDescription>
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-medium",
                calificacionAdmisionBadgeClass(a.calificacionAdmision),
              )}
            >
              {calificacionAdmisionEtiqueta(a.calificacionAdmision as "APTO" | "NO_APTO" | "EN_EVALUACION")}
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Convocatoria:{" "}
            <strong className="text-slate-900">
              {a.convocatoriaNombre}{" "}
              <span className="font-mono font-normal text-slate-700">({a.convocatoriaCodigo})</span> · {a.convocatoriaAnio}
            </strong>
            {a.convocatoriaActiva ? (
              <span className="ml-2 text-[10px] font-semibold uppercase text-emerald-700">activa</span>
            ) : null}
          </p>
        </CardHeader>
        <CardContent className="space-y-6 p-4 sm:p-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Identidad y contacto</h2>
            <Separator className="my-3" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Campo label="Unidad postulante" value={a.unidadPostulante} />
              <Campo label="Fecha de nacimiento" value={a.fechaNacimientoLabel} />
              <Campo label="Lugar de nacimiento" value={a.lugarNacimiento} />
              <Campo label="Teléfono" value={a.telefono} />
              <Campo label="Correo" value={a.correo} />
              <Campo label="Hijos" value={String(a.hijosCantidad)} />
              <div className="sm:col-span-2 lg:col-span-3">
                <Campo label="Dirección" value={a.direccion} />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">Salud y datos físicos</h2>
            <Separator className="my-3" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Campo label="Estatura (cm)" value={a.estaturaCm != null ? String(a.estaturaCm) : null} />
              <Campo label="Peso (kg)" value={a.pesoKg != null ? String(a.pesoKg) : null} />
              <Campo label="Tipo de sangre" value={a.tipoSangre} />
              <Campo label="Alergias" value={a.alergias} />
              <Campo label="Discapacidad" value={a.discapacidad} />
              <div className="sm:col-span-2">
                <Campo label="Condiciones médicas" value={a.condicionesMedicas} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <Campo label="Observaciones" value={a.observaciones} />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">Contacto de emergencia</h2>
            <Separator className="my-3" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Nombre" value={a.contactoNombre} />
              <Campo label="Parentesco" value={a.contactoParentesco} />
              <Campo label="Teléfono" value={a.contactoTelefono} />
              <div className="sm:col-span-2">
                <Campo label="Dirección" value={a.contactoDireccion} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-slate-50/80">
          <CardTitle className="text-base font-semibold text-slate-900">Expediente y evaluaciones</CardTitle>
          <CardDescription className="text-xs text-slate-600">
            Revisión de expediente, prueba física y examen médico registrados en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <FichaBloques ficha={ficha} />
        </CardContent>
      </Card>
    </div>
  );
}
