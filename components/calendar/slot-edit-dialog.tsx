"use client"

import { useState, useTransition, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Repeat } from "lucide-react"
import { Slot, SlotStatus, TimeSlot, STATUS_CONFIG, TIME_SLOT_CONFIG } from "@/lib/types"
import type { RecurringRule } from "@/lib/calendar-logic"
import { upsertSlot, deleteSlot } from "@/lib/actions/calendar"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface SlotEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  date: string
  timeSlot: TimeSlot
  existingSlot?: Slot
  inheritedRule?: RecurringRule
  onSave: () => void
}

export function SlotEditDialog({
  open,
  onOpenChange,
  userId,
  date,
  timeSlot,
  existingSlot,
  inheritedRule,
  onSave,
}: SlotEditDialogProps) {
  const [isPending, startTransition] = useTransition()

  const defaultStatus = existingSlot?.status ?? inheritedRule?.status ?? "AVAILABLE"
  const [status, setStatus] = useState<SlotStatus>(defaultStatus)
  const [customLabel, setCustomLabel] = useState(
    existingSlot?.customLabel ?? inheritedRule?.customLabel ?? ""
  )
  const [customColor, setCustomColor] = useState(
    existingSlot?.customColor ?? inheritedRule?.customColor ?? "#8b5cf6"
  )
  const [note, setNote] = useState(existingSlot?.note ?? "")

  useEffect(() => {
    if (open) {
      setStatus(existingSlot?.status ?? inheritedRule?.status ?? "AVAILABLE")
      setCustomLabel(existingSlot?.customLabel ?? inheritedRule?.customLabel ?? "")
      setCustomColor(existingSlot?.customColor ?? inheritedRule?.customColor ?? "#8b5cf6")
      setNote(existingSlot?.note ?? "")
    }
  }, [open, existingSlot, inheritedRule])

  const dateObj = new Date(date + "T00:00:00")
  const dateLabel = format(dateObj, "EEEE d MMMM yyyy", { locale: fr })
  const timeSlotLabel = TIME_SLOT_CONFIG[timeSlot].label

  const handleSave = () => {
    startTransition(async () => {
      await upsertSlot({
        userId,
        date,
        timeSlot,
        status,
        customLabel: status === "CUSTOM" ? customLabel : undefined,
        customColor: status === "CUSTOM" ? customColor : undefined,
        note: note.trim() || undefined,
      })
      onSave()
      onOpenChange(false)
    })
  }

  const handleDelete = () => {
    if (!existingSlot) return
    startTransition(async () => {
      await deleteSlot({ userId, date, timeSlot })
      onSave()
      onOpenChange(false)
    })
  }

  // Réinitialise à la règle récurrente en supprimant le slot override
  const handleResetToRule = () => {
    if (!existingSlot) return
    startTransition(async () => {
      await deleteSlot({ userId, date, timeSlot })
      onSave()
      onOpenChange(false)
    })
  }

  const isOverridingRule = !!existingSlot && !!inheritedRule === false && !inheritedRule
  const isInheritingRule = !existingSlot && !!inheritedRule

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">{dateLabel}</DialogTitle>
          <DialogDescription>
            {timeSlotLabel} — modifie ton statut
          </DialogDescription>
        </DialogHeader>

        {isInheritingRule && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800 border border-slate-600 text-sm text-slate-300">
            <Repeat className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <span>Hérité de ta règle récurrente — enregistrer créera un override pour ce jour uniquement</span>
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Statut</Label>
            <RadioGroup value={status} onValueChange={(v) => setStatus(v as SlotStatus)}>
              {(Object.keys(STATUS_CONFIG) as SlotStatus[]).map((key) => {
                const config = STATUS_CONFIG[key]
                return (
                  <div key={key} className="flex items-center space-x-2">
                    <RadioGroupItem value={key} id={`status-${key}`} />
                    <Label
                      htmlFor={`status-${key}`}
                      className="flex items-center gap-2 cursor-pointer flex-1 py-1"
                    >
                      <span
                        className={cn(
                          "inline-block w-4 h-4 rounded ring-1 ring-white/30",
                          key !== "CUSTOM" && config.bgClass,
                        )}
                        style={key === "CUSTOM" ? { backgroundColor: customColor } : undefined}
                      />
                      <span>{config.label}</span>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          {status === "CUSTOM" && (
            <div className="space-y-3 border-l-2 border-slate-700 pl-4">
              <div className="space-y-2">
                <Label htmlFor="customLabel">Libellé</Label>
                <Input
                  id="customLabel"
                  placeholder="Ex: Anniv, Vacances, Médecin..."
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customColor">Couleur</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="customColor"
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">{customColor}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">Note (optionnel)</Label>
            <Textarea
              id="note"
              placeholder="Ex: dispo après 18h, à confirmer..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={200}
            />
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          <div>
            {existingSlot && !inheritedRule && (
              <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                Supprimer
              </Button>
            )}
            {existingSlot && inheritedRule && (
              <Button variant="outline" onClick={handleResetToRule} disabled={isPending}>
                <Repeat className="h-3.5 w-3.5 mr-1.5" />
                Réinitialiser à la règle
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || (status === "CUSTOM" && !customLabel.trim())}
            >
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
