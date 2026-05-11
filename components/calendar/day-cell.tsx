import { TimeSlot, TIME_SLOT_CONFIG } from "@/lib/types"
import { TimeSlotBlock } from "./time-slot-block"
import { resolveSlot } from "@/lib/calendar-logic"
import type { Slot } from "@/lib/types"
import type { RecurringRule } from "@/lib/calendar-logic"

interface DayCellProps {
  userId: string
  date: string
  slots: Slot[]
  rules: RecurringRule[]
  isEditable: boolean
  onSlotClick: (userId: string, date: string, timeSlot: TimeSlot) => void
}

const TIME_SLOTS_ORDER: TimeSlot[] = ["MORNING", "AFTERNOON", "EVENING"]

export function DayCell({ userId, date, slots, rules, isEditable, onSlotClick }: DayCellProps) {
  return (
    <div className="flex flex-col gap-1 p-1 min-w-[80px]">
      {TIME_SLOTS_ORDER.map((timeSlot) => {
        const resolved = resolveSlot(userId, date, timeSlot, slots, rules)
        return (
          <TimeSlotBlock
            key={timeSlot}
            resolved={resolved}
            isEditable={isEditable}
            onClick={isEditable ? () => onSlotClick(userId, date, timeSlot) : undefined}
          />
        )
      })}
    </div>
  )
}
