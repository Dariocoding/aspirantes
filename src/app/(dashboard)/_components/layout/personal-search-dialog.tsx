"use client";

import { AspiranteFotoThumbnail } from "@dashboard/aspirantes/_components/aspirante-foto";
import { buscarPersonalGlobal, type PersonaBusqueda } from "@src/app/actions/busqueda-personal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@src/components/ui/dialog";
import {
  getSidebarNavForApp,
  listPersonalConfigCards,
  type AppNavLink,
  type ConfigCard,
} from "@src/lib/apps/registry";
import { routes } from "@src/lib/apps/routes";
import { hasPermission } from "@src/lib/auth/permissions";
import type { AuthContext } from "@src/lib/auth/session";
import { formatCedulaMillares } from "@src/lib/aspirantes/cedula";
import { foldBusqueda } from "@src/lib/text/fold";
import { cn } from "@src/lib/utils";
import { CornerDownLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type Destino = {
  kind: "modulo" | "config";
  href: string;
  label: string;
  description: string;
  icon: AppNavLink["icon"];
};

type Hit =
  | { kind: "persona"; persona: PersonaBusqueda }
  | { kind: "destino"; destino: Destino };

const MODULO_DETALLE: Record<string, string> = {
  [routes.personal.home]: "Resumen del día, servicio y avisos.",
  [routes.personal.aspirantes]: "Censo de aspirantes del curso.",
  [routes.personal.rolesServicio]: "Cuadro de servicio del mes.",
  [routes.personal.permisos]: "Salidas, pernoctas y ausencias.",
  [routes.personal.configuracion]: "Efemérides, documentos y el bot.",
};

function coincide(texto: string, consulta: string): boolean {
  if (!consulta) return true;
  return foldBusqueda(texto).includes(consulta);
}

export function PersonalSearchDialog({
  open,
  onOpenChange,
  auth,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auth: AuthContext;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [consulta, setConsulta] = useState("");
  const [personas, setPersonas] = useState<PersonaBusqueda[]>([]);
  const [consultaResuelta, setConsultaResuelta] = useState("");
  const [activo, setActivo] = useState(0);
  const seq = useRef(0);

  const modulos = useMemo<Destino[]>(() => {
    const q = foldBusqueda(consulta.trim());
    return getSidebarNavForApp("personal", auth).main
      .filter((link) => !link.permission || hasPermission(auth, link.permission))
      .filter((link) => coincide(`${link.label} ${MODULO_DETALLE[link.href] ?? ""}`, q))
      .map((link) => ({
        kind: "modulo" as const,
        href: link.href,
        label: link.label,
        description: MODULO_DETALLE[link.href] ?? "Módulo de personal.",
        icon: link.icon,
      }));
  }, [auth, consulta]);

  const configs = useMemo<Destino[]>(() => {
    const q = foldBusqueda(consulta.trim());
    return listPersonalConfigCards(auth)
      .filter((card) => coincide(`${card.label} ${card.description}`, q))
      .map((card: ConfigCard) => ({
        kind: "config" as const,
        href: card.href,
        label: card.label,
        description: card.description,
        icon: card.icon,
      }));
  }, [auth, consulta]);

  const hits = useMemo<Hit[]>(() => {
    const gente = personas.map((persona) => ({ kind: "persona" as const, persona }));
    const destinos = [...modulos, ...configs].map((destino) => ({ kind: "destino" as const, destino }));
    return consulta.trim() ? [...gente, ...destinos] : [...destinos];
  }, [configs, consulta, modulos, personas]);

  useEffect(() => {
    if (!open) return;
    setConsulta("");
    setPersonas([]);
    setConsultaResuelta("");
    setActivo(0);
    const foco = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(foco);
  }, [open]);

  useEffect(() => {
    setActivo(0);
  }, [consulta]);

  useEffect(() => {
    if (!open) return;
    const texto = consulta.trim();
    const cedula = texto.replace(/\D/g, "");
    if (foldBusqueda(texto).length < 2 && cedula.length < 3) {
      seq.current += 1;
      setPersonas([]);
      setConsultaResuelta(texto);
      return;
    }
    const id = ++seq.current;
    const timer = window.setTimeout(() => {
      void buscarPersonalGlobal(texto)
        .then((rows) => {
          if (seq.current !== id) return;
          setPersonas(rows);
          setConsultaResuelta(texto);
        })
        .catch(() => {
          if (seq.current !== id) return;
          setPersonas([]);
          setConsultaResuelta(texto);
        });
    }, 160);
    return () => window.clearTimeout(timer);
  }, [consulta, open]);

  useEffect(() => {
    if (activo >= hits.length) setActivo(hits.length > 0 ? hits.length - 1 : 0);
  }, [activo, hits.length]);

  useEffect(() => {
    const nodo = document.getElementById(`${listId}-${activo}`);
    nodo?.scrollIntoView({ block: "nearest" });
  }, [activo, listId]);

  const ir = (hit: Hit | undefined) => {
    if (!hit) return;
    const href = hit.kind === "persona" ? routes.personal.aspirante(hit.persona.id) : hit.destino.href;
    onOpenChange(false);
    onNavigate?.();
    router.push(href);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActivo((i) => (hits.length === 0 ? 0 : (i + 1) % hits.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActivo((i) => (hits.length === 0 ? 0 : (i - 1 + hits.length) % hits.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      ir(hits[activo]);
    }
  };

  const texto = consulta.trim();
  const pideGente = foldBusqueda(texto).length >= 2 || texto.replace(/\D/g, "").length >= 3;
  const buscando = pideGente && consultaResuelta !== texto;
  const seleccionado = hits[activo];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[10vh]! max-h-[min(32rem,calc(100dvh-4rem))]! w-[min(100vw-1.5rem,46rem)]! max-w-none! translate-y-0! overflow-hidden! p-0"
      >
        <DialogTitle className="sr-only">Buscar en personal</DialogTitle>
        <DialogDescription className="sr-only">
          Personal, módulos y configuración. Las flechas mueven la selección y Enter abre el resultado.
        </DialogDescription>
        <div className="flex items-center gap-2 border-b border-slate-200 px-3">
          <Search className="size-4 shrink-0 text-slate-400" aria-hidden />
          <input
            ref={inputRef}
            value={consulta}
            onChange={(event) => setConsulta(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar personal, módulos, configuración…"
            className="h-12 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            aria-controls={listId}
            aria-activedescendant={hits.length ? `${listId}-${activo}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          {buscando ? <span className="text-[11px] text-slate-400">Buscando</span> : null}
        </div>
        <div className="grid min-h-72 md:grid-cols-[minmax(0,1fr)_16.5rem]">
          <div id={listId} role="listbox" className="max-h-80 overflow-y-auto p-2" aria-label="Resultados">
            {hits.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-slate-500">
                {buscando
                  ? "Buscando personal…"
                  : texto
                    ? `Nada coincide con «${texto}».`
                    : "Escribe un nombre, un apellido o una cédula."}
              </p>
            ) : (
              <Grupos hits={hits} activo={activo} listId={listId} onHover={setActivo} onPick={ir} />
            )}
          </div>
          <Preview hit={seleccionado} />
        </div>
        <div className="flex items-center gap-3 border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            mover
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>
              <CornerDownLeft className="size-3" aria-hidden />
            </Kbd>
            abrir
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>Esc</Kbd>
            cerrar
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function seccionesDe(hits: Hit[]) {
  const grupos: { titulo: string; items: { hit: Hit; index: number }[] }[] = [];
  let index = 0;
  const tomar = (titulo: string, grupo: Hit[]) => {
    if (grupo.length === 0) return;
    grupos.push({
      titulo,
      items: grupo.map((hit) => ({ hit, index: index++ })),
    });
  };
  tomar(
    "Personal",
    hits.filter((hit) => hit.kind === "persona"),
  );
  tomar(
    "Módulos",
    hits.filter((hit) => hit.kind === "destino" && hit.destino.kind === "modulo"),
  );
  tomar(
    "Configuración",
    hits.filter((hit) => hit.kind === "destino" && hit.destino.kind === "config"),
  );
  return grupos;
}

function Grupos({
  hits,
  activo,
  listId,
  onHover,
  onPick,
}: {
  hits: Hit[];
  activo: number;
  listId: string;
  onHover: (index: number) => void;
  onPick: (hit: Hit) => void;
}) {
  const secciones = seccionesDe(hits);
  return (
    <div className="flex flex-col gap-2">
      {secciones.map((seccion) => (
        <Grupo key={seccion.titulo} titulo={seccion.titulo}>
          {seccion.items.map(({ hit, index }) =>
            hit.kind === "persona" ? (
              <FilaPersona
                key={hit.persona.id}
                id={`${listId}-${index}`}
                persona={hit.persona}
                activa={index === activo}
                onHover={() => onHover(index)}
                onPick={() => onPick(hit)}
              />
            ) : (
              <FilaDestino
                key={hit.destino.href}
                id={`${listId}-${index}`}
                destino={hit.destino}
                activa={index === activo}
                onHover={() => onHover(index)}
                onPick={() => onPick(hit)}
              />
            ),
          )}
        </Grupo>
      ))}
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <p className="px-2 py-1 text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">{titulo}</p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </section>
  );
}

function FilaPersona({
  id,
  persona,
  activa,
  onHover,
  onPick,
}: {
  id: string;
  persona: PersonaBusqueda;
  activa: boolean;
  onHover: () => void;
  onPick: () => void;
}) {
  const nombre = `${persona.nombres} ${persona.apellidos}`;
  return (
    <button
      id={id}
      type="button"
      role="option"
      aria-selected={activa}
      onMouseEnter={onHover}
      onClick={onPick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left",
        activa ? "bg-slate-900 text-white" : "text-slate-800 hover:bg-slate-50",
      )}
    >
      <span className={cn("rounded-full", activa && "ring-2 ring-white/40")}>
        <AspiranteFotoThumbnail aspiranteId={persona.id} fotoKey={persona.fotoKey} nombre={nombre} size="sm" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{nombre}</span>
        <span className={cn("block truncate text-[11px]", activa ? "text-slate-300" : "text-slate-500")}>
          {formatCedulaMillares(persona.cedula)}
          {persona.peloton ? ` · ${persona.peloton}` : ""}
        </span>
      </span>
    </button>
  );
}

function FilaDestino({
  id,
  destino,
  activa,
  onHover,
  onPick,
}: {
  id: string;
  destino: Destino;
  activa: boolean;
  onHover: () => void;
  onPick: () => void;
}) {
  const Icon = destino.icon;
  return (
    <button
      id={id}
      type="button"
      role="option"
      aria-selected={activa}
      onMouseEnter={onHover}
      onClick={onPick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left",
        activa ? "bg-slate-900 text-white" : "text-slate-800 hover:bg-slate-50",
      )}
    >
      <Icon className={cn("size-4 shrink-0", activa ? "text-amber-200" : "text-slate-400")} aria-hidden />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{destino.label}</span>
        <span className={cn("block truncate text-[11px]", activa ? "text-slate-300" : "text-slate-500")}>
          {destino.description}
        </span>
      </span>
    </button>
  );
}

function Preview({ hit }: { hit: Hit | undefined }) {
  return (
    <aside className="hidden border-l border-slate-100 bg-slate-50/80 p-4 md:block">
      {!hit ? (
        <p className="pt-8 text-center text-xs text-slate-400">Los resultados se muestran aquí.</p>
      ) : hit.kind === "persona" ? (
        <PreviewPersona persona={hit.persona} />
      ) : (
        <PreviewDestino destino={hit.destino} />
      )}
    </aside>
  );
}

function PreviewPersona({ persona }: { persona: PersonaBusqueda }) {
  const nombre = `${persona.nombres} ${persona.apellidos}`;
  return (
    <div className="flex h-full flex-col">
      <AspiranteFotoThumbnail aspiranteId={persona.id} fotoKey={persona.fotoKey} nombre={nombre} size="lg" />
      <p className="mt-3 text-sm font-semibold text-slate-900">{nombre}</p>
      <p className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">{formatCedulaMillares(persona.cedula)}</p>
      <dl className="mt-3 space-y-1.5 text-xs">
        <Dato etiqueta="Grado" valor={persona.grado} />
        <Dato etiqueta="Sexo" valor={persona.sexo} />
        <Dato etiqueta="Pelotón" valor={persona.peloton ?? "Sin pelotón"} />
      </dl>
    </div>
  );
}

function PreviewDestino({ destino }: { destino: Destino }) {
  const Icon = destino.icon;
  return (
    <div>
      <span className="flex size-10 items-center justify-center rounded-lg bg-white text-slate-700 ring-1 ring-slate-200">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-900">{destino.label}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{destino.description}</p>
      <p className="mt-3 text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
        {destino.kind === "config" ? "Configuración" : "Módulo"}
      </p>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-400">{etiqueta}</dt>
      <dd className="truncate font-medium text-slate-700">{valor}</dd>
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-slate-200 bg-white px-1 font-sans text-[10px] text-slate-500">
      {children}
    </kbd>
  );
}
