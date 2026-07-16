-- Simplify absence types to a fixed, per-company set of four standard
-- Lithuanian codes (P/A/M/L). Existing rows are never deleted (the FK from
-- schedule_assignments/employee_requests is ON DELETE RESTRICT, and deleting
-- them would break any historical schedule/request that references one) —
-- instead they are demoted (is_default = false, active = false) so they
-- silently drop out of every list while still resolving correctly wherever
-- they're referenced by id.

-- AlterTable
ALTER TABLE "absence_types" ADD COLUMN "code" TEXT;
ALTER TABLE "absence_types" ADD COLUMN "description" TEXT;
ALTER TABLE "absence_types" ADD COLUMN "is_default" BOOLEAN NOT NULL DEFAULT true;

-- Backfill: legacy rows predate the fixed 4-code model, so there's no
-- meaningful code to assign — give each a unique placeholder and demote it.
UPDATE "absence_types"
SET "code" = upper(substr(md5(random()::text || "id"), 1, 8)),
    "is_default" = false,
    "active" = false
WHERE "code" IS NULL;

ALTER TABLE "absence_types" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "absence_types" DROP COLUMN "paid";

-- Replace the old name-based uniqueness with code-based uniqueness (the new
-- source of truth for identity now that name is also immutable).
DROP INDEX "absence_types_company_id_name_key";
CREATE UNIQUE INDEX "absence_types_company_id_code_key" ON "absence_types"("company_id", "code");
