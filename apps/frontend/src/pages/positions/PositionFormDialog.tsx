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
import { useDepartments } from '@/hooks/useDepartments'
import { useCreatePosition, useUpdatePosition } from '@/hooks/usePositions'
import { getErrorMessage } from '@/lib/errors'
import type { Position } from '@/types/position.types'

const NONE_VALUE = '__none__'

const positionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  departmentId: z.string(),
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
    defaultValues: { title: '', description: '', departmentId: NONE_VALUE },
  })

  useEffect(() => {
    if (open) {
      reset({
        title: position?.title ?? '',
        description: position?.description ?? '',
        departmentId: position?.departmentId ?? NONE_VALUE,
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
          departmentId: departmentId ?? null,
        })
        toast.success('Position updated')
      } else {
        await createPosition.mutateAsync({
          title: values.title,
          description: values.description || undefined,
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
