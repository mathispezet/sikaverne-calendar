import {
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
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

export function getMonthStart(date: Date = new Date()): Date {
  return startOfMonth(date)
}

export function nextMonth(date: Date): Date {
  return addMonths(date, 1)
}

export function prevMonth(date: Date): Date {
  return subMonths(date, 1)
}

/**
 * Renvoie toutes les semaines (lignes) d'un mois pour l'affichage grille.
 * Chaque ligne = 7 jours lun→dim. Peut inclure des jours du mois précédent/suivant.
 */
export function getMonthWeeks(monthStart: Date): Date[][] {
  const firstDay = startOfWeek(monthStart, { weekStartsOn: 1 })
  const lastDay = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 })

  const weeks: Date[][] = []
  let current = firstDay
  while (current <= lastDay) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(current, i)))
    current = addDays(current, 7)
  }
  return weeks
}

export function isSameMonthFn(date: Date, monthStart: Date): boolean {
  return isSameMonth(date, monthStart)
}

export function isSameDayFn(a: Date, b: Date): boolean {
  return isSameDay(a, b)
}

export function formatMonthYear(date: Date): string {
  return format(date, "MMMM yyyy", { locale: fr })
}