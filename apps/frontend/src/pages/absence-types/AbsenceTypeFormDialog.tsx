import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ColorPickerInput } from '@/components/shared/ColorPickerInput'
import { useCreateAbsenceType, useUpdateAbsenceType } from '@/hooks/useAbsenceTypes'
import { getErrorMessage } from '@/lib/errors'
import type { AbsenceType } from '@/types/absence-type.types'

const absenceTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Enter a valid hex color'),
  paid: z.boolean(),
  active: z.boolean(),
})

type AbsenceTypeFormValues = z.infer<typeof absenceTypeSchema>

export function AbsenceTypeFormDialog({
  open,
  onOpenChange,
  absenceType,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  absenceType?: AbsenceType
}) {
  const isEditing = Boolean(absenceType)
  const createAbsenceType = useCreateAbsenceType()
  const updateAbsenceType = useUpdateAbsenceType(absenceType?.id ?? '')

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AbsenceTypeFormValues>({
    resolver: zodResolver(absenceTypeSchema),
    defaultValues: { name: '', color: '#F59E0B', paid: true, active: true },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: absenceType?.name ?? '',
        color: absenceType?.color ?? '#F59E0B',
        paid: absenceType?.paid ?? true,
        active: absenceType?.active ?? true,
      })
    }
  }, [open, absenceType, reset])

  async function onSubmit(values: AbsenceTypeFormValues) {
    try {
      if (isEditing) {
        await updateAbsenceType.mutateAsync({
          name: values.name,
          color: values.color,
          paid: values.paid,
          active: values.active,
        })
        toast.success('Absence type updated')
      } else {
        await createAbsenceType.mutateAsync({
          name: values.name,
          color: values.color,
          paid: values.paid,
        })
        toast.success('Absence type created')
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const isPending = createAbsenceType.isPending || updateAbsenceType.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit absence type' : 'New absence type'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update this absence type.' : 'Define a new absence your team can be scheduled into.'}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Vacation" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Controller
              control={control}
              name="color"
              render={({ field }) => <ColorPickerInput id="color" value={field.value} onChange={field.onChange} />}
            />
            {errors.color && <p className="text-sm text-destructive">{errors.color.message}</p>}
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label htmlFor="paid" className="cursor-pointer">
              Paid
            </Label>
            <Controller
              control={control}
              name="paid"
              render={({ field }) => <Switch id="paid" checked={field.value} onCheckedChange={field.onChange} />}
            />
          </div>

          {isEditing && (
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <Label htmlFor="active" className="cursor-pointer">
                Active
              </Label>
              <Controller
                control={control}
                name="active"
                render={({ field }) => <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Create absence type'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
