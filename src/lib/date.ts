import { format, subYears } from "date-fns";
import { es } from "date-fns/locale";

/** Fecha placeholder cuando el nacimiento aún no se cargó (alta mínima). */
export const FECHA_NACIMIENTO_PENDIENTE = new Date(1900, 0, 1, 12, 0, 0, 0);

export function formatDate(date: Date) {
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: es });
}

/**
 * Interpreta `YYYY-MM-DD` como calendario local a mediodía.
 * Evita el desfase de un día que produce `new Date("YYYY-MM-DD")` (UTC).
 */
export function parseDateInputLocal(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const date = new Date(y, month - 1, day, 12, 0, 0, 0);
  if (date.getFullYear() !== y || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

/** True si la fecha no es el placeholder de alta mínima. */
export function hasRealBirthDate(date: Date) {
  return date.getFullYear() > 1900;
}

/**
 * Edad en años cumplidos a partir de la fecha de nacimiento.
 * Devuelve `null` si la fecha es placeholder o inválida.
 */
export function ageFromBirthDate(birth: Date, now: Date = new Date()): number | null {
  if (Number.isNaN(birth.getTime()) || !hasRealBirthDate(birth)) return null;
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  if (age < 0) return null;
  return age;
}

/**
 * Edad que se cumple en el próximo aniversario de nacimiento de este año calendario.
 * Útil para listados de cumpleaños del mes.
 */
export function ageTurningOnBirthday(birth: Date, now: Date = new Date()): number | null {
  const age = ageFromBirthDate(birth, now);
  if (age == null) return null;
  const alreadyPassed =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  return alreadyPassed ? age : age + 1;
}

export function isBirthdayToday(date: Date, reference: Date = new Date()) {
  if (!hasRealBirthDate(date)) return false;
  return date.getDate() === reference.getDate() && date.getMonth() === reference.getMonth();
}

export function isBirthdayThisMonth(date: Date, reference: Date = new Date()) {
  if (!hasRealBirthDate(date)) return false;
  return date.getMonth() === reference.getMonth();
}

/**
 * Filtro Prisma sobre `fechaNacimiento` equivalente a un rango de edad en años cumplidos.
 * `edadMin` / `edadMax` inclusivos.
 */
export function fechaNacimientoFilterForAgeRange(opts: {
  edadMin?: number;
  edadMax?: number;
  now?: Date;
}): { gt?: Date; lte?: Date } | null {
  const emin = opts.edadMin;
  const emax = opts.edadMax;
  const hasMin = emin != null && Number.isFinite(emin);
  const hasMax = emax != null && Number.isFinite(emax);
  if (!hasMin && !hasMax) return null;

  const now = opts.now ?? new Date();
  const filter: { gt?: Date; lte?: Date } = {};

  // Edad >= min → nacido el día de «hace min años» o antes.
  if (hasMin) {
    filter.lte = subYears(now, emin!);
  }

  // Edad <= max → nacido después de «hace (max+1) años».
  if (hasMax) {
    filter.gt = subYears(now, emax! + 1);
  } else {
    // Sin tope superior: excluir placeholder 1900-01-01.
    filter.gt = FECHA_NACIMIENTO_PENDIENTE;
  }

  return filter;
}
