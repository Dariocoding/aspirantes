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

export async function buscarPersonalGlobal(consulta: string): Promise<PersonaBusqueda[]> {
  const session = await requireSession();
  if (!hasPermission(authContextFromSession(session), Permission.ASPIRANTES_READ)) return [];

  const texto = consulta.trim();
  const q = foldBusqueda(texto);
  const cedula = texto.replace(/\D/g, "");
  if (q.length < 2 && cedula.length < 3) return [];

  const or: Array<
    | { nombresBusqueda: { contains: string } }
    | { apellidosBusqueda: { contains: string } }
    | { cedula: { contains: string } }
  > = [];
  if (q.length >= 2) {
    or.push({ nombresBusqueda: { contains: q } });
    or.push({ apellidosBusqueda: { contains: q } });
  }
  if (cedula.length >= 3) or.push({ cedula: { contains: cedula } });

  const rows = await prisma.aspirante.findMany({
    where: { deletedAt: null, OR: or },
    take: 8,
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
