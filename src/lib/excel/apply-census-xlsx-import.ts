import { CalificacionAdmision, Prisma, PrismaClient, Sexo, TallaUniformePatriota } from "@src/generated/prisma";
import type { CensusImportParseOk } from "@src/lib/excel/parse-aspirantes-censo-xlsx";
import {
  examenIdFromExportColumn,
  getCensusExportColumn,
  isExamExportColumnId,
} from "@src/lib/aspirantes/census-export-columns";
import { ESTADO_CIVIL_LABELS, isEstadoCivilValue, labelEstadoCivil, type EstadoCivilValue } from "@src/lib/aspirantes/estado-civil";
import {
  isFichaEvaluacionVacia,
  normalizeFichaEvaluacionForDb,
  parseFichaEvaluacion,
} from "@src/lib/aspirantes/ficha-evaluacion";
import { labelPeloton, nombrePelotonPorDefecto } from "@src/lib/pelotones";
import { FECHA_NACIMIENTO_PENDIENTE, hasRealBirthDate, parseDateInputLocal } from "@src/lib/date";
import {
  TIPO_ESTUDIO_SHORT_LABELS,
  TIPO_ESTUDIO_VALUES,
  labelTipoEstudioNivel,
  normalizeTipoEstudio,
  type TipoEstudioValue,
} from "@src/lib/aspirantes/tipo-estudio";
import { calificacionAdmisionEtiqueta, sexoEtiqueta } from "@src/lib/aspirantes/census";
import { homologarDatosSangre, type FactorRhValue } from "@src/lib/aspirantes/senaletica";
import { homologarEstaturaCm } from "@src/lib/aspirantes/medidas";
import { isTallaUniformePatriota } from "@src/lib/aspirantes/tallas-familia";

const EMPTY = new Set(["", "—", "-", "–", "n/a", "na"]);

export type CensusImportError = {
  excelRow: number;
  cedula: string;
  message: string;
};

export type CensusImportApplyResult = {
  updated: number;
  created: number;
  unchanged: number;
  errors: CensusImportError[];
  columns: string[];
};

function blankToNull(raw: string | undefined): string | null {
  const t = raw?.trim() ?? "";
  if (EMPTY.has(t.toLowerCase()) || EMPTY.has(t)) return null;
  return t || null;
}

function hasColumn(ids: Set<string>, id: string) {
  return ids.has(id);
}

function parseSangreImport(raw: string | null): {
  tipoSangre: string | null;
  factorRh: FactorRhValue | null;
} {
  return homologarDatosSangre(raw);
}

function parseTallaUniformePatriota(raw: string | null): TallaUniformePatriota | null | undefined {
  if (raw == null) return null;
  const t = raw.trim().toUpperCase();
  if (!t) return null;
  if (isTallaUniformePatriota(t)) return t as TallaUniformePatriota;
  if (t === "SM") return TallaUniformePatriota.SR;
  return undefined;
}

function parseSexo(raw: string | null): Sexo | null | undefined {
  if (raw == null) return null;
  const t = raw.trim().toLowerCase();
  if (!t) return undefined;
  if (t === "f" || t.startsWith("fem")) return Sexo.FEMENINO;
  if (t === "m" || t.startsWith("masc")) return Sexo.MASCULINO;
  return undefined;
}

function parseCalificacion(raw: string | null): CalificacionAdmision | undefined {
  if (raw == null) return CalificacionAdmision.EN_EVALUACION;
  const t = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (t === "apto") return CalificacionAdmision.APTO;
  if (t === "no_apto" || t === "noapto" || t.includes("no apto") || t === "noapto") {
    return CalificacionAdmision.NO_APTO;
  }
  if (!t || t.includes("evaluacion") || t.includes("evaluación")) {
    return CalificacionAdmision.EN_EVALUACION;
  }
  const spaced = raw.trim().toLowerCase();
  if (spaced === "no apto") return CalificacionAdmision.NO_APTO;
  return undefined;
}

