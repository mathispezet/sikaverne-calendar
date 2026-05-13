"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { CalendarX, Users } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { TIME_SLOT_CONFIG } from "@/lib/types"
import type { TimeSlot, User } from "@/lib/types"
import { findCommonSlots } from "@/lib/actions/calendar"
import type { CommonSlot } from "@/lib/actions/calendar"
import { CommonSlotCard } from "./common-slot-card"

const ALL_TIME_SLOTS: TimeSlot[] = ["MORNING", "AFTERNOON", "EVENING"]
const HORIZON_OPTIONS: { value: number; label: string }[] = [
  { value: 4, label: "4 semaines" },
  { value: 8, label: "8 semaines" },
  { value: 12, label: "12 semaines" },
]

interface CommonSlotsViewProps {
  users: User[]
  initialSlots: CommonSlot[]
}

export function CommonSlotsView({ users, initialSlots }: CommonSlotsViewProps) {
  const totalUsers = users.length

  const [horizon, setHorizon] = useState<number>(4)
  const [minUsers, setMinUsers] = useState<number>(Math.min(2, Math.max(2, totalUsers)))
  const [activeTimeSlots, setActiveTimeSlots] = useState<TimeSlot[]>(ALL_TIME_SLOTS)
  const [slots, setSlots] = useState<CommonSlot[]>(initialSlots)
  const [isPending, startTransition] = useTransition()
  const [hasFetched, setHasFetched] = useState(false)

  // Re-fetch dès qu'un filtre change (skip le premier render — on a déjà initialSlots)
  useEffect(() => {
    if (!hasFetched) {
      setHasFetched(true)
      return
    }
    startTransition(async () => {
      try {
        const results = await findCommonSlots({
          weeksAhead: horizon,
          minUsers,
          timeSlots: activeTimeSlots,
        })
        setSlots(results)
      } catch {
        toast.error("Impossible de calculer les créneaux communs")
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horizon, minUsers, activeTimeSlots])

  const toggleTimeSlot = (ts: TimeSlot) => {
    setActiveTimeSlots((prev) => {
      if (prev.includes(ts)) {
        // Ne pas autoriser une liste vide — sinon l'utilisateur ne voit rien
        // sans comprendre pourquoi
        if (prev.length === 1) return prev
        return prev.filter((x) => x !== ts)
      }
      return [...prev, ts]
    })
  }

  // Si seulement 1 user dans le groupe, la notion de "créneau commun" n'a pas de sens
  if (totalUsers < 2) {
    return (
      <div className="text-center py-12 text-slate-400 border border-dashed border-slate-700 rounded-lg">
        <Users className="h-8 w-8 mx-auto mb-3 opacity-40" />
        <p>Il faut au moins deux personnes pour trouver un créneau commun.</p>
      </div>
    )
  }

  const minUsersOptions = Array.from({ length: totalUsers - 1 }, (_, i) => i + 2) // [2..totalUsers]

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Horizon */}
          <div className="space-y-2">
            <Label>Horizon</Label>
            <div className="flex gap-1.5 flex-wrap">
              {HORIZON_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setHorizon(opt.value)}
                  className={cn(
                    "px-3 py-1.5 rounded text-xs font-medium transition-colors border",
                    horizon === opt.value
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum d'amis */}
          <div className="space-y-2">
            <Label>Minimum d&apos;amis dispos</Label>
            <div className="flex gap-1.5 flex-wrap">
              {minUsersOptions.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMinUsers(n)}
                  className={cn(
                    "min-w-9 px-3 py-1.5 rounded text-xs font-medium transition-colors border tabular-nums",
                    minUsers === n
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500",
                  )}
                >
                  {n === totalUsers ? `${n} (tous)` : n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Créneaux */}
        <div className="space-y-2">
          <Label>Créneaux</Label>
          <div className="flex gap-1.5 flex-wrap">
            {ALL_TIME_SLOTS.map((ts) => {
              const active = activeTimeSlots.includes(ts)
              return (
                <button
                  key={ts}
                  type="button"
                  onClick={() => toggleTimeSlot(ts)}
                  className={cn(
                    "px-3 py-1.5 rounded text-xs font-medium transition-colors border",
                    active
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500",
                  )}
                  aria-pressed={active}
                >
                  {TIME_SLOT_CONFIG[ts].label}
                </button>
              )
            })}
          </div>
        </div>

      </div>

      {/* Résultats */}
      {isPending ? (
        <ResultsSkeleton />
      ) : slots.length === 0 ? (
        <div className="text-center py-12 text-slate-400 border border-dashed border-slate-700 rounded-lg">
          <CalendarX className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-slate-300">Aucun créneau commun trouvé</p>
          <p className="text-sm mt-1">Essaie d&apos;élargir les filtres (horizon plus long, ou moins d&apos;amis requis).</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 px-1">
            {slots.length} créneau{slots.length > 1 ? "x" : ""} trouvé{slots.length > 1 ? "s" : ""}
          </p>
          {slots.map((s) => (
            <CommonSlotCard key={`${s.date}-${s.timeSlot}`} slot={s} />
          ))}
        </div>
      )}
    </div>
  )
}

function ResultsSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex gap-1.5">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
