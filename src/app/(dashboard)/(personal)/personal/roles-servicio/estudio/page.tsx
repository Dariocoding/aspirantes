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
  papelDesdeConfig,
  type CategoriaRol,
  type PapelNocturno,
} from "@src/lib/roles-servicio/catalogo-rol";
import { abrevJerarquiaAspirante } from "@src/lib/aspirantes/jerarquia-aspirante";
import { loadOrdenNocturnoConfig } from "@src/lib/roles-servicio/orden-del-dia/load-config-nocturno";
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
  const previo = mesOk === 1 ? { anio: anioOk - 1, mes: 12 } : { anio: anioOk, mes: mesOk - 1 };

  const [rolesDb, autoridades, config, aspirantes] = await Promise.all([
    prisma.rolServicio.findMany({
      where: { activo: true },
      orderBy: { sortOrder: "asc" },
      include: {
        planes: {
          where: {
            OR: [
              { anio: anioOk, mes: mesOk },
              { anio: previo.anio, mes: previo.mes },
            ],
          },
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
    loadOrdenNocturnoConfig(),
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

  const hayPlanEsteMes = rolesDb.some((rol) =>
    rol.planes.some((plan) => plan.anio === anioOk && plan.mes === mesOk),
  );

  const roles: RolEstudioInicial[] = rolesDb.map((rol) => {
    const planMes = rol.planes.find((plan) => plan.anio === anioOk && plan.mes === mesOk) ?? null;
    const planPrevio = rol.planes.find((plan) => plan.anio === previo.anio && plan.mes === previo.mes) ?? null;
    const fuente =
      planMes && planMes.asignaciones.length > 0 ? planMes : !planMes ? planPrevio : null;
    const conservarId = fuente === planMes;
    const categoria: CategoriaRol = esCategoriaRol(rol.categoria) && rol.categoria !== "OTROS"
      ? rol.categoria
      : inferirCategoria(rol.nombre);
    const papelDb: PapelNocturno = esPapelNocturno(rol.papelNocturno) ? rol.papelNocturno : "NINGUNO";
    const papel = papelDesdeConfig(rol.clave, config) ?? papelDb;
    const personas = (fuente?.asignaciones ?? []).map((item) => ({
      asignacionId: conservarId ? item.id : null,
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
    const conAutoridad = !hayAspirantes && (rol.conAutoridad || hayAutoridades);

    return {
      id: rol.id,
      nombre: rol.nombre,
      categoria,
      conAutoridad,
      papelNocturno: papel,
      incluido: modoAsignar ? (hayPlanEsteMes ? planMes != null : true) : !hayPlanEsteMes,
      cuposPorDia: cuposSugeridos(rol.nombre, papel, categoria),
      teniaPersonas: (planMes?.asignaciones.length ?? 0) > 0,
      personas,
    };
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
