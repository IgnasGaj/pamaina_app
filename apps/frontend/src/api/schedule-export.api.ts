import { apiClient } from '@/lib/api-client'
import type { ExportSchedulePayload } from '@/types/schedule-export.types'

export interface ScheduleExportResult {
  blob: Blob
  filename: string
}

const DEFAULT_FILENAMES = { xlsx: 'grafikas.xlsx', pdf: 'grafikas.pdf' } as const

function extractFilename(contentDisposition: string | undefined, format: 'xlsx' | 'pdf'): string {
  const match = contentDisposition ? /filename="?([^"]+)"?/.exec(contentDisposition) : null
  return match?.[1] ?? DEFAULT_FILENAMES[format]
}

/** Binary response — bypasses unwrap()/unwrapPaginated() since there's no {data:...} JSON envelope to unwrap. */
export async function exportSchedule(payload: ExportSchedulePayload): Promise<ScheduleExportResult> {
  const response = await apiClient.post('/schedule-exports', payload, { responseType: 'blob' })
  return {
    blob: response.data as Blob,
    filename: extractFilename(response.headers['content-disposition'] as string | undefined, payload.format),
  }
}
