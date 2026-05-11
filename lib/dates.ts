import {
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  format,
  isToday as dateFnsIsToday,
} from "date-fns"
import { fr } from "date-fns/locale"

/**
 * Renvoie le lundi de la semaine contenant `date`.
 * On utilise weekStartsOn=1 pour avoir lundi comme premier jour (standard FR).
 */
export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}

/**
 * Renvoie un tableau des 7 jours d'une semaine, à partir du lundi.
 */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

/**
 * Format français court : "Lun 13"
 */
export function formatDayHeader(date: Date): string {
  return format(date, "EEE d", { locale: fr })
}

/**
 * Format complet : "Semaine du 13 mai au 19 mai 2026"
 */
export function formatWeekRange(weekStart: Date): string {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  return `Semaine du ${format(weekStart, "d MMM", { locale: fr })} au ${format(weekEnd, "d MMM yyyy", { locale: fr })}`
}

export function nextWeek(date: Date): Date {
  return addWeeks(date, 1)
}

export function prevWeek(date: Date): Date {
  return subWeeks(date, 1)
}

export function isToday(date: Date): boolean {
  return dateFnsIsToday(date)
}