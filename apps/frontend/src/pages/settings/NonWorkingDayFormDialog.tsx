import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { useCreateNonWorkingDay } from '@/hooks/useWorkingTime'
import { getErrorMessage } from '@/lib/errors'

function useNonWorkingDaySchema() {
  const { t } = useTranslation()
  return z.object({
    date: z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), t('common.validDate')),
    name: z.string().min(1, t('common.nameRequired')).max(200),
  })
}

type NonWorkingDayFormValues = { date: string; name: string }

export function NonWorkingDayFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const nonWorkingDaySchema = useNonWorkingDaySchema()
  const createNonWorkingDay = useCreateNonWorkingDay()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NonWorkingDayFormValues>({
    resolver: zodResolver(nonWorkingDaySchema),
    defaultValues: { date: '', name: '' },
  })

  useEffect(() => {
    if (open) {
      reset({ date: '', name: '' })
    }
  }, [open, reset])

  async function onSubmit(values: NonWorkingDayFormValues) {
    try {
      await createNonWorkingDay.mutateAsync({ date: values.date, name: values.name })
      toast.success(t('workingTime.dayAdded'))
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('workingTime.newDayTitle')}</DialogTitle>
          <DialogDescription>{t('workingTime.newDayDescription')}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="space-y-2">
            <Label htmlFor="date">{t('common.date')}</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">{t('common.name')}</Label>
            <Input id="name" placeholder={t('workingTime.namePlaceholder')} {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createNonWorkingDay.isPending}>
              {createNonWorkingDay.isPending ? t('workingTime.adding') : t('workingTime.addDay')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
