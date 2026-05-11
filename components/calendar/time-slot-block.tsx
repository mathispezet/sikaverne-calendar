"use client"

import { Slot, STATUS_CONFIG } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TimeSlotBlockProps {
  slot?: Slot
  isEditable: boolean
  onClick?: () => void
}

export function TimeSlotBlock({ slot, isEditable, onClick }: TimeSlotBlockProps) {
  if (!slot) {
    return (
      <button
        onClick={onClick}
        disabled={!isEditable}
        className={cn(
          "w-full h-7 bg-slate-800 rounded text-xs text-slate-500 transition-colors",
          isEditable && "hover:bg-slate-700 cursor-pointer",
          !isEditable && "cursor-default"
        )}
        aria-label="Aucun statut"
      >
        {isEditable ? "+" : "?"}
      </button>
    )
  }

  const config = STATUS_CONFIG[slot.status]
  const isCustom = slot.status === "CUSTOM"
  const customStyle = isCustom && slot.customColor
    ? { backgroundColor: slot.customColor }
    : undefined

  const label = isCustom ? (slot.customLabel ?? config.label) : config.label

  return (
    <button
      onClick={onClick}
      disabled={!isEditable}
      className={cn(
        "w-full h-7 rounded text-xs font-medium transition-opacity",
        !isCustom && config.bgClass,
        config.textClass,
        isEditable && "hover:opacity-80 cursor-pointer",
        !isEditable && "cursor-default opacity-90"
      )}
      style={customStyle}
      title={slot.note ?? label}
    >
      {label}
    </button>
  )
}