"use client";

import { useState } from "react";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import { redSocialModo, redSocialUsuario } from "@src/lib/aspirantes/senaletica";

const selectClass =
  "flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function RedSocialField({
  id,
  label,
  estadoName,
  usuarioName,
  stored,
}: {
  id: string;
  label: string;
  estadoName: string;
  usuarioName: string;
  stored: string | null | undefined;
}) {
  const [modo, setModo] = useState(redSocialModo(stored));

  return (
    <div className="grid gap-2.5 sm:grid-cols-2 sm:col-span-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        <select
          id={id}
          name={estadoName}
          value={modo}
          onChange={(e) => setModo(e.target.value as typeof modo)}
          className={selectClass}
        >
          <option value="">Sin indicar</option>
          <option value="NO_POSEE">No posee redes sociales</option>
          <option value="POSEE">Sí posee</option>
        </select>
      </div>
      {modo === "POSEE" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-usuario`}>Usuario o enlace</Label>
          <Input
            id={`${id}-usuario`}
            name={usuarioName}
            defaultValue={redSocialUsuario(stored)}
            placeholder="@usuario"
            className="h-8"
          />
        </div>
      ) : (
        <input type="hidden" name={usuarioName} value="" />
      )}
    </div>
  );
}
