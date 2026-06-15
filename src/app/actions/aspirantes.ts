"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@src/generated/prisma";
import { prisma } from "@src/lib/prisma";
import { CalificacionAdmision, Sexo } from "@src/generated/prisma";
import { aspiranteCreateSchema, aspiranteUpdateSchema } from "@src/lib/validators/aspirante";
import { zodFieldErrors } from "@src/lib/zod-errors";
import { requireWriter } from "@src/lib/auth/guards";
import { getConvocatoriaActiva } from "@src/lib/convocatoria";
import type { AspiranteActionState } from "@src/lib/action-types";
import { writeAuditLog } from "@src/lib/audit/log";
import { routes } from "@src/lib/apps/routes";
import { isFichaEvaluacionVacia, normalizeFichaEvaluacionForDb } from "@src/lib/aspirantes/ficha-evaluacion";

function toPrismaFichaEvaluacion(
  payload: object | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (payload === undefined) return undefined;
  if (payload === null) return Prisma.JsonNull;
  return payload as Prisma.InputJsonValue;
}

function fichaEvaluacionPayloadFromFormData(formData: FormData): object | null | undefined {
  if (!formData.has("fichaEvaluacion")) return undefined;
  const raw = formData.get("fichaEvaluacion");
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const json = JSON.parse(raw) as unknown;
    const norm = normalizeFichaEvaluacionForDb(json);
    return isFichaEvaluacionVacia(norm) ? null : norm;
  } catch {
    return null;
  }
}

function emptyToNull(v: unknown) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

export async function createAspirante(
  _prev: AspiranteActionState,
  formData: FormData,
): Promise<AspiranteActionState> {
  const session = await requireWriter();

  const raw = {
    unidadPostulante: formData.get("unidadPostulante"),
    calificacionAdmision: formData.get("calificacionAdmision"),
    nombres: formData.get("nombres"),
    apellidos: formData.get("apellidos"),
    cedula: formData.get("cedula"),
    edad: formData.get("edad"),
    sexo: formData.get("sexo"),
    fechaNacimiento: formData.get("fechaNacimiento"),
    lugarNacimiento: formData.get("lugarNacimiento"),
    direccion: emptyToNull(formData.get("direccion")),
    telefono: emptyToNull(formData.get("telefono")),
    correo: emptyToNull(formData.get("correo")),
    hijosCantidad: formData.get("hijosCantidad") || "0",
    estaturaCm: formData.get("estaturaCm"),
    pesoKg: formData.get("pesoKg"),
    tipoSangre: emptyToNull(formData.get("tipoSangre")),
    alergias: emptyToNull(formData.get("alergias")),
    condicionesMedicas: emptyToNull(formData.get("condicionesMedicas")),
    discapacidad: emptyToNull(formData.get("discapacidad")),
    observaciones: emptyToNull(formData.get("observaciones")),
    contactoNombre: formData.get("contactoNombre"),
    contactoParentesco: formData.get("contactoParentesco"),
    contactoTelefono: formData.get("contactoTelefono"),
    contactoDireccion: emptyToNull(formData.get("contactoDireccion")),
  };

  const parsed = aspiranteCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: zodFieldErrors(parsed.error) };
  }

  const d = parsed.data;
  const fichaPayload = fichaEvaluacionPayloadFromFormData(formData);

  const convocatoria = await getConvocatoriaActiva();
  if (!convocatoria) {
    return {
      ok: false,
      errors: { _form: "No hay convocatoria activa. Un administrador debe activar un período de ingreso." },
    };
  }

  try {
    const created = await prisma.aspirante.create({
      data: {
        unidadPostulante: d.unidadPostulante,
        calificacionAdmision:
          d.calificacionAdmision === "APTO"
            ? CalificacionAdmision.APTO
            : d.calificacionAdmision === "NO_APTO"
              ? CalificacionAdmision.NO_APTO
              : CalificacionAdmision.EN_EVALUACION,
        nombres: d.nombres,
        apellidos: d.apellidos,
        cedula: d.cedula,
        edad: d.edad,
        sexo: d.sexo === "FEMENINO" ? Sexo.FEMENINO : Sexo.MASCULINO,
        fechaNacimiento: d.fechaNacimiento,
        lugarNacimiento: d.lugarNacimiento,
        direccion: d.direccion ?? null,
        telefono: d.telefono ?? null,
        correo: d.correo ?? null,
        hijosCantidad: d.hijosCantidad,
        convocatoriaId: convocatoria.id,
        ...(fichaPayload !== undefined ? { fichaEvaluacion: toPrismaFichaEvaluacion(fichaPayload) } : {}),
        datosFisicos: {
          create: {
            estaturaCm: d.estaturaCm ?? null,
            pesoKg: d.pesoKg ?? null,
            tipoSangre: d.tipoSangre ?? null,
            alergias: d.alergias ?? null,
            condicionesMedicas: d.condicionesMedicas ?? null,
            discapacidad: d.discapacidad ?? null,
            observaciones: d.observaciones ?? null,
          },
        },
        contactos: {
          create: {
            nombre: d.contactoNombre,
            parentesco: d.contactoParentesco,
            telefono: d.contactoTelefono,
            direccion: d.contactoDireccion ?? null,
          },
        },
      },
    });
    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "ASPIRANTE_CREATE",
      entityType: "ASPIRANTE",
      entityId: created.id,
      metadata: {
        cedula: d.cedula,
        convocatoriaId: convocatoria.id,
        convocatoriaCodigo: convocatoria.codigo,
      },
    });
    revalidatePath(routes.personal.aspirante(created.id));
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        ok: false,
        errors: { cedula: "Esta cédula ya figura en la convocatoria activa." },
      };
    }
    throw e;
  }

  revalidatePath(routes.hub);
  revalidatePath(routes.personal.aspirantes);
  revalidatePath(routes.personal.aspirantesGestion);
  return { ok: true, errors: {} };
}

