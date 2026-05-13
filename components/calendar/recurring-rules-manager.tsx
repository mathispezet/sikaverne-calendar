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
  0: "Dim",
  1: "Lun",
  2: "Mar",
  3: "Mer",
  4: "Jeu",
  5: "Ven",
  6: "Sam",
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const TIME_SLOTS: TimeSlot[] = ["MORNING", "AFTERNOON", "EVENING"]

interface SlotConfig {
  status: SlotStatus
  customLabel: string
}

type DaySlots = Record<TimeSlot, SlotConfig>

interface RuleFormState {
  ruleSetId: string | null
  ruleSetName: string
  daysOfWeek: number[]
  slots: Record<number, DaySlots>
  startDate: string
  endDate: string
  noEndDate: boolean
  rhythm: number
  rhythmWeekStart: string
  priority: number
}

function defaultSlotConfig(): SlotConfig {
  return { status: "AVAILABLE", customLabel: "" }
}

function defaultDaySlots(): DaySlots {
  return {
    MORNING: defaultSlotConfig(),
    AFTERNOON: defaultSlotConfig(),
    EVENING: defaultSlotConfig(),
  }
}

function defaultForm(): RuleFormState {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1)
  const weekStartStr = format(monday, "yyyy-MM-dd")
  return {
    ruleSetId: null,
    ruleSetName: "Règle",
    daysOfWeek: [today.getDay()],
    slots: {},
    startDate: format(today, "yyyy-MM-dd"),
    endDate: "",
    noEndDate: true,
    rhythm: 1,
    rhythmWeekStart: weekStartStr,
    priority: 0,
  }
}

