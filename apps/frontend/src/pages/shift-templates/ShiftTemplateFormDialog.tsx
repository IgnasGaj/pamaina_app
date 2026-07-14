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
import { useCreateShiftTemplate, useUpdateShiftTemplate } from '@/hooks/useShiftTemplates'
import { getErrorMessage } from '@/lib/errors'
import type { ShiftTemplate } from '@/types/shift-template.types'

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time')

const shiftTemplateSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100),
    shortCode: z.string().min(1, 'Code is required').max(4),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Enter a valid hex color'),
    startTime: timeSchema,
    endTime: timeSchema,
    breakMinutes: z.coerce.number().int().min(0).max(480),
    active: z.boolean(),
  })
  .refine((data) => data.startTime !== data.endTime, {
    message: 'Start time and end time cannot be the same',
    path: ['endTime'],
  })

type ShiftTemplateFormValues = z.infer<typeof shiftTemplateSchema>

export function ShiftTemplateFormDialog({
  open,
  onOpenChange,
  template,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: ShiftTemplate
}) {
  const isEditing = Boolean(template)
  const createShiftTemplate = useCreateShiftTemplate()
  const updateShiftTemplate = useUpdateShiftTemplate(template?.id ?? '')

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ShiftTemplateFormValues>({
    resolver: zodResolver(shiftTemplateSchema),
    defaultValues: {
      name: '',
      shortCode: '',
      color: '#2563EB',
      startTime: '08:00',
      endTime: '17:00',
      breakMinutes: 0,
      active: true,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: template?.name ?? '',
        shortCode: template?.shortCode ?? '',
        color: template?.color ?? '#2563EB',
        startTime: template?.startTime ?? '08:00',
        endTime: template?.endTime ?? '17:00',
        breakMinutes: template?.breakMinutes ?? 0,
        active: template?.active ?? true,
      })
    }
  }, [open, template, reset])

  async function onSubmit(values: ShiftTemplateFormValues) {
    try {
      if (isEditing) {
        await updateShiftTemplate.mutateAsync({
          name: values.name,
          shortCode: values.shortCode,
          color: values.color,
          startTime: values.startTime,
          endTime: values.endTime,
          breakMinutes: values.breakMinutes,
          active: values.active,
        })
        toast.success('Shift template updated')
      } else {
        await createShiftTemplate.mutateAsync({
          name: values.name,
          shortCode: values.shortCode,
          color: values.color,
          startTime: values.startTime,
          endTime: values.endTime,
          breakMinutes: values.breakMinutes,
        })
        toast.success('Shift template created')
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const isPending = createShiftTemplate.isPending || updateShiftTemplate.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit shift template' : 'New shift template'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update this shift definition.' : 'Define a new shift your team can be scheduled into.'}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Morning" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortCode">Grid code</Label>
              <Input id="shortCode" placeholder="M" {...register('shortCode')} />
              {errors.shortCode && <p className="text-sm text-destructive">{errors.shortCode.message}</p>}
            </div>
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

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start time</Label>
              <Input id="startTime" type="time" {...register('startTime')} />
              {errors.startTime && <p className="text-sm text-destructive">{errors.startTime.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End time</Label>
              <Input id="endTime" type="time" {...register('endTime')} />
              {errors.endTime && <p className="text-sm text-destructive">{errors.endTime.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="breakMinutes">Break (min)</Label>
              <Input id="breakMinutes" type="number" step="5" min="0" {...register('breakMinutes')} />
              {errors.breakMinutes && <p className="text-sm text-destructive">{errors.breakMinutes.message}</p>}
            </div>
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
              {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Create template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
