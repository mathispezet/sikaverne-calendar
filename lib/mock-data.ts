import { User, Slot } from "./types"
import { format, addDays } from "date-fns"
import { getWeekStart } from "./dates"

export const mockUsers: User[] = [
  { id: "u1", displayName: "Mathis",  color: "#3b82f6" },
  { id: "u2", displayName: "Léa",     color: "#ec4899" },
  { id: "u3", displayName: "Thomas",  color: "#10b981" },
  { id: "u4", displayName: "Camille", color: "#f59e0b" },
]

// Génère des slots mockés pour la semaine courante
export function generateMockSlots(weekStart: Date): Slot[] {
  const slots: Slot[] = []
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Mathis bosse tous les matins de la semaine
  days.slice(0, 5).forEach((d) => {
    slots.push({
      userId: "u1",
      date: format(d, "yyyy-MM-dd"),
      timeSlot: "MORNING",
      status: "WORKING",
    })
    slots.push({
      userId: "u1",
      date: format(d, "yyyy-MM-dd"),
      timeSlot: "AFTERNOON",
      status: "AVAILABLE",
    })
    slots.push({
      userId: "u1",
      date: format(d, "yyyy-MM-dd"),
      timeSlot: "EVENING",
      status: "AVAILABLE",
    })
  })

  // Léa indispo jeudi
  slots.push({
    userId: "u2",
    date: format(days[3], "yyyy-MM-dd"),
    timeSlot: "MORNING",
    status: "UNAVAILABLE",
  })
  slots.push({
    userId: "u2",
    date: format(days[3], "yyyy-MM-dd"),
    timeSlot: "AFTERNOON",
    status: "UNAVAILABLE",
  })

  // Thomas custom le mercredi soir
  slots.push({
    userId: "u3",
    date: format(days[2], "yyyy-MM-dd"),
    timeSlot: "EVENING",
    status: "CUSTOM",
    customLabel: "Anniv",
    customColor: "#8b5cf6",
  })

  // Camille dispo tous les soirs
  days.forEach((d) => {
    slots.push({
      userId: "u4",
      date: format(d, "yyyy-MM-dd"),
      timeSlot: "EVENING",
      status: "AVAILABLE",
    })
  })

  return slots
}