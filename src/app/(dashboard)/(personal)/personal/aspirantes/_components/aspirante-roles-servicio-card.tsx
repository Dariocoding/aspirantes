import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { routes } from "@src/lib/apps/routes";
import { etiquetaMes, type MarcaDia } from "@src/lib/roles-servicio/marcas";
import { turnoDesdeMarca } from "@src/lib/roles-servicio/turnos-marca";
import { cn } from "@src/lib/utils";
import { buttonVariants } from "@src/components/ui/button";

export type RolServicioPerfil = {
  id: string;
  rol: string;
  curso: string;
  anio: number;
  mes: number;
  dias: MarcaDia[];
};

export function AspiranteRolesServicioCard({ roles }: { roles: RolServicioPerfil[] }) {
  return (
    <Card className="shadow-sm ring-slate-200/80">
      <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex gap-2">
            <CalendarRange className="mt-0.5 h-4 w-4 text-slate-700" aria-hidden />
            <div>
              <CardTitle className="text-base">Roles de servicio</CardTitle>
              <CardDescription className="text-xs">Días en los que esta persona figura en un rol del mes.</CardDescription>
            </div>
          </div>
          <Link
            href={routes.personal.rolesServicio}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
          >
            Ver roles
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {roles.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">No figura en los roles de servicio cargados.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {roles.map((rol) => (
              <li key={rol.id} className="px-4 py-3">
                <p className="text-sm font-medium text-slate-900">{rol.rol}</p>
                <p className="text-xs text-slate-500">
                  {rol.curso} · {etiquetaMes(rol.anio, rol.mes)}
                </p>
                <p className="mt-1 text-xs text-slate-700">
                  {rol.dias.length === 0
                    ? "Sin días marcados"
                    : rol.dias
                        .map((dia) => {
                          const turno = turnoDesdeMarca(dia.marca);
                          if (turno) return `${dia.dia} (${turno.nombre})`;
                          return dia.marca === "X" ? String(dia.dia) : `${dia.dia} (${dia.marca})`;
                        })
                        .join(", ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
