import { ejecutarHerramienta } from "@src/lib/agente-roles/herramientas";

const MODELO = process.env.GEMINI_TEXT_MODEL?.trim() || "gemini-3.8-flash";
const MAX_VUELTAS = 8;
const LIMITE_LLAMADA_MS = 15 * 60 * 1000;

const DECLARACIONES = [
  {
    name: "leer_skill",
    description: "Devuelve el texto completo de la skill, que es el reglamento vigente.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "guardar_skill",
    description:
      "Sustituye la skill completa. Úsala solo cuando el super administrador pida agregar, quitar o cambiar una regla. Conserva todo lo que no te pidió tocar.",
    parameters: {
      type: "object",
      properties: { texto: { type: "string", description: "Texto completo de la skill, en markdown." } },
      required: ["texto"],
    },
  },
  {
    name: "resumen_mes",
    description:
      "Cuenta los días de servicio de cada aspirante en un mes, lista los roles y dice si el mes está sellado. desde y hasta acotan los días que entran en la carga.",
    parameters: {
      type: "object",
      properties: {
        anio: { type: "integer" },
        mes: { type: "integer", description: "1 a 12" },
        desde: { type: "integer" },
        hasta: { type: "integer" },
      },
      required: ["anio", "mes"],
    },
  },
  {
    name: "buscar_persona",
    description: "Busca aspirantes por nombre o cédula y devuelve sexo, pelotón y título.",
    parameters: {
      type: "object",
      properties: { texto: { type: "string" } },
      required: ["texto"],
    },
  },
  {
    name: "marcas_persona",
    description: "Lista las guardias de una persona en un mes.",
    parameters: {
      type: "object",
      properties: {
        anio: { type: "integer" },
        mes: { type: "integer" },
        persona: { type: "string" },
      },
      required: ["anio", "mes", "persona"],
    },
  },
  {
    name: "aplicar_cambios",
    description:
      "Agrega, quita o saca guardias. poner escribe una marca; quitar borra un día; sacar elimina a la persona de ese rol en el mes. No dupliques un cupo ni cruces sexo o pelotón: la herramienta lo rechaza.",
    parameters: {
      type: "object",
      properties: {
        anio: { type: "integer" },
        mes: { type: "integer" },
        cambios: {
          type: "array",
          items: {
            type: "object",
            properties: {
              accion: { type: "string", enum: ["poner", "quitar", "sacar"] },
              rol: { type: "string" },
              persona: { type: "string" },
              dia: { type: "integer", description: "Obligatorio en poner y quitar." },
              marca: { type: "string", description: "X, o T1, T2, T3 en estacionamiento." },
            },
            required: ["accion", "rol", "persona"],
          },
        },
      },
      required: ["anio", "mes", "cambios"],
    },
  },
  {
    name: "crear_rol",
    description: "Publica un rol de servicio en un mes. Si el nombre ya existe en el catálogo, reutiliza ese rol.",
    parameters: {
      type: "object",
      properties: {
        anio: { type: "integer" },
        mes: { type: "integer" },
        nombre: { type: "string" },
      },
      required: ["anio", "mes", "nombre"],
    },
  },
  {
    name: "renombrar_rol",
    description: "Cambia el nombre visible de un rol solo en ese mes y vuelve a inferir su categoría y su papel de noche.",
    parameters: {
      type: "object",
      properties: {
        anio: { type: "integer" },
        mes: { type: "integer" },
        nombre: { type: "string" },
        nombreNuevo: { type: "string" },
      },
      required: ["anio", "mes", "nombre", "nombreNuevo"],
    },
  },
  {
    name: "eliminar_rol",
    description: "Quita un rol de un mes y borra sus marcas. No borra el catálogo si otros meses lo usan.",
    parameters: {
      type: "object",
      properties: {
        anio: { type: "integer" },
        mes: { type: "integer" },
        nombre: { type: "string" },
      },
      required: ["anio", "mes", "nombre"],
    },
  },
];

