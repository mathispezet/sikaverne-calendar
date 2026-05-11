import type { Slot, TimeSlot, SlotStatus } from "@/lib/types"

export interface RecurringRule {
  id: string
  userId: string
  dayOfWeek: number
  timeSlot: TimeSlot
  status: SlotStatus
  customLabel?: string
  customColor?: string
  startDate: string  // YYYY-MM-DD
  endDate?: string   // YYYY-MM-DD | undefined = infini
}

export interface ResolvedSlot {
  userId: string
  date: string
  timeSlot: TimeSlot
  status: SlotStatus
  customLabel?: string
  customColor?: string
  note?: string
  isRecurring: boolean
  recurringRuleId?: string
}

/**
 * Résout le slot effectif pour un user/date/timeSlot.
 * Priorité : Slot spécifique > RecurringRule active > null
 */
export function resolveSlot(
  userId: string,
  date: string,
  timeSlot: TimeSlot,
  slots: Slot[],
  rules: RecurringRule[]
): ResolvedSlot | null {
  // 1. Slot spécifique
  const specific = slots.find(
    (s) => s.userId === userId && s.date === date && s.timeSlot === timeSlot
  )
  if (specific) {
    return {
      userId,
      date,
      timeSlot,
      status: specific.status,
      customLabel: specific.customLabel,
      customColor: specific.customColor,
      note: specific.note,
      isRecurring: false,
    }
  }

  // 2. RecurringRule active
  const dateObj = new Date(date + "T00:00:00")
  // getDay() retourne 0=dim, 1=lun... — même convention que le schéma
  const dayOfWeek = dateObj.getDay()

  const rule = rules.find((r) => {
    if (r.userId !== userId) return false
    if (r.timeSlot !== timeSlot) return false
    if (r.dayOfWeek !== dayOfWeek) return false
    const start = new Date(r.startDate + "T00:00:00")
    if (dateObj < start) return false
    if (r.endDate) {
      const end = new Date(r.endDate + "T00:00:00")
      if (dateObj > end) return false
    }
    return true
  })

  if (rule) {
    return {
      userId,
      date,
      timeSlot,
      status: rule.status,
      customLabel: rule.customLabel,
      customColor: rule.customColor,
      isRecurring: true,
      recurringRuleId: rule.id,
    }
  }

  return null
}
