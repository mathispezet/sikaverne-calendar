"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Repeat, Plus, Pencil, Trash2 } from "lucide-react"
import { upsertRecurringRule, deleteRecurringRule } from "@/lib/actions/calendar"
import type { RecurringRule } from "@/lib/calendar-logic"
import { STATUS_CONFIG, TIME_SLOT_CONFIG } from "@/lib/types"
import type { SlotStatus, TimeSlot } from "@/lib/types"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const DAY_LABELS: Record<number, string> = {
  0: "Dimanche",
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const TIME_SLOTS: TimeSlot[] = ["MORNING", "AFTERNOON", "EVENING"]

// Un statut + label par créneau
interface SlotConfig {
  status: SlotStatus
  customLabel: string
}

interface RuleFormState {
  // En mode édition, on stocke les IDs existants par créneau pour faire un update
  existingIds: Partial<Record<TimeSlot, string>>
  dayOfWeek: number
  slots: Record<TimeSlot, SlotConfig>
  startDate: string
  endDate: string
  noEndDate: boolean
}

function defaultSlotConfig(): SlotConfig {
  return { status: "AVAILABLE", customLabel: "" }
}

function defaultForm(): RuleFormState {
  return {
    existingIds: {},
    dayOfWeek: 1,
    slots: {
      MORNING: defaultSlotConfig(),
      AFTERNOON: defaultSlotConfig(),
      EVENING: defaultSlotConfig(),
    },
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: "",
    noEndDate: true,
  }
}

interface RecurringRulesManagerProps {
  userId: string
  initialRules: RecurringRule[]
}

export function RecurringRulesManager({ userId, initialRules }: RecurringRulesManagerProps) {
  const [rules, setRules] = useState<RecurringRule[]>(initialRules)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<RuleFormState>(defaultForm())
  const [isPending, startTransition] = useTransition()

  const openCreate = () => {
    setForm(defaultForm())
    setDialogOpen(true)
  }

  // Ouvre le dialog en mode édition pour toutes les règles d'un jour donné
  const openEditDay = (day: number) => {
    const dayRules = rules.filter((r) => r.dayOfWeek === day)
    const first = dayRules[0]
    const existingIds: Partial<Record<TimeSlot, string>> = {}
    const slots: Record<TimeSlot, SlotConfig> = {
      MORNING: defaultSlotConfig(),
      AFTERNOON: defaultSlotConfig(),
      EVENING: defaultSlotConfig(),
    }
    for (const r of dayRules) {
      existingIds[r.timeSlot] = r.id
      slots[r.timeSlot] = { status: r.status, customLabel: r.customLabel ?? "" }
    }
    setForm({
      existingIds,
      dayOfWeek: day,
      slots,
      startDate: first?.startDate ?? format(new Date(), "yyyy-MM-dd"),
      endDate: first?.endDate ?? "",
      noEndDate: !first?.endDate,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    startTransition(async () => {
      const saved: RecurringRule[] = []
      for (const ts of TIME_SLOTS) {
        const slotCfg = form.slots[ts]
        const r = await upsertRecurringRule({
          id: form.existingIds[ts],
          userId,
          dayOfWeek: form.dayOfWeek,
          timeSlot: ts,
          status: slotCfg.status,
          customLabel: slotCfg.status === "CUSTOM" ? slotCfg.customLabel : undefined,
          customColor: slotCfg.status === "CUSTOM" ? "#8b5cf6" : undefined,
          startDate: form.startDate,
          endDate: form.noEndDate ? undefined : (form.endDate || undefined),
        })
        saved.push(r)
      }

      setRules((prev) => {
        // Retire les anciennes règles du jour, ajoute les nouvelles
        const withoutDay = prev.filter((r) => r.dayOfWeek !== form.dayOfWeek)
        return [...withoutDay, ...saved]
      })
      setDialogOpen(false)
    })
  }

  const handleDeleteDay = (day: number) => {
    const dayRules = rules.filter((r) => r.dayOfWeek === day)
    startTransition(async () => {
      await Promise.all(dayRules.map((r) => deleteRecurringRule(r.id)))
      setRules((prev) => prev.filter((r) => r.dayOfWeek !== day))
    })
  }

  const setSlotStatus = (ts: TimeSlot, status: SlotStatus) =>
    setForm((f) => ({ ...f, slots: { ...f.slots, [ts]: { ...f.slots[ts], status } } }))

  const setSlotLabel = (ts: TimeSlot, customLabel: string) =>
    setForm((f) => ({ ...f, slots: { ...f.slots, [ts]: { ...f.slots[ts], customLabel } } }))

  // Grouper par jour de la semaine
  const byDay = DAY_ORDER.map((day) => ({
    day,
    rules: rules.filter((r) => r.dayOfWeek === day),
  })).filter((g) => g.rules.length > 0)

  const canSave =
    !!form.startDate &&
    (form.noEndDate || !!form.endDate) &&
    TIME_SLOTS.every(
      (ts) => form.slots[ts].status !== "CUSTOM" || form.slots[ts].customLabel.trim()
    )

  return (
    <div className="space-y-6">
      <Button onClick={openCreate} className="gap-2">
        <Plus className="h-4 w-4" />
        Ajouter une règle
      </Button>

      {rules.length === 0 ? (
        <div className="text-center py-12 text-slate-400 border border-dashed border-slate-700 rounded-lg">
          <Repeat className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p>Aucune règle. Crée-en une pour automatiser ton planning.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {byDay.map(({ day, rules: dayRules }) => (
            <div
              key={day}
              className="p-3 rounded-lg bg-slate-800 border border-slate-700"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">{DAY_LABELS[day]}</h3>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDay(day)}
                    aria-label="Modifier"
                    className="h-7 w-7"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteDay(day)}
                    disabled={isPending}
                    aria-label="Supprimer"
                    className="h-7 w-7 text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                {TIME_SLOTS.map((ts) => {
                  const rule = dayRules.find((r) => r.timeSlot === ts)
                  if (!rule) return (
                    <div key={ts} className="flex-1 text-center text-xs text-slate-600 py-1">—</div>
                  )
                  const config = STATUS_CONFIG[rule.status]
                  const isCustom = rule.status === "CUSTOM"
                  const label = isCustom ? (rule.customLabel ?? "Autre") : config.label
                  return (
                    <div key={ts} className="flex-1 text-center">
                      <div className="text-[10px] text-slate-500 mb-0.5">{TIME_SLOT_CONFIG[ts].label}</div>
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded text-xs font-medium text-white",
                          !isCustom && config.bgClass
                        )}
                        style={isCustom ? { backgroundColor: "#8b5cf6" } : undefined}
                      >
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
              {dayRules[0] && (
                <div className="text-xs text-slate-500 mt-2">
                  Depuis le {format(new Date(dayRules[0].startDate + "T00:00:00"), "d MMM yyyy", { locale: fr })}
                  {dayRules[0].endDate
                    ? ` jusqu'au ${format(new Date(dayRules[0].endDate + "T00:00:00"), "d MMM yyyy", { locale: fr })}`
                    : " · sans date de fin"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {Object.keys(form.existingIds).length > 0 ? "Modifier la règle" : "Nouvelle règle récurrente"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Jour */}
            <div className="space-y-2">
              <Label>Jour de la semaine</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {DAY_ORDER.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, dayOfWeek: day }))}
                    className={cn(
                      "py-1.5 px-2 rounded text-xs font-medium transition-colors",
                      form.dayOfWeek === day
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    )}
                  >
                    {DAY_LABELS[day].slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Statut par créneau */}
            <div className="space-y-3">
              <Label>Statut par créneau</Label>
              {TIME_SLOTS.map((ts) => {
                const slotCfg = form.slots[ts]
                return (
                  <div key={ts} className="rounded-md border border-slate-700 p-3 space-y-2">
                    <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      {TIME_SLOT_CONFIG[ts].label}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(STATUS_CONFIG) as SlotStatus[]).map((key) => {
                        const config = STATUS_CONFIG[key]
                        const selected = slotCfg.status === key
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSlotStatus(ts, key)}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors border",
                              selected
                                ? "border-white/50 bg-white/10 text-white"
                                : "border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200"
                            )}
                          >
                            <span
                              className={cn(
                                "w-3 h-3 rounded-full",
                                key !== "CUSTOM" && config.bgClass,
                                key === "CUSTOM" && "bg-violet-500"
                              )}
                            />
                            {config.label}
                          </button>
                        )
                      })}
                    </div>
                    {slotCfg.status === "CUSTOM" && (
                      <Input
                        placeholder="Libellé (ex: Sport, Cours...)"
                        value={slotCfg.customLabel}
                        onChange={(e) => setSlotLabel(ts, e.target.value)}
                        maxLength={20}
                        className="h-8 text-xs mt-1"
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Dates */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="rule-startDate">Date de début</Label>
                <Input
                  id="rule-startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rule-endDate">Date de fin</Label>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, noEndDate: !f.noEndDate, endDate: "" }))}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded transition-colors border",
                      form.noEndDate
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "border-slate-600 text-slate-400 hover:border-slate-400"
                    )}
                  >
                    Jamais
                  </button>
                </div>
                {!form.noEndDate && (
                  <Input
                    id="rule-endDate"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  />
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isPending || !canSave}>
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
