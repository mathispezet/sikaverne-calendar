import { TimeSlot, Slot, TIME_SLOT_CONFIG } from "@/lib/types"
import { TimeSlotBlock } from "./time-slot-block"

interface DayCellProps {
  userId: string
  date: string
  slots: Slot[]
  isEditable: boolean
  onSlotClick: (userId: string, date: string, timeSlot: TimeSlot) => void
}

const TIME_SLOTS_ORDER: TimeSlot[] = ["MORNING", "AFTERNOON", "EVENING"]

export function DayCell({ userId, date, slots, isEditable, onSlotClick }: DayCellProps) {
  const userDaySlots = slots.filter(
    (s) => s.userId === userId && s.date === date
  )

  const slotByTime = (timeSlot: TimeSlot) =>
    userDaySlots.find((s) => s.timeSlot === timeSlot)

  return (
    <div className="flex flex-col gap-1 p-1 min-w-[80px]">
      {TIME_SLOTS_ORDER.map((timeSlot) => (
        <TimeSlotBlock
          key={timeSlot}
          slot={slotByTime(timeSlot)}
          isEditable={isEditable}
          onClick={isEditable ? () => onSlotClick(userId, date, timeSlot) : undefined}
        />
      ))}
    </div>
  )
}