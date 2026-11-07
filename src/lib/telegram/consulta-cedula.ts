import { formatCedulaMillares } from "@src/lib/aspirantes/cedula";
import { etiquetaMes } from "@src/lib/roles-servicio/marcas";
import { encabezadoInstitucional, escapeHtml, pieMilitar, SEP_FINA } from "@src/lib/telegram/format-militar";

export type DiaMontado = {
  dia: number;
  marca: string;
};

export type RolMontado = {
  nombre: string;
  dias: DiaMontado[];
};

export type PersonaRolesMes = {
  apellidos: string;
  nombres: string;
  cedula: string;
  roles: RolMontado[];
};

/** Saca una cédula (6 a 9 dígitos) de un mensaje. Acepta puntos, guiones y V/E delante. */
export function extraerCedula(texto: string): string | null {
  const limpio = texto.trim();
  if (!limpio || limpio.startsWith("/")) return null;

  const compacta = limpio.replace(/[\s.\-]/g, "").replace(/^[ve](?=\d)/i, "");
  if (/^\d{6,9}$/.test(compacta)) return compacta;

  const grupos = [...limpio.matchAll(/\d[\d.\s-]{4,16}\d/g)]
    .map((coincidencia) => coincidencia[0].replace(/\D/g, ""))
    .filter((digitos) => digitos.length >= 6 && digitos.length <= 9);

  return grupos.length === 1 ? grupos[0] : null;
}

export function mensajeAyudaCedula(): string {
  return [
    ...encabezadoInstitucional("Consulta de roles"),
    "Envíame tu <b>cédula</b>, solo los números.",
    "Ejemplo: <code>12345678</code>",
    "",
    "Te respondo los roles que esa persona monta <b>este mes</b>.",
    ...pieMilitar("La consulta es del mes en curso."),
  ].join("\n");
}

function lineaDias(dias: DiaMontado[]): string {
  const partes = [...dias]
    .sort((a, b) => a.dia - b.dia || a.marca.localeCompare(b.marca))
    .map((dia) => {
      const marca = dia.marca && dia.marca !== "X" ? ` ${dia.marca}` : "";
      return `${dia.dia}${marca}`;
    });
  const etiqueta = partes.length === 1 ? "día" : "días";
  return `${etiqueta} ${partes.join(", ")}`;
}

function bloquePersona(persona: PersonaRolesMes): string[] {
  const nombre = `${persona.apellidos} ${persona.nombres}`.replace(/\s+/g, " ").trim();
  const lineas = [
    `<b>${escapeHtml(nombre.toUpperCase())}</b>`,
    `<b>C.I.:</b> <code>${escapeHtml(formatCedulaMillares(persona.cedula))}</code>`,
    "",
  ];

  if (persona.roles.length === 0) {
    lineas.push("<i>Este mes no monta ningún rol.</i>");
    return lineas;
  }

  const roles = [...persona.roles].sort((a, b) => {
    const diaA = Math.min(...a.dias.map((dia) => dia.dia));
    const diaB = Math.min(...b.dias.map((dia) => dia.dia));
    return diaA - diaB || a.nombre.localeCompare(b.nombre, "es");
  });

  for (const rol of roles) {
    lineas.push(`• <b>${escapeHtml(rol.nombre)}</b>`, `     ${escapeHtml(lineaDias(rol.dias))}`, "");
  }
  return lineas;
}

/** Texto HTML para Telegram con los roles del mes de una o más personas. */
export function formatearRolesMes(input: {
  anio: number;
  mes: number;
  personas: PersonaRolesMes[];
}): string {
  if (input.personas.length === 0) {
    return [
      ...encabezadoInstitucional("Consulta de roles"),
      "<b>MES:</b> " + escapeHtml(etiquetaMes(input.anio, input.mes)),
      "",
      "No encontré esa cédula en el personal activo.",
      "Revisa los números y envíala de nuevo.",
      ...pieMilitar("Si sigue sin aparecer, avisa en administración."),
    ].join("\n");
  }

  const bloques = input.personas.flatMap((persona, indice) => {
    const bloque = bloquePersona(persona);
    if (indice === 0) return bloque;
    return ["", SEP_FINA, "", ...bloque];
  });

  return [
    ...encabezadoInstitucional("Roles del mes"),
    `<b>MES:</b> ${escapeHtml(etiquetaMes(input.anio, input.mes))}`,
    "",
    ...bloques,
    ...pieMilitar("Roles publicados para este mes."),
  ].join("\n");
}
