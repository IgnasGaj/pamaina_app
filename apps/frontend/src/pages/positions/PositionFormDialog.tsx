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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ColorPickerInput } from '@/components/shared/ColorPickerInput'
import { useDepartments } from '@/hooks/useDepartments'
import { useCreatePosition, useUpdatePosition } from '@/hooks/usePositions'
import { getErrorMessage } from '@/lib/errors'
import type { Position } from '@/types/position.types'

const NONE_VALUE = '__none__'

const positionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Enter a valid hex color'),
  departmentId: z.string(),
  isActive: z.boolean(),
})

type PositionFormValues = z.infer<typeof positionSchema>

export function PositionFormDialog({
  open,
  onOpenChange,
  position,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  position?: Position
}) {
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
        toast.success('Position updated')
      } else {
        await createPosition.mutateAsync({
          title: values.title,
          description: values.description || undefined,
          color: values.color,
          departmentId,
        })
        toast.success('Position created')
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
          <DialogTitle>{isEditing ? 'Edit position' : 'New position'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the position details.' : 'Add a new position to your company.'}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register('description')} />
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
          <div className="space-y-2">
            <Label>Department</Label>
            <Controller
              control={control}
              name="departmentId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>No department</SelectItem>
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
                Active
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
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Create position'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
