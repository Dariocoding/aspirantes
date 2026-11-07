import type { PrismaClient } from "@src/generated/prisma";
import { marcasDesdeJson } from "@src/lib/roles-servicio/marcas";
import {
  extraerCedula,
  formatearRolesMes,
  mensajeAyudaCedula,
  type DiaMontado,
  type PersonaRolesMes,
  type RolMontado,
} from "@src/lib/telegram/consulta-cedula";
import { fechaEnCaracas } from "@src/lib/telegram/load-orden-hoy";

function mismaCedula(guardada: string | null | undefined, digitos: string): boolean {
  return (guardada ?? "").replace(/\D/g, "") === digitos;
}

function agruparRoles(
  filas: { nombre: string; dias: unknown }[],
): RolMontado[] {
  const porNombre = new Map<string, DiaMontado[]>();
  for (const fila of filas) {
    const dias = marcasDesdeJson(fila.dias);
    if (dias.length === 0) continue;
    const previas = porNombre.get(fila.nombre) ?? [];
    porNombre.set(fila.nombre, [...previas, ...dias]);
  }
  return [...porNombre.entries()].map(([nombre, dias]) => ({ nombre, dias }));
}

/** Texto que el bot debe responder a un mensaje privado. */
export async function textoRespuestaCedula(
  prisma: PrismaClient,
  texto: string,
  ahora = new Date(),
): Promise<string> {
  const cedula = extraerCedula(texto);
  if (!cedula) return mensajeAyudaCedula();

  const { anio, mes } = fechaEnCaracas(ahora);
  const [aspirantes, autoridades] = await Promise.all([
    prisma.aspirante.findMany({
      select: { id: true, nombres: true, apellidos: true, cedula: true },
    }),
    prisma.autoridad.findMany({
      where: { activa: true, cedula: { not: null } },
      select: { id: true, nombres: true, apellidos: true, cedula: true },
    }),
  ]);

  const personasAsp = aspirantes.filter((persona) => mismaCedula(persona.cedula, cedula));
  const personasAut = autoridades.filter((persona) => mismaCedula(persona.cedula, cedula));
  if (personasAsp.length === 0 && personasAut.length === 0) {
    return formatearRolesMes({ anio, mes, personas: [] });
  }

  const filtros: { aspiranteId?: { in: string[] }; autoridadId?: { in: string[] } }[] = [];
  if (personasAsp.length > 0) filtros.push({ aspiranteId: { in: personasAsp.map((p) => p.id) } });
  if (personasAut.length > 0) filtros.push({ autoridadId: { in: personasAut.map((p) => p.id) } });

  const asignaciones = await prisma.asignacionRolServicio.findMany({
    where: { OR: filtros, plan: { anio, mes } },
    select: {
      aspiranteId: true,
      autoridadId: true,
      dias: true,
      plan: { select: { nombre: true } },
    },
  });

  const personas: PersonaRolesMes[] = [
    ...personasAsp.map((persona) => ({
      apellidos: persona.apellidos,
      nombres: persona.nombres,
      cedula: persona.cedula,
      roles: agruparRoles(
        asignaciones
          .filter((fila) => fila.aspiranteId === persona.id)
          .map((fila) => ({ nombre: fila.plan.nombre, dias: fila.dias })),
      ),
    })),
    ...personasAut.map((persona) => ({
      apellidos: persona.apellidos,
      nombres: persona.nombres,
      cedula: persona.cedula ?? cedula,
      roles: agruparRoles(
        asignaciones
          .filter((fila) => fila.autoridadId === persona.id)
          .map((fila) => ({ nombre: fila.plan.nombre, dias: fila.dias })),
      ),
    })),
  ];

  return formatearRolesMes({ anio, mes, personas });
}
