import { PrismaClient } from "@prisma/client";
import { ALL_PERMISSIONS } from "@/shared/constants/permissions";
import { ensureGlobalSuperAdminRole } from "@/modules/roles/role.service";
import { ensureDefaultAbsenceTypesForAllCompanies } from "@/modules/absence-types/absence-type.service";
import { hashPassword } from "@/shared/utils/password.util";

const prisma = new PrismaClient();

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  "company.manage": "Create, update and deactivate companies on the platform",
  "user.create": "Create user accounts",
  "user.read": "View user accounts",
  "user.update": "Update user accounts",
  "user.delete": "Deactivate or remove user accounts",
  "role.read": "View roles and their permissions",
  "role.manage": "Create and update custom roles",
  "department.create": "Create departments",
  "department.read": "View departments",
  "department.update": "Update departments",
  "department.delete": "Remove departments",
  "position.create": "Create positions",
  "position.read": "View positions",
  "position.update": "Update positions",
  "position.delete": "Remove positions",
  "employee.create": "Create employee records",
  "employee.read": "View employee records",
  "employee.update": "Update employee records",
  "employee.delete": "Remove employee records",
  "schedule.create": "Create monthly schedules",
  "schedule.read": "View monthly schedules",
  "schedule.update": "Edit, publish and copy monthly schedules",
  "shift_template.create": "Create shift templates",
  "shift_template.read": "View shift templates",
  "shift_template.update": "Update shift templates",
  "shift_template.delete": "Archive or restore shift templates",
  "absence_type.read": "View absence types",
  "absence_type.update": "Update absence types (color, description, active)",
  "working_time.read": "View required-hours calculations and holidays",
  "working_time.manage": "Manage company-specific non-working days",
  "request.create": "Submit absence/leave requests",
  "request.read": "View absence/leave requests",
  "request.manage": "Approve or reject absence/leave requests",
};

async function seedPermissions(): Promise<void> {
  for (const key of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: { description: PERMISSION_DESCRIPTIONS[key] ?? key },
      create: { key, description: PERMISSION_DESCRIPTIONS[key] ?? key },
    });
  }
  // eslint-disable-next-line no-console
  console.log(`Seeded ${ALL_PERMISSIONS.length} permissions.`);
}

async function seedSuperAdmin(): Promise<void> {
  const role = await ensureGlobalSuperAdminRole(prisma);

  const email = process.env.SUPER_ADMIN_EMAIL ?? "admin@pamaina.lt";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`Super admin ${email} already exists, skipping.`);
    return;
  }

  const password = process.env.SUPER_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: "Platform",
      lastName: "Admin",
      companyId: null,
      roleId: role.id,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Created super admin ${email}. Change the password immediately in production.`);
}

async function seedDefaultAbsenceTypes(): Promise<void> {
  await ensureDefaultAbsenceTypesForAllCompanies(prisma);
  // eslint-disable-next-line no-console
  console.log("Ensured the four standard absence types (P/A/M/L) for every company.");
}

async function main(): Promise<void> {
  await seedPermissions();
  await seedSuperAdmin();
  await seedDefaultAbsenceTypes();
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
