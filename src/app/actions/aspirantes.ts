"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@src/generated/prisma";
import { prisma } from "@src/lib/prisma";
import {
  CalificacionAdmision,
  ColorCabello,
  ColorOjos,
  ColorPiel,
  FactorRh,
  FormaLabios,
  FormaNariz,
  SenaParticular,
  Sexo,
  TallaUniformeOliva,
  TallaUniformePatriota,
} from "@src/generated/prisma";
import { composeRedSocial } from "@src/lib/aspirantes/senaletica";
import {
  aspiranteCreateSchema,
  aspiranteQuickUpdateSchema,
  aspiranteUpdateSchema,
  ASPIRANTE_FECHA_NACIMIENTO_PENDIENTE,
} from "@src/lib/validators/aspirante";
import { zodFieldErrors } from "@src/lib/zod-errors";
import { requireWriter } from "@src/lib/auth/guards";
import { getConvocatoriaActiva } from "@src/lib/convocatoria";
import type { AspiranteActionState } from "@src/lib/action-types";
import { writeAuditLog } from "@src/lib/audit/log";
import { routes } from "@src/lib/apps/routes";
import { isFichaEvaluacionVacia, normalizeFichaEvaluacionForDb } from "@src/lib/aspirantes/ficha-evaluacion";
import { normalizeTipoEstudio } from "@src/lib/aspirantes/tipo-estudio";
import {
  applyAspiranteFotosFromForm,
  removeAllAspiranteFotos,
  unknownFotoSaveError,
} from "@src/lib/aspirantes/apply-fotos";
import { isDocumentoFotoKind, saveAspiranteDocumentoFoto } from "@src/lib/aspirantes/save-documento-foto";
import { resolvePelotonIdForConvocatoria } from "@src/lib/pelotones";

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

function formSenaletica(formData: FormData) {
  return {
    colorCabello: emptyToNull(formData.get("colorCabello")),
    formaLabios: emptyToNull(formData.get("formaLabios")),
    formaNariz: emptyToNull(formData.get("formaNariz")),
    colorOjos: emptyToNull(formData.get("colorOjos")),
    colorPiel: emptyToNull(formData.get("colorPiel")),
    senaParticular: emptyToNull(formData.get("senaParticular")),
    factorRh: emptyToNull(formData.get("factorRh")),
    instagramEstado: emptyToNull(formData.get("instagramEstado")),
    instagramUsuario: emptyToNull(formData.get("instagramUsuario")),
    twitterEstado: emptyToNull(formData.get("twitterEstado")),
    twitterUsuario: emptyToNull(formData.get("twitterUsuario")),
    facebookEstado: emptyToNull(formData.get("facebookEstado")),
    facebookUsuario: emptyToNull(formData.get("facebookUsuario")),
    tallaUniformePatriota: emptyToNull(formData.get("tallaUniformePatriota")),
    tallaUniformeOliva: emptyToNull(formData.get("tallaUniformeOliva")),
    padresVenezolanos: emptyToNull(formData.get("padresVenezolanos")),
    madreNombres: emptyToNull(formData.get("madreNombres")),
    madreApellidos: emptyToNull(formData.get("madreApellidos")),
    madreCedula: emptyToNull(formData.get("madreCedula")),
    madreFechaNacimiento: emptyToNull(formData.get("madreFechaNacimiento")),
    padreNombres: emptyToNull(formData.get("padreNombres")),
    padreApellidos: emptyToNull(formData.get("padreApellidos")),
    padreCedula: emptyToNull(formData.get("padreCedula")),
    padreFechaNacimiento: emptyToNull(formData.get("padreFechaNacimiento")),
    poseeVehiculoPropio: emptyToNull(formData.get("poseeVehiculoPropio")),
    poseeViviendaPropia: emptyToNull(formData.get("poseeViviendaPropia")),
    carnetPatriaSerial: emptyToNull(formData.get("carnetPatriaSerial")),
    carnetPatriaCodigo: emptyToNull(formData.get("carnetPatriaCodigo")),
    cuentaNominaBanfanb: emptyToNull(formData.get("cuentaNominaBanfanb")),
  };
}