function parseEstadoCivil(raw: string | null): EstadoCivilValue | null | undefined {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t) return null;
  if (isEstadoCivilValue(t.toUpperCase().replace(/\s+/g, "_"))) {
    return t.toUpperCase().replace(/\s+/g, "_") as EstadoCivilValue;
  }
  const folded = t.toLowerCase();
  for (const [id, label] of Object.entries(ESTADO_CIVIL_LABELS)) {
    if (label.toLowerCase() === folded) return id as EstadoCivilValue;
  }
  return undefined;
}

function parseBirthDate(raw: string | null): Date | null | undefined {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t) return null;
  const iso = parseDateInputLocal(t);
  if (iso) return iso;
  const ve = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(t);
  if (ve) {
    const d = Number(ve[1]);
    const m = Number(ve[2]);
    const y = Number(ve[3]);
    const date = new Date(y, m - 1, d, 12, 0, 0, 0);
    if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) return date;
  }
  const asDate = new Date(t);
  if (!Number.isNaN(asDate.getTime()) && asDate.getFullYear() > 1900) return asDate;
  return undefined;
}

function parseNumber(raw: string | null): number | null | undefined {
  if (raw == null) return null;
  const t = raw.replace(",", ".").replace(/[^\d.-]/g, "").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function parseHijos(raw: string | null): number | undefined {
  if (raw == null) return 0;
  const n = parseNumber(raw);
  if (n == null) return 0;
  if (n === undefined || n < 0 || !Number.isInteger(n)) return undefined;
  return n;
}

function parseBoolSi(raw: string): boolean {
  const t = raw.trim().toLowerCase();
  return t === "si" || t === "sí" || t === "x" || t === "1" || t === "true" || t === "yes";
}

function parseCarrera(raw: string | null): { titulo: string | null; nivel: TipoEstudioValue | null } {
  if (raw == null) return { titulo: null, nivel: null };
  const t = raw.trim();
  if (!t) return { titulo: null, nivel: null };
  const m = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(t);
  if (!m) return { titulo: t, nivel: null };
  const titulo = m[1]!.trim();
  const nivelRaw = m[2]!.trim();
  const fromNivel = (TIPO_ESTUDIO_VALUES as readonly string[]).find(
    (id) => labelTipoEstudioNivel(id)?.toLowerCase() === nivelRaw.toLowerCase(),
  );
  const fromShort = (Object.entries(TIPO_ESTUDIO_SHORT_LABELS) as [TipoEstudioValue, string][]).find(
    ([, label]) => label.toLowerCase() === nivelRaw.toLowerCase(),
  );
  return {
    titulo: titulo || t,
    nivel: (fromNivel as TipoEstudioValue | undefined) ?? fromShort?.[0] ?? normalizeTipoEstudio(nivelRaw.toUpperCase()),
  };
}

function splitNombreCompleto(
  full: string,
  existingNombres: string,
  existingApellidos: string,
): { nombres: string; apellidos: string } {
  const words = full.trim().split(/\s+/).filter(Boolean);
  const nCount = existingNombres.trim().split(/\s+/).filter(Boolean).length || 1;
  if (words.length === 0) return { nombres: existingNombres, apellidos: existingApellidos };
  if (words.length === 1) return { nombres: words[0]!, apellidos: existingApellidos || words[0]! };
  if (words.length <= nCount) {
    return { nombres: words.join(" "), apellidos: existingApellidos || words[words.length - 1]! };
  }
  return { nombres: words.slice(0, nCount).join(" "), apellidos: words.slice(nCount).join(" ") };
}

function splitNombreCompletoNew(full: string): { nombres: string; apellidos: string } {
  const words = full.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { nombres: "", apellidos: "" };
  if (words.length === 1) return { nombres: words[0]!, apellidos: words[0]! };
  const mid = Math.max(1, Math.ceil(words.length / 2));
  return { nombres: words.slice(0, mid).join(" "), apellidos: words.slice(mid).join(" ") };
}

function parseContacto(raw: string | null): { nombre: string; parentesco: string; telefono: string } | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t) return null;
  const parts = t.split("·").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return { nombre: parts[0]!, parentesco: "Por definir", telefono: "—" };
  if (parts.length === 2) return { nombre: parts[0]!, parentesco: "Por definir", telefono: parts[1]! };
  return { nombre: parts[0]!, parentesco: parts[1] || "Por definir", telefono: parts[2] || "—" };
}

