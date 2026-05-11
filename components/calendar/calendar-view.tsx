"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarGrid } from "./calendar-grid"
import { WeekNavigator } from "./week-navigator"
import { MonthGrid } from "./month-grid"
import { SlotEditDialog } from "./slot-edit-dialog"
import { getCalendarDataForWeek, getSlotsForMonth } from "@/lib/actions/calendar"
import { getWeekStart, getMonthStart, nextWeek, prevWeek } from "@/lib/dates"
import type { User, Slot, TimeSlot } from "@/lib/types"
import type { RecurringRule } from "@/lib/calendar-logic"

type View = "week" | "month"

interface CalendarViewProps {
  currentUserId: string
  initialWeekStart: string
  initialUsers: User[]
  initialSlots: Slot[]
  initialRules: RecurringRule[]
}

interface DialogState {
  open: boolean
  userId: string
  date: string
  timeSlot: TimeSlot
  existingSlot?: Slot
  inheritedRule?: RecurringRule
}

function getInitialView(): View {
  if (typeof window === "undefined") return "week"
  return (localStorage.getItem("calendar-view") as View) ?? "week"
}

export function CalendarView({
  currentUserId,
  initialWeekStart,
  initialUsers,
  initialSlots,
  initialRules,
}: CalendarViewProps) {
  const [view, setView] = useState<View>(getInitialView)
  const [weekStart, setWeekStart] = useState(() => new Date(initialWeekStart))
  const [monthStart, setMonthStart] = useState(() => getMonthStart(new Date(initialWeekStart)))
  const [slots, setSlots] = useState<Slot[]>(initialSlots)
  const [rules, setRules] = useState<RecurringRule[]>(initialRules)
  const [isPending, startTransition] = useTransition()
  const [dialog, setDialog] = useState<DialogState | null>(null)

  const handleViewChange = (v: View) => {
    setView(v)
    localStorage.setItem("calendar-view", v)
  }

  const refresh = useCallback(async () => {
    if (view === "week") {
      const { slots: s, rules: r } = await getCalendarDataForWeek(weekStart)
      setSlots(s)
      setRules(r)
    } else {
      const s = await getSlotsForMonth(monthStart)
      setSlots(s)
    }
  }, [view, weekStart, monthStart])

  const handleWeekChange = (newWeekStart: Date) => {
    setWeekStart(newWeekStart)
    startTransition(async () => {
      const { slots: s, rules: r } = await getCalendarDataForWeek(newWeekStart)
      setSlots(s)
      setRules(r)
    })
  }

  const handleMonthChange = (newMonthStart: Date) => {
    setMonthStart(newMonthStart)
    startTransition(async () => {
      const s = await getSlotsForMonth(newMonthStart)
      setSlots(s)
    })
  }

  const handleSlotClick = (userId: string, date: string, timeSlot: TimeSlot) => {
    if (userId !== currentUserId) return

    const existingSlot = slots.find(
      (s) => s.userId === userId && s.date === date && s.timeSlot === timeSlot
    )

    // Cherche si ce slot hérite d'une règle récurrente (pas de slot spécifique)
    let inheritedRule: RecurringRule | undefined
    if (!existingSlot) {
      const dateObj = new Date(date + "T00:00:00")
      const dayOfWeek = dateObj.getDay()
      inheritedRule = rules.find((r) => {
        if (r.userId !== userId || r.timeSlot !== timeSlot || r.dayOfWeek !== dayOfWeek) return false
        const start = new Date(r.startDate + "T00:00:00")
        if (dateObj < start) return false
        if (r.endDate) {
          const end = new Date(r.endDate + "T00:00:00")
          if (dateObj > end) return false
        }
        return true
      })
    }

    setDialog({ open: true, userId, date, timeSlot, existingSlot, inheritedRule })
  }

  // Raccourcis clavier
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return

      switch (e.key) {
        case "ArrowLeft":
          if (view === "week") handleWeekChange(prevWeek(weekStart))
          break
        case "ArrowRight":
          if (view === "week") handleWeekChange(nextWeek(weekStart))
          break
        case "t":
          handleWeekChange(getWeekStart())
          if (view === "month") setMonthStart(getMonthStart())
          break
        case "w":
          handleViewChange("week")
          break
        case "m":
          handleViewChange("month")
          break
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [view, weekStart])

  return (
    <>
      <div className="flex justify-end mb-4">
        <Tabs value={view} onValueChange={(v) => handleViewChange(v as View)}>
          <TabsList>
            <TabsTrigger value="week">Semaine</TabsTrigger>
            <TabsTrigger value="month">Mois</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className={isPending ? "opacity-50 transition-opacity" : ""}>
        {view === "week" ? (
          <>
            <WeekNavigator weekStart={weekStart} onChange={handleWeekChange} />
            <CalendarGrid
              weekStart={weekStart}
              users={initialUsers}
              slots={slots}
              rules={rules}
              currentUserId={currentUserId}
              onSlotClick={handleSlotClick}
            />
          </>
        ) : (
          <MonthGrid
            monthStart={monthStart}
            users={initialUsers}
            slots={slots}
            onMonthChange={handleMonthChange}
          />
        )}
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
          inheritedRule={dialog.inheritedRule}
          onSave={refresh}
        />
      )}
    </>
  )
}
