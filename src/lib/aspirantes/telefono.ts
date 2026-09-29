function formatUnTelefonoVenezolano(segment: string): string {
  const compact = segment.trim();
  if (!compact) return compact;
  let digits = compact.replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("58")) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  if (digits.length === 10 && digits.startsWith("4")) {
    return `0${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return compact;
}

/** Móvil venezolano como `04xx-xxxxxxx`. Acepta 10 u 11 dígitos, prefijo +58 y varios números. */
export function formatTelefonoVenezolano(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const parts = raw
    .split(/[/;,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return null;
  return parts.map(formatUnTelefonoVenezolano).join(", ");
}
