import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { PaginationQuery } from "@/shared/types/pagination.types";
import { toPrismaSkipTake } from "@/shared/utils/pagination.util";

type Client = PrismaClient | Prisma.TransactionClient;

const scheduleListInclude = Prisma.validator<Prisma.ScheduleDefaultArgs>()({
  include: { _count: { select: { assignments: true } } },
});
export type ScheduleListItem = Prisma.ScheduleGetPayload<typeof scheduleListInclude>;

const scheduleDetailInclude = Prisma.validator<Prisma.ScheduleDefaultArgs>()({
  include: {
    assignments: {
      include: { employee: { select: { firstName: true, lastName: true } } },
      orderBy: [{ date: "asc" }],
    },
  },
});
export type ScheduleWithAssignments = Prisma.ScheduleGetPayload<typeof scheduleDetailInclude>;

export interface ListSchedulesFilter {
  companyId: string;
  year?: number;
  month?: number;
  status?: Prisma.ScheduleWhereInput["status"];
}

export class ScheduleRepository {
  async create(
    data: Prisma.ScheduleUncheckedCreateInput,
    client: Client = prisma,
  ): Promise<ScheduleWithAssignments> {
    return client.schedule.create({ data, include: scheduleDetailInclude.include });
  }

  async findByIdInCompany(
    id: string,
    companyId: string,
    client: Client = prisma,
  ): Promise<ScheduleWithAssignments | null> {
    return client.schedule.findFirst({ where: { id, companyId }, include: scheduleDetailInclude.include });
  }

  /** Looks up the single schedule for a given company + calendar month (unique by design). */
  async findByYearMonthInCompany(
    year: number,
    month: number,
    companyId: string,
    client: Client = prisma,
  ): Promise<ScheduleWithAssignments | null> {
    return client.schedule.findFirst({ where: { year, month, companyId }, include: scheduleDetailInclude.include });
  }

  async update(
    id: string,
    data: Prisma.ScheduleUpdateInput,
    client: Client = prisma,
  ): Promise<ScheduleWithAssignments> {
    return client.schedule.update({ where: { id }, data, include: scheduleDetailInclude.include });
  }

  async findMany(
    filter: ListSchedulesFilter,
    pagination: PaginationQuery,
    client: Client = prisma,
  ): Promise<{ items: ScheduleListItem[]; total: number }> {
    const { skip, take } = toPrismaSkipTake(pagination);
    const where: Prisma.ScheduleWhereInput = {
      companyId: filter.companyId,
      ...(filter.year ? { year: filter.year } : {}),
      ...(filter.month ? { month: filter.month } : {}),
      ...(filter.status ? { status: filter.status } : {}),
    };

    const [items, total] = await Promise.all([
      client.schedule.findMany({
        where,
        include: scheduleListInclude.include,
        skip,
        take,
        orderBy: [{ year: "desc" }, { month: "desc" }],
      }),
      client.schedule.count({ where }),
    ]);
    return { items, total };
  }
}

export const scheduleRepository = new ScheduleRepository();
