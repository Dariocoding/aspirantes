/**
 * Inserta los aspirantes del documento «RESULTADOS DE ADMISIÓN CEFOA N° 46 (1ERA CONCENTRACIÓN)».
 * Ignora columnas condicionales; usa APTOS / NO APTOS para calificación.
 *
 * Ejecutar: pnpm exec tsx prisma/seed-cefoa46-aspirantes.ts
 *
 * Elimina la convocatoria de prueba `CEFOA-46-1ERA-2026` y sus aspirantes si existían.
 * Asocia los registros a la convocatoria más antigua de la BD (`createdAt` ascendente).
 */
import { PrismaClient } from "../src/generated/prisma";
import { CalificacionAdmision, Sexo } from "../src/generated/prisma";

const prisma = new PrismaClient();

const CODIGO_CONVOCATORIA_A_ELIMINAR = "CEFOA-46-1ERA-2026";

/** Coherente con validación del sistema (edad 16–80): placeholder, no «nacido hoy». */
const DEFAULT_EDAD = 25;

function defaultFechaNacimiento(): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setFullYear(d.getFullYear() - DEFAULT_EDAD);
  return d;
}

function onlyDigitsCedula(raw: string): string {
  return raw.replace(/\D/g, "");
}

function splitNombreCompleto(full: string): { nombres: string; apellidos: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { nombres: "SIN NOMBRE", apellidos: "SIN APELLIDO" };
  if (parts.length === 1) return { nombres: parts[0]!, apellidos: "-" };
  if (parts.length === 2) return { nombres: parts[0]!, apellidos: parts[1]! };
  if (parts.length === 3) return { nombres: `${parts[0]} ${parts[1]}`, apellidos: parts[2]! };
  return { nombres: parts.slice(0, -2).join(" "), apellidos: parts.slice(-2).join(" ") };
}

type RowIn = {
  unidad: string;
  nombreCompleto: string;
  cedula: string;
  cal: "APTO" | "NO_APTO" | "EN_EVALUACION";
  sexo: "M" | "F";
};

