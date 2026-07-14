-- Existing schedule_assignments rows reference the old ShiftType enum with
-- no corresponding ShiftTemplate row to backfill against (shift templates
-- are now company-defined, created via the new UI). These are disposable
-- dev/smoke-test rows, so we clear them rather than invent placeholder
-- templates on the company's behalf.
DELETE FROM "schedule_assignments";

-- AlterTable
ALTER TABLE "schedule_assignments" DROP COLUMN "shift_type",
ADD COLUMN     "shift_template_id" TEXT NOT NULL,
ADD COLUMN     "updated_by" TEXT;

-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "updated_by" TEXT;

-- DropEnum
DROP TYPE "ShiftType";

-- CreateTable
CREATE TABLE "shift_templates" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_code" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#2563EB',
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "break_minutes" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shift_templates_company_id_idx" ON "shift_templates"("company_id");

-- CreateIndex
CREATE INDEX "shift_templates_company_id_active_idx" ON "shift_templates"("company_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "shift_templates_company_id_name_key" ON "shift_templates"("company_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "shift_templates_company_id_short_code_key" ON "shift_templates"("company_id", "short_code");

-- CreateIndex
CREATE INDEX "schedule_assignments_shift_template_id_idx" ON "schedule_assignments"("shift_template_id");

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_templates" ADD CONSTRAINT "shift_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_shift_template_id_fkey" FOREIGN KEY ("shift_template_id") REFERENCES "shift_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