function matchPeloton(
  raw: string | null,
  pelotones: { id: string; numero: number; nombre: string }[],
): { ok: true; id: string | null } | { ok: false; error: string } {
  if (raw == null || raw === "") return { ok: true, id: null };
  const t = raw.trim();
  if (!t) return { ok: true, id: null };
  const byId = pelotones.find((p) => p.id === t);
  if (byId) return { ok: true, id: byId.id };
  const num = Number(t.replace(/[^\d]/g, ""));
  const folded = t.toLowerCase();
  const match = pelotones.find((p) => {
    const label = labelPeloton(p).toLowerCase();
    const def = nombrePelotonPorDefecto(p.numero).toLowerCase();
    return (
      p.nombre.trim().toLowerCase() === folded ||
      label === folded ||
      def === folded ||
      (Number.isFinite(num) && p.numero === num && /^\d+$/.test(t.replace(/[^\d]/g, "")))
    );
  });
  if (match) return { ok: true, id: match.id };
  return { ok: false, error: `Pelotón no encontrado: ${t}` };
}

function toFichaJson(state: ReturnType<typeof parseFichaEvaluacion>): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  const norm = normalizeFichaEvaluacionForDb(state);
  if (isFichaEvaluacionVacia(norm)) return Prisma.JsonNull;
  return norm as Prisma.InputJsonValue;
}

