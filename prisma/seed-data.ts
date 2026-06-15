import { hash } from "bcryptjs";
import type { PrismaClient } from "../src/generated/prisma";
import { seedRbac } from "./seed-rbac";
import { seedInventario } from "./seed-inventario";
import { SYSTEM_ROLE_IDS } from "../src/lib/auth/rbac-catalog";

const efemeridesVenezuela = [
  // --- ENERO ---
  { nombre: "Año Nuevo", dia: 1, mes: 1, tipo: "FERIADO", descripcion: "Inicio del año civil." },
  { nombre: "Día de los Reyes Magos", dia: 6, mes: 1, tipo: "CULTURAL", descripcion: "Tradición cristiana de la epifanía." },
  { nombre: "Día del Maestro", dia: 15, mes: 1, tipo: "PROFESIONAL", descripcion: "Homenaje a los educadores (Fundación de la SVM)." },
  { nombre: "Día del Centra de Caracas", dia: 23, mes: 1, tipo: "HISTORICO", descripcion: "Fin de la dictadura de Marcos Pérez Jiménez (1958)." },

  // --- FEBRERO ---
  { nombre: "Natalicio de Antonio José de Sucre", dia: 3, mes: 2, tipo: "PATRIO", descripcion: "Nace el Gran Mariscal de Ayacucho (1795)." },
  { nombre: "Día del Odontólogo", dia: 3, mes: 2, tipo: "PROFESIONAL", descripcion: "Reconocimiento a la salud bucal." },
  { nombre: "Día de la Juventud", dia: 12, mes: 2, tipo: "PATRIO", descripcion: "Batalla de La Victoria liderada por José Félix Ribas." },
  { nombre: "Día del Amor y la Amistad", dia: 14, mes: 2, tipo: "CULTURAL", descripcion: "San Valentín." },
  { nombre: "Fallecimiento de Joaquín Crespo", dia: 16, mes: 2, tipo: "HISTORICO", descripcion: "Muerte del caudillo y presidente." },
  { nombre: "Día de la Federación", dia: 20, mes: 2, tipo: "HISTORICO", descripcion: "Guerra Federal (Toma del Cuartel de Coro)." },

  // --- MARZO ---
  { nombre: "Día de la Mujer", dia: 8, mes: 3, tipo: "NACIONAL", descripcion: "Día Internacional de la Mujer." },
  { nombre: "Día del Médico", dia: 10, mes: 3, tipo: "PROFESIONAL", descripcion: "Natalicio de José María Vargas." },
  { nombre: "Día de San José", dia: 19, mes: 3, tipo: "RELIGIOSO", descripcion: "Santo Patrono de Maracay y otras ciudades." },
  { nombre: "Día del Meteorólogo", dia: 23, mes: 3, tipo: "PROFESIONAL", descripcion: "Reconocimiento a la ciencia del clima." },

  // --- ABRIL ---
  { nombre: "Proclamación de la Independencia", dia: 19, mes: 4, tipo: "PATRIO", descripcion: "Grito de independencia en 1810 (Feriado)." },
  { nombre: "Día del Bioanalista", dia: 25, mes: 4, tipo: "PROFESIONAL", descripcion: "Natalicio de Rafael Rangel." },

  // --- MAYO ---
  { nombre: "Día del Trabajador", dia: 1, mes: 5, tipo: "FERIADO", descripcion: "Conmemoración del movimiento obrero." },
  { nombre: "Día de la Afrovenezolanidad", dia: 10, mes: 5, tipo: "CULTURAL", descripcion: "Insurrección de José Leonardo Chirino." },
  { nombre: "Día del Artista Plástico", dia: 10, mes: 5, tipo: "PROFESIONAL", descripcion: "Natalicio de Armando Reverón." },
  { nombre: "Día de la Radio en Venezuela", dia: 20, mes: 5, tipo: "CULTURAL", descripcion: "Primera transmisión de radio (AYRE)." },
  { nombre: "Día del Árbol", dia: 30, mes: 5, tipo: "NACIONAL", descripcion: "Celebración de la flora nacional." },

  // --- JUNIO ---
  { nombre: "Día del Bibliotecólogo", dia: 27, mes: 6, tipo: "PROFESIONAL", descripcion: "Homenaje a los guardianes del saber." },
  { nombre: "Batalla de Carabobo", dia: 24, mes: 6, tipo: "FERIADO", descripcion: "Victoria decisiva de la independencia (1821)." },
  { nombre: "Día del Ejército", dia: 24, mes: 6, tipo: "PATRIO", descripcion: "Fundación de las fuerzas terrestres." },
  { nombre: "Día del Periodista", dia: 27, mes: 6, tipo: "PROFESIONAL", descripcion: "Salida del primer Correo del Orinoco." },

  // --- JULIO ---
  { nombre: "Día de la Independencia", dia: 5, mes: 7, tipo: "FERIADO", descripcion: "Firma del Acta de Independencia (1811)." },
  { nombre: "Día del Abogado", dia: 23, mes: 7, tipo: "PROFESIONAL", descripcion: "Natalicio de Cristóbal Mendoza." },
  { nombre: "Natalicio del Libertador", dia: 24, mes: 7, tipo: "FERIADO", descripcion: "Nace Simón Bolívar en Caracas (1783)." },
  { nombre: "Batalla Naval del Lago", dia: 24, mes: 7, tipo: "PATRIO", descripcion: "Victoria naval sobre la flota realista." },
  { nombre: "Fundación de Caracas", dia: 25, mes: 7, tipo: "HISTORICO", descripcion: "Santiago de León de Caracas (1567)." },

  // --- AGOSTO ---
  { nombre: "Día de la Bandera", dia: 3, mes: 8, tipo: "PATRIO", descripcion: "Llegada de Miranda a la Vela de Coro." },
  { nombre: "Día del Nutricionista", dia: 11, mes: 8, tipo: "PROFESIONAL", descripcion: "Reconocimiento a los expertos en nutrición." },
  { nombre: "Día del Bombero", dia: 20, mes: 8, tipo: "NACIONAL", descripcion: "Homenaje a los cuerpos de seguridad." },

  // --- SEPTIEMBRE ---
  { nombre: "Aparición de la Virgen de Coromoto", dia: 8, mes: 9, tipo: "RELIGIOSO", descripcion: "Patrona de Venezuela." },

  // --- OCTUBRE ---
  { nombre: "Día del Odontólogo", dia: 3, mes: 10, tipo: "PROFESIONAL", descripcion: "Celebración gremial." },
  { nombre: "Día de la Resistencia Indígena", dia: 12, mes: 10, tipo: "FERIADO", descripcion: "Reconocimiento a los pueblos originarios." },
  { nombre: "Día del Ingeniero", dia: 28, mes: 10, tipo: "PROFESIONAL", descripcion: "Fundación del Colegio de Ingenieros." },

  // --- NOVIEMBRE ---
  { nombre: "Día de Todos los Santos", dia: 1, mes: 11, tipo: "RELIGIOSO", descripcion: "Conmemoración cristiana." },
  { nombre: "Día de la Chinita", dia: 18, mes: 11, tipo: "CULTURAL", descripcion: "Virgen de Nuestra Señora del Rosario de Chiquinquirá." },
  { nombre: "Día del Estudiante Universitario", dia: 21, mes: 11, tipo: "NACIONAL", descripcion: "Huelga estudiantil contra la dictadura (1957)." },
  { nombre: "Día del Músico", dia: 22, mes: 11, tipo: "PROFESIONAL", descripcion: "Día de Santa Cecilia." },
  { nombre: "Día del Escritor", dia: 29, mes: 11, tipo: "CULTURAL", descripcion: "Natalicio de Andrés Bello." },

  // --- DICIEMBRE ---
  { nombre: "Día del Farmacéutico", dia: 1, mes: 12, tipo: "PROFESIONAL", descripcion: "Reconocimiento al gremio." },
  { nombre: "Día del Profesor Universitario", dia: 5, mes: 12, tipo: "PROFESIONAL", descripcion: "Aprobación de la Ley de Universidades." },
  { nombre: "Día de la Inmaculada Concepción", dia: 8, mes: 12, tipo: "RELIGIOSO", descripcion: "Festividad católica." },
  { nombre: "Muerte de Simón Bolívar", dia: 17, mes: 12, tipo: "PATRIO", descripcion: "Fallecimiento en Santa Marta (1830)." },
  { nombre: "Nochebuena", dia: 24, mes: 12, tipo: "FERIADO", descripcion: "Víspera de Navidad." },
  { nombre: "Navidad", dia: 25, mes: 12, tipo: "FERIADO", descripcion: "Nacimiento de Jesús." },
  { nombre: "Día de los Santos Inocentes", dia: 28, mes: 12, tipo: "CULTURAL", descripcion: "Tradición de bromas y los Locos de La Vela." },
  { nombre: "Fin de Año", dia: 31, mes: 12, tipo: "FERIADO", descripcion: "Cierre del año calendario." }
];

