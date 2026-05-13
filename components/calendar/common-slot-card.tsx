"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { TIME_SLOT_CONFIG } from "@/lib/types"
import type { TimeSlot } from "@/lib/types"
import type { CommonSlot } from "@/lib/actions/calendar"

const TIME_SLOT_BADGE: Record<TimeSlot, string> = {
  MORNING: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  AFTERNOON: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  EVENING: "bg-violet-500/20 text-violet-300 border-violet-500/40",
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function initials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

interface CommonSlotCardProps {
  slot: CommonSlot
}

export function CommonSlotCard({ slot }: CommonSlotCardProps) {
  const dateObj = new Date(slot.date + "T00:00:00")
  const dateLabel = capitalize(format(dateObj, "EEEE d MMMM", { locale: fr }))
  const isFullMatch = slot.availableUsers.length === slot.totalUsers

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition-colors",
        isFullMatch
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-border hover:border-slate-600",
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-sm sm:text-base truncate">
            {dateLabel}
          </span>
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border shrink-0",
              TIME_SLOT_BADGE[slot.timeSlot],
            )}
          >
            {TIME_SLOT_CONFIG[slot.timeSlot].label}
          </span>
        </div>
        <span
          className={cn(
            "text-xs font-semibold tabular-nums shrink-0",
            isFullMatch ? "text-emerald-400" : "text-slate-400",
          )}
        >
          {slot.availableUsers.length}/{slot.totalUsers} amis
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {slot.availableUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700"
            title={user.displayName}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: user.color }}
            >
              {initials(user.displayName)}
            </span>
            <span className="text-xs text-slate-200">{user.displayName}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
