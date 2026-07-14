-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME');

-- DropForeignKey
ALTER TABLE "employment_contracts" DROP CONSTRAINT "employment_contracts_company_id_fkey";

-- DropForeignKey
ALTER TABLE "employment_contracts" DROP CONSTRAINT "employment_contracts_department_id_fkey";

-- DropForeignKey
ALTER TABLE "employment_contracts" DROP CONSTRAINT "employment_contracts_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "employment_contracts" DROP CONSTRAINT "employment_contracts_position_id_fkey";

-- DropForeignKey
ALTER TABLE "schedule_assignments" DROP CONSTRAINT "schedule_assignments_contract_id_fkey";

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "birth_date",
DROP COLUMN "personal_code",
ADD COLUMN     "department_id" TEXT,
ADD COLUMN     "employment_type" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
ADD COLUMN     "end_date" DATE,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "position_id" TEXT,
ADD COLUMN     "start_date" DATE;

-- Backfill: pre-existing employee rows have no employment start date on
-- record (it didn't exist before this migration) — their creation date is
-- the closest available fact, so it becomes the initial start date. Managers
-- can correct it afterwards via the employee edit dialog.
UPDATE "employees" SET "start_date" = "created_at"::date WHERE "start_date" IS NULL;

ALTER TABLE "employees" ALTER COLUMN "start_date" SET NOT NULL;

-- AlterTable
ALTER TABLE "schedule_assignments" DROP COLUMN "contract_id",
ADD COLUMN     "absence_type_id" TEXT,
ALTER COLUMN "shift_template_id" DROP NOT NULL;

-- DropTable
DROP TABLE "employment_contracts";

-- DropEnum
DROP TYPE "ContractStatus";

-- DropEnum
DROP TYPE "ContractType";

-- DropEnum
DROP TYPE "WorkWeek";

-- CreateTable
CREATE TABLE "absence_types" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#F59E0B',
    "paid" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "absence_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "absence_types_company_id_idx" ON "absence_types"("company_id");

-- CreateIndex
CREATE INDEX "absence_types_company_id_active_idx" ON "absence_types"("company_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "absence_types_company_id_name_key" ON "absence_types"("company_id", "name");

-- CreateIndex
CREATE INDEX "employees_department_id_idx" ON "employees"("department_id");

-- CreateIndex
CREATE INDEX "employees_position_id_idx" ON "employees"("position_id");

-- CreateIndex
CREATE INDEX "schedule_assignments_absence_type_id_idx" ON "schedule_assignments"("absence_type_id");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence_types" ADD CONSTRAINT "absence_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_absence_type_id_fkey" FOREIGN KEY ("absence_type_id") REFERENCES "absence_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Exactly one of shift_template_id/absence_type_id must be set — never both,
-- never neither. Existing rows already satisfy this (shift_template_id was
-- NOT NULL, absence_type_id defaults to NULL).
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_shift_or_absence_check"
  CHECK (("shift_template_id" IS NOT NULL) != ("absence_type_id" IS NOT NULL));
