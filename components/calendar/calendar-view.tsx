"use client"

import { useState, useTransition } from "react"
import { CalendarGrid } from "./calendar-grid"
import { WeekNavigator } from "./week-navigator"
import { getSlotsForWeek } from "@/lib/actions/calendar"
import type { User, Slot } from "@/lib/types"

interface CalendarViewProps {
  initialWeekStart: string  // ISO string (passing Date through RSC boundary needs serialization)
  initialUsers: User[]
  initialSlots: Slot[]
}

export function CalendarView({ initialWeekStart, initialUsers, initialSlots }: CalendarViewProps) {
  const [weekStart, setWeekStart] = useState(() => new Date(initialWeekStart))
  const [slots, setSlots] = useState<Slot[]>(initialSlots)
  const [isPending, startTransition] = useTransition()

  const handleWeekChange = (newWeekStart: Date) => {
    setWeekStart(newWeekStart)
    startTransition(async () => {
      const fresh = await getSlotsForWeek(newWeekStart)
      setSlots(fresh)
    })
  }

  return (
    <>
      <WeekNavigator weekStart={weekStart} onChange={handleWeekChange} />
      <div className={isPending ? "opacity-50 transition-opacity" : ""}>
        <CalendarGrid weekStart={weekStart} users={initialUsers} slots={slots} />
      </div>
    </>
  )
}