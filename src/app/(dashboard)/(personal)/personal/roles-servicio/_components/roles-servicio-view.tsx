import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { routes } from "@src/lib/apps/routes";
import {
  diasDelMes,
  esFinDeSemana,
  etiquetaMes,
  letraSemana,
  type MarcaDia,
} from "@src/lib/roles-servicio/marcas";
import { cn } from "@src/lib/utils";

export type AsignacionVista = {
  id: string;
  orden: number;
  grado: string;
  nombre: string;
  dias: MarcaDia[];
  aspirante: {
    id: string;
    nombres: string;
    apellidos: string;
    cedula: string;
  } | null;
};

export type PlanVista = {
  clave: string;
  nombre: string;
  curso: string;
  asignaciones: AsignacionVista[];
};

type Props = {
  anio: number;
  mes: number;
  planes: PlanVista[];
  activo: PlanVista | null;
  diaHoy: number | null;
};

function marcaDelDia(asignacion: AsignacionVista, dia: number): string | null {
  return asignacion.dias.find((item) => item.dia === dia)?.marca ?? null;
}

export function RolesServicioView({ anio, mes, planes, activo, diaHoy }: Props) {
  const dias = Array.from({ length: diasDelMes(anio, mes) }, (_, index) => index + 1);
  const servicioHoy =
    diaHoy == null
      ? []
      : planes.flatMap((plan) =>
          plan.asignaciones
            .filter((asignacion) => asignacion.dias.some((item) => item.dia === diaHoy))
            .map((asignacion) => ({
              plan,
              asignacion,
              marca: marcaDelDia(asignacion, diaHoy) ?? "X",
            })),
        );

  const vinculados = planes.reduce(
    (total, plan) => total + plan.asignaciones.filter((item) => item.aspirante).length,
    0,
  );
  const conNombre = planes.reduce(
    (total, plan) => total + plan.asignaciones.filter((item) => item.nombre.trim()).length,
    0,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-2">
          <CalendarRange className="mt-1 h-5 w-5 text-slate-800" aria-hidden />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Roles de servicio</h1>
            <p className="text-sm text-slate-500">
              {etiquetaMes(anio, mes)}. {vinculados} de {conNombre} nombres coinciden con el censo.
            </p>
          </div>
        </div>
      </div>

      {diaHoy != null && servicioHoy.length > 0 ? (
        <Card className="shadow-sm ring-slate-200/80">
          <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-amber-50 to-white pb-3">
            <CardTitle className="text-base">Servicio del día {diaHoy}</CardTitle>
            <CardDescription className="text-xs">Personal marcado para hoy en todos los roles.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {servicioHoy.map(({ plan, asignacion, marca }) => (
              <div key={`${plan.clave}-${asignacion.id}`} className="rounded-md border border-slate-200 bg-white px-3 py-2">
                <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">{plan.nombre}</p>
                <PersonaRol asignacion={asignacion} />
                {marca !== "X" ? <p className="text-xs text-slate-500">Marca {marca}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {planes.map((plan) => {
          const activos = plan.asignaciones.filter((item) => item.nombre.trim()).length;
          const ligados = plan.asignaciones.filter((item) => item.aspirante).length;
          const seleccionado = plan.clave === activo?.clave;
          return (
            <Link
              key={plan.clave}
              href={`${routes.personal.rolesServicio}?rol=${encodeURIComponent(plan.clave)}`}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
                seleccionado
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
              )}
            >
              <span className="block font-medium">{plan.nombre}</span>
              <span className={cn("block", seleccionado ? "text-slate-300" : "text-slate-500")}>
                {plan.curso} · {ligados}/{activos || plan.asignaciones.length}
              </span>
            </Link>
          );
        })}
      </div>

      {activo ? (
        <Card className="shadow-sm ring-slate-200/80">
          <CardHeader className="border-b border-slate-200/80">
            <CardTitle className="text-base">{activo.nombre}</CardTitle>
            <CardDescription className="text-xs">
              {activo.curso}. La X marca el día de servicio. Un número es la marca que trae el rol.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {activo.asignaciones.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">Este rol todavía no tiene personal asignado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-max min-w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="sticky left-0 z-20 bg-slate-50 px-3 py-2 text-left font-medium">Personal</th>
                      {dias.map((dia) => (
                        <th
                          key={dia}
                          className={cn(
                            "w-7 px-0 py-1 text-center font-medium",
                            esFinDeSemana(anio, mes, dia) && "bg-slate-100",
                            dia === diaHoy && "bg-amber-100 text-amber-950",
                          )}
                        >
                          <span className="block text-[10px]">{letraSemana(anio, mes, dia)}</span>
                          {dia}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activo.asignaciones.map((asignacion) => (
                      <tr key={asignacion.id} className="border-b border-slate-100">
                        <td className="sticky left-0 z-10 min-w-56 bg-white px-3 py-2 align-top">
                          <p className="text-[10px] tracking-wide text-slate-400 uppercase">
                            {asignacion.orden}. {asignacion.grado}
                          </p>
                          <PersonaRol asignacion={asignacion} />
                        </td>
                        {dias.map((dia) => {
                          const marca = marcaDelDia(asignacion, dia);
                          return (
                            <td
                              key={dia}
                              className={cn(
                                "px-0 py-2 text-center font-semibold text-slate-800",
                                esFinDeSemana(anio, mes, dia) && "bg-slate-50",
                                dia === diaHoy && "bg-amber-50",
                              )}
                            >
                              {marca ?? ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-slate-500">No hay roles de servicio cargados para este mes.</p>
      )}
    </div>
  );
}

function PersonaRol({ asignacion }: { asignacion: AsignacionVista }) {
  if (!asignacion.nombre.trim()) {
    return <p className="text-sm text-slate-400">Sin nombre en el rol</p>;
  }
  if (!asignacion.aspirante) {
    return (
      <p>
        <span className="text-sm font-medium text-slate-900">{asignacion.nombre}</span>
        <span className="mt-0.5 block text-[11px] text-amber-700">Sin coincidencia en el censo</span>
      </p>
    );
  }
  const { aspirante } = asignacion;
  return (
    <p>
      <Link href={routes.personal.aspirante(aspirante.id)} className="text-sm font-medium text-slate-900 hover:underline">
        {aspirante.nombres} {aspirante.apellidos}
      </Link>
      <span className="mt-0.5 block text-[11px] text-slate-500">
        En el rol: {asignacion.nombre} · {aspirante.cedula}
      </span>
    </p>
  );
}
