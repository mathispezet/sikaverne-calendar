import { User, Slot } from "@/lib/types"
import { getWeekDays, formatDayHeader, isToday } from "@/lib/dates"
import { format } from "date-fns"
import { DayCell } from "./day-cell"
import { cn } from "@/lib/utils"

interface CalendarGridProps {
  weekStart: Date
  users: User[]
  slots: Slot[]
}

export function CalendarGrid({ weekStart, users, slots }: CalendarGridProps) {
  const days = getWeekDays(weekStart)

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-900">
            <th className="sticky left-0 bg-slate-900 z-10 p-3 text-left text-sm font-medium border-r border-slate-700 min-w-[140px]">
              Utilisateur
            </th>
            {days.map((day) => (
              <th
                key={day.toISOString()}
                className={cn(
                  "p-3 text-center text-sm font-medium border-r border-slate-700 last:border-r-0",
                  isToday(day) && "bg-blue-900/30"
                )}
              >
                <div className="capitalize">{formatDayHeader(day)}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-slate-700">
              <td className="sticky left-0 bg-slate-950 z-10 p-3 border-r border-slate-700">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: user.color }}
                  />
                  <span className="font-medium text-sm">{user.displayName}</span>
                </div>
              </td>
              {days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd")
                return (
                  <td
                    key={day.toISOString()}
                    className={cn(
                      "border-r border-slate-700 last:border-r-0 align-top",
                      isToday(day) && "bg-blue-950/20"
                    )}
                  >
                    <DayCell userId={user.id} date={dateStr} slots={slots} />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}