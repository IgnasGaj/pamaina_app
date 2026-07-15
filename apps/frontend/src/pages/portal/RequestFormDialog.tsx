import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { BottomSheet } from '@/components/portal/BottomSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAbsenceTypes } from '@/hooks/useAbsenceTypes'
import { useCreateRequest } from '@/hooks/useRequests'
import { getErrorMessage } from '@/lib/errors'

function useRequestSchema() {
  const { t } = useTranslation()
  return z
    .object({
      absenceTypeId: z.string().uuid(t('requests.validation.selectRequestType')),
      startDate: z.string().min(1, t('requests.validation.startDateRequired')),
      endDate: z.string().min(1, t('requests.validation.endDateRequired')),
      comment: z.string().max(1000).optional(),
    })
    .refine((data) => data.endDate >= data.startDate, {
      message: t('requests.validation.endDateAfterStart'),
      path: ['endDate'],
    })
}

type RequestFormValues = { absenceTypeId: string; startDate: string; endDate: string; comment?: string }

interface RequestFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Preselects the type when opened from one of the large request-type tiles. */
  initialAbsenceTypeId?: string
}

export function RequestFormDialog({ open, onOpenChange, initialAbsenceTypeId }: RequestFormDialogProps) {
  const { t } = useTranslation()
  const requestSchema = useRequestSchema()
  const absenceTypesQuery = useAbsenceTypes({ pageSize: 100, status: 'ACTIVE' })
  const createRequest = useCreateRequest()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { absenceTypeId: '', startDate: '', endDate: '', comment: '' },
  })

  useEffect(() => {
    if (open) {
      reset({ absenceTypeId: initialAbsenceTypeId ?? '', startDate: '', endDate: '', comment: '' })
    }
  }, [open, initialAbsenceTypeId, reset])

  async function onSubmit(values: RequestFormValues) {
    try {
      await createRequest.mutateAsync({
        absenceTypeId: values.absenceTypeId,
        startDate: values.startDate,
        endDate: values.endDate,
        comment: values.comment || undefined,
      })
      toast.success(t('requests.requestSubmitted'))
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const absenceTypes = absenceTypesQuery.data?.items ?? []

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} closeLabel={t('common.close')}>
      <DialogPrimitive.Title className="text-lg font-semibold">{t('requests.newRequest')}</DialogPrimitive.Title>
      <DialogPrimitive.Description className="mb-4 text-sm text-muted-foreground">
        {t('requests.newRequestDescription')}
      </DialogPrimitive.Description>
      <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <div className="space-y-2">
          <Label>{t('requests.type')}</Label>
          <Controller
            control={control}
            name="absenceTypeId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-12 w-full text-base">
                  <SelectValue placeholder={t('requests.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  {absenceTypes.map((absenceType) => (
                    <SelectItem key={absenceType.id} value={absenceType.id}>
                      {absenceType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.absenceTypeId && <p className="text-sm text-destructive">{errors.absenceTypeId.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="startDate">{t('requests.startDate')}</Label>
            <Input id="startDate" type="date" className="h-12 text-base" {...register('startDate')} />
            {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">{t('requests.endDate')}</Label>
            <Input id="endDate" type="date" className="h-12 text-base" {...register('endDate')} />
            {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="comment">{t('requests.commentOptional')}</Label>
          <Textarea id="comment" rows={3} {...register('comment')} />
          {errors.comment && <p className="text-sm text-destructive">{errors.comment.message}</p>}
        </div>

        <Button type="submit" className="h-12 w-full text-base" disabled={createRequest.isPending}>
          {createRequest.isPending ? t('requests.submitting') : t('requests.submitRequest')}
        </Button>
      </form>
    </BottomSheet>
  )
}
