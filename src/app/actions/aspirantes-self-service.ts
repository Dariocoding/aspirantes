"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { AspiranteSelfServiceState } from "@src/lib/action-types";
import { writeAuditLog } from "@src/lib/audit/log";
import { routes } from "@src/lib/apps/routes";
import {
  clearSelfServiceFailures,
  clientKeyFromHeaders,
  isSelfServiceIpLocked,
  recordSelfServiceFailure,
} from "@src/lib/auth/self-service-attempts";
import { getConvocatoriaActiva } from "@src/lib/convocatoria";
import { prisma } from "@src/lib/prisma";
import {
  aspiranteSelfServiceUpdateSchema,
  aspiranteSelfServiceVerifySchema,
} from "@src/lib/validators/aspirante";
import { zodFieldErrors } from "@src/lib/zod-errors";
import { applyAspiranteFotosFromForm } from "@src/lib/aspirantes/apply-fotos";
import { toDateInputValue } from "@src/lib/date-input";

function emptyToNull(v: unknown) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function onlyDigitsCedula(raw: string): string {
  return raw.replace(/\D/g, "");
}

const GENERIC_NOT_FOUND =
  "No se encontró un aspirante con esa cédula en la convocatoria activa.";

async function clientIp(): Promise<string> {
  const h = await headers();
  return clientKeyFromHeaders(h);
}

async function findVerifiedAspirante(cedula: string) {
  const convocatoria = await getConvocatoriaActiva();
  if (!convocatoria) return { convocatoria: null, aspirante: null };

  const aspirante = await prisma.aspirante.findFirst({
    where: { cedula, convocatoriaId: convocatoria.id },
    include: {
      datosFisicos: true,
      contactos: { orderBy: { createdAt: "asc" }, take: 1 },
      convocatoria: true,
    },
  });
  if (!aspirante) return { convocatoria, aspirante: null };

  return { convocatoria, aspirante };
}

function toSelfServiceRecord(
  a: NonNullable<Awaited<ReturnType<typeof findVerifiedAspirante>>["aspirante"]>,
): NonNullable<AspiranteSelfServiceState["record"]> {
  const c = a.contactos[0];
  return {
    aspiranteId: a.id,
    cedula: a.cedula,
    nombres: a.nombres,
    apellidos: a.apellidos,
    fechaNacimiento: toDateInputValue(a.fechaNacimiento),
    lugarNacimiento: a.lugarNacimiento,
    edad: a.edad,
    sexo: a.sexo === "FEMENINO" ? "FEMENINO" : "MASCULINO",
    direccion: a.direccion,
    telefono: a.telefono,
    correo: a.correo,
    hijosCantidad: a.hijosCantidad,
    estaturaCm: a.datosFisicos?.estaturaCm ?? null,
    pesoKg: a.datosFisicos?.pesoKg ?? null,
    tipoSangre: a.datosFisicos?.tipoSangre ?? null,
    alergias: a.datosFisicos?.alergias ?? null,
    condicionesMedicas: a.datosFisicos?.condicionesMedicas ?? null,
    discapacidad: a.datosFisicos?.discapacidad ?? null,
    observaciones: a.datosFisicos?.observaciones ?? null,
    contactoNombre: c?.nombre ?? "",
    contactoParentesco: c?.parentesco ?? "",
    contactoTelefono: c?.telefono ?? "",
    contactoDireccion: c?.direccion ?? null,
    unidadPostulante: a.unidadPostulante,
    convocatoriaNombre: a.convocatoria.nombre,
    convocatoriaCodigo: a.convocatoria.codigo,
    fotoKey: a.fotoKey,
    fotoCedulaKey: a.fotoCedulaKey,
    fotoTituloKey: a.fotoTituloKey,
  };
}

