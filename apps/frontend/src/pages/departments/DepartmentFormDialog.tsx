import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { useCreateDepartment, useUpdateDepartment } from '@/hooks/useDepartments'
import { getErrorMessage } from '@/lib/errors'
import type { Department } from '@/types/department.types'

const departmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
})

type DepartmentFormValues = z.infer<typeof departmentSchema>

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  department?: Department
}) {
  const isEditing = Boolean(department)
  const createDepartment = useCreateDepartment()
  const updateDepartment = useUpdateDepartment(department?.id ?? '')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '', description: '' },
  })

  useEffect(() => {
    if (open) {
      reset({ name: department?.name ?? '', description: department?.description ?? '' })
    }
  }, [open, department, reset])

  async function onSubmit(values: DepartmentFormValues) {
    const payload = { name: values.name, description: values.description || undefined }
    try {
      if (isEditing) {
        await updateDepartment.mutateAsync(payload)
        toast.success('Department updated')
      } else {
        await createDepartment.mutateAsync(payload)
        toast.success('Department created')
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
          <DialogTitle>{isEditing ? 'Edit department' : 'New department'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the department details.' : 'Add a new department to your company.'}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Create department'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
