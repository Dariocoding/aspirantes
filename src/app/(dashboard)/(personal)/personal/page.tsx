import { addDays, differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { PersonalHomeBoard } from "./_components/personal-home-board";
import { ageFromBirthDate, ageTurningOnBirthday, formatDate, formatDateTime, hasRealBirthDate, isBirthdayThisMonth, isBirthdayToday } from "@src/lib/date";
import { labelTipoPermiso } from "@src/lib/permisos";
import { getConvocatoriaActiva } from "@src/lib/convocatoria";
import { labelPeloton } from "@src/lib/pelotones";
import { prisma } from "@src/lib/prisma";

export default async function PersonalDashboardPage() {
  const convocatoriaActiva = await getConvocatoriaActiva();

  const [aspirantes, efemerides, pelotonesDb, permisosVigentesDb] = await Promise.all([
    convocatoriaActiva
      ? prisma.aspirante.findMany({
          where: { convocatoriaId: convocatoriaActiva.id },
          orderBy: { nombres: "asc" },
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            cedula: true,
            sexo: true,
            fechaNacimiento: true,
            fotoKey: true,
            pelotonId: true,
          },
        })
      : Promise.resolve([]),
    prisma.efemeride.findMany({ where: { activa: true }, orderBy: [{ mes: "asc" }, { dia: "asc" }] }),
    convocatoriaActiva
      ? prisma.peloton.findMany({
          where: { convocatoriaId: convocatoriaActiva.id },
          orderBy: { numero: "asc" },
          select: {
            id: true,
            numero: true,
            nombre: true,
            _count: { select: { aspirantes: true } },
          },
        })
      : Promise.resolve([]),
    prisma.permisoPersonal.findMany({
      where: {
        anulado: false,
        fechaInicio: { lte: new Date() },
        fechaFin: { gte: new Date() },
        ...(convocatoriaActiva ? { aspirante: { convocatoriaId: convocatoriaActiva.id } } : {}),
      },
      orderBy: { fechaFin: "asc" },
      take: 20,
      include: {
        aspirante: { select: { id: true, nombres: true, apellidos: true, fotoKey: true } },
      },
    }),
  ]);

  const hoy = new Date();
  const proximos15 = addDays(hoy, 15);
  const nombreMes = format(hoy, "MMMM", { locale: es });
  const fechaLarga = format(hoy, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

  const cumpleanosDelMes = aspirantes
    .filter((a) => hasRealBirthDate(a.fechaNacimiento) && isBirthdayThisMonth(a.fechaNacimiento, hoy))
    .sort((a, b) => {
      const diaDiff = a.fechaNacimiento.getDate() - b.fechaNacimiento.getDate();
      if (diaDiff !== 0) return diaDiff;
      return `${a.nombres} ${a.apellidos}`.localeCompare(`${b.nombres} ${b.apellidos}`, "es");
    })
    .map((persona) => ({
      id: persona.id,
      nombres: persona.nombres,
      apellidos: persona.apellidos,
      cedula: persona.cedula,
      fotoKey: persona.fotoKey,
      dia: persona.fechaNacimiento.getDate(),
      fechaLabel: format(persona.fechaNacimiento, "d 'de' MMMM", { locale: es }),
      esHoy: isBirthdayToday(persona.fechaNacimiento),
      edadQueCumple: ageTurningOnBirthday(persona.fechaNacimiento, hoy),
    }));

  const proximasEfemerides = efemerides
    .map((item) => {
      const fecha = new Date(hoy.getFullYear(), item.mes - 1, item.dia);
      if (fecha < hoy) fecha.setFullYear(hoy.getFullYear() + 1);
      return { ...item, fecha };
    })
    .filter((item) => item.fecha <= proximos15)
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
    .map((item) => ({
      id: item.id,
      nombre: item.nombre,
      fechaLabel: formatDate(item.fecha),
      dias: Math.max(0, differenceInCalendarDays(item.fecha, hoy)),
    }));

  const total = aspirantes.length;
  const masculinos = aspirantes.filter((a) => a.sexo === "MASCULINO").length;
  const femeninos = aspirantes.filter((a) => a.sexo === "FEMENINO").length;
  const edades = aspirantes
    .map((a) => ageFromBirthDate(a.fechaNacimiento))
    .filter((n): n is number => n != null);
  const edadPromedio = edades.length ? edades.reduce((acc, cur) => acc + cur, 0) / edades.length : 0;
  const sinPeloton = aspirantes.filter((a) => !a.pelotonId).length;

  return (
    <PersonalHomeBoard
      fechaLarga={fechaLarga}
      nombreMes={nombreMes}
      convocatoria={
        convocatoriaActiva
          ? {
              nombre: convocatoriaActiva.nombre,
              codigo: convocatoriaActiva.codigo,
              anio: convocatoriaActiva.anio,
              comandanteNombre: convocatoriaActiva.comandanteNombre,
            }
          : null
      }
      total={total}
      masculinos={masculinos}
      femeninos={femeninos}
      edadPromedio={edadPromedio}
      sinPeloton={sinPeloton}
      pelotones={pelotonesDb.map((p) => ({
        id: p.id,
        label: labelPeloton(p),
        count: p._count.aspirantes,
      }))}
      cumpleanosDelMes={cumpleanosDelMes}
      proximasEfemerides={proximasEfemerides}
      permisosVigentes={permisosVigentesDb.map((p) => ({
        id: p.id,
        aspiranteId: p.aspirante.id,
        nombres: p.aspirante.nombres,
        apellidos: p.aspirante.apellidos,
        fotoKey: p.aspirante.fotoKey,
        tipoLabel: labelTipoPermiso(p.tipo),
        hastaLabel: formatDateTime(p.fechaFin),
      }))}
    />
  );
}
