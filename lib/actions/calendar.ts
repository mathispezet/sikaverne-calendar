"use server"

import { db } from "@/lib/db"
import { addDays, startOfDay, startOfMonth, endOfMonth, format } from "date-fns"
import type { User, Slot, TimeSlot, SlotStatus } from "@/lib/types"
import type { RecurringRule } from "@/lib/calendar-logic"
import { resolveSlot } from "@/lib/calendar-logic"

export async function getUsers(): Promise<User[]> {
  const dbUsers = await db.user.findMany({
    where: {
      // Uniquement les users qui se sont déjà connectés via Authentik
      authentikId: { not: null },
      // Exclure le compte admin Authentik
      NOT: { username: "akadmin" },
    },
    orderBy: { displayName: "asc" },
  })
  return dbUsers.map((u) => ({
    id: u.id,
    displayName: u.displayName,
    color: u.color,
  }))
}

function mapSlot(s: {
  userId: string
  date: Date
  timeSlot: string
  status: string
  customLabel: string | null
  customColor: string | null
  note: string | null
}): Slot {
  return {
    userId: s.userId,
    date: format(s.date, "yyyy-MM-dd"),
    timeSlot: s.timeSlot as TimeSlot,
    status: s.status as SlotStatus,
    customLabel: s.customLabel ?? undefined,
    customColor: s.customColor ?? undefined,
    note: s.note ?? undefined,
  }
}

function mapRule(r: {
  id: string
  userId: string
  dayOfWeek: number
  timeSlot: string
  status: string
  customLabel: string | null
  customColor: string | null
  startDate: Date
  endDate: Date | null
  rhythm: number
  rhythmWeekStart: Date | null
  ruleSetId: string | null
  ruleSetName: string | null
  priority: number
}): RecurringRule {
  return {
    id: r.id,
    userId: r.userId,
    dayOfWeek: r.dayOfWeek,
    timeSlot: r.timeSlot as TimeSlot,
    status: r.status as SlotStatus,
    customLabel: r.customLabel ?? undefined,
    customColor: r.customColor ?? undefined,
    startDate: format(r.startDate, "yyyy-MM-dd"),
    endDate: r.endDate ? format(r.endDate, "yyyy-MM-dd") : undefined,
    rhythm: r.rhythm,
    rhythmWeekStart: r.rhythmWeekStart ? format(r.rhythmWeekStart, "yyyy-MM-dd") : undefined,
    ruleSetId: r.ruleSetId ?? undefined,
    ruleSetName: r.ruleSetName ?? undefined,
    priority: r.priority,
  }
}

export async function getSlotsForWeek(weekStart: Date): Promise<Slot[]> {
  const weekEnd = addDays(weekStart, 6)
  const dbSlots = await db.slot.findMany({
    where: { date: { gte: weekStart, lte: weekEnd } },
  })
  return dbSlots.map(mapSlot)
}

export async function getCalendarDataForWeek(
  weekStart: Date
): Promise<{ slots: Slot[]; rules: RecurringRule[] }> {
  const weekEnd = addDays(weekStart, 6)
  const [dbSlots, dbRules] = await Promise.all([
    db.slot.findMany({ where: { date: { gte: weekStart, lte: weekEnd } } }),
    db.recurringRule.findMany(),
  ])
  return {
    slots: dbSlots.map(mapSlot),
    rules: dbRules.map(mapRule),
  }
}

export async function getSlotsForMonth(monthStart: Date): Promise<Slot[]> {
  const dbSlots = await db.slot.findMany({
    where: {
      date: { gte: startOfMonth(monthStart), lte: endOfMonth(monthStart) },
    },
  })
  return dbSlots.map(mapSlot)
}

export async function upsertSlot(params: {
  userId: string
  date: string
  timeSlot: TimeSlot
  status: SlotStatus
  customLabel?: string
  customColor?: string
  note?: string
}) {
  const date = new Date(params.date + "T00:00:00Z")
  return await db.slot.upsert({
    where: {
      userId_date_timeSlot: {
        userId: params.userId,
        date,
        timeSlot: params.timeSlot,
      },
    },
    update: {
      status: params.status,
      customLabel: params.customLabel ?? null,
      customColor: params.customColor ?? null,
      note: params.note ?? null,
    },
    create: {
      userId: params.userId,
      date,
      timeSlot: params.timeSlot,
      status: params.status,
      customLabel: params.customLabel,
      customColor: params.customColor,
      note: params.note,
    },
  })
}

export async function deleteSlot(params: {
  userId: string
  date: string
  timeSlot: TimeSlot
}) {
  const date = new Date(params.date + "T00:00:00Z")
  return await db.slot.delete({
    where: {
      userId_date_timeSlot: {
        userId: params.userId,
        date,
        timeSlot: params.timeSlot,
      },
    },
  })
}

export async function getRecurringRulesForUser(userId: string): Promise<RecurringRule[]> {
  const rules = await db.recurringRule.findMany({
    where: { userId },
    orderBy: [{ dayOfWeek: "asc" }, { timeSlot: "asc" }],
  })
  return rules.map(mapRule)
}

