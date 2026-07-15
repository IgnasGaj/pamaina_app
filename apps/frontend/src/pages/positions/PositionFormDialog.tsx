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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ColorPickerInput } from '@/components/shared/ColorPickerInput'
import { useDepartments } from '@/hooks/useDepartments'
import { useCreatePosition, useUpdatePosition } from '@/hooks/usePositions'
import { getErrorMessage } from '@/lib/errors'
import type { Position } from '@/types/position.types'

const NONE_VALUE = '__none__'

function usePositionSchema() {
  const { t } = useTranslation()
  return z.object({
    title: z.string().min(1, t('common.titleRequired')).max(200),
    description: z.string().max(1000).optional().or(z.literal('')),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, t('common.validHexColor')),
    departmentId: z.string(),
    isActive: z.boolean(),
  })
}

type PositionFormValues = {
  title: string
  description?: string
  color: string
  departmentId: string
  isActive: boolean
}

export function PositionFormDialog({
  open,
  onOpenChange,
  position,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  position?: Position
}) {
  const { t } = useTranslation()
  const positionSchema = usePositionSchema()
  const isEditing = Boolean(position)
  const createPosition = useCreatePosition()
  const updatePosition = useUpdatePosition(position?.id ?? '')
  const departmentsQuery = useDepartments({ pageSize: 100 })

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<PositionFormValues>({
    resolver: zodResolver(positionSchema),
    defaultValues: { title: '', description: '', color: '#2563EB', departmentId: NONE_VALUE, isActive: true },
  })

  useEffect(() => {
    if (open) {
      reset({
        title: position?.title ?? '',
        description: position?.description ?? '',
        color: position?.color ?? '#2563EB',
        departmentId: position?.departmentId ?? NONE_VALUE,
        isActive: position?.isActive ?? true,
      })
    }
  }, [open, position, reset])

  async function onSubmit(values: PositionFormValues) {
    const departmentId = values.departmentId === NONE_VALUE ? undefined : values.departmentId
    try {
      if (isEditing) {
        await updatePosition.mutateAsync({
          title: values.title,
          description: values.description || undefined,
          color: values.color,
          departmentId: departmentId ?? null,
          isActive: values.isActive,
        })
        toast.success(t('positions.updated'))
      } else {
        await createPosition.mutateAsync({
          title: values.title,
          description: values.description || undefined,
          color: values.color,
          departmentId,
        })
        toast.success(t('positions.created'))
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const isPending = createPosition.isPending || updatePosition.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? t('positions.editPosition') : t('positions.newPosition')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('positions.editDescription') : t('positions.createDescription')}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="space-y-2">
            <Label htmlFor="title">{t('common.title')}</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('common.description')}</Label>
            <Input id="description" {...register('description')} />
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
          <div className="space-y-2">
            <Label>{t('common.department')}</Label>
            <Controller
              control={control}
              name="departmentId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('employees.noDepartment')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>{t('employees.noDepartment')}</SelectItem>
                    {departmentsQuery.data?.items.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {isEditing && (
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <Label htmlFor="isActive" className="cursor-pointer">
                {t('common.active')}
              </Label>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.saving') : isEditing ? t('common.saveChanges') : t('positions.newPosition')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
