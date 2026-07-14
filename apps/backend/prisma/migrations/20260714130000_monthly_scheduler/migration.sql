-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT', 'DAY', 'OFF', 'VACATION', 'SICK');

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_assignments" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shift_type" "ShiftType" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedules_company_id_idx" ON "schedules"("company_id");

-- CreateIndex
CREATE INDEX "schedules_company_id_status_idx" ON "schedules"("company_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_company_id_year_month_key" ON "schedules"("company_id", "year", "month");

-- CreateIndex
CREATE INDEX "schedule_assignments_schedule_id_idx" ON "schedule_assignments"("schedule_id");

-- CreateIndex
CREATE INDEX "schedule_assignments_employee_id_idx" ON "schedule_assignments"("employee_id");

-- CreateIndex
CREATE INDEX "schedule_assignments_schedule_id_date_idx" ON "schedule_assignments"("schedule_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_assignments_schedule_id_employee_id_date_key" ON "schedule_assignments"("schedule_id", "employee_id", "date");

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "employment_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

