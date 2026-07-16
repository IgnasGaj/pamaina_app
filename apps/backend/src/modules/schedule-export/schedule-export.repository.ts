import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/config/prisma";

type Client = PrismaClient | Prisma.TransactionClient;

/**
 * Dedicated to the export feature — deliberately separate from
 * schedule.repository.ts (which only needs employee first/last name for the
 * grid). Export needs the full shift/absence detail (times, break, code,
 * name) to fill the workbook, so it pulls its own include shape rather than
 * widening the existing Scheduler query for everyone.
 */
const scheduleExportInclude = Prisma.validator<Prisma.ScheduleDefaultArgs>()({
  include: {
    assignments: {
      include: {
        employee: {
          include: {
            department: { select: { id: true, name: true } },
            position: { select: { id: true, title: true } },
          },
        },
        shiftTemplate: true,
        absenceType: true,
      },
      orderBy: [{ date: "asc" }],
    },
  },
});
export type ScheduleForExport = Prisma.ScheduleGetPayload<typeof scheduleExportInclude>;

export class ScheduleExportRepository {
  async findByYearMonthInCompany(
    year: number,
    month: number,
    companyId: string,
    client: Client = prisma,
  ): Promise<ScheduleForExport | null> {
    return client.schedule.findFirst({
      where: { year, month, companyId },
      include: scheduleExportInclude.include,
    });
  }
}

export const scheduleExportRepository = new ScheduleExportRepository();
