"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@src/components/ui/button";
import { Input } from "@src/components/ui/input";
import { formatCedulaMillares } from "@src/lib/aspirantes/cedula";
import { etiquetaPapelNocturno } from "@src/lib/roles-servicio/catalogo-rol";
import { labelJerarquiaAutoridad } from "@src/lib/roles-servicio/jerarquia-autoridad";
import { foldBusqueda } from "@src/lib/text/fold";
import { cn } from "@src/lib/utils";

type Persona = {
  asignacionId: string | null;
  aspiranteId: string | null;
  autoridadId: string | null;
  nombre: string;
  grado: string;
};

type RolLocal = {
  claveLocal: string;
  nombre: string;
  incluido: boolean;
  conAutoridad: boolean;
  papelNocturno: string;
  cuposPorDia: number;
  personas: Persona[];
};

type AutoridadFila = {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string | null;
  jerarquia: string;
  grado: string;
};

export type AspiranteCenso = {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  grado: string;
  peloton: string;
  pelotonNumero: number;
};

function claveDe(persona: Persona): string {
  if (persona.aspiranteId) return `a:${persona.aspiranteId}`;
  if (persona.autoridadId) return `u:${persona.autoridadId}`;
  return `id:${persona.asignacionId ?? persona.nombre}`;
}