const ROWS: RowIn[] = [
  { unidad: "12 BRIGADA", nombreCompleto: "LIONI JOSE PEÑARANDA DIAZ", cedula: "30.089.001", cal: "EN_EVALUACION", sexo: "F" },
  { unidad: "12 BRIGADA", nombreCompleto: "JOSE ELIAS GONZALEZ PIRELA", cedula: "31.126.343", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "12 BRIGADA", nombreCompleto: "DIONIVER ROGER MEDINA MORENO", cedula: "30.200.909", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "13 BRIGADA", nombreCompleto: "KATERINE DEL CARMEN GONZALEZ VILLALOBOS", cedula: "24.510.369", cal: "EN_EVALUACION", sexo: "F" },
  { unidad: "14 BRIGADA", nombreCompleto: "GRENYER JOSE TORREALBA TORREALBA", cedula: "26.458.024", cal: "APTO", sexo: "M" },
  { unidad: "14 BRIGADA", nombreCompleto: "RAYNELL FELIPE MARIN SANCHEZ", cedula: "28.477.889", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "22 BRIGADA", nombreCompleto: "KLEY DAVID ABRAHAMSZ ROJAS", cedula: "25.163.687", cal: "APTO", sexo: "M" },
  { unidad: "22 BRIGADA", nombreCompleto: "JESUS ALBERTO ARISMENDI PAREDES", cedula: "29.957.801", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "22 BRIGADA", nombreCompleto: "GEISMAR ORIANA PEÑA MARQUEZ", cedula: "30.269.777", cal: "NO_APTO", sexo: "F" },
  { unidad: "25 BRIGADA", nombreCompleto: "DARIO ALFONSO FLORES MONTESINOS", cedula: "28.023.488", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "31 BRIGADA", nombreCompleto: "YULETZYS CORAIMA GARCIA", cedula: "24.620.066", cal: "EN_EVALUACION", sexo: "F" },
  { unidad: "31 BRIGADA", nombreCompleto: "FRANCISCO JAVIER CALLAMA VARGAS", cedula: "24.167.450", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "31 BRIGADA", nombreCompleto: "CESAR EDUARDO RIVAS APONTE", cedula: "25.617.176", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "33 BRIGADA", nombreCompleto: "JOSIAS JAVIER FLORES", cedula: "27.471.839", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "33 BRIGADA", nombreCompleto: "LAZARO ANTONIO EVANS ZAMBRANO", cedula: "26.033.114", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "35 BRIGADA", nombreCompleto: "KEILISMAR YAITZARETH REVENGA SOSA", cedula: "29.661.982", cal: "EN_EVALUACION", sexo: "F" },
  { unidad: "35 BRIGADA", nombreCompleto: "JOSE ALFREDO TINEDO CHAVEZ", cedula: "24.632.254", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "41 BRIGADA", nombreCompleto: "ADRIANA KAROLINA ESPINOLA MARQUEZ", cedula: "27.555.861", cal: "APTO", sexo: "F" },
  { unidad: "42 BRIGADA", nombreCompleto: "PEDRO RICARDO TINAURE ESCOBAR", cedula: "22.615.369", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "43 BRIGADA", nombreCompleto: "JESSICA CELIA FUENTES MORA", cedula: "21.658.152", cal: "EN_EVALUACION", sexo: "F" },
  { unidad: "43 BRIGADA", nombreCompleto: "YURIMAR GABRIELA RAMIREZ LUCENA", cedula: "29.671.428", cal: "APTO", sexo: "F" },
  { unidad: "43 BRIGADA", nombreCompleto: "FREDDY ANIBAL FLORES PERDOMO", cedula: "21.337.365", cal: "APTO", sexo: "M" },
  { unidad: "51 BRIGADA", nombreCompleto: "MARIA JOSE RAMIREZ RAMIREZ", cedula: "25.512.867", cal: "APTO", sexo: "F" },
  { unidad: "51 BRIGADA", nombreCompleto: "DAVID JOSE TORO TOVAR", cedula: "26.848.206", cal: "NO_APTO", sexo: "M" },
  { unidad: "52 BRIGADA", nombreCompleto: "DISRAEL JIHANDRI EMAYACU VELASQUEZ", cedula: "26.083.254", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "61 BRIGADA", nombreCompleto: "MILAGROS DEL VALLE ALVAREZ TORRES", cedula: "22.795.367", cal: "APTO", sexo: "F" },
  { unidad: "61 BRIGADA", nombreCompleto: "CARLOS ALBERTO GONZALEZ PEÑA", cedula: "25.252.227", cal: "NO_APTO", sexo: "M" },
  { unidad: "64 BRIGADA", nombreCompleto: "CLAUDIMAR AVID SALMERON PEREZ", cedula: "26.662.049", cal: "NO_APTO", sexo: "M" },
  { unidad: "81 BRIGADA", nombreCompleto: "FABIOLA SINAI MORILLO RAMIREZ", cedula: "23.496.495", cal: "APTO", sexo: "F" },
  { unidad: "81 BRIGADA", nombreCompleto: "JOSVEER DAVID OSTOS SUAREZ", cedula: "26.934.781", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "82 BRIGADA", nombreCompleto: "YARELIS DEL CARMEN SILVA QUINTERO", cedula: "22.294.844", cal: "APTO", sexo: "F" },
  { unidad: "82 BRIGADA", nombreCompleto: "YEIN DANIEL CONTRERAS ARAY", cedula: "30.598.046", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "82 BRIGADA", nombreCompleto: "SAMUEL JESUS PEREZ GUZMAN", cedula: "31.154.069", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "83 BRIGADA", nombreCompleto: "LUIS ALEJANDRO NAVARRO DIAZ", cedula: "27.341.224", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "83 BRIGADA", nombreCompleto: "ANGELICA YESIMAR NUÑEZ CEDEÑO", cedula: "30.091.500", cal: "APTO", sexo: "F" },
  { unidad: "91 BRIGADA", nombreCompleto: "LISBETHY VISMAR FLORES MONTOYA", cedula: "27.416.558", cal: "EN_EVALUACION", sexo: "F" },
  { unidad: "91 BRIGADA", nombreCompleto: "JOSE FRANCISCO MORAO MUJICA", cedula: "28.345.219", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "91 BRIGADA", nombreCompleto: "LOHANA MARIMAR FLORES OSTO", cedula: "26.658.822", cal: "EN_EVALUACION", sexo: "F" },
  { unidad: "92 BRIGADA", nombreCompleto: "JESUS EDUARDO AMADO RUIZ", cedula: "28.760.968", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "93 BRIGADA", nombreCompleto: "JONATHAN RAFAEL LEAL PALACIOS", cedula: "30.320.874", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "94 BRIGADA", nombreCompleto: "JUAN EDUARDO LEON GUAPE", cedula: "27.838.858", cal: "NO_APTO", sexo: "M" },
  { unidad: "99 BRIGADA", nombreCompleto: "LARYSA NOHEMY OCHOA SUAREZ", cedula: "24.904.093", cal: "EN_EVALUACION", sexo: "F" },
  { unidad: "99 BRIGADA", nombreCompleto: "CARLOS EDUARDO PINEDA ROMERO", cedula: "25.359.736", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "99 BRIGADA", nombreCompleto: "IBRAHIM JOSE VASQUEZ GAMBOA", cedula: "24.448.579", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "99 BRIGADA", nombreCompleto: "DAVID JOSE AVENDAÑO ORTIZ", cedula: "25.032.944", cal: "NO_APTO", sexo: "M" },
  { unidad: "COMANDO AV", nombreCompleto: "THAMYS NAIBETH ORTIZ ORTIZ", cedula: "24.798.124", cal: "EN_EVALUACION", sexo: "F" },
  { unidad: "COMANDO LOG.", nombreCompleto: "LUIS ENRIQUE MALAVE RODRIGUEZ", cedula: "29.642.712", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "CGEB", nombreCompleto: "MELANY SINAY HERNANDEZ ARISMENDI", cedula: "30.882.847", cal: "EN_EVALUACION", sexo: "F" },
  { unidad: "CGEB", nombreCompleto: "MAIREF MILAGRO CARICO MOSQUEDA", cedula: "26.037.693", cal: "EN_EVALUACION", sexo: "F" },
  { unidad: "DEEJB", nombreCompleto: "JOSE ANGEL NAVAS VICUÑA", cedula: "23.953.058", cal: "EN_EVALUACION", sexo: "M" },
  { unidad: "DEEJB", nombreCompleto: "ANIUSKA ROXANA LUGO RICO", cedula: "26.057.693", cal: "EN_EVALUACION", sexo: "F" },
  { unidad: "DEEJB", nombreCompleto: "ANTHONY SANTIAGO BLANCO HERRERA", cedula: "22.951.149", cal: "APTO", sexo: "M" },
  { unidad: "DEEJB", nombreCompleto: "WINEI DANIELA COLMENAREZ GONZALEZ", cedula: "30.285.198", cal: "NO_APTO", sexo: "F" },
  { unidad: "DEEJB", nombreCompleto: "MERCEDES AUDRI INMACULADA ROMERO GARCIA", cedula: "26.752.799", cal: "EN_EVALUACION", sexo: "F" },
  { unidad: "DEEJB", nombreCompleto: "ANYELIS DEL VALLE SUCRE FIGUEROA", cedula: "24.598.208", cal: "APTO", sexo: "F" },
  { unidad: "DEEJB", nombreCompleto: "IVAN LEONEL DE NAZARET LINAREZ RODRIGUEZ", cedula: "30.601.123", cal: "EN_EVALUACION", sexo: "M" },
];