export async function applyCensusXlsxImport(
  db: PrismaClient,
  convocatoriaId: string,
  parsed: CensusImportParseOk,
): Promise<CensusImportApplyResult> {
  const ids = new Set(parsed.columnIds);
  const errors: CensusImportError[] = [];
  let updated = 0;
  let created = 0;
  let unchanged = 0;

  const pelotones = await db.peloton.findMany({
    where: { convocatoriaId },
    select: { id: true, numero: true, nombre: true },
  });

  const existing = await db.aspirante.findMany({
    where: { convocatoriaId, cedula: { in: parsed.rows.map((r) => r.cedula) } },
    include: {
      datosFisicos: true,
      contactos: { orderBy: { createdAt: "asc" }, take: 1 },
    },
  });
  const byCedula = new Map(existing.map((a) => [a.cedula, a]));

  // Neon + pooler: cada fila son 1–3 roundtrips. El timeout por defecto (5 s)
  // aborta el lote entero, Prisma lanza P2028 y la ruta responde 500.
  await db.$transaction(
    async (tx) => {
      for (const row of parsed.rows) {
      const v = row.values;
      const current = byCedula.get(row.cedula);

      try {
        if (hasColumn(ids, "peloton")) {
          const peloton = matchPeloton(blankToNull(v.peloton), pelotones);
          if (!peloton.ok) {
            errors.push({ excelRow: row.excelRow, cedula: row.cedula, message: peloton.error });
            continue;
          }
        }

        if (hasColumn(ids, "sexo") && parseSexo(blankToNull(v.sexo)) === undefined) {
          errors.push({ excelRow: row.excelRow, cedula: row.cedula, message: "Sexo no reconocido." });
          continue;
        }
        if (hasColumn(ids, "calificacion") && parseCalificacion(blankToNull(v.calificacion)) === undefined) {
          errors.push({ excelRow: row.excelRow, cedula: row.cedula, message: "Calificación no reconocida." });
          continue;
        }
        if (hasColumn(ids, "estadoCivil") && parseEstadoCivil(blankToNull(v.estadoCivil)) === undefined) {
          errors.push({ excelRow: row.excelRow, cedula: row.cedula, message: "Estado civil no reconocido." });
          continue;
        }
        if (hasColumn(ids, "nacimiento") && parseBirthDate(blankToNull(v.nacimiento)) === undefined) {
          errors.push({ excelRow: row.excelRow, cedula: row.cedula, message: "Fecha de nacimiento inválida." });
          continue;
        }
        if (hasColumn(ids, "estatura") && blankToNull(v.estatura) && homologarEstaturaCm(blankToNull(v.estatura)) == null) {
          errors.push({ excelRow: row.excelRow, cedula: row.cedula, message: "Estatura inválida. Use metros (p. ej. 1,75)." });
          continue;
        }
        if (
          hasColumn(ids, "tallaUniformePatriota") &&
          parseTallaUniformePatriota(blankToNull(v.tallaUniformePatriota)) === undefined
        ) {
          errors.push({
            excelRow: row.excelRow,
            cedula: row.cedula,
            message: "Talla de uniforme patriota no reconocida.",
          });
          continue;
        }

        const pelotonId = hasColumn(ids, "peloton")
          ? (matchPeloton(blankToNull(v.peloton), pelotones) as { ok: true; id: string | null }).id
          : undefined;

        if (!current) {
          const fromParts = hasColumn(ids, "nombres") || hasColumn(ids, "apellidos");
          const fromFull = hasColumn(ids, "nombreCompleto") ? splitNombreCompletoNew(v.nombreCompleto ?? "") : null;
          const nombres = (fromParts ? blankToNull(v.nombres) : fromFull?.nombres)?.trim() ?? "";
          const apellidos = (fromParts ? blankToNull(v.apellidos) : fromFull?.apellidos)?.trim() ?? "";
          if (!nombres || !apellidos) {
            errors.push({
              excelRow: row.excelRow,
              cedula: row.cedula,
              message: "No está en la convocatoria. Para darlo de alta incluya nombres y apellidos (o nombre completo).",
            });
            continue;
          }
          const sexo = hasColumn(ids, "sexo") ? parseSexo(blankToNull(v.sexo)) : Sexo.MASCULINO;
          const createdRow = await tx.aspirante.create({
            data: {
              convocatoriaId,
              cedula: row.cedula,
              nombres,
              apellidos,
              sexo: sexo === Sexo.FEMENINO ? Sexo.FEMENINO : Sexo.MASCULINO,
              fechaNacimiento:
                (hasColumn(ids, "nacimiento") ? parseBirthDate(blankToNull(v.nacimiento)) : null) ??
                FECHA_NACIMIENTO_PENDIENTE,
              lugarNacimiento: hasColumn(ids, "lugarNacimiento") ? (blankToNull(v.lugarNacimiento) ?? "") : "",
              unidadPostulante: hasColumn(ids, "unidad") ? (blankToNull(v.unidad) ?? "") : "",
              calificacionAdmision: hasColumn(ids, "calificacion")
                ? (parseCalificacion(blankToNull(v.calificacion)) ?? CalificacionAdmision.EN_EVALUACION)
                : CalificacionAdmision.EN_EVALUACION,
              telefono: hasColumn(ids, "telefono") ? blankToNull(v.telefono) : null,
              correo: hasColumn(ids, "correo") ? blankToNull(v.correo) : null,
              direccion: hasColumn(ids, "direccion") ? blankToNull(v.direccion) : null,
              estadoCivil: hasColumn(ids, "estadoCivil") ? (parseEstadoCivil(blankToNull(v.estadoCivil)) ?? null) : null,
              religion: hasColumn(ids, "religion") ? blankToNull(v.religion) : null,
              deporte: hasColumn(ids, "deporte") ? blankToNull(v.deporte) : null,
              hijosCantidad: hasColumn(ids, "hijos") ? (parseHijos(blankToNull(v.hijos)) ?? 0) : 0,
              pelotonId: pelotonId === undefined ? null : pelotonId,
              tituloUniversidad: hasColumn(ids, "carrera") ? parseCarrera(blankToNull(v.carrera)).titulo : null,
              tipoEstudio: hasColumn(ids, "carrera")
                ? parseCarrera(blankToNull(v.carrera)).nivel
                : null,
              nombreUniversidad: hasColumn(ids, "universidad") ? blankToNull(v.universidad) : null,
              paisUniversidad: hasColumn(ids, "paisUniversidad") ? blankToNull(v.paisUniversidad) : null,
              datosFisicos: {
                create: {
                  estaturaCm: hasColumn(ids, "estatura") ? homologarEstaturaCm(blankToNull(v.estatura)) : null,
                  pesoKg: hasColumn(ids, "peso") ? (parseNumber(blankToNull(v.peso)) ?? null) : null,
                  tensionArterial: hasColumn(ids, "tension") ? blankToNull(v.tension) : null,
                  tipoSangre: hasColumn(ids, "tipoSangre") ? parseSangreImport(blankToNull(v.tipoSangre)).tipoSangre : null,
                  factorRh: hasColumn(ids, "tipoSangre") ? parseSangreImport(blankToNull(v.tipoSangre)).factorRh : null,
                  tallaGorra: hasColumn(ids, "tallaGorra") ? blankToNull(v.tallaGorra) : null,
                  tallaCamisa: hasColumn(ids, "tallaCamisa") ? blankToNull(v.tallaCamisa) : null,
                  tallaPantalon: hasColumn(ids, "tallaPantalon") ? blankToNull(v.tallaPantalon) : null,
                  tallaCalzado: hasColumn(ids, "tallaCalzado") ? blankToNull(v.tallaCalzado) : null,
                  tallaUniformePatriota: hasColumn(ids, "tallaUniformePatriota")
                    ? (parseTallaUniformePatriota(blankToNull(v.tallaUniformePatriota)) ?? null)
                    : null,
                  alergias: hasColumn(ids, "alergias") ? blankToNull(v.alergias) : null,
                  condicionesMedicas: hasColumn(ids, "condicionesMedicas")
                    ? blankToNull(v.condicionesMedicas)
                    : null,
                  discapacidad: hasColumn(ids, "discapacidad") ? blankToNull(v.discapacidad) : null,
                  observaciones: hasColumn(ids, "observaciones") ? blankToNull(v.observaciones) : null,
                },
              },
            },
          });
          const contacto = hasColumn(ids, "contactoEmergencia")
            ? parseContacto(blankToNull(v.contactoEmergencia))
            : null;
          if (contacto) {
            await tx.contactoEmergencia.create({
              data: {
                aspiranteId: createdRow.id,
                nombre: contacto.nombre,
                parentesco: contacto.parentesco,
                telefono: contacto.telefono,
              },
            });
          }
          const examIds = parsed.columnIds.filter(isExamExportColumnId);
          if (examIds.length) {
            const ficha = parseFichaEvaluacion(null);
            for (const colId of examIds) {
              const examenId = examenIdFromExportColumn(colId);
              if (!examenId || !ficha.examenMedico[examenId]) continue;
              const si = parseBoolSi(v[colId] ?? "");
              ficha.examenMedico[examenId] = { si, no: !si && Boolean((v[colId] ?? "").trim()), diagnostico: "" };
              if (!si) ficha.examenMedico[examenId] = { si: false, no: false, diagnostico: "" };
            }
            await tx.aspirante.update({
              where: { id: createdRow.id },
              data: { fichaEvaluacion: toFichaJson(ficha) },
            });
          }
          created += 1;
          continue;
        }

        const data: Prisma.AspiranteUpdateInput = {};
        if (hasColumn(ids, "nombres") && blankToNull(v.nombres)) {
          const next = blankToNull(v.nombres)!;
          if (next !== current.nombres) data.nombres = next;
        }
        if (hasColumn(ids, "apellidos") && blankToNull(v.apellidos)) {
          const next = blankToNull(v.apellidos)!;
          if (next !== current.apellidos) data.apellidos = next;
        }
        if (
          hasColumn(ids, "nombreCompleto") &&
          !hasColumn(ids, "nombres") &&
          !hasColumn(ids, "apellidos") &&
          blankToNull(v.nombreCompleto)
        ) {
          const full = blankToNull(v.nombreCompleto)!;
          const currentFull = `${current.nombres} ${current.apellidos}`.replace(/\s+/g, " ").trim();
          const incomingFull = full.replace(/\s+/g, " ").trim();
          if (incomingFull.localeCompare(currentFull, "es", { sensitivity: "accent" }) !== 0) {
            const split = splitNombreCompleto(full, current.nombres, current.apellidos);
            if (split.nombres !== current.nombres) data.nombres = split.nombres;
            if (split.apellidos !== current.apellidos) data.apellidos = split.apellidos;
          }
        }
        if (hasColumn(ids, "sexo")) {
          const sexo = parseSexo(blankToNull(v.sexo));
          if (sexo) data.sexo = sexo;
        }
        if (hasColumn(ids, "nacimiento")) {
          data.fechaNacimiento = parseBirthDate(blankToNull(v.nacimiento)) ?? FECHA_NACIMIENTO_PENDIENTE;
        }
        if (hasColumn(ids, "lugarNacimiento")) data.lugarNacimiento = blankToNull(v.lugarNacimiento) ?? "";
        if (hasColumn(ids, "unidad")) data.unidadPostulante = blankToNull(v.unidad) ?? "";
        if (hasColumn(ids, "calificacion")) {
          data.calificacionAdmision =
            parseCalificacion(blankToNull(v.calificacion)) ?? CalificacionAdmision.EN_EVALUACION;
        }
        if (hasColumn(ids, "telefono")) data.telefono = blankToNull(v.telefono);
        if (hasColumn(ids, "correo")) data.correo = blankToNull(v.correo);
        if (hasColumn(ids, "direccion")) data.direccion = blankToNull(v.direccion);
        if (hasColumn(ids, "estadoCivil")) data.estadoCivil = parseEstadoCivil(blankToNull(v.estadoCivil)) ?? null;
        if (hasColumn(ids, "religion")) data.religion = blankToNull(v.religion);
        if (hasColumn(ids, "deporte")) data.deporte = blankToNull(v.deporte);
        if (hasColumn(ids, "hijos")) {
          const hijos = parseHijos(blankToNull(v.hijos));
          if (hijos === undefined) {
            errors.push({ excelRow: row.excelRow, cedula: row.cedula, message: "Cantidad de hijos inválida." });
            continue;
          }
          data.hijosCantidad = hijos;
        }
        if (hasColumn(ids, "peloton") && pelotonId !== (current.pelotonId ?? null)) {
          data.peloton = pelotonId ? { connect: { id: pelotonId } } : { disconnect: true };
        }
        if (hasColumn(ids, "carrera")) {
          const carrera = parseCarrera(blankToNull(v.carrera));
          data.tituloUniversidad = carrera.titulo;
          if (carrera.nivel) data.tipoEstudio = carrera.nivel;
        }
        if (hasColumn(ids, "universidad")) data.nombreUniversidad = blankToNull(v.universidad);
        if (hasColumn(ids, "paisUniversidad")) data.paisUniversidad = blankToNull(v.paisUniversidad);

        const fisicoPatch: {
          estaturaCm?: number | null;
          pesoKg?: number | null;
          tensionArterial?: string | null;
          tipoSangre?: string | null;
          factorRh?: FactorRhValue | null;
          tallaGorra?: string | null;
          tallaCamisa?: string | null;
          tallaPantalon?: string | null;
          tallaCalzado?: string | null;
          tallaUniformePatriota?: TallaUniformePatriota | null;
          alergias?: string | null;
          condicionesMedicas?: string | null;
          discapacidad?: string | null;
          observaciones?: string | null;
        } = {};
        if (hasColumn(ids, "estatura")) {
          const next = homologarEstaturaCm(blankToNull(v.estatura));
          if (next !== (current.datosFisicos?.estaturaCm ?? null)) fisicoPatch.estaturaCm = next;
        }
        if (hasColumn(ids, "peso")) {
          const next = parseNumber(blankToNull(v.peso)) ?? null;
          if (next !== (current.datosFisicos?.pesoKg ?? null)) fisicoPatch.pesoKg = next;
        }
        if (hasColumn(ids, "tension")) fisicoPatch.tensionArterial = blankToNull(v.tension);
        if (hasColumn(ids, "tipoSangre")) {
          const sangre = parseSangreImport(blankToNull(v.tipoSangre));
          fisicoPatch.tipoSangre = sangre.tipoSangre;
          fisicoPatch.factorRh = sangre.factorRh;
        }
        if (hasColumn(ids, "tallaGorra")) fisicoPatch.tallaGorra = blankToNull(v.tallaGorra);
        if (hasColumn(ids, "tallaCamisa")) fisicoPatch.tallaCamisa = blankToNull(v.tallaCamisa);
        if (hasColumn(ids, "tallaPantalon")) fisicoPatch.tallaPantalon = blankToNull(v.tallaPantalon);
        if (hasColumn(ids, "tallaCalzado")) fisicoPatch.tallaCalzado = blankToNull(v.tallaCalzado);
        if (hasColumn(ids, "tallaUniformePatriota")) {
          fisicoPatch.tallaUniformePatriota =
            parseTallaUniformePatriota(blankToNull(v.tallaUniformePatriota)) ?? null;
        }
        if (hasColumn(ids, "alergias")) fisicoPatch.alergias = blankToNull(v.alergias);
        if (hasColumn(ids, "condicionesMedicas")) fisicoPatch.condicionesMedicas = blankToNull(v.condicionesMedicas);
        if (hasColumn(ids, "discapacidad")) fisicoPatch.discapacidad = blankToNull(v.discapacidad);
        if (hasColumn(ids, "observaciones")) fisicoPatch.observaciones = blankToNull(v.observaciones);
        const fisicoChanged = Object.keys(fisicoPatch).length > 0;

        const examIds = parsed.columnIds.filter(isExamExportColumnId);
        if (examIds.length) {
          const ficha = parseFichaEvaluacion(current.fichaEvaluacion);
          for (const colId of examIds) {
            const examenId = examenIdFromExportColumn(colId);
            if (!examenId || !ficha.examenMedico[examenId]) continue;
            const si = parseBoolSi(v[colId] ?? "");
            ficha.examenMedico[examenId] = {
              ...ficha.examenMedico[examenId]!,
              si,
              no: false,
            };
          }
          data.fichaEvaluacion = toFichaJson(ficha);
        }

        const hasAspirantePatch = Object.keys(data).length > 0;
        if (!hasAspirantePatch && !fisicoChanged && !hasColumn(ids, "contactoEmergencia") && !examIds.length) {
          unchanged += 1;
          continue;
        }

        if (hasAspirantePatch || examIds.length) {
          await tx.aspirante.update({ where: { id: current.id }, data });
        }

        if (fisicoChanged) {
          await tx.datosFisicosMedicos.upsert({
            where: { aspiranteId: current.id },
            create: { aspiranteId: current.id, ...fisicoPatch },
            update: fisicoPatch,
          });
        }

        if (hasColumn(ids, "contactoEmergencia")) {
          const parsedContacto = parseContacto(blankToNull(v.contactoEmergencia));
          const existingContacto = current.contactos[0];
          if (parsedContacto) {
            if (existingContacto) {
              await tx.contactoEmergencia.update({
                where: { id: existingContacto.id },
                data: {
                  nombre: parsedContacto.nombre,
                  parentesco: parsedContacto.parentesco,
                  telefono: parsedContacto.telefono,
                },
              });
            } else {
              await tx.contactoEmergencia.create({
                data: {
                  aspiranteId: current.id,
                  nombre: parsedContacto.nombre,
                  parentesco: parsedContacto.parentesco,
                  telefono: parsedContacto.telefono,
                },
              });
            }
          } else if (existingContacto) {
            await tx.contactoEmergencia.delete({ where: { id: existingContacto.id } });
          }
        }

        updated += 1;
      } catch (e) {
        errors.push({
          excelRow: row.excelRow,
          cedula: row.cedula,
          message: e instanceof Error ? e.message : "No se pudo guardar la fila.",
        });
      }
      }
    },
    { maxWait: 20_000, timeout: 180_000 },
  );

  return { updated, created, unchanged, errors, columns: parsed.columnIds };
}
