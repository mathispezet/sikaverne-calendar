"use client"

import { useState } from "react"
import { CalendarGrid } from "@/components/calendar/calendar-grid"
import { WeekNavigator } from "@/components/calendar/week-navigator"
import { getWeekStart } from "@/lib/dates"
import { mockUsers, generateMockSlots } from "@/lib/mock-data"

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart())

  // Pour l'instant : régénère les mocks à chaque changement de semaine
  // Au Sprint B4, on remplacera par un fetch
  const slots = generateMockSlots(weekStart)

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📅 Calendrier</h1>
      <WeekNavigator weekStart={weekStart} onChange={setWeekStart} />
      <CalendarGrid weekStart={weekStart} users={mockUsers} slots={slots} />
    </main>
  )
}