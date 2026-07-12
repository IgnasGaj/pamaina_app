import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { PaginationMeta } from '@/types/api.types'

export function PaginationBar({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}) {
  const { page, totalPages, totalItems, pageSize } = meta
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between border-t border-border px-1 py-3">
      <p className="text-sm text-muted-foreground">
        {totalItems === 0 ? 'No results' : `Showing ${start}-${end} of ${totalItems}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
