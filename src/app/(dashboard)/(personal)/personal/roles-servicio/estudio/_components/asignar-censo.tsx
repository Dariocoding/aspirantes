"use client";

import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@src/components/ui/button";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import { formatCedulaMillares } from "@src/lib/aspirantes/cedula";
import {
  CATEGORIAS_ROL,
  cuposSugeridos,
  etiquetaCategoria,
  PAPELES_NOCTURNOS,
  type CategoriaRol,
  type PapelNocturno,
} from "@src/lib/roles-servicio/catalogo-rol";
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
  id: string | null;
  nombre: string;
  categoria: CategoriaRol;
  conAutoridad: boolean;
  papelNocturno: PapelNocturno;
  incluido: boolean;
  cuposPorDia: number;
  personas: Persona[];
  teniaPersonas: boolean;
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
  const [rolClave, setRolClave] = useState(
    () => roles.find((rol) => rol.incluido)?.claveLocal ?? roles[0]?.claveLocal ?? "",
  );
  const [peloton, setPeloton] = useState("todos");
  const [consulta, setConsulta] = useState("");
  const [creando, setCreando] = useState(false);

  const rol = roles.find((item) => item.claveLocal === rolClave) ?? roles[0] ?? null;

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
    for (const item of roles) {
      if (!item.incluido || item.claveLocal === rol.claveLocal) continue;
      for (const persona of item.personas) {
        const id = persona.aspiranteId ?? (persona.autoridadId ? `u:${persona.autoridadId}` : null);
        if (!id) continue;
        const lista = mapa.get(id) ?? [];
        lista.push(item.nombre);
        mapa.set(id, lista);
      }
    }
    return mapa;
  }, [roles, rol]);

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

  const actualizarRol = (clave: string, parcial: Partial<RolLocal>) => {
    onChange(roles.map((item) => (item.claveLocal === clave ? { ...item, ...parcial } : item)));
  };

  const elegirRol = (clave: string) => {
    setRolClave(clave);
    const elegido = roles.find((item) => item.claveLocal === clave);
    if (elegido && !elegido.incluido) actualizarRol(clave, { incluido: true });
  };

  const togglePersona = (persona: Persona) => {
    if (!rol) return;
    const clave = claveDe(persona);
    const ya = rol.personas.some((item) => claveDe(item) === clave);
    actualizarRol(rol.claveLocal, {
      incluido: true,
      personas: ya ? rol.personas.filter((item) => claveDe(item) !== clave) : [...rol.personas, persona],
    });
  };

  const crearRol = (datos: { nombre: string; categoria: CategoriaRol; conAutoridad: boolean; papelNocturno: PapelNocturno }) => {
    const claveLocal = crypto.randomUUID();
    const nuevo = {
      claveLocal,
      id: null,
      teniaPersonas: false,
      incluido: true,
      personas: [] as Persona[],
      nombre: datos.nombre,
      categoria: datos.categoria,
      conAutoridad: datos.conAutoridad,
      papelNocturno: datos.papelNocturno,
      cuposPorDia: cuposSugeridos(datos.nombre, datos.papelNocturno, datos.categoria),
    } as unknown as T;
    onChange([...roles, nuevo]);
    setRolClave(claveLocal);
    setCreando(false);
  };

  return (
    <div className="grid items-start gap-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
          <p className="text-sm font-semibold text-slate-950">Roles</p>
          <Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => setCreando((v) => !v)}>
            <Plus className="size-3.5" aria-hidden />
            Añadir
          </Button>
        </div>
        {creando ? (
          <FormularioRolNuevo onCancel={() => setCreando(false)} onCrear={crearRol} />
        ) : null}
        <ul className="max-h-[36rem] overflow-y-auto p-1.5">
          {roles.length === 0 ? (
            <li className="px-2 py-6 text-center text-xs text-slate-500">Todavía no hay roles. Añade el primero.</li>
          ) : (
            roles.map((item) => {
              const activo = item.claveLocal === rol?.claveLocal;
              return (
                <li key={item.claveLocal}>
                  <button
                    type="button"
                    onClick={() => elegirRol(item.claveLocal)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left",
                      activo ? "bg-slate-900 text-white" : "hover:bg-slate-50",
                      !item.incluido && !activo && "opacity-60",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug font-medium">{item.nombre || "Sin nombre"}</span>
                      <span className={cn("mt-0.5 block text-[11px]", activo ? "text-slate-300" : "text-slate-500")}>
                        {etiquetaCategoria(item.categoria)}
                        {item.incluido ? "" : " · fuera de este mes"}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 min-w-5 rounded-md px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums",
                        activo ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {item.personas.length}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      {rol ? (
        <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nombre-rol-activo">Nombre del rol</Label>
              <Input
                id="nombre-rol-activo"
                value={rol.nombre}
                onChange={(event) => actualizarRol(rol.claveLocal, { nombre: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cupos-rol">Por día</Label>
              <Input
                id="cupos-rol"
                type="number"
                min={1}
                max={8}
                value={rol.cuposPorDia}
                onChange={(event) =>
                  actualizarRol(rol.claveLocal, {
                    cuposPorDia: Math.max(1, Math.min(8, Number(event.target.value) || 1)),
                  })
                }
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <CampoSelect
              id="categoria-rol"
              label="Categoría"
              value={rol.categoria}
              options={CATEGORIAS_ROL.map((item) => ({ value: item.value, label: item.label }))}
              onChange={(categoria) =>
                actualizarRol(rol.claveLocal, {
                  categoria: categoria as CategoriaRol,
                  cuposPorDia: cuposSugeridos(rol.nombre, rol.papelNocturno, categoria as CategoriaRol),
                })
              }
            />
            <CampoSelect
              id="personal-rol"
              label="Personal"
              value={rol.conAutoridad ? "autoridad" : "aspirantes"}
              options={[
                { value: "aspirantes", label: "Aspirantes del censo" },
                { value: "autoridad", label: "Autoridades" },
              ]}
              onChange={(valor) => actualizarRol(rol.claveLocal, { conAutoridad: valor === "autoridad" })}
            />
            <CampoSelect
              id="nocturno-rol"
              label="En el nocturno"
              value={rol.papelNocturno}
              options={PAPELES_NOCTURNOS.map((item) => ({ value: item.value, label: item.label }))}
              onChange={(papel) =>
                actualizarRol(rol.claveLocal, {
                  papelNocturno: papel as PapelNocturno,
                  cuposPorDia: cuposSugeridos(rol.nombre, papel as PapelNocturno, rol.categoria),
                })
              }
            />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">
              Asignados · {rol.personas.length}
            </p>
            {rol.personas.length === 0 ? (
              <p className="mt-1 text-sm text-slate-500">Nadie todavía. Márcalos en la lista de abajo.</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {rol.personas.map((persona) => (
                  <li key={claveDe(persona)}>
                    <button
                      type="button"
                      onClick={() => togglePersona(persona)}
                      className="inline-flex max-w-full items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-left text-xs text-slate-800 hover:border-red-200 hover:bg-red-50"
                    >
                      <span className="truncate">{persona.nombre}</span>
                      <X className="size-3 shrink-0 text-slate-400" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

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
              elegidas={new Set(rol.personas.map((item) => item.autoridadId).filter((id): id is string => Boolean(id)))}
              otros={otrosRoles}
              onToggle={(autoridad) =>
                togglePersona({
                  asignacionId: rol.personas.find((item) => item.autoridadId === autoridad.id)?.asignacionId ?? null,
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
              <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
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
                              "flex size-5 shrink-0 items-center justify-center rounded border text-[11px] font-bold",
                              dentro ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 text-transparent",
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
        </section>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          Añade un rol para empezar a asignar personas.
        </p>
      )}
    </div>
  );
}

function FormularioRolNuevo({
  onCancel,
  onCrear,
}: {
  onCancel: () => void;
  onCrear: (datos: {
    nombre: string;
    categoria: CategoriaRol;
    conAutoridad: boolean;
    papelNocturno: PapelNocturno;
  }) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<CategoriaRol>("OTROS");
  const [conAutoridad, setConAutoridad] = useState(false);
  const [papelNocturno, setPapelNocturno] = useState<PapelNocturno>("NINGUNO");
  const [aviso, setAviso] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50 px-3 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (nombre.trim().length < 3) {
          setAviso("El nombre necesita al menos 3 letras.");
          return;
        }
        onCrear({ nombre: nombre.trim(), categoria, conAutoridad, papelNocturno });
      }}
    >
      <Label htmlFor="nuevo-rol-nombre">Nuevo rol</Label>
      <Input
        id="nuevo-rol-nombre"
        value={nombre}
        onChange={(event) => setNombre(event.target.value)}
        placeholder="Nombre del puesto"
        autoFocus
      />
      <CampoSelect
        id="nuevo-rol-categoria"
        label="Categoría"
        value={categoria}
        options={CATEGORIAS_ROL.map((item) => ({ value: item.value, label: item.label }))}
        onChange={(valor) => setCategoria(valor as CategoriaRol)}
      />
      <CampoSelect
        id="nuevo-rol-personal"
        label="Personal"
        value={conAutoridad ? "autoridad" : "aspirantes"}
        options={[
          { value: "aspirantes", label: "Aspirantes del censo" },
          { value: "autoridad", label: "Autoridades" },
        ]}
        onChange={(valor) => setConAutoridad(valor === "autoridad")}
      />
      <CampoSelect
        id="nuevo-rol-noche"
        label="En el nocturno"
        value={papelNocturno}
        options={PAPELES_NOCTURNOS.map((item) => ({ value: item.value, label: item.label }))}
        onChange={(valor) => setPapelNocturno(valor as PapelNocturno)}
      />
      {aviso ? <p className="text-xs text-red-700">{aviso}</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm">
          Crear
        </Button>
      </div>
    </form>
  );
}

function CampoSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (valor: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-input bg-background h-8 w-full rounded-lg border px-2 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
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
    <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
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
                    "flex size-5 shrink-0 items-center justify-center rounded border text-[11px] font-bold",
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
        "shrink-0 rounded-md border px-2 py-1 text-[11px] font-medium",
        activo ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600",
      )}
    >
      {children}
    </button>
  );
}
