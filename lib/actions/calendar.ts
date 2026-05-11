"use server"

import { db } from "@/lib/db"
import { startOfWeek, addDays, format } from "date-fns"
import type { User, Slot, TimeSlot, SlotStatus } from "@/lib/types"

/**
 * Récupère tous les users actifs (triés par displayName)
 */
export async function getUsers(): Promise<User[]> {
  const dbUsers = await db.user.findMany({
    orderBy: { displayName: "asc" },
  })

  return dbUsers.map((u) => ({
    id: u.id,
    displayName: u.displayName,
    color: u.color,
  }))
}

/**
 * Récupère tous les slots d'une semaine (du lundi au dimanche inclus)
 */
export async function getSlotsForWeek(weekStart: Date): Promise<Slot[]> {
  const weekEnd = addDays(weekStart, 6)

  const dbSlots = await db.slot.findMany({
    where: {
      date: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
  })

  return dbSlots.map((s) => ({
    userId: s.userId,
    date: format(s.date, "yyyy-MM-dd"),
    timeSlot: s.timeSlot as TimeSlot,
    status: s.status as SlotStatus,
    customLabel: s.customLabel ?? undefined,
    customColor: s.customColor ?? undefined,
    note: s.note ?? undefined,
  }))
}

/**
 * Upsert un slot pour un user/date/timeSlot donné.
 * Utilisé au Sprint B5 pour l'édition.
 */
export async function upsertSlot(params: {
  userId: string
  date: string     // YYYY-MM-DD
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

/**
 * Supprime un slot (le rendre "non défini" = ?)
 */
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