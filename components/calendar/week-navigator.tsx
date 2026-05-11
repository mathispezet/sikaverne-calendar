"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { formatWeekRange, nextWeek, prevWeek, getWeekStart } from "@/lib/dates"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { isSameDay } from "date-fns"

interface WeekNavigatorProps {
  weekStart: Date
  onChange: (newWeekStart: Date) => void
}

export function WeekNavigator({ weekStart, onChange }: WeekNavigatorProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const currentWeekStart = getWeekStart()
  const isCurrentWeek = isSameDay(weekStart, currentWeekStart)

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return
    onChange(getWeekStart(day))
    setPickerOpen(false)
  }

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

      <div className="flex flex-col items-center gap-1">
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button className="text-xl font-semibold capitalize hover:text-blue-400 transition-colors cursor-pointer">
              {formatWeekRange(weekStart)}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={weekStart}
              onSelect={handleDaySelect}
              weekStartsOn={1}
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="default"
          size="sm"
          onClick={() => onChange(currentWeekStart)}
          disabled={isCurrentWeek}
          className="h-6 px-2 text-xs"
        >
          Aujourd'hui
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
