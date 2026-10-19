import type { JerarquiaAutoridad } from "@src/generated/prisma";
import type { MarcaDia } from "@src/lib/roles-servicio/marcas";

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
    fotoKey: string | null;
  } | null;
  autoridad: {
    id: string;
    nombres: string;
    apellidos: string;
    cedula: string | null;
    jerarquia: JerarquiaAutoridad;
  } | null;
};

export type PlanVista = {
  clave: string;
  nombre: string;
  curso: string;
  asignaciones: AsignacionVista[];
};