export async function verifyAspiranteSelfService(
  _prev: AspiranteSelfServiceState,
  formData: FormData,
): Promise<AspiranteSelfServiceState> {
  const ip = await clientIp();
  if (isSelfServiceIpLocked(ip)) {
    return {
      ok: false,
      errors: {
        _form: "Demasiados intentos fallidos. Espere unos minutos e intente de nuevo.",
      },
      record: null,
    };
  }

  const parsed = aspiranteSelfServiceVerifySchema.safeParse({
    cedula: onlyDigitsCedula(String(formData.get("cedula") ?? "")),
  });
  if (!parsed.success) {
    recordSelfServiceFailure(ip);
    return { ok: false, errors: zodFieldErrors(parsed.error), record: null };
  }

  const { convocatoria, aspirante } = await findVerifiedAspirante(parsed.data.cedula);

  if (!convocatoria) {
    return {
      ok: false,
      errors: {
        _form: "No hay convocatoria activa en este momento. Intente más tarde.",
      },
      record: null,
    };
  }

  if (!aspirante) {
    recordSelfServiceFailure(ip);
    return { ok: false, errors: { _form: GENERIC_NOT_FOUND }, record: null };
  }

  clearSelfServiceFailures(ip);
  return {
    ok: true,
    errors: {},
    record: toSelfServiceRecord(aspirante),
  };
}

export async function updateAspiranteSelfService(
  _prev: AspiranteSelfServiceState,
  formData: FormData,
): Promise<AspiranteSelfServiceState> {
  const ip = await clientIp();
  if (isSelfServiceIpLocked(ip)) {
    return {
      ok: false,
      errors: {
        _form: "Demasiados intentos fallidos. Espere unos minutos e intente de nuevo.",
      },
      record: null,
    };
  }

  const raw = {
    aspiranteId: formData.get("aspiranteId"),
    cedula: onlyDigitsCedula(String(formData.get("cedula") ?? "")),
    nombres: formData.get("nombres"),
    apellidos: formData.get("apellidos"),
    fechaNacimiento: formData.get("fechaNacimiento"),
    lugarNacimiento: formData.get("lugarNacimiento"),
    edad: formData.get("edad"),
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

  const parsed = aspiranteSelfServiceUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: zodFieldErrors(parsed.error), record: null };
  }

  const d = parsed.data;
  const { convocatoria, aspirante } = await findVerifiedAspirante(d.cedula);

  if (!convocatoria) {
    return {
      ok: false,
      errors: {
        _form: "No hay convocatoria activa en este momento. Intente más tarde.",
      },
      record: null,
    };
  }

  if (!aspirante || aspirante.id !== d.aspiranteId) {
    recordSelfServiceFailure(ip);
    return { ok: false, errors: { _form: GENERIC_NOT_FOUND }, record: null };
  }

  await prisma.$transaction(async (tx) => {
    await tx.aspirante.update({
      where: { id: aspirante.id },
      data: {
        nombres: d.nombres,
        apellidos: d.apellidos,
        fechaNacimiento: d.fechaNacimiento,
        lugarNacimiento: d.lugarNacimiento,
        edad: d.edad,
        direccion: d.direccion ?? null,
        telefono: d.telefono ?? null,
        correo: d.correo ?? null,
        hijosCantidad: d.hijosCantidad,
      },
    });

    await tx.datosFisicosMedicos.upsert({
      where: { aspiranteId: aspirante.id },
      create: {
        aspiranteId: aspirante.id,
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

    const contacto = aspirante.contactos[0];
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
          aspiranteId: aspirante.id,
          nombre: d.contactoNombre,
          parentesco: d.contactoParentesco,
          telefono: d.contactoTelefono,
          direccion: d.contactoDireccion ?? null,
        },
      });
    }
  });

  const fotoResult = await applyAspiranteFotosFromForm(formData, aspirante.id, {
    fotoKey: aspirante.fotoKey,
    fotoCedulaKey: aspirante.fotoCedulaKey,
    fotoTituloKey: aspirante.fotoTituloKey,
  });
  if ("ok" in fotoResult && fotoResult.ok === false) {
    return { ...fotoResult, record: toSelfServiceRecord(aspirante) };
  }

  await writeAuditLog({
    userId: null,
    userEmail: null,
    action: "ASPIRANTE_SELF_UPDATE",
    entityType: "ASPIRANTE",
    entityId: aspirante.id,
    metadata: {
      source: "self-service",
      cedula: d.cedula,
      convocatoriaId: convocatoria.id,
      ip,
    },
  });

  clearSelfServiceFailures(ip);
  revalidatePath(routes.actualizarDatos);
  revalidatePath(routes.personal.aspirantes);
  revalidatePath(routes.personal.aspirante(aspirante.id));

  const refreshed = await findVerifiedAspirante(d.cedula);
  return {
    ok: true,
    errors: {},
    record: refreshed.aspirante ? toSelfServiceRecord(refreshed.aspirante) : null,
  };
}
