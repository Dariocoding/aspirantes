"use client";

import { useState } from "react";
import { LayoutGrid, UserCog } from "lucide-react";
import { AutoridadesPanel, type AutoridadVista } from "./autoridades-panel";
import { RolesServicioView, type PlanVista } from "./roles-servicio-view";
import { cn } from "@src/lib/utils";

type Props = {
  anio: number;
  mes: number;
  planes: PlanVista[];
  rolInicial: string | null;
  diaHoy: number | null;
  autoridades: AutoridadVista[];
  canWrite: boolean;
};

export function RolesServicioShell(props: Props) {
  const [seccion, setSeccion] = useState<"cuadro" | "autoridades">("cuadro");

  return (
    <div className="flex flex-col gap-5">
      <div className="inline-flex w-fit rounded-lg bg-slate-100 p-1">
        {(
          [
            { id: "cuadro", label: "Cuadro de servicio", icon: LayoutGrid },
            { id: "autoridades", label: "Autoridades", icon: UserCog },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const activo = seccion === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSeccion(item.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                activo
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </div>

      {seccion === "cuadro" ? (
        <RolesServicioView
          anio={props.anio}
          mes={props.mes}
          planes={props.planes}
          rolInicial={props.rolInicial}
          diaHoy={props.diaHoy}
        />
      ) : (
        <AutoridadesPanel autoridades={props.autoridades} canWrite={props.canWrite} />
      )}
    </div>
  );
}
