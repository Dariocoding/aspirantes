"use client";

import { RolesServicioView, type PlanVista } from "./roles-servicio-view";

type Props = {
  anio: number;
  mes: number;
  planes: PlanVista[];
  rolInicial: string | null;
  diaHoy: number | null;
  canWrite: boolean;
  sellado?: boolean;
};

export function RolesServicioShell(props: Props) {
  return (
    <RolesServicioView
      anio={props.anio}
      mes={props.mes}
      planes={props.planes}
      rolInicial={props.rolInicial}
      diaHoy={props.diaHoy}
      canWrite={props.canWrite}
      sellado={props.sellado ?? false}
    />
  );
}
