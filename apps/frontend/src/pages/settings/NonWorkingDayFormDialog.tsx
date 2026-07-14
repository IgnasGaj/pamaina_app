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
import { useCreateNonWorkingDay } from '@/hooks/useWorkingTime'
import { getErrorMessage } from '@/lib/errors'

const nonWorkingDaySchema = z.object({
  date: z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), 'Enter a valid date'),
  name: z.string().min(1, 'Name is required').max(200),
})

type NonWorkingDayFormValues = z.infer<typeof nonWorkingDaySchema>

export function NonWorkingDayFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
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
      toast.success('Non-working day added')
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New non-working day</DialogTitle>
          <DialogDescription>
            Add a company-specific day (e.g. a factory shutdown) that reduces required monthly hours for everyone.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Company anniversary" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createNonWorkingDay.isPending}>
              {createNonWorkingDay.isPending ? 'Adding…' : 'Add day'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
