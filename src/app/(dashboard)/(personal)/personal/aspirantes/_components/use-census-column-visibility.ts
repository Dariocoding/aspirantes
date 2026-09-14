"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  CENSUS_COLUMNS_STORAGE_KEY,
  CENSUS_DEFAULT_VISIBLE_IDS,
  CENSUS_OPTIONAL_COLUMNS,
  parseCensusVisibleColumnIds,
  type CensusOptionalColumnId,
} from "@src/lib/aspirantes/census-table-columns";

const LEGACY_STORAGE_KEYS = [
  "personal.aspirantes.census.columns.v1",
  "personal.aspirantes.census.columns.v2",
] as const;
const CHANGE_EVENT = "aspirantes-census-columns-change";

let cachedRaw: string | null | undefined = undefined;
let cachedIds: CensusOptionalColumnId[] = [...CENSUS_DEFAULT_VISIBLE_IDS];

function readRawFromLocalStorage(): string | null {
  try {
    const current = window.localStorage.getItem(CENSUS_COLUMNS_STORAGE_KEY);
    if (current != null) return current;
    for (const key of LEGACY_STORAGE_KEYS) {
      const legacy = window.localStorage.getItem(key);
      if (legacy == null) continue;
      const migrated = JSON.stringify(withDocumentosIfMissing(parseStoredIds(legacy)));
      window.localStorage.setItem(CENSUS_COLUMNS_STORAGE_KEY, migrated);
      window.localStorage.removeItem(key);
      return migrated;
    }
    return null;
  } catch {
    return null;
  }
}

function withDocumentosIfMissing(ids: CensusOptionalColumnId[]): CensusOptionalColumnId[] {
  if (ids.includes("documentos")) return ids;
  return ["documentos", ...ids];
}

function parseStoredIds(raw: string | null): CensusOptionalColumnId[] {
  if (raw == null) return [...CENSUS_DEFAULT_VISIBLE_IDS];
  try {
    const parsed = parseCensusVisibleColumnIds(JSON.parse(raw) as unknown);
    return parsed ?? [...CENSUS_DEFAULT_VISIBLE_IDS];
  } catch {
    return [...CENSUS_DEFAULT_VISIBLE_IDS];
  }
}

function getSnapshot(): CensusOptionalColumnId[] {
  const raw = readRawFromLocalStorage();
  if (raw === cachedRaw) return cachedIds;
  cachedRaw = raw;
  cachedIds = parseStoredIds(raw);
  return cachedIds;
}

function getServerSnapshot(): CensusOptionalColumnId[] {
  return CENSUS_DEFAULT_VISIBLE_IDS;
}

function subscribe(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== CENSUS_COLUMNS_STORAGE_KEY && !LEGACY_STORAGE_KEYS.includes(event.key as (typeof LEGACY_STORAGE_KEYS)[number])) {
      return;
    }
    cachedRaw = undefined;
    onStoreChange();
  };
  const onLocal = () => {
    cachedRaw = undefined;
    onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onLocal);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onLocal);
  };
}

function writeVisibleIds(ids: CensusOptionalColumnId[]) {
  const unique = CENSUS_OPTIONAL_COLUMNS.map((c) => c.id).filter((id) => ids.includes(id));
  const raw = JSON.stringify(unique);
  try {
    window.localStorage.setItem(CENSUS_COLUMNS_STORAGE_KEY, raw);
  } catch {
    /* ignore quota / private mode */
  }
  cachedRaw = raw;
  cachedIds = unique;
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return unique;
}

export function useCensusColumnVisibility() {
  const visibleIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setVisibleIds = useCallback((next: CensusOptionalColumnId[]) => {
    writeVisibleIds(next);
  }, []);

  const toggleColumn = useCallback(
    (id: CensusOptionalColumnId, checked: boolean) => {
      writeVisibleIds(checked ? [...visibleIds, id] : visibleIds.filter((x) => x !== id));
    },
    [visibleIds],
  );

  return { visibleIds, setVisibleIds, toggleColumn };
}
