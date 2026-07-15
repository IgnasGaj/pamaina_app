import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import type { PaginationMeta } from '@/types/api.types'

export function PaginationBar({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}) {
  const { t } = useTranslation()
  const { page, totalPages, totalItems, pageSize } = meta
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between border-t border-border px-1 py-3">
      <p className="text-sm text-muted-foreground">
        {totalItems === 0 ? t('common.noResults') : t('common.showingRange', { start, end, total: totalItems })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
          {t('common.previous')}
        </Button>
        <span className="text-sm text-muted-foreground">
          {t('common.page')} {page} {t('common.of')} {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t('common.nextPage')}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
