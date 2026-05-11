"use client"

import { useState, useTransition } from "react"
import { CalendarGrid } from "./calendar-grid"
import { WeekNavigator } from "./week-navigator"
import { SlotEditDialog } from "./slot-edit-dialog"
import { getSlotsForWeek } from "@/lib/actions/calendar"
import type { User, Slot, TimeSlot } from "@/lib/types"

interface CalendarViewProps {
  currentUserId: string
  initialWeekStart: string
  initialUsers: User[]
  initialSlots: Slot[]
}

interface DialogState {
  open: boolean
  userId: string
  date: string
  timeSlot: TimeSlot
  existingSlot?: Slot
}

export function CalendarView({
  currentUserId,
  initialWeekStart,
  initialUsers,
  initialSlots,
}: CalendarViewProps) {
  const [weekStart, setWeekStart] = useState(() => new Date(initialWeekStart))
  const [slots, setSlots] = useState<Slot[]>(initialSlots)
  const [isPending, startTransition] = useTransition()
  const [dialog, setDialog] = useState<DialogState | null>(null)

  const refresh = async () => {
    const fresh = await getSlotsForWeek(weekStart)
    setSlots(fresh)
  }

  const handleWeekChange = (newWeekStart: Date) => {
    setWeekStart(newWeekStart)
    startTransition(async () => {
      const fresh = await getSlotsForWeek(newWeekStart)
      setSlots(fresh)
    })
  }

  const handleSlotClick = (userId: string, date: string, timeSlot: TimeSlot) => {
    // Seul le user courant peut éditer ses propres slots
    if (userId !== currentUserId) return

    const existingSlot = slots.find(
      (s) => s.userId === userId && s.date === date && s.timeSlot === timeSlot
    )

    setDialog({
      open: true,
      userId,
      date,
      timeSlot,
      existingSlot,
    })
  }

  return (
    <>
      <WeekNavigator weekStart={weekStart} onChange={handleWeekChange} />
      <div className={isPending ? "opacity-50 transition-opacity" : ""}>
        <CalendarGrid
          weekStart={weekStart}
          users={initialUsers}
          slots={slots}
          currentUserId={currentUserId}
          onSlotClick={handleSlotClick}
        />
      </div>
      {dialog && (
        <SlotEditDialog
          open={dialog.open}
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
          userId={dialog.userId}
          date={dialog.date}
          timeSlot={dialog.timeSlot}
          existingSlot={dialog.existingSlot}
          onSave={refresh}
        />
      )}
    </>
  )
}