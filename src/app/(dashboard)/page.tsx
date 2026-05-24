import { addDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { formatDate, isBirthdayToday } from "@/lib/date";
import { getConvocatoriaActiva } from "@/lib/convocatoria";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const convocatoriaActiva = await getConvocatoriaActiva();
  const aspiranteWhere = convocatoriaActiva ? { convocatoriaId: convocatoriaActiva.id } : {};

  const [aspirantes, efemerides] = await Promise.all([
    prisma.aspirante.findMany({ where: aspiranteWhere, orderBy: { nombres: "asc" } }),
    prisma.efemeride.findMany({ where: { activa: true }, orderBy: [{ mes: "asc" }, { dia: "asc" }] }),
  ]);

  const hoy = new Date();
  const proximos15 = addDays(hoy, 15);

  const cumpleanosHoy = aspirantes.filter((a) => isBirthdayToday(a.fechaNacimiento));

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
            <CardTitle>Cumpleaños del día</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cumpleanosHoy.length === 0 ? (
              <p className="text-sm text-slate-600">No hay cumpleaños registrados para hoy.</p>
            ) : (
              cumpleanosHoy.map((persona) => (
                <div key={persona.id} className="rounded-md border border-blue-200 bg-blue-50 p-3">
                  <p className="font-medium text-blue-900">
                    {persona.nombres} {persona.apellidos}
                  </p>
                  <p className="text-sm text-blue-700">C.I: {persona.cedula}</p>
                  <Badge className="mt-2 bg-blue-700">Cumpleaños hoy</Badge>
                </div>
              ))
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
