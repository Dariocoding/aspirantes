const FOLD_PAIRS = [
  ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"],
  ["ÁÀÄÂ", "aaaa"],
  ["ÉÈËÊ", "eeee"],
  ["ÍÌÏÎ", "iiii"],
  ["ÓÒÖÔ", "oooo"],
  ["ÚÙÜÛ", "uuuu"],
  ["Ñ", "n"],
  ["áàäâ", "aaaa"],
  ["éèëê", "eeee"],
  ["íìïî", "iiii"],
  ["óòöô", "oooo"],
  ["úùüû", "uuuu"],
  ["ñ", "n"],
] as const;

/** Misma tabla que `fold_busqueda` en Postgres. */
export const FOLD_BUSQUEDA_FROM = FOLD_PAIRS.map(([from]) => from).join("");
export const FOLD_BUSQUEDA_TO = FOLD_PAIRS.map(([, to]) => to).join("");

/** Minúsculas y sin tildes: «Darío» y «dario» quedan en `dario`. */
export function foldBusqueda(value: string): string {
  const text = value.normalize("NFC");
  let out = "";
  for (const ch of text) {
    const at = FOLD_BUSQUEDA_FROM.indexOf(ch);
    out += at >= 0 ? FOLD_BUSQUEDA_TO[at]! : ch;
  }
  return out;
}
