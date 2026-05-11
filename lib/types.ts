export type TimeSlot = "MORNING" | "AFTERNOON" | "EVENING"

export type SlotStatus = "AVAILABLE" | "WORKING" | "UNAVAILABLE" | "CUSTOM"

export interface User {
  id: string
  displayName: string
  color: string  // couleur de la ligne (avatar/badge)
}

export interface Slot {
  userId: string
  date: string         // ISO YYYY-MM-DD
  timeSlot: TimeSlot
  status: SlotStatus
  customLabel?: string
  customColor?: string
  note?: string
}

// Config visuelle des statuts
export const STATUS_CONFIG: Record<SlotStatus, { label: string; bgClass: string; textClass: string }> = {
  AVAILABLE:    { label: "Dispo",   bgClass: "bg-emerald-500", textClass: "text-white" },
  WORKING:      { label: "Boulot",  bgClass: "bg-orange-500",  textClass: "text-white" },
  UNAVAILABLE:  { label: "Indispo", bgClass: "bg-rose-500",    textClass: "text-white" },
  CUSTOM:       { label: "Autre",   bgClass: "bg-slate-500",   textClass: "text-white" },
}

export const TIME_SLOT_CONFIG: Record<TimeSlot, { label: string; short: string }> = {
  MORNING:    { label: "Matin",     short: "M" },
  AFTERNOON:  { label: "Aprem",     short: "A" },
  EVENING:    { label: "Soir",      short: "S" },
}