export function AsignarCenso<T extends RolLocal>({
  roles,
  autoridades,
  censo,
  onChange,
}: {
  roles: T[];
  autoridades: AutoridadFila[];
  censo: AspiranteCenso[];
  onChange: (roles: T[]) => void;
}) {
  const incluidos = roles.filter((rol) => rol.incluido);
  const [rolClave, setRolClave] = useState(incluidos[0]?.claveLocal ?? "");
  const [peloton, setPeloton] = useState("todos");
  const [consulta, setConsulta] = useState("");

  const rol = incluidos.find((item) => item.claveLocal === rolClave) ?? incluidos[0] ?? null;

  const pelotones = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const persona of censo) {
      if (!mapa.has(persona.peloton)) mapa.set(persona.peloton, persona.pelotonNumero);
    }
    return [...mapa.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0], "es"));
  }, [censo]);

  const otrosRoles = useMemo(() => {
    const mapa = new Map<string, string[]>();
    if (!rol) return mapa;
    for (const item of incluidos) {
      if (item.claveLocal === rol.claveLocal) continue;
      for (const persona of item.personas) {
        const id = persona.aspiranteId ?? (persona.autoridadId ? `u:${persona.autoridadId}` : null);
        if (!id) continue;
        const lista = mapa.get(id) ?? [];
        lista.push(item.nombre);
        mapa.set(id, lista);
      }
    }
    return mapa;
  }, [incluidos, rol]);

  const q = foldBusqueda(consulta.trim());
  const cedulaQ = consulta.replace(/\D/g, "");

  const censoVisible = censo
    .filter((persona) => {
      if (peloton !== "todos" && persona.peloton !== peloton) return false;
      if (!q && !cedulaQ) return true;
      const nombre = foldBusqueda(`${persona.nombres} ${persona.apellidos}`);
      return (q.length > 0 && nombre.includes(q)) || (cedulaQ.length >= 2 && persona.cedula.includes(cedulaQ));
    })
    .sort(
      (a, b) =>
        a.pelotonNumero - b.pelotonNumero ||
        a.apellidos.localeCompare(b.apellidos, "es") ||
        a.nombres.localeCompare(b.nombres, "es"),
    );

  const autoridadesVisibles = autoridades.filter((autoridad) => {
    if (!q && !cedulaQ) return true;
    const nombre = foldBusqueda(`${autoridad.nombres} ${autoridad.apellidos} ${autoridad.cedula ?? ""}`);
    return nombre.includes(q) || (cedulaQ.length >= 2 && (autoridad.cedula ?? "").includes(cedulaQ));
  });

  const actualizarRol = (parcial: Partial<RolLocal>) => {
    if (!rol) return;
    onChange(
      roles.map((item) =>
        item.claveLocal === rol.claveLocal ? { ...item, ...parcial } : item,
      ),
    );
  };

  const togglePersona = (persona: Persona) => {
    if (!rol) return;
    const clave = claveDe(persona);
    const ya = rol.personas.some((item) => claveDe(item) === clave);
    actualizarRol({
      personas: ya
        ? rol.personas.filter((item) => claveDe(item) !== clave)
        : [...rol.personas, persona],
    });
  };

  if (incluidos.length === 0) {
    return (
      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Vuelve al paso de roles y marca al menos uno. Después tocas a las personas del censo para asignarlas.
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">¿Quién va en cada rol?</h2>
        <p className="mt-1 text-sm text-slate-500">
          Elige el rol y toca a la persona para ponerla o quitarla. El censo está agrupado por pelotón. Los días que ya tiene el mes no cambian si guardas solo el personal.
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {incluidos.map((item) => {
            const activo = item.claveLocal === rol?.claveLocal;
            return (
              <button
                key={item.claveLocal}
                type="button"
                onClick={() => setRolClave(item.claveLocal)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-left text-xs",
                  activo ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700",
                )}
              >
                <span className="font-semibold">{item.nombre}</span>
                <span className={cn("ml-1.5 tabular-nums", activo ? "text-slate-300" : "text-slate-500")}>
                  {item.personas.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {rol ? (
        <div className="grid gap-3 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-950">En este rol</p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Menos personas por día"
                  onClick={() => actualizarRol({ cuposPorDia: Math.max(1, rol.cuposPorDia - 1) })}
                >
                  −
                </Button>
                <span className="w-5 text-center text-xs font-semibold tabular-nums" title="Personas por día">
                  {rol.cuposPorDia}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Más personas por día"
                  onClick={() => actualizarRol({ cuposPorDia: Math.min(8, rol.cuposPorDia + 1) })}
                >
                  +
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              {etiquetaPapelNocturno(rol.papelNocturno)} · {rol.cuposPorDia} por día
            </p>
            {rol.personas.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-xs text-slate-500">
                Todavía no hay nadie. Toca personas en el censo.
              </p>
            ) : (
              <ul className="flex max-h-112 flex-col gap-1 overflow-y-auto">
                {rol.personas.map((persona) => (
                  <li key={claveDe(persona)}>
                    <button
                      type="button"
                      onClick={() => togglePersona(persona)}
                      className="flex w-full items-start justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-red-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium text-slate-900">{persona.nombre}</span>
                        <span className="block text-[10px] text-slate-500">
                          {persona.aspiranteId || persona.autoridadId ? persona.grado : "Sin vínculo en el censo"}
                        </span>
                      </span>
                      <X className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={consulta}
                onChange={(event) => setConsulta(event.target.value)}
                placeholder={rol.conAutoridad ? "Buscar autoridad…" : "Buscar en el censo por nombre o cédula…"}
                className="pl-8"
              />
            </div>
            {rol.conAutoridad ? (
              <ListaAutoridades
                autoridades={autoridadesVisibles}
                elegidas={new Set(rol.personas.map((item) => item.autoridadId).filter(Boolean) as string[])}
                otros={otrosRoles}
                onToggle={(autoridad) =>
                  togglePersona({
                    asignacionId:
                      rol.personas.find((item) => item.autoridadId === autoridad.id)?.asignacionId ?? null,
                    aspiranteId: null,
                    autoridadId: autoridad.id,
                    nombre: `${autoridad.nombres} ${autoridad.apellidos}`,
                    grado: autoridad.grado,
                  })
                }
              />
            ) : (
              <>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  <FiltroChip activo={peloton === "todos"} onClick={() => setPeloton("todos")}>
                    Todos
                  </FiltroChip>
                  {pelotones.map(([nombre]) => (
                    <FiltroChip key={nombre} activo={peloton === nombre} onClick={() => setPeloton(nombre)}>
                      {nombre}
                    </FiltroChip>
                  ))}
                </div>
                <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
                  {censoVisible.length === 0 ? (
                    <li className="px-3 py-8 text-center text-sm text-slate-500">Nadie coincide con esa búsqueda.</li>
                  ) : (
                    censoVisible.map((persona) => {
                      const dentro = rol.personas.some((item) => item.aspiranteId === persona.id);
                      const tambien = otrosRoles.get(persona.id) ?? [];
                      return (
                        <li key={persona.id}>
                          <button
                            type="button"
                            onClick={() =>
                              togglePersona({
                                asignacionId:
                                  rol.personas.find((item) => item.aspiranteId === persona.id)?.asignacionId ?? null,
                                aspiranteId: persona.id,
                                autoridadId: null,
                                nombre: `${persona.nombres} ${persona.apellidos}`,
                                grado: persona.grado,
                              })
                            }
                            className={cn(
                              "flex w-full items-center gap-3 px-3 py-2 text-left",
                              dentro ? "bg-teal-50" : "hover:bg-slate-50",
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold",
                                dentro
                                  ? "border-teal-700 bg-teal-700 text-white"
                                  : "border-slate-300 text-transparent",
                              )}
                              aria-hidden
                            >
                              ✓
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-slate-950">
                                {persona.apellidos} {persona.nombres}
                              </span>
                              <span className="block truncate text-[11px] text-slate-500">
                                <span className="font-mono tabular-nums">{formatCedulaMillares(persona.cedula)}</span>
                                {" · "}
                                {persona.peloton}
                                {tambien.length > 0 ? ` · también en ${tambien.join(", ")}` : ""}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ListaAutoridades({
  autoridades,
  elegidas,
  otros,
  onToggle,
}: {
  autoridades: AutoridadFila[];
  elegidas: Set<string>;
  otros: Map<string, string[]>;
  onToggle: (autoridad: AutoridadFila) => void;
}) {
  return (
    <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
      {autoridades.length === 0 ? (
        <li className="px-3 py-8 text-center text-sm text-slate-500">No hay autoridades con ese nombre.</li>
      ) : (
        autoridades.map((autoridad) => {
          const dentro = elegidas.has(autoridad.id);
          const tambien = otros.get(`u:${autoridad.id}`) ?? [];
          return (
            <li key={autoridad.id}>
              <button
                type="button"
                onClick={() => onToggle(autoridad)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-left",
                  dentro ? "bg-indigo-50" : "hover:bg-slate-50",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold",
                    dentro ? "border-indigo-700 bg-indigo-700 text-white" : "border-slate-300 text-transparent",
                  )}
                  aria-hidden
                >
                  ✓
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-950">
                    {autoridad.apellidos} {autoridad.nombres}
                  </span>
                  <span className="block truncate text-[11px] text-indigo-800">
                    {labelJerarquiaAutoridad(autoridad.jerarquia)}
                    {autoridad.cedula ? ` · ${formatCedulaMillares(autoridad.cedula)}` : ""}
                    {tambien.length > 0 ? ` · también en ${tambien.join(", ")}` : ""}
                  </span>
                </span>
              </button>
            </li>
          );
        })
      )}
    </ul>
  );
}

function FiltroChip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        activo ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600",
      )}
    >
      {children}
    </button>
  );
}
