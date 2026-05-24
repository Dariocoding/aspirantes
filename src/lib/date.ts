import { format } from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(date: Date) {
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: es });
}

export function isBirthdayToday(date: Date) {
  const today = new Date();
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
}
