"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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

interface RuleFormState {
  id?: string
  dayOfWeek: number
  timeSlot: TimeSlot
  status: SlotStatus
  customLabel: string
  customColor: string
  startDate: string
  endDate: string
}

function defaultForm(partial?: Partial<RuleFormState>): RuleFormState {
  return {
    dayOfWeek: 1,
    timeSlot: "MORNING",
    status: "AVAILABLE",
    customLabel: "",
    customColor: "#8b5cf6",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: "",
    ...partial,
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

  const openEdit = (rule: RecurringRule) => {
    setForm({
      id: rule.id,
      dayOfWeek: rule.dayOfWeek,
      timeSlot: rule.timeSlot,
      status: rule.status,
      customLabel: rule.customLabel ?? "",
      customColor: rule.customColor ?? "#8b5cf6",
      startDate: rule.startDate,
      endDate: rule.endDate ?? "",
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    startTransition(async () => {
      const saved = await upsertRecurringRule({
        id: form.id,
        userId,
        dayOfWeek: form.dayOfWeek,
        timeSlot: form.timeSlot,
        status: form.status,
        customLabel: form.status === "CUSTOM" ? form.customLabel : undefined,
        customColor: form.status === "CUSTOM" ? "#8b5cf6" : undefined,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
      })
      setRules((prev) =>
        form.id ? prev.map((r) => (r.id === form.id ? saved : r)) : [...prev, saved]
      )
      setDialogOpen(false)
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteRecurringRule(id)
      setRules((prev) => prev.filter((r) => r.id !== id))
    })
  }

  // Grouper par jour de la semaine
  const byDay = DAY_ORDER.map((day) => ({
    day,
    rules: rules.filter((r) => r.dayOfWeek === day),
  })).filter((g) => g.rules.length > 0)

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
        <div className="space-y-4">
          {byDay.map(({ day, rules: dayRules }) => (
            <div key={day}>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {DAY_LABELS[day]}
              </h3>
              <div className="space-y-2">
                {dayRules.map((rule) => {
                  const statusConfig = STATUS_CONFIG[rule.status]
                  const isCustom = rule.status === "CUSTOM"
                  const label = isCustom ? (rule.customLabel ?? "Autre") : statusConfig.label
                  const timeLabel = TIME_SLOT_CONFIG[rule.timeSlot].label

                  return (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={cn(
                            "w-3 h-3 rounded-full flex-shrink-0",
                            !isCustom && statusConfig.bgClass
                          )}
                          style={isCustom && rule.customColor ? { backgroundColor: rule.customColor } : undefined}
                        />
                        <div className="min-w-0">
                          <span className="font-medium text-sm">{timeLabel}</span>
                          <span className="text-slate-400 text-sm"> — {label}</span>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Depuis le {format(new Date(rule.startDate + "T00:00:00"), "d MMM yyyy", { locale: fr })}
                            {rule.endDate && ` jusqu'au ${format(new Date(rule.endDate + "T00:00:00"), "d MMM yyyy", { locale: fr })}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(rule)}
                          aria-label="Modifier"
                          className="h-8 w-8"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rule.id)}
                          disabled={isPending}
                          aria-label="Supprimer"
                          className="h-8 w-8 text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle>{form.id ? "Modifier la règle" : "Nouvelle règle récurrente"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Jour de la semaine */}
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

            {/* Créneau */}
            <div className="space-y-2">
              <Label>Créneau</Label>
              <div className="flex gap-2">
                {TIME_SLOTS.map((ts) => (
                  <button
                    key={ts}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, timeSlot: ts }))}
                    className={cn(
                      "flex-1 py-1.5 rounded text-xs font-medium transition-colors",
                      form.timeSlot === ts
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    )}
                  >
                    {TIME_SLOT_CONFIG[ts].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <Label>Statut</Label>
              <RadioGroup
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as SlotStatus }))}
              >
                {(Object.keys(STATUS_CONFIG) as SlotStatus[]).map((key) => {
                  const config = STATUS_CONFIG[key]
                  return (
                    <div key={key} className="flex items-center space-x-2">
                      <RadioGroupItem value={key} id={`rule-status-${key}`} />
                      <Label htmlFor={`rule-status-${key}`} className="flex items-center gap-2 cursor-pointer flex-1 py-1">
                        <span
                          className={cn("inline-block w-4 h-4 rounded ring-1 ring-white/30", key !== "CUSTOM" && config.bgClass, key === "CUSTOM" && "bg-violet-500")}
                        />
                        <span>{config.label}</span>
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
            </div>

            {form.status === "CUSTOM" && (
              <div className="space-y-3 border-l-2 border-slate-700 pl-4">
                <div className="space-y-2">
                  <Label htmlFor="rule-customLabel">Libellé</Label>
                  <Input
                    id="rule-customLabel"
                    placeholder="Ex: Sport, Cours..."
                    value={form.customLabel}
                    onChange={(e) => setForm((f) => ({ ...f, customLabel: e.target.value }))}
                    maxLength={20}
                  />
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
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
                <Label htmlFor="rule-endDate">Date de fin (optionnel)</Label>
                <Input
                  id="rule-endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                isPending ||
                !form.startDate ||
                (form.status === "CUSTOM" && !form.customLabel.trim())
              }
            >
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
