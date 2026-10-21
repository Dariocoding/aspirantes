"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { duplicarRolesDeMes } from "@src/app/actions/roles-servicio-duplicar";
import { Button } from "@src/components/ui/button";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

type Props = {
  anio: number;
  mes: number;
  /** El mes actual ya tiene roles: se copian hacia el mes elegido. */
  tieneRoles: boolean;
  /** No se puede escribir en el mes actual. */
  sellado?: boolean;
};

function vecino(anio: number, mes: number, delta: number): { anio: number; mes: number } {
  const fecha = new Date(anio, mes - 1 + delta, 1);
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 };
}

export function DuplicarRolesControl({ anio, mes, tieneRoles, sellado = false }: Props) {
  const router = useRouter();
  const sugerido = useMemo(
    () => (tieneRoles ? vecino(anio, mes, 1) : vecino(anio, mes, -1)),
    [anio, mes, tieneRoles],
  );
  const [destinoAnio, setDestinoAnio] = useState(sugerido.anio);
  const [destinoMes, setDestinoMes] = useState(sugerido.mes);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bloqueado = !tieneRoles && sellado;

  const copiar = () => {
    setAviso(null);
    const origen = tieneRoles ? { anio, mes } : { anio: destinoAnio, mes: destinoMes };
    const destino = tieneRoles ? { anio: destinoAnio, mes: destinoMes } : { anio, mes };
    startTransition(async () => {
      const result = await duplicarRolesDeMes({
        origenAnio: origen.anio,
        origenMes: origen.mes,
        destinoAnio: destino.anio,
        destinoMes: destino.mes,
      });
      if (!result.ok) {
        setAviso(result.message);
        return;
      }
      const detalle =
        result.omitidos > 0
          ? ` ${result.omitidos} ya estaban y no se tocaron.`
          : "";
      setAviso(
        result.copiados === 0
          ? "Ese mes ya tenía esos roles."
          : `Se copiaron ${result.copiados} roles, con su personal y sin los días.${detalle}`,
      );
      router.refresh();
    });
  };

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-slate-500">
        {tieneRoles
          ? "Copiar los roles de este mes, con su personal, a otro mes. Los días no se copian."
          : "Traer los roles y el personal de otro mes. Los días no se copian."}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <select
          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
          value={destinoMes}
          disabled={bloqueado || pending}
          aria-label={tieneRoles ? "Mes de destino" : "Mes de origen"}
          onChange={(event) => setDestinoMes(Number(event.target.value))}
        >
          {MESES.map((nombre, index) => (
            <option key={nombre} value={index + 1}>
              {nombre}
            </option>
          ))}
        </select>
        <input
          type="number"
          className="h-8 w-20 rounded-md border border-slate-200 bg-white px-2 text-xs"
          value={destinoAnio}
          min={2000}
          max={2100}
          disabled={bloqueado || pending}
          aria-label="Año"
          onChange={(event) => setDestinoAnio(Number(event.target.value))}
        />
        <Button type="button" size="sm" className="h-8 gap-1.5 text-xs" disabled={bloqueado || pending} onClick={copiar}>
          <Copy className="size-3.5" aria-hidden />
          {tieneRoles ? "Copiar roles" : "Traer roles"}
        </Button>
      </div>
      {aviso ? <p className="text-[11px] text-slate-600">{aviso}</p> : null}
    </div>
  );
}
