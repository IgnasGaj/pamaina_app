-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('REQUEST_APPROVED', 'REQUEST_APPROVAL_REVOKED');

-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'REVOKED';

-- AlterTable
ALTER TABLE "company_settings" ADD COLUMN     "annual_vacation_days" INTEGER NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "schedule_assignments" ADD COLUMN     "source_request_id" TEXT;

-- CreateTable
CREATE TABLE "request_audit_logs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "performed_by" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "request_audit_logs_company_id_idx" ON "request_audit_logs"("company_id");

-- CreateIndex
CREATE INDEX "request_audit_logs_request_id_idx" ON "request_audit_logs"("request_id");

-- CreateIndex
CREATE INDEX "schedule_assignments_source_request_id_idx" ON "schedule_assignments"("source_request_id");

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_source_request_id_fkey" FOREIGN KEY ("source_request_id") REFERENCES "employee_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_audit_logs" ADD CONSTRAINT "request_audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_audit_logs" ADD CONSTRAINT "request_audit_logs_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "employee_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_audit_logs" ADD CONSTRAINT "request_audit_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
