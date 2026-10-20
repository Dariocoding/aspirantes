"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Dices,
  Moon,
  Plus,
  Shield,
  Users,
} from "lucide-react";
import { publicarEstudio, type RolEstudioInput } from "@src/app/actions/roles-servicio-estudio";
import { AsignarCenso, type AspiranteCenso } from "./asignar-censo";
import { Badge } from "@src/components/ui/badge";
import { Button, buttonVariants } from "@src/components/ui/button";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import { routes } from "@src/lib/apps/routes";
import {
  CATEGORIAS_ROL,
  cuposSugeridos,
  etiquetaCategoria,
  etiquetaPapelNocturno,
  marcasPorCupoDe,
  PAPELES_NOCTURNOS,
  type CategoriaRol,
  type PapelNocturno,
} from "@src/lib/roles-servicio/catalogo-rol";
import {
  generarCalendarioMultiRol,
  type PersonaClave,
} from "@src/lib/roles-servicio/generar-rotacion";
import { labelJerarquiaAutoridad } from "@src/lib/roles-servicio/jerarquia-autoridad";
import {
  diasDelMes,
  esFinDeSemana,
  etiquetaMes,
  letraSemana,
} from "@src/lib/roles-servicio/marcas";
import { foldBusqueda } from "@src/lib/text/fold";
import { cn } from "@src/lib/utils";

export type AutoridadEstudio = {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string | null;
  jerarquia: string;
  grado: string;
};

export type RolEstudioInicial = RolEstudioInput & {
  teniaPersonas: boolean;
};

type RolLocal = RolEstudioInicial & { claveLocal: string };

type Props = {
  anio: number;
  mes: number;
  curso: string;
  /** El mes ya tiene marcas. El estudio no las toca hasta que el usuario elija días y roles. */
  mesConMarcas: boolean;
  /** Abre directo en la asignación del censo y guarda sin rehacer los días. */
  modoAsignar?: boolean;
  rolesIniciales: RolEstudioInicial[];
  autoridades: AutoridadEstudio[];
  censo: AspiranteCenso[];
};

const PASOS = [
  { titulo: "Días", detalle: "Cuándo hay servicio" },
  { titulo: "Roles", detalle: "Qué puestos armar" },
  { titulo: "Personas", detalle: "Quién entra" },
  { titulo: "Revisar", detalle: "Generar el mes" },
] as const;

const DIAS_SEMANA = ["D", "L", "M", "M", "J", "V", "S"] as const;

function nuevaSemilla(): number {
  return (Date.now() ^ (Math.floor(Math.random() * 0xffffffff) >>> 0)) >>> 0;
}

function mesVecino(anio: number, mes: number, delta: number): { anio: number; mes: number } {
  const fecha = new Date(anio, mes - 1 + delta, 1);
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 };
}

function hrefMes(anio: number, mes: number, asignar: boolean): string {
  const base = `${routes.personal.rolesServicioEstudio}?anio=${anio}&mes=${mes}`;
  return asignar ? `${base}&asignar=1` : base;
}

function todosLosDias(anio: number, mes: number): number[] {
  return Array.from({ length: diasDelMes(anio, mes) }, (_, index) => index + 1);
}

function celdasDelMes(anio: number, mes: number): Array<number | null> {
  const offset = new Date(anio, mes - 1, 1).getDay();
  const celdas: Array<number | null> = Array.from({ length: offset }, () => null);
  for (let dia = 1; dia <= diasDelMes(anio, mes); dia += 1) celdas.push(dia);
  return celdas;
}

function clavePersonaLocal(persona: RolEstudioInput["personas"][number]): string {
  if (persona.aspiranteId) return `a:${persona.aspiranteId}`;
  if (persona.autoridadId) return `u:${persona.autoridadId}`;
  return `id:${persona.asignacionId ?? persona.nombre}`;
}