function mapCalificacion(c: RowIn["cal"]): CalificacionAdmision {
  if (c === "APTO") return CalificacionAdmision.APTO;
  if (c === "NO_APTO") return CalificacionAdmision.NO_APTO;
  return CalificacionAdmision.EN_EVALUACION;
}

async function main() {
  const convocatoriaVieja = await prisma.convocatoria.findUnique({
    where: { codigo: CODIGO_CONVOCATORIA_A_ELIMINAR },
  });
  if (convocatoriaVieja) {
    const borrados = await prisma.aspirante.deleteMany({
      where: { convocatoriaId: convocatoriaVieja.id },
    });
    await prisma.convocatoria.delete({ where: { id: convocatoriaVieja.id } });
    console.log(
      `Convocatoria ${CODIGO_CONVOCATORIA_A_ELIMINAR} eliminada (${borrados.count} aspirantes y relaciones en cascada).`,
    );
  }

  const convocatoria = await prisma.convocatoria.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!convocatoria) {
    throw new Error(
      "No hay ninguna convocatoria en la base de datos. Crea una convocatoria en la aplicación y vuelve a ejecutar este script.",
    );
  }

  const fechaNac = defaultFechaNacimiento();
  const existing = new Set(
    (
      await prisma.aspirante.findMany({
        where: { convocatoriaId: convocatoria.id },
        select: { cedula: true },
      })
    ).map((a) => a.cedula),
  );

  let inserted = 0;
  let skipped = 0;

  for (const row of ROWS) {
    const cedula = onlyDigitsCedula(row.cedula);
    if (cedula.length < 6 || cedula.length > 12) {
      console.warn(`Cédula inválida (longitud), se omite: ${row.nombreCompleto} → ${cedula}`);
      skipped++;
      continue;
    }
    if (existing.has(cedula)) {
      skipped++;
      continue;
    }

    const { nombres, apellidos } = splitNombreCompleto(row.nombreCompleto);

    await prisma.aspirante.create({
      data: {
        unidadPostulante: row.unidad,
        calificacionAdmision: mapCalificacion(row.cal),
        nombres,
        apellidos,
        cedula,
        edad: DEFAULT_EDAD,
        sexo: row.sexo === "F" ? Sexo.FEMENINO : Sexo.MASCULINO,
        fechaNacimiento: fechaNac,
        lugarNacimiento: "Por definir",
        direccion: null,
        telefono: null,
        correo: null,
        hijosCantidad: 0,
        convocatoriaId: convocatoria.id,
        datosFisicos: {
          create: {},
        },
        contactos: {
          create: {
            nombre: "Por definir",
            parentesco: "No especificado",
            telefono: "0000000000",
            direccion: null,
          },
        },
      },
    });
    existing.add(cedula);
    inserted++;
  }

  console.log(
    `Convocatoria: ${convocatoria.codigo} (${convocatoria.id}). Insertados: ${inserted}, omitidos (ya existían o error): ${skipped}. Total filas en datos: ${ROWS.length}.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
