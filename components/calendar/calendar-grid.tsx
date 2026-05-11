import { User, Slot, TimeSlot, TIME_SLOT_CONFIG } from "@/lib/types"
import type { RecurringRule } from "@/lib/calendar-logic"
import { getWeekDays, formatDayHeader, isToday } from "@/lib/dates"
import { format } from "date-fns"
import { DayCell } from "./day-cell"
import { cn } from "@/lib/utils"

interface CalendarGridProps {
  weekStart: Date
  users: User[]
  slots: Slot[]
  rules: RecurringRule[]
  currentUserId: string
  onSlotClick: (userId: string, date: string, timeSlot: TimeSlot) => void
}

export function CalendarGrid({
  weekStart,
  users,
  slots,
  rules,
  currentUserId,
  onSlotClick,
}: CalendarGridProps) {
  const days = getWeekDays(weekStart)

  return (
    <div className="relative overflow-x-auto rounded-lg border border-border">
      {/* Gradient indicateur scroll horizontal sur mobile */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-20 sm:hidden" />
      <table className="w-full">
        <thead>
          <tr className="bg-card">
            <th className="sticky left-0 bg-card z-10 p-2 sm:p-3 text-left text-xs sm:text-sm font-medium border-r border-border min-w-[110px] sm:min-w-[140px]">
              Utilisateur
            </th>
            {/* Colonne légende créneaux */}
            <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium border-r border-border min-w-[60px] sm:min-w-[70px]">
              Créneau
            </th>
            {days.map((day) => (
              <th
                key={day.toISOString()}
                className={cn(
                  "p-2 sm:p-3 text-center text-xs sm:text-sm font-medium border-r border-border last:border-r-0 min-w-[60px] sm:min-w-[80px]",
                  isToday(day) && "bg-blue-900/30"
                )}
              >
                <div className="capitalize">{formatDayHeader(day)}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isCurrentUser = user.id === currentUserId
            return (
              <tr key={user.id} className="border-t border-border">
                <td
                  className={cn(
                    "sticky left-0 bg-background z-10 p-2 sm:p-3 border-r border-border",
                    isCurrentUser && "bg-card"
                  )}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: user.color }}
                    />
                    <span className="font-medium text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">
                      {user.displayName}
                      {isCurrentUser && <span className="text-primary"> (toi)</span>}
                    </span>
                  </div>
                </td>
                {/* Colonne légende créneaux */}
                <td className={cn("border-r border-border align-top", isToday(days[0]) && "")}>
                  <div className="flex flex-col gap-0.5 sm:gap-1 p-0.5 sm:p-1">
                    {(["MORNING", "AFTERNOON", "EVENING"] as TimeSlot[]).map((ts) => (
                      <div
                        key={ts}
                        className="h-6 sm:h-7 flex items-center justify-center text-[10px] sm:text-xs text-muted-foreground font-medium"
                      >
                        {TIME_SLOT_CONFIG[ts].short}
                      </div>
                    ))}
                  </div>
                </td>
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd")
                  return (
                    <td
                      key={day.toISOString()}
                      className={cn(
                        "border-r border-border last:border-r-0 align-top",
                        isToday(day) && "bg-blue-950/20"
                      )}
                    >
                      <DayCell
                        userId={user.id}
                        date={dateStr}
                        slots={slots}
                        rules={rules}
                        isEditable={isCurrentUser}
                        onSlotClick={onSlotClick}
                      />
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
