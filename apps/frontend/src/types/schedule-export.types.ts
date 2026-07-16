export type ScheduleExportFormat = 'xlsx' | 'pdf' | 'print'

export interface ScheduleExportOptions {
  year: number
  month: number
  departmentId?: string
  employeeId?: string
  includeUnpublished: boolean
  signatureName?: string
}

export interface ExportSchedulePayload extends ScheduleExportOptions {
  format: 'xlsx' | 'pdf'
}
