import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

/** Sin sesión o sin permiso el documento no se distingue de una ruta inexistente. */
export function pdfNoEncontrado(): never {
  notFound();
}

export function inlinePdfResponse(body: Buffer | Uint8Array, filename: string) {
  return new NextResponse(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