type Parte = {
  text?: string;
  functionCall?: { name?: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
};

type Contenido = { role: "user" | "model"; parts: Parte[] };

export type MensajeAgente = { role: "user" | "assistant"; text: string };

export type RespuestaAgente = {
  texto: string;
  pasos: string[];
  skill: string | null;
};

function instruccion(skill: string, fecha: string): string {
  return `Eres el agente de roles de servicio. Hablas solo con el super administrador. Hoy es ${fecha}.

Trabajas sobre las guardias del mes: puedes consultarlas, diseñar un reparto, agregar personas, mover marcas, quitar días, sacar a alguien de un rol, crear un rol, renombrarlo o eliminarlo de ese mes. No administras los roles de permiso de usuario.

La skill es el reglamento. Síguela. Si una orden la contradice, explícalo y no la apliques, salvo que te pidan cambiar la skill.
Cuando te pidan agregar, quitar o cambiar una regla, llama guardar_skill con el texto completo: conserva lo que no te pidieron tocar.
No inventes personas ni roles. Si hay varias coincidencias, pregunta cuál es.
Un mes sellado no se toca.
Una orden concreta se ejecuta. Un encargo grande, como rearmar varios días, se resume primero y se aplica cuando lo confirmen.
Antes de poner una marca, mira la carga, el sexo, el pelotón, el título y el cupo. Después de escribir, di quién, qué rol y qué día cambió.
Si una herramienta avisa que la persona ya tiene otro rol ese día, deshaz el cambio cuando la skill lo prohíba.

SKILL ACTUAL:
${skill}`;
}

function recortar(data: Record<string, unknown>): Record<string, unknown> {
  const json = JSON.stringify(data);
  if (json.length <= 14_000) return data;
  return { ok: data.ok === true, resumen: String(data.resumen ?? "Resultado recortado."), aviso: "El detalle era muy largo." };
}

function textoDe(parts: Parte[]): string {
  return parts
    .map((parte) => parte.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

function mensajeGemini(status: number, raw: string): string {
  try {
    const json = JSON.parse(raw) as { error?: { message?: string } };
    const message = json.error?.message?.replace(/key=[^&\s]+/gi, "key").slice(0, 180);
    if (message) return `Gemini respondió ${status}: ${message}`;
  } catch {
    /* el cuerpo no era JSON */
  }
  return `Gemini respondió ${status}.`;
}

async function generar(apiKey: string, system: string, contents: Contenido[]): Promise<Parte[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODELO)}:generateContent`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    signal: AbortSignal.timeout(LIMITE_LLAMADA_MS),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      tools: [{ functionDeclarations: DECLARACIONES }],
      toolConfig: { functionCallingConfig: { mode: "AUTO" } },
      generationConfig: {
        temperature: 0.2,
        thinkingConfig: { thinkingLevel: "high" },
      },
    }),
  });
  const raw = await response.text();
  if (!response.ok) {
    console.error(`[agente-roles] gemini ${response.status}: ${raw.slice(0, 400)}`);
    throw new Error(mensajeGemini(response.status, raw));
  }
  const json = JSON.parse(raw) as {
    candidates?: Array<{ content?: { parts?: Parte[] }; finishReason?: string }>;
    promptFeedback?: { blockReason?: string };
  };
  if (json.promptFeedback?.blockReason) {
    throw new Error("Gemini bloqueó la consulta.");
  }
  const parts = json.candidates?.[0]?.content?.parts;
  if (!parts || parts.length === 0) throw new Error("Gemini no devolvió respuesta.");
  return parts;
}

export function mensajesDelAgente(entrada: unknown): MensajeAgente[] | null {
  if (!Array.isArray(entrada) || entrada.length === 0 || entrada.length > 16) return null;
  const mensajes: MensajeAgente[] = [];
  for (const item of entrada) {
    if (!item || typeof item !== "object") return null;
    const role = (item as { role?: unknown }).role;
    const text = (item as { text?: unknown }).text;
    if (role !== "user" && role !== "assistant") return null;
    const limpio = typeof text === "string" ? text.trim().slice(0, 4000) : "";
    if (!limpio) return null;
    mensajes.push({ role, text: limpio });
  }
  if (mensajes.at(-1)?.role !== "user") return null;
  return mensajes;
}

export async function conversarConAgente(
  mensajes: MensajeAgente[],
  skill: string,
  avisar?: (texto: string) => void,
): Promise<RespuestaAgente> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("Falta GEMINI_API_KEY en el servidor.");

  const contents: Contenido[] = mensajes.map((mensaje) => ({
    role: mensaje.role === "assistant" ? "model" : "user",
    parts: [{ text: mensaje.text }],
  }));
  const fecha = new Intl.DateTimeFormat("es-VE", {
    dateStyle: "full",
    timeZone: "America/Caracas",
  }).format(new Date());

  let skillActual = skill;
  const pasos: string[] = [];
  let skillNueva: string | null = null;

  for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta += 1) {
    let parts: Parte[];
    try {
      avisar?.("Pensando con las reglas y los roles…");
      parts = await generar(apiKey, instruccion(skillActual, fecha), contents);
    } catch (error) {
      const tardio = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      if (!tardio) throw error;
      return {
        texto: pasos.length > 0
          ? "Esta vuelta pasó de quince minutos. Lo que ya guardó sigue en el cuadro."
          : "Gemini no contestó en quince minutos. Vuelve a enviarlo: sigue desde donde quedó.",
        pasos,
        skill: skillNueva,
      };
    }
    const llamadas = parts.filter((parte) => parte.functionCall?.name);
    if (llamadas.length === 0) {
      return { texto: textoDe(parts) || "Listo.", pasos, skill: skillNueva };
    }

    contents.push({ role: "model", parts });
    const respuestas: Parte[] = [];
    for (const parte of llamadas) {
      const nombre = parte.functionCall?.name ?? "";
      const args = parte.functionCall?.args ?? {};
      const resultado = await ejecutarHerramienta(nombre, args);
      if (resultado.paso) {
        const lineas = resultado.paso.split("\n").filter(Boolean);
        pasos.push(...lineas);
        const ultimo = lineas.at(-1);
        if (ultimo) avisar?.(ultimo);
      }
      if (resultado.skill) {
        skillActual = resultado.skill;
        skillNueva = resultado.skill;
      }
      respuestas.push({
        functionResponse: { name: nombre, response: recortar(resultado.data) },
      });
    }
    contents.push({ role: "user", parts: respuestas });
  }

  return {
    texto: pasos.length > 0 ? "Llegué al límite de pasos. Esto es lo que ya quedó hecho." : "No alcancé a terminar. Pídemelo en un paso más corto.",
    pasos,
    skill: skillNueva,
  };
}
