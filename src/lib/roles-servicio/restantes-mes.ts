import { diasDelMes, etiquetaMes, letraSemana, type MarcaDia } from "@src/lib/roles-servicio/marcas";
import { turnoDesdeMarca } from "@src/lib/roles-servicio/turnos-marca";

export type PersonaRestanteInput = {
  orden: number;
  grado: string;
  nombre: string;
  dias: MarcaDia[];
  aspirante: { nombres: string; apellidos: string } | null;
  autoridad: { nombres: string; apellidos: string } | null;
};

export type PlanRestanteInput = {
  clave: string;
  nombre: string;
  curso: string;
  asignaciones: PersonaRestanteInput[];
};

export type RestantesMesInput = {
  anio: number;
  mes: number;
  /** Primer día a incluir (inclusive). */
  desde: number;
  planes: PlanRestanteInput[];
  generadoEn?: Date;
};

function nombreMostrado(persona: PersonaRestanteInput): string {
  if (persona.aspirante) {
    return `${persona.aspirante.nombres} ${persona.aspirante.apellidos}`.trim().toUpperCase();
  }
  if (persona.autoridad) {
    return `${persona.autoridad.nombres} ${persona.autoridad.apellidos}`.trim().toUpperCase();
  }
  return (persona.nombre.trim() || "(SIN NOMBRE)").toUpperCase();
}

function diasRestantes(dias: MarcaDia[], desde: number, ultimo: number): MarcaDia[] {
  return dias
    .filter((d) => d.dia >= desde && d.dia <= ultimo)
    .sort((a, b) => a.dia - b.dia);
}

function etiquetaDiaMarca(marca: MarcaDia): string {
  const turno = turnoDesdeMarca(marca.marca);
  if (turno) return `${marca.dia}(${turno.etiqueta})`;
  if (marca.marca && marca.marca !== "X") return `${marca.dia}(${marca.marca})`;
  return String(marca.dia);
}

function linea(char: string, ancho = 72): string {
  return char.repeat(ancho);
}

function clavePersona(persona: PersonaRestanteInput): string {
  if (persona.aspirante) {
    return `asp:${persona.aspirante.nombres}|${persona.aspirante.apellidos}`.toUpperCase();
  }
  if (persona.autoridad) {
    return `aut:${persona.autoridad.nombres}|${persona.autoridad.apellidos}`.toUpperCase();
  }
  return `raw:${persona.nombre}`.toUpperCase();
}

/** Día inicial para “restantes”: hoy si el mes es el actual; si no, el 1. */
export function diaDesdeRestantes(anio: number, mes: number, ahora = new Date()): number {
  if (ahora.getFullYear() === anio && ahora.getMonth() + 1 === mes) {
    return ahora.getDate();
  }
  return 1;
}

/**
 * Documento de texto con quienes aún tienen servicio desde `desde` hasta fin de mes.
 * Secciones: por rol, por persona y por día.
 */
