import { TimeSlot, Slot, TIME_SLOT_CONFIG } from "@/lib/types"
import { TimeSlotBlock } from "./time-slot-block"

interface DayCellProps {
  userId: string
  date: string  // YYYY-MM-DD
  slots: Slot[]
}

const TIME_SLOTS_ORDER: TimeSlot[] = ["MORNING", "AFTERNOON", "EVENING"]

export function DayCell({ userId, date, slots }: DayCellProps) {
  // Récupère les slots de ce user pour ce jour
  const userDaySlots = slots.filter(
    (s) => s.userId === userId && s.date === date
  )

  // Pour chaque créneau, trouve s'il y a un slot
  const slotByTime = (timeSlot: TimeSlot) =>
    userDaySlots.find((s) => s.timeSlot === timeSlot)

  return (
    <div className="flex flex-col gap-1 p-1 min-w-[80px]">
      {TIME_SLOTS_ORDER.map((timeSlot) => (
        <TimeSlotBlock
          key={timeSlot}
          slot={slotByTime(timeSlot)}
          onClick={() => {
            // Sprint B5 : ouvrira un popup d'édition
            console.log("Clicked", { userId, date, timeSlot })
          }}
        />
      ))}
    </div>
  )
}