type SenaleticaParsed = {
  colorCabello?: string | null;
  formaLabios?: string | null;
  formaNariz?: string | null;
  colorOjos?: string | null;
  colorPiel?: string | null;
  senaParticular?: string | null;
  factorRh?: string | null;
  instagramEstado?: string | null;
  instagramUsuario?: string | null;
  twitterEstado?: string | null;
  twitterUsuario?: string | null;
  facebookEstado?: string | null;
  facebookUsuario?: string | null;
  tallaUniformePatriota?: string | null;
  tallaUniformeOliva?: string | null;
  padresVenezolanos?: boolean | null;
  madreNombres?: string | null;
  madreApellidos?: string | null;
  madreCedula?: string | null;
  madreFechaNacimiento?: Date | null;
  padreNombres?: string | null;
  padreApellidos?: string | null;
  padreCedula?: string | null;
  padreFechaNacimiento?: Date | null;
  poseeVehiculoPropio?: boolean | null;
  poseeViviendaPropia?: boolean | null;
  carnetPatriaSerial?: string | null;
  carnetPatriaCodigo?: string | null;
  cuentaNominaBanfanb?: string | null;
  tipoSangre?: string | null;
  estaturaCm?: number;
  pesoKg?: number;
  tensionArterial?: string | null;
  tallaGorra?: string | null;
  tallaCamisa?: string | null;
  tallaPantalon?: string | null;
  tallaCalzado?: string | null;
  alergias?: string | null;
  condicionesMedicas?: string | null;
  discapacidad?: string | null;
  observaciones?: string | null;
};

function datosFisicosWrite(d: SenaleticaParsed) {
  return {
    estaturaCm: d.estaturaCm ?? null,
    pesoKg: d.pesoKg ?? null,
    tensionArterial: d.tensionArterial ?? null,
    tipoSangre: d.tipoSangre ?? null,
    factorRh: (d.factorRh as FactorRh | null | undefined) ?? null,
    colorCabello: (d.colorCabello as ColorCabello | null | undefined) ?? null,
    formaLabios: (d.formaLabios as FormaLabios | null | undefined) ?? null,
    formaNariz: (d.formaNariz as FormaNariz | null | undefined) ?? null,
    colorOjos: (d.colorOjos as ColorOjos | null | undefined) ?? null,
    colorPiel: (d.colorPiel as ColorPiel | null | undefined) ?? null,
    senaParticular: (d.senaParticular as SenaParticular | null | undefined) ?? null,
    tallaUniformePatriota: (d.tallaUniformePatriota as TallaUniformePatriota | null | undefined) ?? null,
    tallaUniformeOliva: (d.tallaUniformeOliva as TallaUniformeOliva | null | undefined) ?? null,
    tallaGorra: d.tallaGorra ?? null,
    tallaCamisa: d.tallaCamisa ?? null,
    tallaPantalon: d.tallaPantalon ?? null,
    tallaCalzado: d.tallaCalzado ?? null,
    alergias: d.alergias ?? null,
    condicionesMedicas: d.condicionesMedicas ?? null,
    discapacidad: d.discapacidad ?? null,
    observaciones: d.observaciones ?? null,
  };
}

function familiaWrite(d: SenaleticaParsed) {
  return {
    padresVenezolanos: d.padresVenezolanos ?? null,
    madreNombres: d.madreNombres ?? null,
    madreApellidos: d.madreApellidos ?? null,
    madreCedula: d.madreCedula ?? null,
    madreFechaNacimiento: d.madreFechaNacimiento ?? null,
    padreNombres: d.padreNombres ?? null,
    padreApellidos: d.padreApellidos ?? null,
    padreCedula: d.padreCedula ?? null,
    padreFechaNacimiento: d.padreFechaNacimiento ?? null,
    poseeVehiculoPropio: d.poseeVehiculoPropio ?? null,
    poseeViviendaPropia: d.poseeViviendaPropia ?? null,
    carnetPatriaSerial: d.carnetPatriaSerial ?? null,
    carnetPatriaCodigo: d.carnetPatriaCodigo ?? null,
    cuentaNominaBanfanb: d.cuentaNominaBanfanb ?? null,
  };
}

