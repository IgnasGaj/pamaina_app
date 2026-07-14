-- AlterEnum
-- Recreates EmploymentType with 4 fractions instead of 2. Existing
-- 'PART_TIME' rows map to 'PART_TIME_50' (previously implied a 50% ratio in
-- the frontend's now-removed STANDARD_WEEKLY_HOURS placeholder), preserving
-- their meaning rather than silently promoting them to full-time.
BEGIN;
CREATE TYPE "EmploymentType_new" AS ENUM ('FULL_TIME', 'PART_TIME_75', 'PART_TIME_50', 'PART_TIME_25');
ALTER TABLE "employees" ALTER COLUMN "employment_type" DROP DEFAULT;
ALTER TABLE "employees" ALTER COLUMN "employment_type" TYPE "EmploymentType_new" USING (
  CASE "employment_type"::text
    WHEN 'PART_TIME' THEN 'PART_TIME_50'
    ELSE "employment_type"::text
  END
)::"EmploymentType_new";
ALTER TYPE "EmploymentType" RENAME TO "EmploymentType_old";
ALTER TYPE "EmploymentType_new" RENAME TO "EmploymentType";
DROP TYPE "EmploymentType_old";
ALTER TABLE "employees" ALTER COLUMN "employment_type" SET DEFAULT 'FULL_TIME';
COMMIT;

-- CreateTable
CREATE TABLE "company_non_working_days" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_non_working_days_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_non_working_days_company_id_idx" ON "company_non_working_days"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_non_working_days_company_id_date_key" ON "company_non_working_days"("company_id", "date");

-- AddForeignKey
ALTER TABLE "company_non_working_days" ADD CONSTRAINT "company_non_working_days_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