export async function getAllRecurringRules(): Promise<RecurringRule[]> {
  const rules = await db.recurringRule.findMany({
    orderBy: { priority: "desc" },
  })
  return rules.map(mapRule)
}

export async function upsertRecurringRule(params: {
  id?: string
  userId: string
  dayOfWeek: number
  timeSlot: TimeSlot
  status: SlotStatus
  customLabel?: string
  customColor?: string
  startDate: string
  endDate?: string
  rhythm?: number
  rhythmWeekStart?: string
  ruleSetId?: string
  ruleSetName?: string
  priority?: number
}): Promise<RecurringRule> {
  const startDate = new Date(params.startDate + "T00:00:00Z")
  const endDate = params.endDate ? new Date(params.endDate + "T00:00:00Z") : null
  const rhythmWeekStart = params.rhythmWeekStart ? new Date(params.rhythmWeekStart + "T00:00:00Z") : null

  const data = {
    userId: params.userId,
    dayOfWeek: params.dayOfWeek,
    timeSlot: params.timeSlot,
    status: params.status,
    customLabel: params.customLabel ?? null,
    customColor: params.customColor ?? null,
    startDate,
    endDate,
    rhythm: params.rhythm ?? 1,
    rhythmWeekStart,
    ruleSetId: params.ruleSetId ?? null,
    ruleSetName: params.ruleSetName ?? null,
    priority: params.priority ?? 0,
  }

  if (params.id) {
    const r = await db.recurringRule.update({ where: { id: params.id }, data })
    return mapRule(r)
  }
  const r = await db.recurringRule.create({ data })
  return mapRule(r)
}

export async function deleteRecurringRule(id: string): Promise<void> {
  await db.recurringRule.delete({ where: { id } })
}

// === Créneaux communs ===

export interface CommonSlot {
  date: string          // YYYY-MM-DD
  timeSlot: TimeSlot
  availableUsers: User[] // users dispos sur ce créneau
  totalUsers: number     // total dans le groupe (pour le %)
}

const TIME_SLOT_ORDER: Record<TimeSlot, number> = {
  MORNING: 0,
  AFTERNOON: 1,
  EVENING: 2,
}

/**
 * Cherche les créneaux à venir où au moins `minUsers` membres du groupe
 * sont simultanément disponibles.
 *
 * Pour chaque (user, date, timeSlot) dans la plage [today, today + weeksAhead semaines[,
 * on résout le statut effectif via resolveSlot. Un user est "dispo" si :
 *   - status === "AVAILABLE"
 *   Un créneau non rempli = indisponible.
 */
export async function findCommonSlots(params: {
  weeksAhead: number
  minUsers: number
  timeSlots?: TimeSlot[]
}): Promise<CommonSlot[]> {
  const { weeksAhead, minUsers } = params
  const timeSlots = params.timeSlots && params.timeSlots.length > 0
    ? params.timeSlots
    : (["MORNING", "AFTERNOON", "EVENING"] as TimeSlot[])

  const today = startOfDay(new Date())
  const totalDays = weeksAhead * 7
  const rangeEnd = addDays(today, totalDays - 1)

  // Fetch en parallèle
  const [users, dbSlots, dbRules] = await Promise.all([
    getUsers(),
    db.slot.findMany({
      where: { date: { gte: today, lte: rangeEnd } },
    }),
    db.recurringRule.findMany(),
  ])

  if (users.length === 0) return []

  const slots = dbSlots.map(mapSlot)
  const rules = dbRules.map(mapRule)

  // Index pour des lookups O(1) dans resolveSlot — sinon on referait
  // N×.find() pour chaque cellule. Ici on garde resolveSlot tel quel
  // et on lui passe un sous-tableau pré-filtré par user.
  const slotsByUser = new Map<string, Slot[]>()
  for (const s of slots) {
    const arr = slotsByUser.get(s.userId)
    if (arr) arr.push(s)
    else slotsByUser.set(s.userId, [s])
  }
  const rulesByUser = new Map<string, RecurringRule[]>()
  for (const r of rules) {
    const arr = rulesByUser.get(r.userId)
    if (arr) arr.push(r)
    else rulesByUser.set(r.userId, [r])
  }

  const results: CommonSlot[] = []

  for (let i = 0; i < totalDays; i++) {
    const day = addDays(today, i)
    const dateStr = format(day, "yyyy-MM-dd")

    for (const ts of timeSlots) {
      const availableUsers: User[] = []

      for (const user of users) {
        const resolved = resolveSlot(
          user.id,
          dateStr,
          ts,
          slotsByUser.get(user.id) ?? [],
          rulesByUser.get(user.id) ?? [],
        )

        let isAvailable: boolean
        if (resolved === null) {
          isAvailable = false
        } else {
          isAvailable = resolved.status === "AVAILABLE"
        }

        if (isAvailable) availableUsers.push(user)
      }

      if (availableUsers.length >= minUsers) {
        results.push({
          date: dateStr,
          timeSlot: ts,
          availableUsers,
          totalUsers: users.length,
        })
      }
    }
  }

  // Tri chronologique : date puis ordre des créneaux (matin → aprem → soir)
  results.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    return TIME_SLOT_ORDER[a.timeSlot] - TIME_SLOT_ORDER[b.timeSlot]
  })

  return results
}
