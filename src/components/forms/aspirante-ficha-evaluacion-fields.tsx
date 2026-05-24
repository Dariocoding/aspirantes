"use client";

import { useMemo, useState } from "react";
import {
  emptyFichaEvaluacion,
  EXAMEN_MEDICO_ITEMS,
  parseFichaEvaluacion,
  PRUEBA_FISICA_FILAS,
  REVISION_EXPEDIENTE_ITEMS,
  type ExamenMedicoFila,
  type FichaEvaluacionState,
  type RevisionRespuesta,
} from "@/lib/aspirantes/ficha-evaluacion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function setRevision(prev: FichaEvaluacionState, id: string, value: RevisionRespuesta): FichaEvaluacionState {
  return { ...prev, revision: { ...prev.revision, [id]: value } };
}

function setPruebaFila(
  prev: FichaEvaluacionState,
  filaId: string,
  key: "datosM" | "datosF" | "calificacion" | "porcentaje" | "subtotal",
  value: string,
): FichaEvaluacionState {
  const fila = prev.pruebaFisica.filas[filaId] ?? {
    datosM: "",
    datosF: "",
    calificacion: "",
    porcentaje: "",
    subtotal: "",
  };
  return {
    ...prev,
    pruebaFisica: {
      ...prev.pruebaFisica,
      filas: {
        ...prev.pruebaFisica.filas,
        [filaId]: { ...fila, [key]: value },
      },
    },
  };
}

function setExamen(prev: FichaEvaluacionState, id: string, patch: Partial<ExamenMedicoFila>): FichaEvaluacionState {
  const cur = prev.examenMedico[id] ?? { si: false, no: false, diagnostico: "" };
  let next: ExamenMedicoFila = { ...cur, ...patch };
  if (patch.si === true) next = { ...next, si: true, no: false };
  if (patch.no === true) next = { ...next, no: true, si: false };
  return { ...prev, examenMedico: { ...prev.examenMedico, [id]: next } };
}