export function formatearRestantesMes(input: RestantesMesInput): string {
  const { anio, mes, planes } = input;
  const ultimo = diasDelMes(anio, mes);
  const desde = Math.min(Math.max(1, input.desde), ultimo);
  const generado = input.generadoEn ?? new Date();
  const mesLabel = etiquetaMes(anio, mes).toUpperCase();

  type Fila = {
    planNombre: string;
    planClave: string;
    orden: number;
    grado: string;
    display: string;
    personaKey: string;
    dias: MarcaDia[];
  };

  const filas: Fila[] = [];
  for (const plan of planes) {
    for (const asg of plan.asignaciones) {
      const dias = diasRestantes(asg.dias, desde, ultimo);
      if (dias.length === 0) continue;
      filas.push({
        planNombre: plan.nombre,
        planClave: plan.clave,
        orden: asg.orden,
        grado: asg.grado.trim().toUpperCase() || "—",
        display: nombreMostrado(asg),
        personaKey: clavePersona(asg),
        dias,
      });
    }
  }

  const out: string[] = [];
  out.push(linea("="));
  out.push("SERVICIOS RESTANTES DEL MES");
  out.push(`${mesLabel} · Desde el día ${String(desde).padStart(2, "0")} (inclusive)`);
  out.push(
    `Generado: ${generado.toLocaleString("es-VE", {
      dateStyle: "short",
      timeStyle: "short",
    })}`,
  );
  out.push(linea("="));
  out.push("");

  if (filas.length === 0) {
    out.push("No quedan servicios asignados desde esa fecha hasta fin de mes.");
    out.push("");
    return out.join("\n");
  }

  // —— Por rol ——
  out.push(linea("-"));
  out.push("1. POR ROL");
  out.push(linea("-"));
  out.push("");

  const ordenRoles = [...new Map(planes.map((p) => [p.clave, p.nombre])).entries()];
  for (const [clave, nombreRol] of ordenRoles) {
    const delRol = filas
      .filter((f) => f.planClave === clave)
      .sort((a, b) => a.orden - b.orden || a.display.localeCompare(b.display, "es"));
    if (delRol.length === 0) continue;

    out.push(nombreRol.toUpperCase());
    let n = 1;
    for (const fila of delRol) {
      const diasTxt = fila.dias.map(etiquetaDiaMarca).join(", ");
      out.push(`  ${n}. ${fila.grado} ${fila.display}`);
      out.push(`     Días: ${diasTxt}`);
      n += 1;
    }
    out.push("");
  }

  // —— Por persona ——
  out.push(linea("-"));
  out.push("2. POR PERSONA");
  out.push(linea("-"));
  out.push("");

  const porPersona = new Map<string, { display: string; items: Fila[] }>();
  for (const fila of filas) {
    const cur = porPersona.get(fila.personaKey) ?? { display: fila.display, items: [] };
    cur.items.push(fila);
    porPersona.set(fila.personaKey, cur);
  }

  const personasOrdenadas = [...porPersona.values()].sort((a, b) =>
    a.display.localeCompare(b.display, "es"),
  );

  for (const persona of personasOrdenadas) {
    out.push(persona.display);
    const items = [...persona.items].sort((a, b) =>
      a.planNombre.localeCompare(b.planNombre, "es"),
    );
    for (const item of items) {
      out.push(`  · ${item.planNombre.toUpperCase()} — ${item.dias.map(etiquetaDiaMarca).join(", ")}`);
    }
    out.push("");
  }

  // —— Por día ——
  out.push(linea("-"));
  out.push("3. POR DÍA");
  out.push(linea("-"));
  out.push("");

  for (let dia = desde; dia <= ultimo; dia += 1) {
    const delDia = filas
      .map((f) => {
        const marca = f.dias.find((d) => d.dia === dia);
        if (!marca) return null;
        return { ...f, marca };
      })
      .filter((x): x is Fila & { marca: MarcaDia } => x != null)
      .sort(
        (a, b) =>
          a.planNombre.localeCompare(b.planNombre, "es") ||
          a.orden - b.orden ||
          a.display.localeCompare(b.display, "es"),
      );

    if (delDia.length === 0) continue;

    const letra = letraSemana(anio, mes, dia);
    out.push(`DÍA ${String(dia).padStart(2, "0")} (${letra})`);
    for (const fila of delDia) {
      const turno = turnoDesdeMarca(fila.marca.marca);
      const extra = turno
        ? ` [${turno.etiqueta}]`
        : fila.marca.marca !== "X"
          ? ` [${fila.marca.marca}]`
          : "";
      out.push(`  · ${fila.planNombre.toUpperCase()}${extra} — ${fila.grado} ${fila.display}`);
    }
    out.push("");
  }

  out.push(linea("="));
  out.push(
    `Total personas con servicio restante: ${personasOrdenadas.length} · Filas de rol: ${filas.length}`,
  );
  out.push(linea("="));
  out.push("");

  return out.join("\n");
}

export function nombreArchivoRestantes(anio: number, mes: number, desde: number): string {
  return `servicios-restantes-${anio}-${String(mes).padStart(2, "0")}-desde-${String(desde).padStart(2, "0")}.txt`;
}
