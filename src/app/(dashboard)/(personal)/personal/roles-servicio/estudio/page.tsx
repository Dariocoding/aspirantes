import { unauthorized } from "next/navigation";
import type { AspiranteCenso } from "./_components/asignar-censo";
import { EstudioWizard, type RolEstudioInicial } from "./_components/estudio-wizard";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import {
  cuposSugeridos,
  esCategoriaRol,
  esPapelNocturno,
  gradoAutoridadCorto,
  inferirCategoria,
  type CategoriaRol,
  type PapelNocturno,
} from "@src/lib/roles-servicio/catalogo-rol";
import { abrevJerarquiaAspirante } from "@src/lib/aspirantes/jerarquia-aspirante";
import { prisma } from "@src/lib/prisma";

function numero(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

export default async function EstudioRolesPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; mes?: string; asignar?: string }>;
}) {
  const session = await auth();
  if (!session?.user) unauthorized();
  const ctx = authContextFromSession(session);
  if (!hasPermission(ctx, Permission.ASPIRANTES_WRITE)) unauthorized();

  const params = await searchParams;
  const modoAsignar = params.asignar === "1";
  const hoy = new Date();
  const reciente = await prisma.planRolServicio.findFirst({
    orderBy: [{ anio: "desc" }, { mes: "desc" }],
    select: { anio: true, mes: true },
  });
  const anio = numero(params.anio, reciente?.anio ?? hoy.getFullYear());
  const mes = numero(params.mes, reciente?.mes ?? hoy.getMonth() + 1);
  const anioOk = anio >= 2000 && anio <= 2100 ? anio : hoy.getFullYear();
  const mesOk = mes >= 1 && mes <= 12 ? mes : hoy.getMonth() + 1;

  const [rolesDb, autoridades, aspirantes] = await Promise.all([
    prisma.rolServicio.findMany({
      where: { activo: true },
      orderBy: { sortOrder: "asc" },
      include: {
        planes: {
          where: { anio: anioOk, mes: mesOk },
          include: {
            asignaciones: {
              orderBy: { orden: "asc" },
              include: {
                aspirante: { select: { id: true, nombres: true, apellidos: true } },
                autoridad: { select: { id: true, nombres: true, apellidos: true, jerarquia: true } },
              },
            },
          },
        },
      },
    }),
    prisma.autoridad.findMany({
      where: { activa: true },
      orderBy: [{ jerarquia: "asc" }, { apellidos: "asc" }],
      select: { id: true, nombres: true, apellidos: true, cedula: true, jerarquia: true },
    }),
    prisma.aspirante.findMany({
      where: { deletedAt: null },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        cedula: true,
        jerarquia: true,
        peloton: { select: { nombre: true, numero: true } },
      },
    }),
  ]);

  const roles: RolEstudioInicial[] = rolesDb.flatMap((rol) => {
    const planMes = rol.planes.find((plan) => plan.anio === anioOk && plan.mes === mesOk) ?? null;
    if (!planMes) return [];
    const categoria: CategoriaRol = esCategoriaRol(planMes.categoria) && planMes.categoria !== "OTROS"
      ? planMes.categoria
      : inferirCategoria(planMes.nombre);
    const papel: PapelNocturno = esPapelNocturno(planMes.papelNocturno) ? planMes.papelNocturno : "NINGUNO";
    const personas = planMes.asignaciones.map((item) => ({
      asignacionId: item.id,
      aspiranteId: item.aspiranteId,
      autoridadId: item.autoridadId,
      nombre: item.aspirante
        ? `${item.aspirante.nombres} ${item.aspirante.apellidos}`
        : item.autoridad
          ? `${item.autoridad.nombres} ${item.autoridad.apellidos}`
          : item.nombre,
      grado: item.grado,
    }));
    const hayAspirantes = personas.some((item) => item.aspiranteId);
    const hayAutoridades = personas.some((item) => item.autoridadId);
    const conAutoridad = !hayAspirantes && (planMes.conAutoridad || hayAutoridades);

    return [{
      id: rol.id,
      nombre: planMes.nombre,
      categoria,
      conAutoridad,
      papelNocturno: papel,
      incluido: modoAsignar,
      cuposPorDia: cuposSugeridos(planMes.nombre, papel, categoria),
      teniaPersonas: personas.length > 0,
      personas,
    }];
  });

  const curso = rolesDb.find((rol) => rol.curso.trim())?.curso ?? "CEFOA";
  const mesConMarcas = rolesDb.some((rol) =>
    rol.planes.some(
      (plan) =>
        plan.anio === anioOk &&
        plan.mes === mesOk &&
        plan.asignaciones.some((item) => Array.isArray(item.dias) && item.dias.length > 0),
    ),
  );

  const censo: AspiranteCenso[] = aspirantes.map((item) => ({
    id: item.id,
    nombres: item.nombres,
    apellidos: item.apellidos,
    cedula: item.cedula,
    grado: abrevJerarquiaAspirante(item.jerarquia),
    peloton: item.peloton?.nombre ?? "Sin pelotón",
    pelotonNumero: item.peloton?.numero ?? 999,
  }));

  return (
    <EstudioWizard
      anio={anioOk}
      mes={mesOk}
      curso={curso}
      mesConMarcas={mesConMarcas}
      modoAsignar={modoAsignar}
      sellado={rolesDb.some((rol) =>
        rol.planes.some((plan) => plan.anio === anioOk && plan.mes === mesOk && plan.sellado),
      )}
      rolesIniciales={roles}
      censo={censo}
      autoridades={autoridades.map((item) => ({
        id: item.id,
        nombres: item.nombres,
        apellidos: item.apellidos,
        cedula: item.cedula,
        jerarquia: item.jerarquia,
        grado: gradoAutoridadCorto(item.jerarquia),
      }))}
    />
  );
}