function buildSlotsForDays(daysOfWeek: number[]): Record<number, DaySlots> {
  const slots: Record<number, DaySlots> = {}
  for (const d of daysOfWeek) {
    slots[d] = defaultDaySlots()
  }
  return slots
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

  const bySet = Object.values(
    rules.reduce<Record<string, {
      ruleSetId: string
      ruleSetName: string
      rules: RecurringRule[]
      rhythm: number
      rhythmWeekStart: string
      startDate: string
      endDate: string
      priority: number
    }>>((acc, r) => {
      const id = r.ruleSetId ?? r.id
      if (!acc[id]) {
        acc[id] = {
          ruleSetId: id,
          ruleSetName: r.ruleSetName ?? "Règle",
          rules: [],
          rhythm: r.rhythm ?? 1,
          rhythmWeekStart: r.rhythmWeekStart ?? "",
          startDate: r.startDate,
          endDate: r.endDate ?? "",
          priority: r.priority ?? 0,
        }
      }
      acc[id].rules.push(r)
      return acc
    }, {})
  )

  const openCreate = () => {
    setForm(defaultForm())
    setDialogOpen(true)
  }

  const openEditSet = (ruleSetId: string) => {
    const set = bySet.find((s) => s.ruleSetId === ruleSetId)
    if (!set) return

    const days = [...new Set(set.rules.map((r) => r.dayOfWeek))]
    const slots: Record<number, DaySlots> = {}
    for (const d of days) {
      slots[d] = {
        MORNING: defaultSlotConfig(),
        AFTERNOON: defaultSlotConfig(),
        EVENING: defaultSlotConfig(),
      }
    }
    for (const r of set.rules) {
      slots[r.dayOfWeek][r.timeSlot] = {
        status: r.status,
        customLabel: r.customLabel ?? "",
      }
    }

    setForm({
      ruleSetId: set.ruleSetId,
      ruleSetName: set.ruleSetName,
      daysOfWeek: days,
      slots,
      startDate: set.startDate,
      endDate: set.endDate,
      noEndDate: !set.endDate,
      rhythm: set.rhythm ?? 1,
      rhythmWeekStart: set.rhythmWeekStart ?? format(new Date(), "yyyy-MM-dd"),
      priority: set.rules[0]?.priority ?? 0,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    startTransition(async () => {
      const ruleSetId = form.ruleSetId ?? crypto.randomUUID()

      const existingRules = rules.filter((r) => (r.ruleSetId ?? r.id) === ruleSetId)
      const existingDays = new Set(existingRules.map((r) => r.dayOfWeek))
      const newDays = new Set(form.daysOfWeek)

      const daysToDelete = [...existingDays].filter((d) => !newDays.has(d))
      const daysToCreate = [...newDays].filter((d) => !existingDays.has(d))

      await Promise.all(
        existingRules
          .filter((r) => daysToDelete.includes(r.dayOfWeek))
          .map((r) => deleteRecurringRule(r.id))
      )

      const saved: RecurringRule[] = []

      // Jours existants conservés → update
      for (const day of [...existingDays]) {
        if (daysToDelete.includes(day)) continue
        for (const ts of TIME_SLOTS) {
          const daySlots = form.slots[day] ?? defaultDaySlots()
          const slotCfg = daySlots[ts] ?? defaultSlotConfig()
          const existingRule = existingRules.find(
            (r) => r.dayOfWeek === day && r.timeSlot === ts
          )
          const r = await upsertRecurringRule({
            id: existingRule?.id,
            userId,
            dayOfWeek: day,
            timeSlot: ts,
            status: slotCfg.status,
            customLabel: slotCfg.status === "CUSTOM" ? slotCfg.customLabel : undefined,
            customColor: slotCfg.status === "CUSTOM" ? "#8b5cf6" : undefined,
            startDate: form.startDate,
            endDate: form.noEndDate ? undefined : (form.endDate || undefined),
            rhythm: form.rhythm,
            rhythmWeekStart: form.rhythm === 1 ? undefined : form.rhythmWeekStart,
            ruleSetId,
            ruleSetName: form.ruleSetName,
            priority: form.priority,
          })
          saved.push(r)
        }
      }

      // Nouveaux jours → create
      for (const day of daysToCreate) {
        for (const ts of TIME_SLOTS) {
          const daySlots = form.slots[day] ?? defaultDaySlots()
          const slotCfg = daySlots[ts] ?? defaultSlotConfig()
          const r = await upsertRecurringRule({
            userId,
            dayOfWeek: day,
            timeSlot: ts,
            status: slotCfg.status,
            customLabel: slotCfg.status === "CUSTOM" ? slotCfg.customLabel : undefined,
            customColor: slotCfg.status === "CUSTOM" ? "#8b5cf6" : undefined,
            startDate: form.startDate,
            endDate: form.noEndDate ? undefined : (form.endDate || undefined),
            rhythm: form.rhythm,
            rhythmWeekStart: form.rhythm === 1 ? undefined : form.rhythmWeekStart,
            ruleSetId,
            ruleSetName: form.ruleSetName,
            priority: form.priority,
          })
          saved.push(r)
        }
      }

      const otherRules = rules.filter((r) => (r.ruleSetId ?? r.id) !== ruleSetId)
      setRules([...otherRules, ...saved])
      setDialogOpen(false)
    })
  }

  const handleDeleteSet = (ruleSetId: string) => {
    const rulesToDelete = rules.filter((r) => (r.ruleSetId ?? r.id) === ruleSetId)
    startTransition(async () => {
      await Promise.all(rulesToDelete.map((r) => deleteRecurringRule(r.id)))
      setRules((prev) => prev.filter((r) => (r.ruleSetId ?? r.id) !== ruleSetId))
    })
  }

  const setSlotStatus = (day: number, ts: TimeSlot, status: SlotStatus) =>
    setForm((f) => ({
      ...f,
      slots: {
        ...f.slots,
        [day]: { ...f.slots[day], [ts]: { ...f.slots[day][ts], status } },
      },
    }))

  const setSlotLabel = (day: number, ts: TimeSlot, customLabel: string) =>
    setForm((f) => ({
      ...f,
      slots: {
        ...f.slots,
        [day]: { ...f.slots[day], [ts]: { ...f.slots[day][ts], customLabel } },
      },
    }))

  const toggleDay = (day: number) =>
    setForm((f) => {
      const exists = f.daysOfWeek.includes(day)
      if (exists && f.daysOfWeek.length === 1) return f
      const newDays = exists
        ? f.daysOfWeek.filter((d) => d !== day)
        : [...f.daysOfWeek, day].sort()
      const newSlots = { ...f.slots }
      if (!exists) {
        newSlots[day] = defaultDaySlots()
      }
      return { ...f, daysOfWeek: newDays, slots: newSlots }
    })

  const canSave =
    !!form.ruleSetName.trim() &&
    form.daysOfWeek.length > 0 &&
    !!form.startDate &&
    (form.noEndDate || !!form.endDate) &&
    (form.rhythm === 1 || !!form.rhythmWeekStart) &&
    form.daysOfWeek.every((day) =>
      TIME_SLOTS.every(
        (ts) =>
          form.slots[day]?.[ts]?.status !== "CUSTOM" ||
          form.slots[day]?.[ts]?.customLabel.trim()
      )
    )

  return (
    <div className="space-y-6">
      <Button onClick={openCreate} className="gap-2">
        <Plus className="h-4 w-4" />
        Nouveau set de règles
      </Button>

      {bySet.length === 0 ? (
        <div className="text-center py-12 text-slate-400 border border-dashed border-slate-700 rounded-lg">
          <Repeat className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p>Aucune règle. Crée un set pour automatiser ton planning.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bySet.map((set) => {
            const sortedDays = [...new Set(set.rules.map((r) => r.dayOfWeek))].sort(
              (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
            )
            return (
              <div
                key={set.ruleSetId}
                className="p-4 rounded-lg bg-slate-800 border border-slate-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-blue-400" />
                    <h3 className="text-sm font-semibold">{set.ruleSetName}</h3>
                    {set.priority > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-900/60 text-violet-300 border border-violet-700/50">
                        ↑ {set.priority}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditSet(set.ruleSetId)}
                      aria-label="Modifier"
                      className="h-7 w-7"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSet(set.ruleSetId)}
                      disabled={isPending}
                      aria-label="Supprimer"
                      className="h-7 w-7 text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* En-tête créneaux */}
                <div className="flex gap-2 mb-1 pl-12">
                  {TIME_SLOTS.map((ts) => (
                    <div key={ts} className="flex-1 text-center text-[10px] text-slate-500 uppercase tracking-wide">
                      {TIME_SLOT_CONFIG[ts].label}
                    </div>
                  ))}
                </div>

                {/* Une ligne par jour */}
                {sortedDays.map((day) => {
                  const dayRules = set.rules.filter((r) => r.dayOfWeek === day)
                  return (
                    <div key={day} className="flex items-center gap-2 mb-1">
                      <span className="w-12 text-xs text-slate-400 flex-shrink-0">
                        {DAY_LABELS[day]}
                      </span>
                      <div className="flex gap-2 flex-1">
                        {TIME_SLOTS.map((ts) => {
                          const rule = dayRules.find((r) => r.timeSlot === ts)
                          if (!rule) return (
                            <div key={ts} className="flex-1 text-center text-xs text-slate-600">—</div>
                          )
                          const config = STATUS_CONFIG[rule.status]
                          const isCustom = rule.status === "CUSTOM"
                          const label = isCustom ? (rule.customLabel ?? "Autre") : config.label
                          return (
                            <div key={ts} className="flex-1 text-center">
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
                    </div>
                  )
                })}

                {/* Rythme */}
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <span>Depuis le {format(new Date(set.startDate + "T00:00:00"), "d MMM yyyy", { locale: fr })}</span>
                  {set.endDate
                    ? <span>· jusqu&apos;au {format(new Date(set.endDate + "T00:00:00"), "d MMM yyyy", { locale: fr })}</span>
                    : <span>· sans date de fin</span>}
                  {set.rhythm > 1 && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700/40 font-medium">
                      1/{set.rhythm}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form.ruleSetId ? "Modifier le set" : "Nouveau set de règles"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Nom du set */}
            <div className="space-y-2">
              <Label htmlFor="ruleSetName">Nom du set</Label>
              <Input
                id="ruleSetName"
                placeholder="Ex: Semaine A, Dispo fixe, Alternance..."
                value={form.ruleSetName}
                onChange={(e) => setForm((f) => ({ ...f, ruleSetName: e.target.value }))}
                maxLength={40}
              />
            </div>

            {/* Jours */}
            <div className="space-y-2">
              <Label>Jours</Label>
              <div className="flex gap-1.5 flex-wrap">
                {DAY_ORDER.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "py-1.5 px-2.5 rounded text-xs font-medium transition-colors border",
                      form.daysOfWeek.includes(day)
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
                    )}
                  >
                    {DAY_LABELS[day]}
                  </button>
                ))}
              </div>
            </div>

            {/* Tableau jour × créneau */}
            {form.daysOfWeek.length > 0 && (
              <div className="space-y-2">
                <Label>Disponibilités par jour</Label>
                <div className="rounded-md border border-slate-700 overflow-hidden">
                  {/* Header */}
                  <div className="flex bg-slate-800/80 text-[10px] text-slate-500 uppercase tracking-wide">
                    <div className="w-12 flex-shrink-0" />
                    {TIME_SLOTS.map((ts) => (
                      <div key={ts} className="flex-1 text-center py-1.5">
                        {TIME_SLOT_CONFIG[ts].label}
                      </div>
                    ))}
                  </div>
                  {/* Lignes par jour */}
                  {form.daysOfWeek.map((day) => (
                    <div key={day} className="flex border-t border-slate-700/50">
                      <div className="w-12 flex-shrink-0 flex items-center pl-3 text-xs text-slate-400 font-medium">
                        {DAY_LABELS[day]}
                      </div>
                      {TIME_SLOTS.map((ts) => {
                        const daySlots = form.slots[day] ?? defaultDaySlots()
                        const slotCfg = daySlots[ts] ?? defaultSlotConfig()
                        return (
                          <div key={ts} className="flex-1 p-2 border-l border-slate-700/50 space-y-1.5">
                            <div className="flex flex-wrap gap-1">
                              {(Object.keys(STATUS_CONFIG) as SlotStatus[]).map((key) => {
                                const config = STATUS_CONFIG[key]
                                const selected = slotCfg?.status === key
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => setSlotStatus(day, ts, key)}
                                    className={cn(
                                      "flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors border",
                                      selected
                                        ? "border-white/50 bg-white/10 text-white"
                                        : "border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200"
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "w-2.5 h-2.5 rounded-full flex-shrink-0",
                                        key !== "CUSTOM" && config.bgClass,
                                        key === "CUSTOM" && "bg-violet-500"
                                      )}
                                    />
                                    {config.label}
                                  </button>
                                )
                              })}
                            </div>
                            {slotCfg?.status === "CUSTOM" && (
                              <Input
                                placeholder="Libellé..."
                                value={slotCfg.customLabel}
                                onChange={(e) => setSlotLabel(day, ts, e.target.value)}
                                maxLength={20}
                                className="h-6 text-xs py-0.5"
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {/* Rythme */}
            <div className="space-y-3">
              <Label>Rythme de répétition</Label>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { value: 1, label: "Chaque semaine" },
                  { value: 2, label: "1 sem. / 2" },
                  { value: 3, label: "1 sem. / 3" },
                  { value: 4, label: "1 sem. / 4" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rhythm: opt.value }))}
                    className={cn(
                      "px-3 py-1.5 rounded text-xs font-medium transition-colors border",
                      form.rhythm === opt.value
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
                    )}
                  >
                    {opt.value === 1 ? "Chaque semaine" : `1 sem. / ${opt.value}`}
                  </button>
                ))}
              </div>
              {form.rhythm > 1 && (
                <div className="space-y-2 mt-2 p-3 rounded-md border border-slate-700 bg-slate-800/50">
                  <Label htmlFor="rule-rhythmWeekStart" className="text-xs text-slate-400">
                    Date de référence (première semaine active)
                  </Label>
                  <Input
                    id="rule-rhythmWeekStart"
                    type="date"
                    value={form.rhythmWeekStart}
                    onChange={(e) => setForm((f) => ({ ...f, rhythmWeekStart: e.target.value }))}
                    className="h-9"
                  />
                  <p className="text-xs text-slate-500">
                    La règle sera active les semaines 1, 3, 5... à partir de cette date.
                  </p>
                </div>
              )}
            </div>

            {/* Priorité */}
            <div className="space-y-2">
              <Label htmlFor="rule-priority">Priorité</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="rule-priority"
                  type="number"
                  min={0}
                  max={10}
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: Math.max(0, parseInt(e.target.value) || 0) }))}
                  className="w-20 h-9 text-center"
                />
                <span className="text-xs text-slate-500">
                  Priorité haute = écrase les règles de priorité inférieure en cas de conflit
                </span>
              </div>
            </div>

            {/* Rythme */}
            <div className="space-y-3">
              <Label>Rythme de répétition</Label>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { value: 1, label: "Chaque semaine" },
                  { value: 2, label: "1 sem. / 2" },
                  { value: 3, label: "1 sem. / 3" },
                  { value: 4, label: "1 sem. / 4" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rhythm: opt.value }))}
                    className={cn(
                      "px-3 py-1.5 rounded text-xs font-medium transition-colors border",
                      form.rhythm === opt.value
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
                    )}
                  >
                    {opt.value === 1 ? "Chaque semaine" : `1 sem. / ${opt.value}`}
                  </button>
                ))}
              </div>
              {form.rhythm > 1 && (
                <div className="space-y-2 mt-2 p-3 rounded-md border border-slate-700 bg-slate-800/50">
                  <Label htmlFor="rule-rhythmWeekStart" className="text-xs text-slate-400">
                    Date de référence (première semaine active)
                  </Label>
                  <Input
                    id="rule-rhythmWeekStart"
                    type="date"
                    value={form.rhythmWeekStart}
                    onChange={(e) => setForm((f) => ({ ...f, rhythmWeekStart: e.target.value }))}
                    className="h-9"
                  />
                  <p className="text-xs text-slate-500">
                    La règle sera active les semaines 1, 3, 5... à partir de cette date.
                  </p>
                </div>
              )}
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
