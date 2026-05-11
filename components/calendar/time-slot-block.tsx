"use client"

import { Repeat } from "lucide-react"
import { STATUS_CONFIG } from "@/lib/types"
import type { ResolvedSlot } from "@/lib/calendar-logic"
import { cn } from "@/lib/utils"

interface TimeSlotBlockProps {
  resolved: ResolvedSlot | null
  isEditable: boolean
  onClick?: () => void
}

export function TimeSlotBlock({ resolved, isEditable, onClick }: TimeSlotBlockProps) {
  if (!resolved) {
    return (
      <button
        onClick={onClick}
        disabled={!isEditable}
        className={cn(
          "relative w-full h-7 bg-slate-800 rounded text-xs text-slate-500 transition-colors",
          isEditable && "hover:bg-slate-700 cursor-pointer",
          !isEditable && "cursor-default"
        )}
        aria-label="Aucun statut"
      >
        {isEditable ? "+" : "?"}
      </button>
    )
  }

  const config = STATUS_CONFIG[resolved.status]
  const isCustom = resolved.status === "CUSTOM"
  const customStyle = isCustom && resolved.customColor
    ? { backgroundColor: resolved.customColor }
    : undefined
  const label = isCustom ? (resolved.customLabel ?? config.label) : config.label

  return (
    <button
      onClick={onClick}
      disabled={!isEditable}
      className={cn(
        "relative w-full h-7 rounded text-xs font-medium transition-opacity",
        !isCustom && config.bgClass,
        config.textClass,
        isEditable && "hover:opacity-80 cursor-pointer",
        !isEditable && "cursor-default opacity-90",
        resolved.isRecurring && "border border-dashed border-white/40"
      )}
      style={customStyle}
      title={resolved.note ?? label}
      aria-label={label}
    >
      <span className="truncate px-1">{label}</span>
      {resolved.isRecurring && (
        <Repeat className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 opacity-70" />
      )}
    </button>
  )
}
