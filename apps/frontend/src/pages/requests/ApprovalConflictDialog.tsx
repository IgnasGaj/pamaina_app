import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ConflictPreviewEntry } from '@/types/request.types'

type Resolution = 'remove' | 'keep' | 'cancel'

export function ApprovalConflictDialog({
  open,
  onOpenChange,
  conflicts,
  isLoading = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  conflicts: ConflictPreviewEntry[]
  isLoading?: boolean
  onConfirm: (resolution: 'remove' | 'keep') => void
}) {
  const { t } = useTranslation()
  const [resolution, setResolution] = useState<Resolution>('remove')

  function handleConfirm() {
    if (resolution === 'cancel') {
      onOpenChange(false)
      return
    }
    onConfirm(resolution)
  }

  const options: { value: Resolution; labelKey: string }[] = [
    { value: 'remove', labelKey: 'requests.conflict.removeShifts' },
    { value: 'cancel', labelKey: 'requests.conflict.cancelApproval' },
    { value: 'keep', labelKey: 'requests.conflict.keepShifts' },
  ]

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setResolution('remove')
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('requests.conflict.title')}</DialogTitle>
          <DialogDescription>{t('requests.conflict.description')}</DialogDescription>
        </DialogHeader>

        <ul className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-border p-2 text-sm text-muted-foreground">
          {conflicts.map((conflict) => (
            <li key={conflict.date}>
              {conflict.date} — {conflict.shiftTemplateName}
            </li>
          ))}
        </ul>

        <div className="space-y-2">
          {options.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="conflict-resolution"
                value={option.value}
                checked={resolution === option.value}
                onChange={() => setResolution(option.value)}
                className="size-4 accent-primary"
              />
              {t(option.labelKey)}
            </label>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button disabled={isLoading} onClick={handleConfirm}>
            {isLoading ? t('common.pleaseWait') : t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
