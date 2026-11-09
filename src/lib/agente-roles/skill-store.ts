import { prisma } from "@src/lib/prisma";
import { SKILL_INICIAL } from "@src/lib/agente-roles/skill-inicial";

export const AGENTE_ROLES_ID = "agente_roles";

const MIN_SKILL = 40;
const MAX_SKILL = 20_000;

export function validarSkill(texto: string): { ok: true; skill: string } | { ok: false; message: string } {
  const skill = texto.replace(/\r\n/g, "\n").trim();
  if (skill.length < MIN_SKILL) {
    return { ok: false, message: "La skill quedó demasiado corta. Conserva las reglas que siguen vigentes." };
  }
  if (skill.length > MAX_SKILL) {
    return { ok: false, message: "La skill pasa de 20.000 caracteres." };
  }
  return { ok: true, skill };
}

export async function leerSkillGuardada(): Promise<string> {
  const fila = await prisma.agenteRolesConfig.findUnique({
    where: { id: AGENTE_ROLES_ID },
    select: { skill: true },
  });
  if (fila) return fila.skill;

  try {
    const creada = await prisma.agenteRolesConfig.create({
      data: { id: AGENTE_ROLES_ID, skill: SKILL_INICIAL },
      select: { skill: true },
    });
    return creada.skill;
  } catch {
    const otra = await prisma.agenteRolesConfig.findUnique({
      where: { id: AGENTE_ROLES_ID },
      select: { skill: true },
    });
    if (otra) return otra.skill;
    throw new Error("No se pudo crear la skill del agente.");
  }
}

export async function guardarSkillTexto(texto: string): Promise<{ ok: true; skill: string } | { ok: false; message: string }> {
  const validada = validarSkill(texto);
  if (!validada.ok) return validada;
  await prisma.agenteRolesConfig.upsert({
    where: { id: AGENTE_ROLES_ID },
    create: { id: AGENTE_ROLES_ID, skill: validada.skill },
    update: { skill: validada.skill },
  });
  return { ok: true, skill: validada.skill };
}
