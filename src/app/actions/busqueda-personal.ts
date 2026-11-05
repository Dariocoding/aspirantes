"use server";

import { abrevJerarquiaAspirante } from "@src/lib/aspirantes/jerarquia-aspirante";
import { sexoEtiqueta } from "@src/lib/aspirantes/census";
import { requireSession } from "@src/lib/auth/guards";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { labelPeloton } from "@src/lib/pelotones";
import { prisma } from "@src/lib/prisma";
import { foldBusqueda } from "@src/lib/text/fold";

export type PersonaBusqueda = {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  fotoKey: string | null;
  sexo: string;
  grado: string;
  peloton: string | null;
};

export async function buscarPersonalGlobal(consulta: string, limite = 8): Promise<PersonaBusqueda[]> {
  const session = await requireSession();
  if (!hasPermission(authContextFromSession(session), Permission.ASPIRANTES_READ)) return [];

  const texto = consulta.trim();
  const q = foldBusqueda(texto);
  const cedula = texto.replace(/\D/g, "");
  const tokens = q
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2 && /[a-z]/.test(token));
  if (tokens.length === 0 && cedula.length < 3) return [];

  const partes: Array<
    | {
        AND: Array<{
          OR: Array<
            { nombresBusqueda: { contains: string } } | { apellidosBusqueda: { contains: string } }
          >;
        }>;
      }
    | { cedula: { contains: string } }
  > = [];
  if (tokens.length > 0) {
    partes.push({
      AND: tokens.map((token) => ({
        OR: [{ nombresBusqueda: { contains: token } }, { apellidosBusqueda: { contains: token } }],
      })),
    });
  }
  if (cedula.length >= 3) partes.push({ cedula: { contains: cedula } });

  const take = Math.min(30, Math.max(1, Math.floor(limite) || 8));
  const rows = await prisma.aspirante.findMany({
    where: { deletedAt: null, OR: partes },
    take,
    orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      cedula: true,
      fotoKey: true,
      sexo: true,
      jerarquia: true,
      peloton: { select: { numero: true, nombre: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    nombres: row.nombres,
    apellidos: row.apellidos,
    cedula: row.cedula,
    fotoKey: row.fotoKey,
    sexo: sexoEtiqueta(row.sexo),
    grado: abrevJerarquiaAspirante(row.jerarquia),
    peloton: row.peloton ? labelPeloton(row.peloton) : null,
  }));
}
