import { auth } from "@src/auth";
import { conversarConAgente, mensajesDelAgente } from "@src/lib/agente-roles/gemini";
import { leerSkillGuardada } from "@src/lib/agente-roles/skill-store";
import { authContextFromSession } from "@src/lib/auth/from-session";

export const runtime = "nodejs";
export const maxDuration = 800;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  const ctx = session?.user ? authContextFromSession(session) : null;
  if (!ctx?.isSuper) {
    return Response.json({ ok: false, message: "Solo el super administrador puede usar este agente." }, { status: 403 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ ok: false, message: "El mensaje no es válido." }, { status: 400 });
  }
  const mensajes = mensajesDelAgente((cuerpo as { mensajes?: unknown })?.mensajes);
  if (!mensajes) {
    return Response.json({ ok: false, message: "El mensaje no es válido." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const enviar = (evento: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(evento)}\n`));
      };
      const latido = setInterval(() => {
        try {
          controller.enqueue(encoder.encode("\n"));
        } catch {
          clearInterval(latido);
        }
      }, 8_000);
      try {
        const skill = await leerSkillGuardada();
        const respuesta = await conversarConAgente(mensajes, skill, (texto) => enviar({ tipo: "aviso", texto }));
        enviar({ tipo: "listo", ok: true, ...respuesta });
      } catch (error) {
        console.error("[agente-roles]", error);
        const message = error instanceof Error ? error.message : "No pude consultar al agente.";
        enviar({ tipo: "error", ok: false, message });
      } finally {
        clearInterval(latido);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
