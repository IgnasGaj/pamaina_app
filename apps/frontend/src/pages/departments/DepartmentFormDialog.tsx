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
import { useCreateDepartment, useUpdateDepartment } from '@/hooks/useDepartments'
import { getErrorMessage } from '@/lib/errors'
import type { Department } from '@/types/department.types'

function useDepartmentSchema() {
  const { t } = useTranslation()
  return z.object({
    name: z.string().min(1, t('common.nameRequired')).max(200),
    description: z.string().max(1000).optional().or(z.literal('')),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, t('common.validHexColor')),
    isActive: z.boolean(),
  })
}

type DepartmentFormValues = { name: string; description?: string; color: string; isActive: boolean }

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  department?: Department
}) {
  const { t } = useTranslation()
  const departmentSchema = useDepartmentSchema()
  const isEditing = Boolean(department)
  const createDepartment = useCreateDepartment()
  const updateDepartment = useUpdateDepartment(department?.id ?? '')

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '', description: '', color: '#2563EB', isActive: true },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: department?.name ?? '',
        description: department?.description ?? '',
        color: department?.color ?? '#2563EB',
        isActive: department?.isActive ?? true,
      })
    }
  }, [open, department, reset])

  async function onSubmit(values: DepartmentFormValues) {
    try {
      if (isEditing) {
        await updateDepartment.mutateAsync({
          name: values.name,
          description: values.description || undefined,
          color: values.color,
          isActive: values.isActive,
        })
        toast.success(t('departments.updated'))
      } else {
        await createDepartment.mutateAsync({
          name: values.name,
          description: values.description || undefined,
          color: values.color,
        })
        toast.success(t('departments.created'))
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const isPending = createDepartment.isPending || updateDepartment.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? t('departments.editDepartment') : t('departments.newDepartment')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('departments.editDescription') : t('departments.createDescription')}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="space-y-2">
            <Label htmlFor="name">{t('common.name')}</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('common.description')}</Label>
            <Input id="description" {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
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
              {isPending ? t('common.saving') : isEditing ? t('common.saveChanges') : t('departments.newDepartment')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
