import { useMutation } from '@tanstack/react-query'

import { exportSchedule } from '@/api/schedule-export.api'
import type { ScheduleExportFormat, ScheduleExportOptions } from '@/types/schedule-export.types'

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function openBlobInNewTab(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  // Revoking immediately would race the new tab's load — the browser tab holds its own reference once opened.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function useScheduleExport() {
  return useMutation({
    mutationFn: async ({ format, ...payload }: ScheduleExportOptions & { format: ScheduleExportFormat }) => {
      const result = await exportSchedule({ ...payload, format: format === 'print' ? 'pdf' : format })
      if (format === 'print') {
        openBlobInNewTab(result.blob)
      } else {
        downloadBlob(result.blob, result.filename)
      }
      return result
    },
  })
}