function redesWrite(d: SenaleticaParsed) {
  return {
    instagram: composeRedSocial(d.instagramEstado, d.instagramUsuario),
    twitter: composeRedSocial(d.twitterEstado, d.twitterUsuario),
    facebook: composeRedSocial(d.facebookEstado, d.facebookUsuario),
  };
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
    sexo: formData.get("sexo"),
    fechaNacimiento: formData.get("fechaNacimiento"),
    lugarNacimiento: formData.get("lugarNacimiento"),
    direccion: emptyToNull(formData.get("direccion")),
    telefono: emptyToNull(formData.get("telefono")),
    correo: emptyToNull(formData.get("correo")),
    hijosCantidad: formData.get("hijosCantidad") || "0",
    estadoCivil: emptyToNull(formData.get("estadoCivil")),
    religion: emptyToNull(formData.get("religion")),
    deporte: emptyToNull(formData.get("deporte")),
    pelotonId: emptyToNull(formData.get("pelotonId")),
    estaturaCm: formData.get("estaturaCm"),
    pesoKg: formData.get("pesoKg"),
    tensionArterial: emptyToNull(formData.get("tensionArterial")),
    tipoSangre: emptyToNull(formData.get("tipoSangre")),
    tallaGorra: emptyToNull(formData.get("tallaGorra")),
    tallaCamisa: emptyToNull(formData.get("tallaCamisa")),
    tallaPantalon: emptyToNull(formData.get("tallaPantalon")),
    tallaCalzado: emptyToNull(formData.get("tallaCalzado")),
    alergias: emptyToNull(formData.get("alergias")),
    condicionesMedicas: emptyToNull(formData.get("condicionesMedicas")),
    discapacidad: emptyToNull(formData.get("discapacidad")),
    observaciones: emptyToNull(formData.get("observaciones")),
    ...formSenaletica(formData),
    contactoNombre: formData.get("contactoNombre"),
    contactoParentesco: formData.get("contactoParentesco"),
    contactoTelefono: formData.get("contactoTelefono"),
    contactoDireccion: emptyToNull(formData.get("contactoDireccion")),
    tipoEstudio: emptyToNull(formData.get("tipoEstudio")),
    nombreUniversidad: emptyToNull(formData.get("nombreUniversidad")),
    tituloUniversidad: emptyToNull(formData.get("tituloUniversidad")),
    paisUniversidad: emptyToNull(formData.get("paisUniversidad")),
    nucleoUniversidad: emptyToNull(formData.get("nucleoUniversidad")),
    anioIngresoUniversidad: formData.get("anioIngresoUniversidad"),
    anioEgresoUniversidad: formData.get("anioEgresoUniversidad"),
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

  const pelotonResolved = await resolvePelotonIdForConvocatoria(
    prisma,
    convocatoria.id,
    d.pelotonId,
  );
  if (!pelotonResolved.ok) {
    return { ok: false, errors: { pelotonId: pelotonResolved.error } };
  }

  const contactoNombre = d.contactoNombre.trim();
  const hasContacto = Boolean(contactoNombre);

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
        sexo: d.sexo === "FEMENINO" ? Sexo.FEMENINO : Sexo.MASCULINO,
        fechaNacimiento: d.fechaNacimiento ?? ASPIRANTE_FECHA_NACIMIENTO_PENDIENTE,
        lugarNacimiento: d.lugarNacimiento,
        direccion: d.direccion ?? null,
        telefono: d.telefono ?? null,
        correo: d.correo ?? null,
        hijosCantidad: d.hijosCantidad,
        estadoCivil: d.estadoCivil ?? null,
        religion: d.religion ?? null,
        deporte: d.deporte ?? null,
        ...redesWrite(d),
        ...familiaWrite(d),
        convocatoriaId: convocatoria.id,
        pelotonId: pelotonResolved.pelotonId,
        tipoEstudio: normalizeTipoEstudio(d.tipoEstudio) ?? null,
        nombreUniversidad: d.nombreUniversidad ?? null,
        tituloUniversidad: d.tituloUniversidad ?? null,
        paisUniversidad: d.paisUniversidad ?? null,
        nucleoUniversidad: d.nucleoUniversidad ?? null,
        anioIngresoUniversidad: d.anioIngresoUniversidad ?? null,
        anioEgresoUniversidad: d.anioEgresoUniversidad ?? null,
        ...(fichaPayload !== undefined ? { fichaEvaluacion: toPrismaFichaEvaluacion(fichaPayload) } : {}),
        datosFisicos: {
          create: datosFisicosWrite(d),
        },
        ...(hasContacto
          ? {
              contactos: {
                create: {
                  nombre: contactoNombre,
                  parentesco: d.contactoParentesco.trim() || "Por definir",
                  telefono: d.contactoTelefono.trim() || "—",
                  direccion: d.contactoDireccion ?? null,
                },
              },
            }
          : {}),
      },
    });

    const fotoResult = await applyAspiranteFotosFromForm(formData, created.id, {
      fotoKey: null,
      fotoEsquelaKey: null,
      fotoCedulaKey: null,
      fotoTituloKey: null,
      fotoTituloAutenticacionKey: null,
      fotoNotasKey: null,
    });
    if ("ok" in fotoResult && fotoResult.ok === false) {
      return fotoResult;
    }

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
    select: {
      cedula: true,
      convocatoriaId: true,
      fotoKey: true,
      fotoEsquelaKey: true,
      fotoCedulaKey: true,
      fotoTituloKey: true,
      fotoTituloAutenticacionKey: true,
      fotoNotasKey: true,
    },
  });
  if (!row) return;
  await prisma.aspirante.delete({ where: { id } });
  await removeAllAspiranteFotos({
    fotoKey: row.fotoKey,
    fotoEsquelaKey: row.fotoEsquelaKey,
    fotoCedulaKey: row.fotoCedulaKey,
    fotoTituloKey: row.fotoTituloKey,
    fotoTituloAutenticacionKey: row.fotoTituloAutenticacionKey,
    fotoNotasKey: row.fotoNotasKey,
  });
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
    sexo: formData.get("sexo"),
    fechaNacimiento: formData.get("fechaNacimiento"),
    lugarNacimiento: formData.get("lugarNacimiento"),
    direccion: emptyToNull(formData.get("direccion")),
    telefono: emptyToNull(formData.get("telefono")),
    correo: emptyToNull(formData.get("correo")),
    hijosCantidad: formData.get("hijosCantidad") || "0",
    estadoCivil: emptyToNull(formData.get("estadoCivil")),
    religion: emptyToNull(formData.get("religion")),
    deporte: emptyToNull(formData.get("deporte")),
    pelotonId: emptyToNull(formData.get("pelotonId")),
    estaturaCm: formData.get("estaturaCm"),
    pesoKg: formData.get("pesoKg"),
    tensionArterial: emptyToNull(formData.get("tensionArterial")),
    tipoSangre: emptyToNull(formData.get("tipoSangre")),
    tallaGorra: emptyToNull(formData.get("tallaGorra")),
    tallaCamisa: emptyToNull(formData.get("tallaCamisa")),
    tallaPantalon: emptyToNull(formData.get("tallaPantalon")),
    tallaCalzado: emptyToNull(formData.get("tallaCalzado")),
    alergias: emptyToNull(formData.get("alergias")),
    condicionesMedicas: emptyToNull(formData.get("condicionesMedicas")),
    discapacidad: emptyToNull(formData.get("discapacidad")),
    observaciones: emptyToNull(formData.get("observaciones")),
    ...formSenaletica(formData),
    contactoNombre: formData.get("contactoNombre"),
    contactoParentesco: formData.get("contactoParentesco"),
    contactoTelefono: formData.get("contactoTelefono"),
    contactoDireccion: emptyToNull(formData.get("contactoDireccion")),
    tipoEstudio: emptyToNull(formData.get("tipoEstudio")),
    nombreUniversidad: emptyToNull(formData.get("nombreUniversidad")),
    tituloUniversidad: emptyToNull(formData.get("tituloUniversidad")),
    paisUniversidad: emptyToNull(formData.get("paisUniversidad")),
    nucleoUniversidad: emptyToNull(formData.get("nucleoUniversidad")),
    anioIngresoUniversidad: formData.get("anioIngresoUniversidad"),
    anioEgresoUniversidad: formData.get("anioEgresoUniversidad"),
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

  const pelotonResolved = await resolvePelotonIdForConvocatoria(
    prisma,
    convocatoria.id,
    d.pelotonId,
  );
  if (!pelotonResolved.ok) {
    return { ok: false, errors: { pelotonId: pelotonResolved.error } };
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
          sexo: d.sexo === "FEMENINO" ? Sexo.FEMENINO : Sexo.MASCULINO,
          fechaNacimiento: d.fechaNacimiento ?? ASPIRANTE_FECHA_NACIMIENTO_PENDIENTE,
          lugarNacimiento: d.lugarNacimiento,
          direccion: d.direccion ?? null,
          telefono: d.telefono ?? null,
          correo: d.correo ?? null,
          hijosCantidad: d.hijosCantidad,
          estadoCivil: d.estadoCivil ?? null,
          religion: d.religion ?? null,
          deporte: d.deporte ?? null,
          ...redesWrite(d),
          ...familiaWrite(d),
          pelotonId: pelotonResolved.pelotonId,
          tipoEstudio: normalizeTipoEstudio(d.tipoEstudio) ?? null,
          nombreUniversidad: d.nombreUniversidad ?? null,
          tituloUniversidad: d.tituloUniversidad ?? null,
          paisUniversidad: d.paisUniversidad ?? null,
          nucleoUniversidad: d.nucleoUniversidad ?? null,
          anioIngresoUniversidad: d.anioIngresoUniversidad ?? null,
          anioEgresoUniversidad: d.anioEgresoUniversidad ?? null,
          ...(fichaPayload !== undefined ? { fichaEvaluacion: toPrismaFichaEvaluacion(fichaPayload) } : {}),
        },
      });

      await tx.datosFisicosMedicos.upsert({
        where: { aspiranteId },
        create: {
          aspiranteId,
          ...datosFisicosWrite(d),
        },
        update: datosFisicosWrite(d),
      });

      const contactoNombre = d.contactoNombre.trim();
      const hasContacto = Boolean(contactoNombre);
      const contacto = existing.contactos[0];
      if (contacto) {
        if (hasContacto) {
          await tx.contactoEmergencia.update({
            where: { id: contacto.id },
            data: {
              nombre: contactoNombre,
              parentesco: d.contactoParentesco.trim() || "Por definir",
              telefono: d.contactoTelefono.trim() || "—",
              direccion: d.contactoDireccion ?? null,
            },
          });
        } else {
          await tx.contactoEmergencia.delete({ where: { id: contacto.id } });
        }
      } else if (hasContacto) {
        await tx.contactoEmergencia.create({
          data: {
            aspiranteId,
            nombre: contactoNombre,
            parentesco: d.contactoParentesco.trim() || "Por definir",
            telefono: d.contactoTelefono.trim() || "—",
            direccion: d.contactoDireccion ?? null,
          },
        });
      }
    });

    const fotoResult = await applyAspiranteFotosFromForm(formData, aspiranteId, {
      fotoKey: existing.fotoKey,
      fotoEsquelaKey: existing.fotoEsquelaKey,
      fotoCedulaKey: existing.fotoCedulaKey,
      fotoTituloKey: existing.fotoTituloKey,
      fotoTituloAutenticacionKey: existing.fotoTituloAutenticacionKey,
      fotoNotasKey: existing.fotoNotasKey,
    });
    if ("ok" in fotoResult && fotoResult.ok === false) {
      return fotoResult;
    }

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