export function EstudioWizard({
  anio,
  mes,
  curso,
  mesConMarcas,
  modoAsignar = false,
  rolesIniciales,
  autoridades,
  censo,
}: Props) {
  const router = useRouter();
  const total = diasDelMes(anio, mes);
  const universo = useMemo(() => todosLosDias(anio, mes), [anio, mes]);
  const [paso, setPaso] = useState(modoAsignar ? 2 : 0);
  const [modo, setModo] = useState<"mes" | "parte">(mesConMarcas ? "parte" : "mes");
  const [dias, setDias] = useState<number[]>(mesConMarcas ? [] : universo);
  const [roles, setRoles] = useState<RolLocal[]>(() =>
    rolesIniciales.map((rol) => ({ ...rol, claveLocal: rol.id ?? crypto.randomUUID() })),
  );
  const [editando, setEditando] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [seed, setSeed] = useState(nuevaSemilla);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const incluidos = roles.filter((rol) => rol.incluido);
  const seleccion = new Set(dias);

  const preview = useMemo(() => {
    const entrada = incluidos
      .filter((rol) => rol.personas.length > 0)
      .map((rol) => ({
        clave: rol.claveLocal,
        cuposPorDia: rol.cuposPorDia,
        marcasPorCupo: marcasPorCupoDe(rol.papelNocturno, rol.cuposPorDia),
        personas: rol.personas.map(
          (persona, index): PersonaClave => ({
            asignacionId: persona.asignacionId ?? `${rol.claveLocal}-${index}`,
            aspiranteId: persona.aspiranteId,
            autoridadId: persona.autoridadId,
            nombre: persona.nombre,
          }),
        ),
      }));
    if (entrada.length === 0 || dias.length === 0) {
      return { totalMarcas: 0, cuposVacios: 0 };
    }
    return generarCalendarioMultiRol({
      roles: entrada,
      desdeDia: dias[0] ?? 1,
      hastaDia: dias[dias.length - 1] ?? total,
      dias,
      seed,
    });
  }, [incluidos, dias, seed, total]);

  const repetidos = useMemo(() => {
    const vistos = new Map<string, string>();
    const avisos: string[] = [];
    for (const rol of incluidos) {
      for (const persona of rol.personas) {
        const clave = clavePersonaLocal(persona);
        const previo = vistos.get(clave);
        if (previo && previo !== rol.nombre) {
          avisos.push(`${persona.nombre} está en ${previo} y en ${rol.nombre}`);
        } else if (!previo) {
          vistos.set(clave, rol.nombre);
        }
      }
    }
    return [...new Set(avisos)].slice(0, 4);
  }, [incluidos]);

  const elegirModo = (siguiente: "mes" | "parte") => {
    setModo(siguiente);
    setDias(siguiente === "mes" ? universo : []);
  };

  const toggleDia = (dia: number) => {
    setDias((prev) => {
      const set = new Set(prev);
      if (set.has(dia)) set.delete(dia);
      else set.add(dia);
      return [...set].sort((a, b) => a - b);
    });
  };

  const publicar = (soloPersonal = false) => {
    setError(null);
    startTransition(async () => {
      const result = await publicarEstudio({
        anio,
        mes,
        dias: soloPersonal ? [] : dias,
        seed,
        curso,
        roles: roles.map((rol) => ({
          id: rol.id,
          nombre: rol.nombre,
          categoria: rol.categoria,
          conAutoridad: rol.conAutoridad,
          papelNocturno: rol.papelNocturno,
          incluido: rol.incluido,
          cuposPorDia: rol.cuposPorDia,
          personas: rol.personas,
        })),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push(routes.personal.rolesServicio);
      router.refresh();
    });
  };

  const puedeSeguir =
    paso === 0
      ? true
      : paso === 1
        ? incluidos.length > 0
        : true;

  return (
    <div className={cn("mx-auto flex w-full flex-col gap-4 pb-8", paso === 2 ? "max-w-5xl" : "max-w-3xl")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={routes.personal.rolesServicio}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Volver al cuadro
          </Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
            {modoAsignar ? "Asignar personal" : "Armar el mes"}
          </h1>
          <p className="text-sm text-slate-500">
            {modoAsignar
              ? "Toca a cada aspirante del censo para ponerlo o quitarlo del rol. Guardar personal no cambia los días."
              : mesConMarcas
                ? "Este mes ya tiene servicio. Elige días y roles; lo que no marques se queda igual."
                : "Prepara los roles y los días. El cuadro se actualiza al guardar."}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={hrefMes(mesVecino(anio, mes, -1).anio, mesVecino(anio, mes, -1).mes, modoAsignar)}
            className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
            aria-label="Mes anterior"
          >
            <ChevronLeft />
          </Link>
          <p className="min-w-36 text-center text-sm font-medium capitalize">{etiquetaMes(anio, mes)}</p>
          <Link
            href={hrefMes(mesVecino(anio, mes, 1).anio, mesVecino(anio, mes, 1).mes, modoAsignar)}
            className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
            aria-label="Mes siguiente"
          >
            <ChevronRight />
          </Link>
        </div>
      </div>

      <ol className="grid grid-cols-4 gap-2">
        {PASOS.map((item, index) => {
          const activo = index === paso;
          const listo = index < paso;
          return (
            <li key={item.titulo}>
              <button
                type="button"
                onClick={() => {
                  if (index < paso) setPaso(index);
                }}
                className={cn(
                  "flex w-full flex-col rounded-xl border px-3 py-2 text-left transition-colors",
                  activo
                    ? "border-slate-900 bg-slate-900 text-white"
                    : listo
                      ? "border-teal-200 bg-teal-50 text-teal-950"
                      : "border-slate-200 bg-white text-slate-500",
                )}
              >
                <span className="text-[10px] font-semibold tracking-wide uppercase">
                  {index + 1}. {item.titulo}
                </span>
                <span className={cn("mt-0.5 hidden text-[11px] sm:block", activo ? "text-slate-300" : "")}>
                  {item.detalle}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {paso === 0 ? (
        <PasoDias
          anio={anio}
          mes={mes}
          modo={modo}
          dias={seleccion}
          total={total}
          onModo={elegirModo}
          onToggle={toggleDia}
          onSinFinDeSemana={() => {
            setModo("parte");
            setDias(universo.filter((dia) => !esFinDeSemana(anio, mes, dia)));
          }}
          onDesdeHoy={() => {
            const hoy = new Date();
            const desde =
              hoy.getFullYear() === anio && hoy.getMonth() + 1 === mes ? hoy.getDate() : 1;
            setModo("parte");
            setDias(universo.filter((dia) => dia >= desde));
          }}
        />
      ) : null}

      {paso === 1 ? (
        <PasoRoles
          roles={roles}
          editando={editando}
          creando={creando}
          onCreando={setCreando}
          onEditando={setEditando}
          onChange={setRoles}
        />
      ) : null}

      {paso === 2 ? (
        <AsignarCenso roles={roles} autoridades={autoridades} censo={censo} onChange={setRoles} />
      ) : null}

      {paso === 3 ? (
        <PasoRevisar
          modo={modo}
          dias={dias.length}
          total={total}
          roles={incluidos}
          preview={preview}
          repetidos={repetidos}
          error={error}
          onBarajar={() => setSeed(nuevaSemilla())}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={paso === 0 || pending}
          onClick={() => setPaso((actual) => Math.max(0, actual - 1))}
        >
          Atrás
        </Button>
        <div className="flex flex-wrap gap-2">
          {paso === 2 ? (
            <Button
              type="button"
              variant={modoAsignar ? "default" : "outline"}
              disabled={pending || incluidos.length === 0}
              onClick={() => publicar(true)}
            >
              {pending ? "Guardando…" : "Guardar personal"}
            </Button>
          ) : null}
          {paso < 3 ? (
            <Button
              type="button"
              variant={modoAsignar && paso === 2 ? "outline" : "default"}
              disabled={!puedeSeguir}
              onClick={() => setPaso((actual) => actual + 1)}
            >
              {modoAsignar && paso === 2 ? "Seguir al calendario" : "Continuar"}
            </Button>
          ) : (
            <Button type="button" disabled={pending || incluidos.length === 0} onClick={() => publicar(false)}>
              {pending ? "Guardando…" : dias.length === 0 ? "Guardar roles" : "Generar y guardar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PasoDias({
  anio,
  mes,
  modo,
  dias,
  total,
  onModo,
  onToggle,
  onSinFinDeSemana,
  onDesdeHoy,
}: {
  anio: number;
  mes: number;
  modo: "mes" | "parte";
  dias: Set<number>;
  total: number;
  onModo: (modo: "mes" | "parte") => void;
  onToggle: (dia: number) => void;
  onSinFinDeSemana: () => void;
  onDesdeHoy: () => void;
}) {
  const celdas = celdasDelMes(anio, mes);
  const elegidos = dias.size;
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-slate-950">¿Qué días se arman?</h2>
        <p className="mt-1 text-sm text-slate-500">
          Puedes sacar los días que no hay servicio, o armar solo una parte y dejar el resto para después.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onModo("mes")}
          className={cn(
            "rounded-xl border p-3 text-left",
            modo === "mes" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 hover:bg-slate-50",
          )}
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <CalendarRange className="size-4" aria-hidden />
            Todo el mes de una vez
          </span>
          <span className={cn("mt-1 block text-xs", modo === "mes" ? "text-slate-300" : "text-slate-500")}>
            Toca un día para marcarlo como “este día no hay”.
          </span>
        </button>
        <button
          type="button"
          onClick={() => onModo("parte")}
          className={cn(
            "rounded-xl border p-3 text-left",
            modo === "parte" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 hover:bg-slate-50",
          )}
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Check className="size-4" aria-hidden />
            Solo algunos días
          </span>
          <span className={cn("mt-1 block text-xs", modo === "parte" ? "text-slate-300" : "text-slate-500")}>
            Toca los días que quieres generar ahora. El resto se queda igual.
          </span>
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDesdeHoy}>
          Desde hoy
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onSinFinDeSemana}>
          Sin fines de semana
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onModo(modo)}>
          {modo === "mes" ? "Restaurar el mes" : "Vaciar selección"}
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {DIAS_SEMANA.map((letra, index) => (
            <div
              key={`${letra}-${index}`}
              className="py-1.5 text-center text-[10px] font-semibold tracking-wide text-slate-500 uppercase"
            >
              {letra}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {celdas.map((dia, index) => {
            if (dia == null) return <div key={`vacio-${index}`} className="h-14 border-r border-b border-slate-100" />;
            const activo = dias.has(dia);
            return (
              <button
                key={dia}
                type="button"
                onClick={() => onToggle(dia)}
                className={cn(
                  "flex h-14 flex-col items-center justify-center border-r border-b border-slate-100 text-sm",
                  activo ? "bg-teal-600 font-semibold text-white" : "bg-white text-slate-400",
                  esFinDeSemana(anio, mes, dia) && !activo && "bg-slate-50",
                )}
              >
                <span className="text-[9px] leading-none uppercase opacity-70">
                  {letraSemana(anio, mes, dia)}
                </span>
                <span className="tabular-nums">{dia}</span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-sm text-slate-600">
        <span className="font-semibold text-slate-950">{elegidos}</span> de {total} días se van a generar.
        {elegidos < total ? ` ${total - elegidos} quedan como están.` : " Es el mes completo."}
      </p>
    </section>
  );
}

function PasoRoles({
  roles,
  editando,
  creando,
  onCreando,
  onEditando,
  onChange,
}: {
  roles: RolLocal[];
  editando: string | null;
  creando: boolean;
  onCreando: (valor: boolean) => void;
  onEditando: (clave: string | null) => void;
  onChange: (roles: RolLocal[]) => void;
}) {
  const actualizar = (claveLocal: string, parcial: Partial<RolLocal>) => {
    onChange(roles.map((rol) => (rol.claveLocal === claveLocal ? { ...rol, ...parcial } : rol)));
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Roles de este mes</h2>
        <p className="mt-1 text-sm text-slate-500">
          Marca los que entran en este guardado. Los que dejes sin marcar no se tocan. Si falta uno, créalo e indica si lleva autoridad y qué turno de noche es.
        </p>
      </div>

      {creando ? (
        <FormularioRol
          onCancel={() => onCreando(false)}
          onSave={(rol) => {
            onChange([
              ...roles,
              {
                id: null,
                ...rol,
                incluido: true,
                teniaPersonas: false,
                claveLocal: crypto.randomUUID(),
                personas: [],
                cuposPorDia: cuposSugeridos(rol.nombre, rol.papelNocturno, rol.categoria),
              },
            ]);
            onCreando(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => onCreando(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-white"
        >
          <Plus className="size-4" aria-hidden />
          Crear un rol nuevo
        </button>
      )}

      <ul className="flex flex-col gap-2">
        {roles.map((rol) => {
          const abierto = editando === rol.claveLocal;
          return (
            <li key={rol.claveLocal} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 size-4"
                  checked={rol.incluido}
                  onChange={() => actualizar(rol.claveLocal, { incluido: !rol.incluido })}
                  aria-label={`Incluir ${rol.nombre || "rol"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-950">{rol.nombre || "Sin nombre"}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Badge variant="outline">{etiquetaCategoria(rol.categoria)}</Badge>
                    <Badge variant="secondary">
                      {rol.conAutoridad ? "Con autoridad" : "Aspirantes"}
                    </Badge>
                    <Badge variant="secondary">{etiquetaPapelNocturno(rol.papelNocturno)}</Badge>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditando(abierto ? null : rol.claveLocal)}
                >
                  Ajustar
                </Button>
              </div>
              {abierto ? (
                <EditorRol
                  rol={rol}
                  onChange={(parcial) => actualizar(rol.claveLocal, parcial)}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function FormularioRol({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (rol: Pick<RolLocal, "nombre" | "categoria" | "conAutoridad" | "papelNocturno">) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<CategoriaRol>("OTROS");
  const [conAutoridad, setConAutoridad] = useState(false);
  const [papelNocturno, setPapelNocturno] = useState<PapelNocturno>("NINGUNO");
  const [aviso, setAviso] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-slate-900 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-950">Nuevo rol</h3>
      <div className="mt-3 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nombre-rol">Nombre del puesto</Label>
          <Input
            id="nombre-rol"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Ej. Guardia de aula, Oficial de día"
            autoFocus
          />
        </div>
        <CamposRol
          grupo="nuevo"
          categoria={categoria}
          conAutoridad={conAutoridad}
          papelNocturno={papelNocturno}
          onCategoria={(valor) => {
            setCategoria(valor);
            if (valor === "OFICIAL") {
              setConAutoridad(true);
              setPapelNocturno("RONDA");
            } else if (valor === "INSPECCION") setPapelNocturno("RONDIN");
            else if (valor === "AULA") setPapelNocturno("TURNO_1");
            else if (valor === "CUARTEL") setPapelNocturno("TURNO_2");
            else if (valor === "BANO") setPapelNocturno("TURNO_3");
            else if (valor === "ESTACIONAMIENTO") setPapelNocturno("MARCA_TURNO");
          }}
          onAutoridad={setConAutoridad}
          onPapel={setPapelNocturno}
        />
        {aviso ? <p className="text-sm text-red-700">{aviso}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (nombre.trim().length < 3) {
                setAviso("Escribe un nombre de al menos 3 letras.");
                return;
              }
              onSave({
                nombre: nombre.trim(),
                categoria,
                conAutoridad,
                papelNocturno,
              });
            }}
          >
            Agregar al mes
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditorRol({
  rol,
  onChange,
}: {
  rol: RolLocal;
  onChange: (parcial: Partial<RolLocal>) => void;
}) {
  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`nombre-${rol.claveLocal}`}>Nombre</Label>
        <Input
          id={`nombre-${rol.claveLocal}`}
          value={rol.nombre}
          onChange={(event) => onChange({ nombre: event.target.value })}
        />
      </div>
      <div className="mt-3">
        <CamposRol
          grupo={rol.claveLocal}
          categoria={rol.categoria}
          conAutoridad={rol.conAutoridad}
          papelNocturno={rol.papelNocturno}
          onCategoria={(categoria) =>
            onChange({
              categoria,
              cuposPorDia: cuposSugeridos(rol.nombre, rol.papelNocturno, categoria),
            })
          }
          onAutoridad={(conAutoridad) => onChange({ conAutoridad })}
          onPapel={(papelNocturno) =>
            onChange({
              papelNocturno,
              cuposPorDia: cuposSugeridos(rol.nombre, papelNocturno, rol.categoria),
            })
          }
        />
      </div>
    </div>
  );
}

function CamposRol({
  grupo,
  categoria,
  conAutoridad,
  papelNocturno,
  onCategoria,
  onAutoridad,
  onPapel,
}: {
  grupo: string;
  categoria: CategoriaRol;
  conAutoridad: boolean;
  papelNocturno: PapelNocturno;
  onCategoria: (valor: CategoriaRol) => void;
  onAutoridad: (valor: boolean) => void;
  onPapel: (valor: PapelNocturno) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Categoría</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CATEGORIAS_ROL.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onCategoria(item.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium",
                categoria === item.value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Personal</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onAutoridad(true)}
            className={cn(
              "rounded-xl border p-3 text-left",
              conAutoridad ? "border-indigo-700 bg-indigo-50" : "border-slate-200 hover:bg-slate-50",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Shield className="size-4 text-indigo-700" aria-hidden />
              Con autoridad
            </span>
            <span className="mt-1 block text-xs text-slate-500">Oficiales del cuadro, no aspirantes.</span>
          </button>
          <button
            type="button"
            onClick={() => onAutoridad(false)}
            className={cn(
              "rounded-xl border p-3 text-left",
              !conAutoridad ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Users className="size-4" aria-hidden />
              Sin autoridad
            </span>
            <span className="mt-1 block text-xs text-slate-500">Aspirantes del censo.</span>
          </button>
        </div>
      </fieldset>
      <fieldset>
        <legend className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          <Moon className="size-3.5" aria-hidden />
          En el nocturno
        </legend>
        <div className="mt-2 grid gap-1.5">
          {PAPELES_NOCTURNOS.map((item) => (
            <label
              key={item.value}
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2",
                papelNocturno === item.value ? "border-slate-900 bg-slate-50" : "border-slate-200",
              )}
            >
              <input
                type="radio"
                name={`papel-nocturno-${grupo}`}
                className="mt-1"
                checked={papelNocturno === item.value}
                onChange={() => onPapel(item.value)}
              />
              <span>
                <span className="block text-sm font-medium text-slate-950">{item.label}</span>
                <span className="block text-xs text-slate-500">{item.detalle}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function PasoRevisar({
  modo,
  dias,
  total,
  roles,
  preview,
  repetidos,
  error,
  onBarajar,
}: {
  modo: "mes" | "parte";
  dias: number;
  total: number;
  roles: RolLocal[];
  preview: { totalMarcas: number; cuposVacios: number };
  repetidos: string[];
  error: string | null;
  onBarajar: () => void;
}) {
  const vacios = roles.filter((rol) => rol.personas.length === 0);
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Así queda el mes</h2>
          <p className="mt-1 text-sm text-slate-500">
            {modo === "mes" ? "Mes completo" : "Solo una parte"}, {dias} de {total} días.
            {dias === 0
              ? " No se escriben marcas: solo se guarda quién está en cada rol."
              : " Los días que no elegiste conservan lo que ya tenían."}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onBarajar}>
          <Dices className="size-3.5" aria-hidden />
          Barajar
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {roles.map((rol) => (
          <li key={rol.claveLocal} className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-sm font-medium text-slate-950">{rol.nombre}</p>
            <p className="text-xs text-slate-500">
              {etiquetaCategoria(rol.categoria)} · {rol.conAutoridad ? "Con autoridad" : "Aspirantes"} ·{" "}
              {etiquetaPapelNocturno(rol.papelNocturno)} · {rol.personas.length} personas · {rol.cuposPorDia} por día
            </p>
          </li>
        ))}
      </ul>
      <p className="text-sm text-slate-700">
        Vista previa: <span className="font-semibold">{preview.totalMarcas}</span> marcas nuevas
        {preview.cuposVacios > 0 ? ` · ${preview.cuposVacios} puestos de un día quedaron vacíos` : ""}.
      </p>
      {repetidos.length > 0 ? (
        <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-950">
          <p className="font-medium">Hay personas en más de un rol.</p>
          <p className="mt-1">No se les asignan dos servicios el mismo día.</p>
          <ul className="mt-1 list-disc pl-4">
            {repetidos.map((aviso) => (
              <li key={aviso}>{aviso}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {vacios.length > 0 ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-950">
          {vacios.map((rol) => rol.nombre).join(", ")}{" "}
          {vacios.length === 1 ? "se queda" : "se quedan"} sin personal
          {vacios.some((rol) => rol.teniaPersonas) ? ". Si ya tenían gente, se les quita de este mes." : "."}
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
