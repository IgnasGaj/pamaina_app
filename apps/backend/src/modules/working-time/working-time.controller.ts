import { Request, Response } from "express";
import * as workingTimeService from "@/modules/working-time/working-time.service";
import { CreateNonWorkingDayDto, HolidaysQuery, MonthlyHoursQuery } from "@/modules/working-time/working-time.dto";
import { sendSuccess } from "@/shared/utils/api-response.util";

export async function getMonthlyHours(req: Request, res: Response): Promise<void> {
  const result = await workingTimeService.getMonthlyHours(req.user!.companyId!, req.query as unknown as MonthlyHoursQuery);
  sendSuccess(res, result);
}

export async function listHolidays(req: Request, res: Response): Promise<void> {
  const result = await workingTimeService.listHolidays(req.user!.companyId!, req.query as unknown as HolidaysQuery);
  sendSuccess(res, result);
}

export async function listNonWorkingDays(req: Request, res: Response): Promise<void> {
  const result = await workingTimeService.listCompanyNonWorkingDays(req.user!.companyId!);
  sendSuccess(res, result);
}

export async function createNonWorkingDay(req: Request, res: Response): Promise<void> {
  const result = await workingTimeService.createCompanyNonWorkingDay(
    req.user!.companyId!,
    req.body as CreateNonWorkingDayDto,
  );
  sendSuccess(res, result, 201);
}

export async function deleteNonWorkingDay(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  await workingTimeService.deleteCompanyNonWorkingDay(req.user!.companyId!, id);
  sendSuccess(res, null);
}
