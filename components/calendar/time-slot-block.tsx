"use client"

import { Repeat } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
          "relative w-full h-6 sm:h-7 bg-muted rounded text-[10px] sm:text-xs text-muted-foreground transition-colors",
          isEditable && "hover:bg-accent hover:border hover:border-primary cursor-pointer",
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

  const btn = (
    <button
      onClick={onClick}
      disabled={!isEditable}
      className={cn(
        "relative w-full h-6 sm:h-7 rounded text-[10px] sm:text-xs font-medium transition-opacity",
        !isCustom && config.bgClass,
        config.textClass,
        isEditable && "hover:opacity-80 hover:shadow-md cursor-pointer",
        !isEditable && "cursor-default opacity-90",
        resolved.isRecurring && "border border-dashed border-white/40"
      )}
      style={customStyle}
      aria-label={label}
    >
      <span className="truncate px-1">{label}</span>
      {resolved.isRecurring && (
        <Repeat className="absolute bottom-0.5 right-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5 opacity-70" />
      )}
    </button>
  )

  // Tooltip sur la note (slots des autres users ou note présente)
  if (resolved.note) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-[180px] text-xs">
            {resolved.note}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return btn
}
