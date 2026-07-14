import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/config/prisma";

type Client = PrismaClient | Prisma.TransactionClient;

/**
 * Includes the parent Schedule so the service can authorize (companyId) and
 * enforce the "no edits once published" rule from a single fetch, without a
 * companyId column on ScheduleAssignment itself.
 */
const assignmentWithSchedule = Prisma.validator<Prisma.ScheduleAssignmentDefaultArgs>()({
  include: {
    schedule: true,
    employee: { select: { firstName: true, lastName: true } },
    updater: { select: { firstName: true, lastName: true } },
  },
});
export type AssignmentWithSchedule = Prisma.ScheduleAssignmentGetPayload<typeof assignmentWithSchedule>;

export class ScheduleAssignmentRepository {
  async create(
    data: Prisma.ScheduleAssignmentUncheckedCreateInput,
    client: Client = prisma,
  ): Promise<AssignmentWithSchedule> {
    return client.scheduleAssignment.create({ data, include: assignmentWithSchedule.include });
  }

  async findById(id: string, client: Client = prisma): Promise<AssignmentWithSchedule | null> {
    return client.scheduleAssignment.findUnique({ where: { id }, include: assignmentWithSchedule.include });
  }

  async findByScheduleEmployeeDate(
    scheduleId: string,
    employeeId: string,
    date: Date,
    client: Client = prisma,
  ) {
    return client.scheduleAssignment.findUnique({
      where: { scheduleId_employeeId_date: { scheduleId, employeeId, date } },
    });
  }

  async update(
    id: string,
    data: Prisma.ScheduleAssignmentUpdateInput,
    client: Client = prisma,
  ): Promise<AssignmentWithSchedule> {
    return client.scheduleAssignment.update({ where: { id }, data, include: assignmentWithSchedule.include });
  }

  async delete(id: string, client: Client = prisma): Promise<void> {
    await client.scheduleAssignment.delete({ where: { id } });
  }

  /**
   * Bulk-inserts copied assignments, silently skipping any that would
   * collide with an existing (scheduleId, employeeId, date) row — this is
   * what makes "copy previous month" non-destructive of manual edits
   * already made in the draft.
   */
  async createMany(data: Prisma.ScheduleAssignmentCreateManyInput[], client: Client = prisma): Promise<number> {
    if (data.length === 0) return 0;
    const result = await client.scheduleAssignment.createMany({ data, skipDuplicates: true });
    return result.count;
  }
}

export const scheduleAssignmentRepository = new ScheduleAssignmentRepository();