export async function deleteAspirante(formData: FormData) {
  const session = await requireWriter();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const row = await prisma.aspirante.findUnique({
    where: { id },
    select: { cedula: true, convocatoriaId: true },
  });
  if (!row) return;
  await prisma.aspirante.delete({ where: { id } });
  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action: "ASPIRANTE_DELETE",
    entityType: "ASPIRANTE",
    entityId: id,
    metadata: { cedula: row.cedula, convocatoriaId: row.convocatoriaId },
  });
  revalidatePath(routes.hub);
  revalidatePath(routes.personal.aspirantes);
  revalidatePath(routes.personal.aspirantesGestion);
  revalidatePath(routes.personal.aspirante(id));
}

export async function updateAspirante(
  _prev: AspiranteActionState,
  formData: FormData,
): Promise<AspiranteActionState> {
  const session = await requireWriter();

  const raw = {
    aspiranteId: formData.get("aspiranteId"),
    unidadPostulante: formData.get("unidadPostulante"),
    calificacionAdmision: formData.get("calificacionAdmision"),
    nombres: formData.get("nombres"),
    apellidos: formData.get("apellidos"),
    cedula: formData.get("cedula"),
    edad: formData.get("edad"),
    sexo: formData.get("sexo"),
    fechaNacimiento: formData.get("fechaNacimiento"),
    lugarNacimiento: formData.get("lugarNacimiento"),
    direccion: emptyToNull(formData.get("direccion")),
    telefono: emptyToNull(formData.get("telefono")),
    correo: emptyToNull(formData.get("correo")),
    hijosCantidad: formData.get("hijosCantidad") || "0",
    estaturaCm: formData.get("estaturaCm"),
    pesoKg: formData.get("pesoKg"),
    tipoSangre: emptyToNull(formData.get("tipoSangre")),
    alergias: emptyToNull(formData.get("alergias")),
    condicionesMedicas: emptyToNull(formData.get("condicionesMedicas")),
    discapacidad: emptyToNull(formData.get("discapacidad")),
    observaciones: emptyToNull(formData.get("observaciones")),
    contactoNombre: formData.get("contactoNombre"),
    contactoParentesco: formData.get("contactoParentesco"),
    contactoTelefono: formData.get("contactoTelefono"),
    contactoDireccion: emptyToNull(formData.get("contactoDireccion")),
  };

  const parsed = aspiranteUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: zodFieldErrors(parsed.error) };
  }

  const d = parsed.data;
  const aspiranteId = d.aspiranteId;
  const fichaPayload = fichaEvaluacionPayloadFromFormData(formData);

  const convocatoria = await getConvocatoriaActiva();
  if (!convocatoria) {
    return {
      ok: false,
      errors: { _form: "No hay convocatoria activa. Un administrador debe activar un período de ingreso." },
    };
  }

  const existing = await prisma.aspirante.findFirst({
    where: { id: aspiranteId, convocatoriaId: convocatoria.id },
    include: { datosFisicos: true, contactos: { orderBy: { createdAt: "asc" }, take: 1 } },
  });

  if (!existing) {
    return {
      ok: false,
      errors: {
        _form: "No se encontró el aspirante en la convocatoria activa o no tiene permiso para editarlo.",
      },
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.aspirante.update({
        where: { id: aspiranteId },
        data: {
          unidadPostulante: d.unidadPostulante,
          calificacionAdmision:
            d.calificacionAdmision === "APTO"
              ? CalificacionAdmision.APTO
              : d.calificacionAdmision === "NO_APTO"
                ? CalificacionAdmision.NO_APTO
                : CalificacionAdmision.EN_EVALUACION,
          nombres: d.nombres,
          apellidos: d.apellidos,
          cedula: d.cedula,
          edad: d.edad,
          sexo: d.sexo === "FEMENINO" ? Sexo.FEMENINO : Sexo.MASCULINO,
          fechaNacimiento: d.fechaNacimiento,
          lugarNacimiento: d.lugarNacimiento,
          direccion: d.direccion ?? null,
          telefono: d.telefono ?? null,
          correo: d.correo ?? null,
          hijosCantidad: d.hijosCantidad,
          ...(fichaPayload !== undefined ? { fichaEvaluacion: toPrismaFichaEvaluacion(fichaPayload) } : {}),
        },
      });

      await tx.datosFisicosMedicos.upsert({
        where: { aspiranteId },
        create: {
          aspiranteId,
          estaturaCm: d.estaturaCm ?? null,
          pesoKg: d.pesoKg ?? null,
          tipoSangre: d.tipoSangre ?? null,
          alergias: d.alergias ?? null,
          condicionesMedicas: d.condicionesMedicas ?? null,
          discapacidad: d.discapacidad ?? null,
          observaciones: d.observaciones ?? null,
        },
        update: {
          estaturaCm: d.estaturaCm ?? null,
          pesoKg: d.pesoKg ?? null,
          tipoSangre: d.tipoSangre ?? null,
          alergias: d.alergias ?? null,
          condicionesMedicas: d.condicionesMedicas ?? null,
          discapacidad: d.discapacidad ?? null,
          observaciones: d.observaciones ?? null,
        },
      });

      const contacto = existing.contactos[0];
      if (contacto) {
        await tx.contactoEmergencia.update({
          where: { id: contacto.id },
          data: {
            nombre: d.contactoNombre,
            parentesco: d.contactoParentesco,
            telefono: d.contactoTelefono,
            direccion: d.contactoDireccion ?? null,
          },
        });
      } else {
        await tx.contactoEmergencia.create({
          data: {
            aspiranteId,
            nombre: d.contactoNombre,
            parentesco: d.contactoParentesco,
            telefono: d.contactoTelefono,
            direccion: d.contactoDireccion ?? null,
          },
        });
      }
    });
    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "ASPIRANTE_UPDATE",
      entityType: "ASPIRANTE",
      entityId: aspiranteId,
      metadata: { cedula: d.cedula, convocatoriaId: convocatoria.id },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        ok: false,
        errors: { cedula: "Esta cédula ya figura en la convocatoria activa." },
      };
    }
    throw e;
  }

  revalidatePath(routes.hub);
  revalidatePath(routes.personal.aspirantes);
  revalidatePath(routes.personal.aspirantesGestion);
  revalidatePath(routes.personal.aspirante(aspiranteId));
  return { ok: true, errors: {} };
}