/**
 * Datos iniciales idempotentes: añade efemérides del catálogo que aún no existen
 * (clave única día + mes + nombre) sin borrar las creadas o editadas en la app.
 * Crea el primer super administrador solo si no existe usuario con ADMIN_EMAIL.
 * Si ya hay usuarios pero ninguno con SUPER_ADMIN, promueve el ADMIN más antiguo.
 */
export async function runSeed(client: PrismaClient) {
  await seedRbac(client);
  await seedInventario(client);

  const inserted = await client.efemeride.createMany({
    data: efemeridesVenezuela,
    skipDuplicates: true,
  });
  const total = await client.efemeride.count();
  console.log(
    `Efemérides: ${inserted.count} filas nuevas en este paso; ${total} registros en tabla (catálogo base: ${efemeridesVenezuela.length}).`,
  );

  const superCount = await client.user.count({
    where: { roleId: SYSTEM_ROLE_IDS.SUPER_ADMIN },
  });
  if (superCount === 0) {
    const oldestAdmin = await client.user.findFirst({
      where: { roleId: SYSTEM_ROLE_IDS.ADMIN },
      orderBy: { createdAt: "asc" },
    });
    if (oldestAdmin) {
      await client.user.update({
        where: { id: oldestAdmin.id },
        data: { roleId: SYSTEM_ROLE_IDS.SUPER_ADMIN },
      });
      console.log(
        "[seed] Ningún super administrador en la base: el usuario ADMIN más antiguo fue promovido a SUPER_ADMIN.",
      );
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@admin.com";
  const existingAdmin = await client.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const isProd = process.env.NODE_ENV === "production";
    const password = process.env.ADMIN_PASSWORD ?? (isProd ? "" : "Admin12345");
    if (!password || password.length < 10) {
      console.warn(
        isProd
          ? "[seed] Producción: defina ADMIN_PASSWORD (mín. 10 caracteres, letra y dígito) para crear el primer super administrador."
          : "[seed] No se creó super administrador: falta contraseña válida o ADMIN_PASSWORD demasiado corto.",
      );
    } else {
      const passwordHash = await hash(password, 12);
      await client.user.create({
        data: {
          email: adminEmail,
          name: "Super administrador",
          passwordHash,
          roleId: SYSTEM_ROLE_IDS.SUPER_ADMIN,
        },
      });
      console.log("Usuario super administrador creado.");
    }
  }
}
