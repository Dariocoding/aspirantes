import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ManualUsuarioPdfDocument } from "@/lib/pdf/manual-usuario-document";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const generatedOn = new Date().toISOString().slice(0, 10);
  const doc = createElement(ManualUsuarioPdfDocument, { generatedOn });
  const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="manual-usuario-fanb-aspirantes.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}
