"use client"

import { Button } from "@/components/ui/button"
import { formatWeekRange, nextWeek, prevWeek, getWeekStart } from "@/lib/dates"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface WeekNavigatorProps {
  weekStart: Date
  onChange: (newWeekStart: Date) => void
}

export function WeekNavigator({ weekStart, onChange }: WeekNavigatorProps) {
  return (
    <div className="flex items-center justify-between mb-6 gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(prevWeek(weekStart))}
        aria-label="Semaine précédente"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="text-center">
        <h2 className="text-xl font-semibold capitalize">
          {formatWeekRange(weekStart)}
        </h2>
        <Button
          variant="link"
          size="sm"
          onClick={() => onChange(getWeekStart())}
          className="h-auto p-0 text-xs"
        >
          Revenir à aujourd'hui
        </Button>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(nextWeek(weekStart))}
        aria-label="Semaine suivante"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}