function RevisionTriRadio({
  id,
  value,
  onChange,
}: {
  id: string;
  value: RevisionRespuesta;
  onChange: (v: RevisionRespuesta) => void;
}) {
  const name = `ficha-revision-${id}`;
  return (
    <div className="flex flex-wrap justify-center gap-3 sm:justify-end" role="group" aria-label={`Requisito ${id}`}>
      {(
        [
          { key: "vacío", label: "—", val: null as RevisionRespuesta },
          { key: "SI", label: "Sí", val: "SI" as const },
          { key: "NO", label: "No", val: "NO" as const },
        ] as const
      ).map((opt) => (
        <label
          key={opt.key}
          className={cn(
            "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium",
            value === opt.val ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700",
          )}
        >
          <input
            type="radio"
            className="sr-only"
            name={name}
            checked={value === opt.val}
            onChange={() => onChange(opt.val)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

export function AspiranteFichaEvaluacionFields({ initialJson }: { initialJson: unknown | null | undefined }) {
  const [state, setState] = useState<FichaEvaluacionState>(() =>
    initialJson != null ? parseFichaEvaluacion(initialJson) : emptyFichaEvaluacion(),
  );

  const hiddenValue = useMemo(() => JSON.stringify(state), [state]);

  return (
    <div className="space-y-8">
      <input type="hidden" name="fichaEvaluacion" value={hiddenValue} readOnly aria-hidden />

      <section className="min-w-0 space-y-3" aria-labelledby="ficha-a-title">
        <div>
          <h3 id="ficha-a-title" className="text-sm font-semibold text-slate-900">
            A. Revisión de expediente
          </h3>
          <p className="text-xs text-slate-600">Marque Sí o No por requisito. Use «—» si aún no aplica.</p>
        </div>
        <div className="space-y-3 md:hidden">
          {REVISION_EXPEDIENTE_ITEMS.map((row) => (
            <div
              key={row.id}
              className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="flex gap-2">
                <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded bg-slate-100 px-1.5 text-xs font-semibold tabular-nums text-slate-700">
                  {row.numero}
                </span>
                <p className="min-w-0 flex-1 text-sm leading-snug text-slate-800">{row.texto}</p>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cumple</p>
                <RevisionTriRadio
                  id={row.id}
                  value={state.revision[row.id] ?? null}
                  onChange={(v) => setState((p) => setRevision(p, row.id, v))}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm md:block">
          <table className="w-full min-w-0 table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-12" />
              <col />
              <col className="w-[11rem]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-slate-600">N°</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-600">Requisitos</th>
                <th className="px-2 py-2 text-center text-xs font-semibold uppercase text-slate-600">Cumple</th>
              </tr>
            </thead>
            <tbody>
              {REVISION_EXPEDIENTE_ITEMS.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 align-top last:border-0">
                  <td className="px-2 py-2 tabular-nums text-slate-700">{row.numero}</td>
                  <td className="break-words px-3 py-2 text-slate-800">{row.texto}</td>
                  <td className="px-2 py-2">
                    <RevisionTriRadio
                      id={row.id}
                      value={state.revision[row.id] ?? null}
                      onChange={(v) => setState((p) => setRevision(p, row.id, v))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="min-w-0 space-y-3" aria-labelledby="ficha-b-title">
        <div>
          <h3 id="ficha-b-title" className="text-sm font-semibold text-slate-900">
            B. Prueba física
          </h3>
          <p className="text-xs text-slate-600">
            Indicadores de referencia (F/M) son orientativos; registre datos y calificación del aspirante.
          </p>
        </div>
        <div className="space-y-3 md:hidden">
          {PRUEBA_FISICA_FILAS.map((def) => {
            const f = state.pruebaFisica.filas[def.id] ?? {
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
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-[11px] text-slate-500">Datos (M)</Label>
                    <Input
                      className="mt-1 h-9 text-xs"
                      value={f.datosM}
                      onChange={(e) => setState((p) => setPruebaFila(p, def.id, "datosM", e.target.value))}
                      placeholder={def.refMasculino}
                      aria-label={`${def.prueba} datos masculino`}
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-500">Datos (F)</Label>
                    <Input
                      className="mt-1 h-9 text-xs"
                      value={f.datosF}
                      onChange={(e) => setState((p) => setPruebaFila(p, def.id, "datosF", e.target.value))}
                      placeholder={def.refFemenino}
                      aria-label={`${def.prueba} datos femenino`}
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-500">Calificación</Label>
                    <Input
                      className="mt-1 h-9 text-xs"
                      value={f.calificacion}
                      onChange={(e) => setState((p) => setPruebaFila(p, def.id, "calificacion", e.target.value))}
                      aria-label={`${def.prueba} calificación`}
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-500">%</Label>
                    <Input
                      className="mt-1 h-9 text-xs"
                      value={f.porcentaje}
                      onChange={(e) => setState((p) => setPruebaFila(p, def.id, "porcentaje", e.target.value))}
                      placeholder={def.refPorcentaje}
                      aria-label={`${def.prueba} porcentaje`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-[11px] text-slate-500">Subtotal</Label>
                    <Input
                      className="mt-1 h-9 text-xs"
                      value={f.subtotal}
                      onChange={(e) => setState((p) => setPruebaFila(p, def.id, "subtotal", e.target.value))}
                      placeholder={def.refSubtotal || "—"}
                      aria-label={`${def.prueba} subtotal`}
                    />
                  </div>
                </div>
                <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                  Ref. % <span className="font-mono font-medium text-slate-700">{def.refPorcentaje}</span>
                  {" · "}
                  Ref. subt. <span className="font-medium text-slate-700">{def.refSubtotal || "—"}</span>
                </p>
              </div>
            );
          })}
        </div>
        <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm md:block">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-slate-600">Prueba</th>
                <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-slate-600">Indicadores</th>
                <th className="px-2 py-2 text-center text-xs font-semibold uppercase text-slate-600">Datos (F)</th>
                <th className="px-2 py-2 text-center text-xs font-semibold uppercase text-slate-600">Datos (M)</th>
                <th className="w-24 px-2 py-2 text-center text-xs font-semibold uppercase text-slate-600">Calif.</th>
                <th className="w-20 px-2 py-2 text-center text-xs font-semibold uppercase text-slate-600">%</th>
                <th className="w-20 px-2 py-2 text-center text-xs font-semibold uppercase text-slate-600">Subt.</th>
                <th className="px-2 py-2 text-center text-xs font-semibold uppercase text-slate-600">Ref. %</th>
                <th className="px-2 py-2 text-center text-xs font-semibold uppercase text-slate-600">Ref. subt.</th>
              </tr>
            </thead>
            <tbody>
              {PRUEBA_FISICA_FILAS.map((def) => {
                const f = state.pruebaFisica.filas[def.id] ?? {
                  datosM: "",
                  datosF: "",
                  calificacion: "",
                  porcentaje: "",
                  subtotal: "",
                };
                return (
                  <tr key={def.id} className="border-b border-slate-100 align-top last:border-0">
                    <td className="max-w-[200px] px-2 py-2 text-xs font-medium text-slate-900">{def.prueba}</td>
                    <td className="px-2 py-2 text-xs text-slate-600">{def.indicadorLabel}</td>
                    <td className="px-1 py-1">
                      <Input
                        className="h-8 text-xs"
                        value={f.datosM}
                        onChange={(e) => setState((p) => setPruebaFila(p, def.id, "datosM", e.target.value))}
                        placeholder={def.refMasculino}
                        aria-label={`${def.prueba} datos masculino`}
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        className="h-8 text-xs"
                        value={f.datosF}
                        onChange={(e) => setState((p) => setPruebaFila(p, def.id, "datosF", e.target.value))}
                        placeholder={def.refFemenino}
                        aria-label={`${def.prueba} datos femenino`}
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        className="h-8 text-xs"
                        value={f.calificacion}
                        onChange={(e) => setState((p) => setPruebaFila(p, def.id, "calificacion", e.target.value))}
                        aria-label={`${def.prueba} calificación`}
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        className="h-8 text-xs"
                        value={f.porcentaje}
                        onChange={(e) => setState((p) => setPruebaFila(p, def.id, "porcentaje", e.target.value))}
                        placeholder={def.refPorcentaje}
                        aria-label={`${def.prueba} porcentaje`}
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        className="h-8 text-xs"
                        value={f.subtotal}
                        onChange={(e) => setState((p) => setPruebaFila(p, def.id, "subtotal", e.target.value))}
                        placeholder={def.refSubtotal || "—"}
                        aria-label={`${def.prueba} subtotal`}
                      />
                    </td>
                    <td className="px-2 py-2 text-center text-xs tabular-nums text-slate-500">{def.refPorcentaje}</td>
                    <td className="px-2 py-2 text-center text-xs text-slate-500">{def.refSubtotal || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div>
          <Label htmlFor="calificacionObtenidaPf">Calificación obtenida (prueba física)</Label>
          <Input
            id="calificacionObtenidaPf"
            className="mt-1 max-w-md"
            value={state.pruebaFisica.calificacionObtenida}
            onChange={(e) =>
              setState((p) => ({
                ...p,
                pruebaFisica: { ...p.pruebaFisica, calificacionObtenida: e.target.value },
              }))
            }
          />
        </div>
      </section>

      <section className="min-w-0 space-y-3" aria-labelledby="ficha-c-title">
        <div>
          <h3 id="ficha-c-title" className="text-sm font-semibold text-slate-900">
            C. Examen médico
          </h3>
          <p className="text-xs text-slate-600">Sí / No y observaciones por ítem.</p>
        </div>
        <div className="space-y-3 md:hidden">
          {EXAMEN_MEDICO_ITEMS.map((row) => {
            const r = state.examenMedico[row.id] ?? { si: false, no: false, diagnostico: "" };
            return (
              <div key={row.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex gap-2">
                  <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded bg-slate-100 px-1.5 text-xs font-semibold tabular-nums text-slate-700">
                    {row.numero}
                  </span>
                  <p className="min-w-0 flex-1 text-sm leading-snug text-slate-800">{row.texto}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300"
                      checked={r.si}
                      onChange={(e) =>
                        setState((p) => setExamen(p, row.id, e.target.checked ? { si: true, no: false } : { si: false }))
                      }
                      aria-label={`${row.texto} sí`}
                    />
                    Sí
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300"
                      checked={r.no}
                      onChange={(e) =>
                        setState((p) => setExamen(p, row.id, e.target.checked ? { no: true, si: false } : { no: false }))
                      }
                      aria-label={`${row.texto} no`}
                    />
                    No
                  </label>
                </div>
                <div className="mt-3">
                  <Label className="text-[11px] text-slate-500">Diagnóstico / observaciones</Label>
                  <Textarea
                    className="mt-1 min-h-[52px] text-xs"
                    value={r.diagnostico}
                    onChange={(e) => setState((p) => setExamen(p, row.id, { diagnostico: e.target.value }))}
                    rows={2}
                    aria-label={`${row.texto} observaciones`}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm md:block">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-10 px-2 py-2 text-left text-xs font-semibold uppercase text-slate-600">N°</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-600">Prueba / estudio</th>
                <th className="w-28 px-2 py-2 text-center text-xs font-semibold uppercase text-slate-600">Sí</th>
                <th className="w-28 px-2 py-2 text-center text-xs font-semibold uppercase text-slate-600">No</th>
                <th className="min-w-[200px] px-2 py-2 text-left text-xs font-semibold uppercase text-slate-600">
                  Diagnóstico / observaciones
                </th>
              </tr>
            </thead>
            <tbody>
              {EXAMEN_MEDICO_ITEMS.map((row) => {
                const r = state.examenMedico[row.id] ?? { si: false, no: false, diagnostico: "" };
                return (
                  <tr key={row.id} className="border-b border-slate-100 align-top last:border-0">
                    <td className="px-2 py-2 tabular-nums text-slate-700">{row.numero}</td>
                    <td className="break-words px-3 py-2 text-slate-800">{row.texto}</td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={r.si}
                        onChange={(e) =>
                          setState((p) => setExamen(p, row.id, e.target.checked ? { si: true, no: false } : { si: false }))
                        }
                        aria-label={`${row.texto} sí`}
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={r.no}
                        onChange={(e) =>
                          setState((p) => setExamen(p, row.id, e.target.checked ? { no: true, si: false } : { no: false }))
                        }
                        aria-label={`${row.texto} no`}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Textarea
                        className="min-h-[52px] text-xs"
                        value={r.diagnostico}
                        onChange={(e) => setState((p) => setExamen(p, row.id, { diagnostico: e.target.value }))}
                        rows={2}
                        aria-label={`${row.texto} observaciones`}
                      />
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
