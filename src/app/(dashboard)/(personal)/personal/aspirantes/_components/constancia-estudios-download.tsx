"use client";

export function constanciaEstudiosPdfUrl(aspiranteId: string): string {
  return `/api/aspirantes/constancia-estudios/pdf?ids=${encodeURIComponent(aspiranteId)}`;
}

function filenameFromContentDisposition(header: string | null, fallback: string) {
  if (!header) return fallback;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].trim());
    } catch {
      return star[1].trim();
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(header);
  if (quoted?.[1]) return quoted[1];
  const plain = /filename=([^;]+)/i.exec(header);
  if (plain?.[1]) return plain[1].trim().replace(/^"+|"+$/g, "");
  return fallback;
}

async function saveBlob(res: Response, fallbackName: string) {
  const blob = await res.blob();
  const filename = filenameFromContentDisposition(res.headers.get("Content-Disposition"), fallbackName);
  const href = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(href);
  }
}

export async function downloadConstanciaEstudiosPdf(input: {
  ids?: string[];
  url?: string;
  fallbackName?: string;
}): Promise<void> {
  const res = input.ids?.length
    ? await fetch("/api/aspirantes/constancia-estudios/pdf", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: input.ids }),
      })
    : await fetch(input.url ?? "/api/aspirantes/constancia-estudios/pdf", { credentials: "same-origin" });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? `No se pudo generar el PDF (${res.status}).`);
  }
  await saveBlob(res, input.fallbackName ?? "constancia-estudios.pdf");
}
