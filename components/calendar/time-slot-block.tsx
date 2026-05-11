"use client"

import { Slot, STATUS_CONFIG } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TimeSlotBlockProps {
  slot?: Slot                  // si undefined : pas de slot défini
  onClick?: () => void
}

export function TimeSlotBlock({ slot, onClick }: TimeSlotBlockProps) {
  if (!slot) {
    return (
      <button
        onClick={onClick}
        className="w-full h-7 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-500 transition-colors"
        aria-label="Aucun statut, cliquer pour définir"
      >
        ?
      </button>
    )
  }

  const config = STATUS_CONFIG[slot.status]
  const isCustom = slot.status === "CUSTOM"
  
  // Pour status CUSTOM, on utilise la couleur custom de l'utilisateur
  const customStyle = isCustom && slot.customColor
    ? { backgroundColor: slot.customColor }
    : undefined

  const label = isCustom ? (slot.customLabel ?? config.label) : config.label

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full h-7 rounded text-xs font-medium transition-opacity hover:opacity-80",
        !isCustom && config.bgClass,
        config.textClass,
      )}
      style={customStyle}
      title={slot.note ?? label}
    >
      {label}
    </button>
  )
}