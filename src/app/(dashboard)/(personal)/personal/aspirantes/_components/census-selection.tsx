"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { routes } from "@src/lib/apps/routes";

export type CensusSelectionPerson = {
  id: string;
  nombreCompleto: string;
};

const SEL_KEY = "sel";
const MAX_SELECTION = 100;
const ID_PATTERN = /^[a-z0-9_-]{8,40}$/i;

const nameCache = new Map<string, string>();
let currentIds: string[] = [];

type CensusSelectionContextValue = {
  people: CensusSelectionPerson[];
  adoptScope: (scope: string) => void;
  toggle: (person: CensusSelectionPerson) => void;
  setPageSelection: (pagePeople: CensusSelectionPerson[], select: boolean) => void;
  fillNames: (pagePeople: CensusSelectionPerson[]) => void;
  clear: () => void;
};

const CensusSelectionContext = createContext<CensusSelectionContextValue | null>(null);

function parseSel(raw: string | null): string[] {
  if (!raw) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const id = part.trim();
    if (!ID_PATTERN.test(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAX_SELECTION) break;
  }
  return ids;
}

function isCensusList() {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  return path === routes.personal.aspirantes;
}

function peopleFromIds(ids: string[]): CensusSelectionPerson[] {
  return ids.map((id) => ({ id, nombreCompleto: nameCache.get(id) ?? "" }));
}

function remember(person: CensusSelectionPerson) {
  if (person.nombreCompleto.trim()) nameCache.set(person.id, person.nombreCompleto.trim());
}

function readSel(): string[] {
  if (typeof window === "undefined") return [];
  return parseSel(new URLSearchParams(window.location.search).get(SEL_KEY));
}

function writeSelectionParam(ids: string[]) {
  if (!isCensusList()) return;
  const url = new URL(window.location.href);
  const next = ids.join(",");
  const current = url.searchParams.get(SEL_KEY) ?? "";
  if (current === next) return;
  if (next) url.searchParams.set(SEL_KEY, next);
  else url.searchParams.delete(SEL_KEY);
  const href = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", href);
}

/** Navegación del censo: actualiza la URL sin recargar el documento y conserva la selección. */
export function useCensusNavigate() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = useCallback((href: string, dropSelection = false) => {
    const next = applySelectionParam(href, dropSelection);
    startTransition(() => {
      router.push(next, { scroll: false });
    });
  }, [router]);
  return { go, pending };
}

/** Copia la selección actual a la próxima dirección del censo. `drop` la quita (cambio de convocatoria). */
export function applySelectionParam(href: string, drop = false): string {
  const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const url = new URL(href, origin);
  if (drop || currentIds.length === 0) url.searchParams.delete(SEL_KEY);
  else url.searchParams.set(SEL_KEY, currentIds.join(","));
  const qs = url.searchParams.toString();
  return `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`;
}

export function CensusSelectionProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<CensusSelectionPerson[]>([]);
  const peopleRef = useRef<CensusSelectionPerson[]>([]);
  const scopeRef = useRef("");

  const commit = useCallback((next: CensusSelectionPerson[]) => {
    const capped = next.length > MAX_SELECTION ? next.slice(0, MAX_SELECTION) : next;
    for (const person of capped) remember(person);
    peopleRef.current = capped;
    currentIds = capped.map((person) => person.id);
    setPeople(capped);
    writeSelectionParam(currentIds);
  }, []);

  const adoptScope = useCallback(
    (scope: string) => {
      if (scopeRef.current && scopeRef.current !== scope) commit([]);
      scopeRef.current = scope;
    },
    [commit],
  );

  const toggle = useCallback(
    (person: CensusSelectionPerson) => {
      remember(person);
      const prev = peopleRef.current;
      const exists = prev.some((item) => item.id === person.id);
      commit(exists ? prev.filter((item) => item.id !== person.id) : [...prev, person]);
    },
    [commit],
  );

  const setPageSelection = useCallback(
    (pagePeople: CensusSelectionPerson[], select: boolean) => {
      for (const person of pagePeople) remember(person);
      const pageIds = new Set(pagePeople.map((person) => person.id));
      const rest = peopleRef.current.filter((person) => !pageIds.has(person.id));
      commit(select ? [...rest, ...pagePeople] : rest);
    },
    [commit],
  );

  const fillNames = useCallback((incoming: CensusSelectionPerson[]) => {
    let cacheChanged = false;
    for (const person of incoming) {
      const nombre = person.nombreCompleto.trim();
      if (!nombre || nameCache.get(person.id) === nombre) continue;
      nameCache.set(person.id, nombre);
      cacheChanged = true;
    }
    if (!cacheChanged) return;
    let changed = false;
    const next = peopleRef.current.map((person) => {
      const nombre = nameCache.get(person.id);
      if (!nombre || nombre === person.nombreCompleto) return person;
      changed = true;
      return { ...person, nombreCompleto: nombre };
    });
    if (!changed) return;
    peopleRef.current = next;
    setPeople(next);
  }, []);

  const clear = useCallback(() => {
    commit([]);
  }, [commit]);

  const pathname = usePathname();

  useLayoutEffect(() => {
    if (!isCensusList()) return;
    const urlIds = readSel();
    const stateIds = peopleRef.current.map((person) => person.id);
    if (stateIds.length === 0 && urlIds.length > 0) {
      const next = peopleFromIds(urlIds);
      peopleRef.current = next;
      currentIds = urlIds;
      setPeople(next);
      return;
    }
    const same =
      urlIds.length === stateIds.length && urlIds.every((id, index) => id === stateIds[index]);
    if (same) return;
    currentIds = stateIds;
    writeSelectionParam(stateIds);
  }, [pathname, people]);

  useEffect(() => {
    const onPop = () => {
      if (!isCensusList()) return;
      const ids = readSel();
      const next = peopleFromIds(ids);
      peopleRef.current = next;
      currentIds = ids;
      setPeople(next);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const value = useMemo(
    () => ({ people, adoptScope, toggle, setPageSelection, fillNames, clear }),
    [people, adoptScope, toggle, setPageSelection, fillNames, clear],
  );

  return <CensusSelectionContext.Provider value={value}>{children}</CensusSelectionContext.Provider>;
}

function useCensusSelectionContext() {
  const value = useContext(CensusSelectionContext);
  if (!value) {
    throw new Error("La selección del censo tiene que usarse dentro de CensusSelectionProvider.");
  }
  return value;
}

export function useCensusSelection(scope: string) {
  const { people, adoptScope } = useCensusSelectionContext();
  useLayoutEffect(() => {
    adoptScope(scope);
  }, [adoptScope, scope]);
  return people;
}

export function useCensusSelectionActions() {
  const { toggle, setPageSelection, fillNames, clear } = useCensusSelectionContext();
  return {
    toggleCensusPerson: toggle,
    setCensusPageSelection: setPageSelection,
    fillCensusNames: fillNames,
    clearCensusSelection: clear,
  };
}
