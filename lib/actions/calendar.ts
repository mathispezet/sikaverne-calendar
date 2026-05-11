"use server"

import { db } from "@/lib/db"
import { addDays, startOfMonth, endOfMonth, format } from "date-fns"
import type { User, Slot, TimeSlot, SlotStatus } from "@/lib/types"
import type { RecurringRule } from "@/lib/calendar-logic"

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
  const rules = await db.recurringRule.findMany()
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
}): Promise<RecurringRule> {
  const startDate = new Date(params.startDate + "T00:00:00Z")
  const endDate = params.endDate ? new Date(params.endDate + "T00:00:00Z") : null

  const data = {
    userId: params.userId,
    dayOfWeek: params.dayOfWeek,
    timeSlot: params.timeSlot,
    status: params.status,
    customLabel: params.customLabel ?? null,
    customColor: params.customColor ?? null,
    startDate,
    endDate,
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
