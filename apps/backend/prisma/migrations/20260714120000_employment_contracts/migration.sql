-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'ENDED', 'SUSPENDED', 'DRAFT');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('PERMANENT', 'FIXED_TERM', 'SEASONAL', 'TEMPORARY', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "WorkWeek" AS ENUM ('FIVE_DAY', 'SIX_DAY', 'CUSTOM');

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_department_id_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_position_id_fkey";

-- DropIndex
DROP INDEX "employees_department_id_idx";

-- DropIndex
DROP INDEX "employees_position_id_idx";

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "contracted_weekly_hours",
DROP COLUMN "department_id",
DROP COLUMN "employment_status",
DROP COLUMN "employment_type",
DROP COLUMN "hire_date",
DROP COLUMN "position_id",
DROP COLUMN "termination_date";

-- DropEnum
DROP TYPE "EmploymentStatus";

-- DropEnum
DROP TYPE "EmploymentType";

-- CreateTable
CREATE TABLE "employment_contracts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "department_id" TEXT,
    "position_id" TEXT,
    "contract_number" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "contract_type" "ContractType" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "probation_end_date" DATE,
    "weekly_hours" DECIMAL(5,2) NOT NULL DEFAULT 40,
    "daily_hours" DECIMAL(4,2) NOT NULL DEFAULT 8,
    "fte" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "work_week" "WorkWeek" NOT NULL DEFAULT 'FIVE_DAY',
    "vacation_days_per_year" INTEGER NOT NULL DEFAULT 20,
    "summarized_working_time" BOOLEAN NOT NULL DEFAULT false,
    "can_work_weekends" BOOLEAN NOT NULL DEFAULT true,
    "can_work_holidays" BOOLEAN NOT NULL DEFAULT false,
    "can_work_nights" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employment_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employment_contracts_company_id_idx" ON "employment_contracts"("company_id");

-- CreateIndex
CREATE INDEX "employment_contracts_employee_id_idx" ON "employment_contracts"("employee_id");

-- CreateIndex
CREATE INDEX "employment_contracts_company_id_employee_id_status_idx" ON "employment_contracts"("company_id", "employee_id", "status");

-- CreateIndex
CREATE INDEX "employment_contracts_department_id_idx" ON "employment_contracts"("department_id");

-- CreateIndex
CREATE INDEX "employment_contracts_position_id_idx" ON "employment_contracts"("position_id");

-- CreateIndex
CREATE UNIQUE INDEX "employment_contracts_company_id_contract_number_key" ON "employment_contracts"("company_id", "contract_number");

-- AddForeignKey
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

