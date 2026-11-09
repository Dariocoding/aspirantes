"use server";

import { auth } from "@src/auth";
import { conversarConAgente, type MensajeAgente } from "@src/lib/agente-roles/gemini";
import { guardarSkillTexto, leerSkillGuardada } from "@src/lib/agente-roles/skill-store";
import { authContextFromSession } from "@src/lib/auth/from-session";

export type ResultadoSkill =
  | { ok: true; skill: string }
  | { ok: false; message: string };

export type ResultadoConversacion =
  | { ok: true; texto: string; pasos: string[]; skill: string | null }
  | { ok: false; message: string };

async function exigirSuper(): Promise<true | { ok: false; message: string }> {
  const session = await auth();
  const ctx = session?.user ? authContextFromSession(session) : null;
  if (!ctx?.isSuper) return { ok: false, message: "Solo el super administrador puede usar este agente." };
  return true;
}

export async function guardarSkillAgente(texto: string): Promise<ResultadoSkill> {
  const permiso = await exigirSuper();
  if (permiso !== true) return permiso;
  try {
    return await guardarSkillTexto(texto);
  } catch (error) {
    console.error("[agente-roles] guardar skill", error);
    return { ok: false, message: "No se pudo guardar la skill." };
  }
}

function mensajesLimpios(entrada: MensajeAgente[]): MensajeAgente[] | null {
  if (!Array.isArray(entrada) || entrada.length === 0 || entrada.length > 16) return null;
  const mensajes: MensajeAgente[] = [];
  for (const item of entrada) {
    if (!item || (item.role !== "user" && item.role !== "assistant")) return null;
    const text = typeof item.text === "string" ? item.text.trim().slice(0, 4000) : "";
    if (!text) return null;
    mensajes.push({ role: item.role, text });
  }
  if (mensajes.at(-1)?.role !== "user") return null;
  return mensajes;
}

export async function conversarAgenteRoles(entrada: MensajeAgente[]): Promise<ResultadoConversacion> {
  const permiso = await exigirSuper();
  if (permiso !== true) return permiso;
  const mensajes = mensajesLimpios(entrada);
  if (!mensajes) return { ok: false, message: "El mensaje no es válido." };
  try {
    const skill = await leerSkillGuardada();
    const respuesta = await conversarConAgente(mensajes, skill);
    return { ok: true, ...respuesta };
  } catch (error) {
    console.error("[agente-roles] conversar", error);
    const message = error instanceof Error ? error.message : "No pude consultar al agente.";
    return { ok: false, message };
  }
}
