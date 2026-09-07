import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@src/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@src/components/ui/card";
import { StatsCards } from "@dashboard/_components/home/stats-cards";
import { formatDate, isBirthdayThisMonth, isBirthdayToday } from "@src/lib/date";
import { getConvocatoriaActiva } from "@src/lib/convocatoria";
import { prisma } from "@src/lib/prisma";
function tieneFechaNacimientoReal(fecha: Date) {
  // Placeholder de alta mínima: 1900-01-01
  return fecha.getFullYear() > 1900;
}

export default async function PersonalDashboardPage() {
  const convocatoriaActiva = await getConvocatoriaActiva();
  const aspiranteWhere = convocatoriaActiva ? { convocatoriaId: convocatoriaActiva.id } : {};

  const [aspirantes, efemerides] = await Promise.all([
    prisma.aspirante.findMany({ where: aspiranteWhere, orderBy: { nombres: "asc" } }),
    prisma.efemeride.findMany({ where: { activa: true }, orderBy: [{ mes: "asc" }, { dia: "asc" }] }),
  ]);

  const hoy = new Date();
  const proximos15 = addDays(hoy, 15);
  const nombreMes = format(hoy, "MMMM", { locale: es });

  const cumpleanosDelMes = aspirantes
    .filter(
      (a) => tieneFechaNacimientoReal(a.fechaNacimiento) && isBirthdayThisMonth(a.fechaNacimiento, hoy),
    )
    .sort((a, b) => {
      const diaDiff = a.fechaNacimiento.getDate() - b.fechaNacimiento.getDate();
      if (diaDiff !== 0) return diaDiff;
      return `${a.nombres} ${a.apellidos}`.localeCompare(`${b.nombres} ${b.apellidos}`, "es");
    });

  const proximasEfemerides = efemerides
    .map((item) => {
      const fecha = new Date(hoy.getFullYear(), item.mes - 1, item.dia);
      if (fecha < hoy) fecha.setFullYear(hoy.getFullYear() + 1);
      return { ...item, fecha };
    })
    .filter((item) => item.fecha <= proximos15)
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  const total = aspirantes.length;
  const masculinos = aspirantes.filter((a) => a.sexo === "MASCULINO").length;
  const femeninos = aspirantes.filter((a) => a.sexo === "FEMENINO").length;
  const edadPromedio = total ? aspirantes.reduce((acc, cur) => acc + cur.edad, 0) / total : 0;

  return (
    <div className="min-w-0 space-y-6">
      <header className="min-w-0 space-y-1">
        <h2 className="text-balance text-2xl font-bold text-slate-900">Dashboard de Control</h2>
        <p className="max-w-prose text-pretty text-sm text-slate-600">
          Seguimiento de personal, cumpleaños y efemérides.
          {convocatoriaActiva ? (
            <>
              {" "}
              Cifras del censo en la convocatoria activa:{" "}
              <span className="font-medium text-slate-800">{convocatoriaActiva.nombre}</span> (
              <span className="font-mono text-xs">{convocatoriaActiva.codigo}</span>).
            </>
          ) : (
            <>
              {" "}
              <span className="text-amber-800">No hay convocatoria activa</span>: no se muestran aspirantes en las
              tarjetas hasta que un administrador active un período en Convocatorias.
            </>
          )}
        </p>
      </header>

      <StatsCards total={total} masculinos={masculinos} femeninos={femeninos} edadPromedio={edadPromedio} />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cumpleaños de {nombreMes}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cumpleanosDelMes.length === 0 ? (
              <p className="text-sm text-slate-600">Nadie cumple años este mes en la convocatoria activa.</p>
            ) : (
              cumpleanosDelMes.map((persona) => {
                const esHoy = isBirthdayToday(persona.fechaNacimiento);
                return (
                  <div
                    key={persona.id}
                    className={
                      esHoy
                        ? "rounded-md border border-blue-200 bg-blue-50 p-3"
                        : "rounded-md border border-slate-200 bg-slate-50 p-3"
                    }
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className={`font-medium ${esHoy ? "text-blue-900" : "text-slate-900"}`}>
                          {persona.nombres} {persona.apellidos}
                        </p>
                        <p className={`text-sm ${esHoy ? "text-blue-700" : "text-slate-600"}`}>
                          C.I: {persona.cedula}
                        </p>
                      </div>
                      <p className={`text-sm font-medium tabular-nums ${esHoy ? "text-blue-800" : "text-slate-700"}`}>
                        {format(persona.fechaNacimiento, "d 'de' MMMM", { locale: es })}
                      </p>
                    </div>
                    {esHoy ? <Badge className="mt-2 bg-blue-700">Cumpleaños hoy</Badge> : null}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas Efemérides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {proximasEfemerides.length === 0 ? (
              <p className="text-sm text-slate-600">No hay efemérides en los próximos 15 días.</p>
            ) : (
              proximasEfemerides.map((item) => (
                <div key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-medium text-slate-900">{item.nombre}</p>
                  <p className="text-sm text-slate-600">{formatDate(item.fecha)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
