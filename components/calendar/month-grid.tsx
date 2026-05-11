"use client"

import { useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  getMonthWeeks,
  getMonthStart,
  nextMonth,
  prevMonth,
  formatMonthYear,
  isSameMonthFn,
  isSameDayFn,
  isToday,
} from "@/lib/dates"
import { STATUS_CONFIG, TIME_SLOT_CONFIG } from "@/lib/types"
import type { User, Slot, TimeSlot } from "@/lib/types"

const DAY_HEADERS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
const TIME_SLOTS: TimeSlot[] = ["MORNING", "AFTERNOON", "EVENING"]

interface MonthGridProps {
  monthStart: Date
  users: User[]
  slots: Slot[]
  onMonthChange: (newMonth: Date) => void
}

export function MonthGrid({ monthStart, users, slots, onMonthChange }: MonthGridProps) {
  const weeks = useMemo(() => getMonthWeeks(monthStart), [monthStart])

  const slotsByDateAndUser = useMemo(() => {
    const map = new Map<string, Map<string, Slot[]>>()
    for (const slot of slots) {
      if (!map.has(slot.date)) map.set(slot.date, new Map())
      const byUser = map.get(slot.date)!
      if (!byUser.has(slot.userId)) byUser.set(slot.userId, [])
      byUser.get(slot.userId)!.push(slot)
    }
    return map
  }, [slots])

  return (
    <div className="w-full">
      {/* Header navigation mois */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onMonthChange(prevMonth(monthStart))}
          aria-label="Mois précédent"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold capitalize">{formatMonthYear(monthStart)}</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onMonthChange(nextMonth(monthStart))}
          aria-label="Mois suivant"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grille */}
      <TooltipProvider>
        <div className="grid grid-cols-7 gap-1">
          {/* En-têtes jours */}
          {DAY_HEADERS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">
              {d}
            </div>
          ))}

          {/* Cellules */}
          {weeks.flat().map((day, i) => {
            const dateStr = day.toISOString().slice(0, 10)
            const inMonth = isSameMonthFn(day, monthStart)
            const today = isToday(day)
            const byUser = slotsByDateAndUser.get(dateStr)

            // Construit le tooltip : liste des dispos par user
            const tooltipLines: string[] = []
            if (byUser) {
              for (const user of users) {
                const userSlots = byUser.get(user.id)
                if (!userSlots?.length) continue
                const parts = userSlots.map((s) => {
                  const timeLabel = TIME_SLOT_CONFIG[s.timeSlot].short
                  const statusLabel =
                    s.status === "CUSTOM" && s.customLabel
                      ? s.customLabel
                      : STATUS_CONFIG[s.status].label
                  return `${timeLabel}: ${statusLabel}`
                })
                tooltipLines.push(`${user.displayName} — ${parts.join(", ")}`)
              }
            }

            // Dots par user (un point par user qui a au moins un slot ce jour)
            const dots = users
              .filter((u) => byUser?.has(u.id))
              .map((u) => {
                const userSlots = byUser!.get(u.id)!
                // Couleur dominante : priorité UNAVAILABLE > WORKING > AVAILABLE > CUSTOM
                const priority: Record<string, number> = {
                  UNAVAILABLE: 0,
                  WORKING: 1,
                  AVAILABLE: 2,
                  CUSTOM: 3,
                }
                const dominant = userSlots.sort(
                  (a, b) => priority[a.status] - priority[b.status]
                )[0]
                const color =
                  dominant.status === "CUSTOM" && dominant.customColor
                    ? dominant.customColor
                    : undefined
                const bgClass = color ? undefined : STATUS_CONFIG[dominant.status].bgClass
                return { userId: u.id, color, bgClass }
              })

            const cell = (
              <div
                key={i}
                className={[
                  "rounded-md p-1 min-h-[52px] flex flex-col items-center gap-1",
                  inMonth ? "bg-slate-800/50" : "bg-transparent opacity-30",
                  today ? "ring-2 ring-blue-500" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full",
                    today ? "bg-blue-500 text-white" : "text-slate-300",
                  ].join(" ")}
                >
                  {day.getDate()}
                </span>
                {dots.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 justify-center">
                    {dots.map(({ userId, color, bgClass }) => (
                      <span
                        key={userId}
                        className={["w-2 h-2 rounded-full", bgClass].filter(Boolean).join(" ")}
                        style={color ? { backgroundColor: color } : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            )

            if (tooltipLines.length === 0) return cell

            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>{cell}</TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <div className="text-xs space-y-0.5">
                    {tooltipLines.map((line, j) => (
                      <div key={j}>{line}</div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    </div>
  )
}
