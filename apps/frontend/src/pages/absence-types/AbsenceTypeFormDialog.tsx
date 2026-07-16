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
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ColorPickerInput } from '@/components/shared/ColorPickerInput'
import { useUpdateAbsenceType } from '@/hooks/useAbsenceTypes'
import { getErrorMessage } from '@/lib/errors'
import type { AbsenceType } from '@/types/absence-type.types'

function useAbsenceTypeSchema() {
  const { t } = useTranslation()
  return z.object({
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, t('common.validHexColor')),
    description: z.string().max(500).optional(),
    active: z.boolean(),
  })
}

type AbsenceTypeFormValues = { color: string; description?: string; active: boolean }

/** Edit-only: code and name are fixed for Pamaina's four standard absence types (see the backend service). */
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
  const updateAbsenceType = useUpdateAbsenceType(absenceType?.id ?? '')

  const {
    handleSubmit,
    reset,
    control,
    register,
    formState: { errors },
  } = useForm<AbsenceTypeFormValues>({
    resolver: zodResolver(absenceTypeSchema),
    defaultValues: { color: '#F59E0B', description: '', active: true },
  })

  useEffect(() => {
    if (open && absenceType) {
      reset({
        color: absenceType.color,
        description: absenceType.description ?? '',
        active: absenceType.active,
      })
    }
  }, [open, absenceType, reset])

  async function onSubmit(values: AbsenceTypeFormValues) {
    try {
      await updateAbsenceType.mutateAsync({
        color: values.color,
        description: values.description || null,
        active: values.active,
      })
      toast.success(t('absenceTypes.updated'))
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {absenceType ? `${absenceType.code} — ${absenceType.name}` : ''}
          </DialogTitle>
          <DialogDescription>{t('absenceTypes.editDescription')}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="space-y-2">
            <Label htmlFor="color">{t('common.color')}</Label>
            <Controller
              control={control}
              name="color"
              render={({ field }) => <ColorPickerInput id="color" value={field.value} onChange={field.onChange} />}
            />
            {errors.color && <p className="text-sm text-destructive">{errors.color.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('common.description')}</Label>
            <Textarea id="description" rows={2} placeholder={t('absenceTypes.descriptionPlaceholder')} {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={updateAbsenceType.isPending}>
              {updateAbsenceType.isPending ? t('common.saving') : t('common.saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
