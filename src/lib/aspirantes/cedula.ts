/** Cédula con separación de millares: 23537597 → 23.537.597. */
export function formatCedulaMillares(cedula: string): string {
  const digits = cedula.replace(/\D/g, "");
  if (!digits) return cedula.trim() || "—";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
