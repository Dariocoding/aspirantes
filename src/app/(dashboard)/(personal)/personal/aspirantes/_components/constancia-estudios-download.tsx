export function constanciaEstudiosPdfUrl(aspiranteId: string): string {
  return `/api/aspirantes/constancia-estudios/pdf?ids=${encodeURIComponent(aspiranteId)}`;
}

export function openConstanciaEstudiosPdf(input: { ids?: string[]; url?: string }) {
  const url = input.ids?.length
    ? `/api/aspirantes/constancia-estudios/pdf?ids=${input.ids.map((id) => encodeURIComponent(id)).join(",")}`
    : (input.url ?? "/api/aspirantes/constancia-estudios/pdf");
  window.open(url, "_blank", "noopener,noreferrer");
}
