import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'

import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
  closeLabel: string
}

/**
 * Bottom-anchored sheet for the employee mobile portal, built directly on
 * the Radix Dialog primitive rather than ui/dialog's DialogContent — that
 * component's centered-modal classes (top/left/translate) would otherwise
 * fight the bottom-anchored ones here. Desktop dialogs are untouched.
 */
export function BottomSheet({ open, onOpenChange, children, className, closeLabel }: BottomSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 max-h-[86vh] overflow-y-auto rounded-t-3xl border-t border-border bg-background shadow-2xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            className,
          )}
        >
          <div className="sticky top-0 z-10 flex justify-center bg-background pt-3 pb-1">
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" aria-hidden />
          </div>
          <DialogPrimitive.Close
            className="absolute right-4 top-3 rounded-full p-1.5 text-muted-foreground opacity-80 transition-opacity hover:bg-muted hover:opacity-100 focus:outline-hidden"
            aria-label={closeLabel}
          >
            <XIcon className="size-5" />
          </DialogPrimitive.Close>
          <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-1">{children}</div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