export async function updateAspiranteQuick(
  _prev: AspiranteActionState,
  formData: FormData,
): Promise<AspiranteActionState> {
  const session = await requireWriter();

  const parsed = aspiranteQuickUpdateSchema.safeParse({
    aspiranteId: formData.get("aspiranteId"),
    nombres: formData.get("nombres"),
    apellidos: formData.get("apellidos"),
    cedula: formData.get("cedula"),
    sexo: formData.get("sexo"),
    fechaNacimiento: formData.get("fechaNacimiento"),
    lugarNacimiento: formData.get("lugarNacimiento"),
    telefono: emptyToNull(formData.get("telefono")),
    correo: emptyToNull(formData.get("correo")),
    direccion: emptyToNull(formData.get("direccion")),
    pelotonId: emptyToNull(formData.get("pelotonId")),
    estaturaCm: formData.get("estaturaCm"),
    pesoKg: formData.get("pesoKg"),
    tensionArterial: emptyToNull(formData.get("tensionArterial")),
    tipoSangre: emptyToNull(formData.get("tipoSangre")),
    tallaGorra: emptyToNull(formData.get("tallaGorra")),
    tallaCamisa: emptyToNull(formData.get("tallaCamisa")),
    tallaPantalon: emptyToNull(formData.get("tallaPantalon")),
    tallaCalzado: emptyToNull(formData.get("tallaCalzado")),
    alergias: emptyToNull(formData.get("alergias")),
    condicionesMedicas: emptyToNull(formData.get("condicionesMedicas")),
    discapacidad: emptyToNull(formData.get("discapacidad")),
    observaciones: emptyToNull(formData.get("observaciones")),
    ...formSenaletica(formData),
    contactoNombre: formData.get("contactoNombre"),
    contactoParentesco: formData.get("contactoParentesco"),
    contactoTelefono: formData.get("contactoTelefono"),
    contactoDireccion: emptyToNull(formData.get("contactoDireccion")),
  });
  if (!parsed.success) {
    return { ok: false, errors: zodFieldErrors(parsed.error) };
  }

  const d = parsed.data;
  const convocatoria = await getConvocatoriaActiva();
  if (!convocatoria) {
    return {
      ok: false,
      errors: { _form: "No hay convocatoria activa. Un administrador debe activar un período de ingreso." },
    };
  }

  const existing = await prisma.aspirante.findFirst({
    where: { id: d.aspiranteId, convocatoriaId: convocatoria.id },
    include: { contactos: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  if (!existing) {
    return {
      ok: false,
      errors: {
        _form: "No se encontró el aspirante en la convocatoria activa o no tiene permiso para editarlo.",
      },
    };
  }

  const pelotonResolved = await resolvePelotonIdForConvocatoria(prisma, convocatoria.id, d.pelotonId);
  if (!pelotonResolved.ok) {
    return { ok: false, errors: { pelotonId: pelotonResolved.error } };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.aspirante.update({
        where: { id: d.aspiranteId },
        data: {
          nombres: d.nombres,
          apellidos: d.apellidos,
          cedula: d.cedula,
          sexo:
            d.sexo === "FEMENINO"
              ? Sexo.FEMENINO
              : d.sexo === "MASCULINO"
                ? Sexo.MASCULINO
                : existing.sexo,
          fechaNacimiento: d.fechaNacimiento ?? ASPIRANTE_FECHA_NACIMIENTO_PENDIENTE,
          lugarNacimiento: d.lugarNacimiento,
          telefono: d.telefono ?? null,
          correo: d.correo ?? null,
          direccion: d.direccion ?? null,
          pelotonId: pelotonResolved.pelotonId,
          ...redesWrite(d),
          ...familiaWrite(d),
        },
      });

      await tx.datosFisicosMedicos.upsert({
        where: { aspiranteId: d.aspiranteId },
        create: {
          aspiranteId: d.aspiranteId,
          ...datosFisicosWrite(d),
        },
        update: datosFisicosWrite(d),
      });

      const contactoNombre = d.contactoNombre.trim();
      const hasContacto = Boolean(contactoNombre);
      const contacto = existing.contactos[0];
      if (contacto) {
        if (hasContacto) {
          await tx.contactoEmergencia.update({
            where: { id: contacto.id },
            data: {
              nombre: contactoNombre,
              parentesco: d.contactoParentesco.trim() || "Por definir",
              telefono: d.contactoTelefono.trim() || "—",
              direccion: d.contactoDireccion ?? null,
            },
          });
        } else {
          await tx.contactoEmergencia.delete({ where: { id: contacto.id } });
        }
      } else if (hasContacto) {
        await tx.contactoEmergencia.create({
          data: {
            aspiranteId: d.aspiranteId,
            nombre: contactoNombre,
            parentesco: d.contactoParentesco.trim() || "Por definir",
            telefono: d.contactoTelefono.trim() || "—",
            direccion: d.contactoDireccion ?? null,
          },
        });
      }
    });

    const fotoResult = await applyAspiranteFotosFromForm(formData, d.aspiranteId, {
      fotoKey: existing.fotoKey,
      fotoEsquelaKey: existing.fotoEsquelaKey,
      fotoCedulaKey: existing.fotoCedulaKey,
      fotoTituloKey: existing.fotoTituloKey,
      fotoTituloAutenticacionKey: existing.fotoTituloAutenticacionKey,
      fotoNotasKey: existing.fotoNotasKey,
    });
    if ("ok" in fotoResult && fotoResult.ok === false) {
      return fotoResult;
    }

    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "ASPIRANTE_UPDATE",
      entityType: "ASPIRANTE",
      entityId: d.aspiranteId,
      metadata: { cedula: d.cedula, modo: "rapido", convocatoriaId: convocatoria.id },
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
  revalidatePath(routes.personal.aspirante(d.aspiranteId));
  return { ok: true, errors: {} };
}

export async function updateAspiranteDocumentoFoto(
  formData: FormData,
): Promise<AspiranteActionState & { hasFoto?: boolean; isPdf?: boolean }> {
  const session = await requireWriter();
  const aspiranteId = String(formData.get("aspiranteId") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? "").trim();
  if (!aspiranteId) {
    return { ok: false, errors: { _form: "Falta el aspirante." } };
  }
  if (!isDocumentoFotoKind(kindRaw)) {
    return { ok: false, errors: { _form: "Tipo de documento no válido." } };
  }

  return saveAspiranteDocumentoFoto({ session, formData, aspiranteId, kind: kindRaw });
}
