import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
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

function useAbsenceTypeSchema() {
  const { t } = useTranslation()
  return z.object({
    name: z.string().min(1, t('common.nameRequired')).max(100),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, t('common.validHexColor')),
    paid: z.boolean(),
    active: z.boolean(),
  })
}

type AbsenceTypeFormValues = { name: string; color: string; paid: boolean; active: boolean }

export function AbsenceTypeFormDialog({
  open,
  onOpenChange,
  absenceType,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  absenceType?: AbsenceType
}) {
  const { t } = useTranslation()
  const absenceTypeSchema = useAbsenceTypeSchema()
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
        toast.success(t('absenceTypes.updated'))
      } else {
        await createAbsenceType.mutateAsync({
          name: values.name,
          color: values.color,
          paid: values.paid,
        })
        toast.success(t('absenceTypes.created'))
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
          <DialogTitle>{isEditing ? t('absenceTypes.editType') : t('absenceTypes.newType')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('absenceTypes.editDescription') : t('absenceTypes.createDescription')}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="space-y-2">
            <Label htmlFor="name">{t('common.name')}</Label>
            <Input id="name" placeholder="Vacation" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">{t('common.color')}</Label>
            <Controller
              control={control}
              name="color"
              render={({ field }) => <ColorPickerInput id="color" value={field.value} onChange={field.onChange} />}
            />
            {errors.color && <p className="text-sm text-destructive">{errors.color.message}</p>}
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label htmlFor="paid" className="cursor-pointer">
              {t('absenceTypes.paid')}
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
                {t('common.active')}
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
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.saving') : isEditing ? t('common.saveChanges') : t('absenceTypes.newType')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
