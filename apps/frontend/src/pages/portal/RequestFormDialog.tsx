import { zodResolver } from '@hookform/resolvers/zod'
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

export function RequestFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
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

  async function onSubmit(values: RequestFormValues) {
    try {
      await createRequest.mutateAsync({
        absenceTypeId: values.absenceTypeId,
        startDate: values.startDate,
        endDate: values.endDate,
        comment: values.comment || undefined,
      })
      toast.success(t('requests.requestSubmitted'))
      reset({ absenceTypeId: '', startDate: '', endDate: '', comment: '' })
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const absenceTypes = absenceTypesQuery.data?.items ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('requests.newRequest')}</DialogTitle>
          <DialogDescription>{t('requests.newRequestDescription')}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="space-y-2">
            <Label>{t('requests.type')}</Label>
            <Controller
              control={control}
              name="absenceTypeId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
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
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t('requests.endDate')}</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">{t('requests.commentOptional')}</Label>
            <Textarea id="comment" rows={3} {...register('comment')} />
            {errors.comment && <p className="text-sm text-destructive">{errors.comment.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createRequest.isPending}>
              {createRequest.isPending ? t('requests.submitting') : t('requests.submitRequest')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
