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
import { Slot, SlotStatus, TimeSlot, STATUS_CONFIG, TIME_SLOT_CONFIG } from "@/lib/types"
import { upsertSlot, deleteSlot } from "@/lib/actions/calendar"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface SlotEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  date: string             // YYYY-MM-DD
  timeSlot: TimeSlot
  existingSlot?: Slot      // si on édite un slot existant
  onSave: () => void       // callback pour rafraîchir la grille
}

export function SlotEditDialog({
  open,
  onOpenChange,
  userId,
  date,
  timeSlot,
  existingSlot,
  onSave,
}: SlotEditDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<SlotStatus>(existingSlot?.status ?? "AVAILABLE")
  const [customLabel, setCustomLabel] = useState(existingSlot?.customLabel ?? "")
  const [customColor, setCustomColor] = useState(existingSlot?.customColor ?? "#8b5cf6")
  const [note, setNote] = useState(existingSlot?.note ?? "")

  // Re-init quand le slot change
  useEffect(() => {
    if (open) {
      setStatus(existingSlot?.status ?? "AVAILABLE")
      setCustomLabel(existingSlot?.customLabel ?? "")
      setCustomColor(existingSlot?.customColor ?? "#8b5cf6")
      setNote(existingSlot?.note ?? "")
    }
  }, [open, existingSlot])

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="capitalize">{dateLabel}</DialogTitle>
          <DialogDescription>
            {timeSlotLabel} — modifie ton statut
          </DialogDescription>
        </DialogHeader>

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
                      className={cn(
                        "flex items-center gap-2 cursor-pointer flex-1 py-1"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block w-4 h-4 rounded",
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
            {existingSlot && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                Supprimer
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
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