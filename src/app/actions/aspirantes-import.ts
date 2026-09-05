"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@src/generated/prisma";
import { CalificacionAdmision, Sexo } from "@src/generated/prisma";
import { requireWriter } from "@src/lib/auth/guards";
import { writeAuditLog } from "@src/lib/audit/log";
import {
  isFichaEvaluacionVacia,
  normalizeFichaEvaluacionForDb,
  parseFichaEvaluacion,
} from "@src/lib/aspirantes/ficha-evaluacion";
import {
  ageFromBirthDate,
  parseAspirantesImportXlsx,
} from "@src/lib/excel/parse-aspirantes-import-xlsx";
import { prisma } from "@src/lib/prisma";
import { routes } from "@src/lib/apps/routes";
import type { AspirantesImportActionState } from "@src/lib/action-types";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function importAspirantesFromXlsx(
  _prev: AspirantesImportActionState,
  formData: FormData,
): Promise<AspirantesImportActionState> {
  const session = await requireWriter();

  const convocatoriaId = String(formData.get("convocatoriaId") ?? "").trim();
  if (!convocatoriaId) {
    return { ok: false, errors: { _form: "Falta la convocatoria destino." }, summary: null };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, errors: { file: "Seleccione un archivo Excel (.xlsx)." }, summary: null };
  }
  if (!/\.xlsx$/i.test(file.name) && file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    return { ok: false, errors: { file: "Solo se aceptan archivos .xlsx." }, summary: null };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, errors: { file: "El archivo supera el límite de 8 MB." }, summary: null };
  }

  const convocatoria = await prisma.convocatoria.findUnique({ where: { id: convocatoriaId } });
  if (!convocatoria) {
    return { ok: false, errors: { _form: "Convocatoria no encontrada." }, summary: null };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await parseAspirantesImportXlsx(buffer);
  if (!parsed.ok) {
    return { ok: false, errors: { file: parsed.error }, summary: null };
  }

  const cedulas = parsed.rows.map((r) => r.cedula);
  const existing = await prisma.aspirante.findMany({
    where: { convocatoriaId, cedula: { in: cedulas } },
    select: {
      id: true,
      cedula: true,
      fichaEvaluacion: true,
      datosFisicos: { select: { id: true } },
    },
  });
  const byCedula = new Map(existing.map((a) => [a.cedula, a]));

  const rowErrors: string[] = [];
  let updated = 0;
  let notFound = 0;

  try {
    await prisma.$transaction(
      async (tx) => {
        if (parsed.variant === "censo") {
          for (const row of parsed.rows) {
            const asp = byCedula.get(row.cedula);
            if (!asp) {
              notFound += 1;
              rowErrors.push(`Fila ${row.rowNumber}: cédula ${row.cedula} no existe en esta convocatoria.`);
              continue;
            }

            const data: Prisma.AspiranteUpdateInput = {};
            if (row.unidadPostulante !== undefined) data.unidadPostulante = row.unidadPostulante;
            if (row.tituloUniversidad !== undefined) data.tituloUniversidad = row.tituloUniversidad;
            if (row.calificacionAdmision) {
              data.calificacionAdmision =
                row.calificacionAdmision === "APTO"
                  ? CalificacionAdmision.APTO
                  : row.calificacionAdmision === "NO_APTO"
                    ? CalificacionAdmision.NO_APTO
                    : CalificacionAdmision.EN_EVALUACION;
            }
            if (row.sexo) {
              data.sexo = row.sexo === "FEMENINO" ? Sexo.FEMENINO : Sexo.MASCULINO;
            }
            if (row.fechaNacimiento) {
              data.fechaNacimiento = row.fechaNacimiento;
              data.edad = ageFromBirthDate(row.fechaNacimiento);
            }

            if (Object.keys(data).length === 0) continue;

            await tx.aspirante.update({ where: { id: asp.id }, data });
            updated += 1;
          }
        } else {
          for (const row of parsed.rows) {
            const asp = byCedula.get(row.cedula);
            if (!asp) {
              notFound += 1;
              rowErrors.push(`Fila ${row.rowNumber}: cédula ${row.cedula} no existe en esta convocatoria.`);
              continue;
            }

            const ficha = parseFichaEvaluacion(asp.fichaEvaluacion);
            for (const [examId, si] of Object.entries(row.examenes)) {
              const prev = ficha.examenMedico[examId] ?? { si: false, no: false, diagnostico: "" };
              ficha.examenMedico[examId] = {
                ...prev,
                si,
                no: si ? false : prev.no,
              };
            }
            const fichaNorm = normalizeFichaEvaluacionForDb(ficha);
            const fichaDb: Prisma.InputJsonValue | typeof Prisma.JsonNull = isFichaEvaluacionVacia(
              fichaNorm,
            )
              ? Prisma.JsonNull
              : (fichaNorm as unknown as Prisma.InputJsonValue);

            await tx.aspirante.update({
              where: { id: asp.id },
              data: { fichaEvaluacion: fichaDb },
            });

            const fisicoData = {
              pesoKg: row.pesoKg ?? null,
              estaturaCm: row.estaturaCm ?? null,
              tensionArterial: row.tensionArterial ?? null,
            };

            if (asp.datosFisicos) {
              await tx.datosFisicosMedicos.update({
                where: { aspiranteId: asp.id },
                data: fisicoData,
              });
            } else {
              await tx.datosFisicosMedicos.create({
                data: { aspiranteId: asp.id, ...fisicoData },
              });
            }

            updated += 1;
          }
        }
      },
      { timeout: 60_000 },
    );
  } catch (e) {
    console.error("[importAspirantesFromXlsx]", e);
    return {
      ok: false,
      errors: { _form: "Error al guardar los cambios. Intente de nuevo o reduzca el tamaño del archivo." },
      summary: null,
    };
  }

  await writeAuditLog({
    userId: session.user?.id,
    userEmail: session.user?.email,
    action: "aspirantes.import_xlsx",
    entityType: "Convocatoria",
    entityId: convocatoriaId,
    metadata: {
      variant: parsed.variant,
      fileName: file.name,
      rowsInFile: parsed.rows.length,
      updated,
      notFound,
      errorCount: rowErrors.length,
      convocatoriaCodigo: convocatoria.codigo,
    },
  });

  revalidatePath(routes.hub);
  revalidatePath(routes.personal.aspirantes);
  revalidatePath(routes.personal.aspirantesGestion);

  const hardFail = updated === 0 && notFound > 0;
  return {
    ok: !hardFail,
    errors: hardFail
      ? {
          _form:
            "Ninguna fila se actualizó: ninguna cédula del Excel coincide con aspirantes de esta convocatoria.",
        }
      : {},
    summary: {
      variant: parsed.variant,
      totalRows: parsed.rows.length,
      updated,
      notFound,
      rowErrors: rowErrors.slice(0, 40),
    },
  };
}
