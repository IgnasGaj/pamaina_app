import { Request, Response } from "express";
import * as scheduleService from "@/modules/schedules/schedule.service";
import * as employeeService from "@/modules/employees/employee.service";
import {
  CreateAssignmentDto,
  CreateScheduleDto,
  ListSchedulesQuery,
  UpdateAssignmentDto,
  UpdateScheduleDto,
} from "@/modules/schedules/schedule.dto";
import { sendSuccess } from "@/shared/utils/api-response.util";

/**
 * Plain EMPLOYEE-role accounts may only ever see PUBLISHED schedules, and
 * only their own assignments within them — never draft schedules, never
 * other employees' shifts. Mirrors the isSelfServiceOnly pattern already
 * used in employee.controller.ts.
 */
function isSelfServiceOnly(req: Request): boolean {
  return req.user!.roleKey === "EMPLOYEE";
}

export async function create(req: Request, res: Response): Promise<void> {
  const schedule = await scheduleService.createSchedule(
    req.user!.companyId!,
    req.user!.id,
    req.body as CreateScheduleDto,
  );
  sendSuccess(res, schedule, 201);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };

  if (isSelfServiceOnly(req)) {
    const own = await employeeService.getOwnEmployeeProfileOrThrow(req.user!.companyId!, req.user!.id);
    const schedule = await scheduleService.getScheduleByIdOrThrow(req.user!.companyId!, id, {
      restrictToPublished: true,
      restrictToEmployeeId: own.id,
    });
    sendSuccess(res, schedule);
    return;
  }

  const schedule = await scheduleService.getScheduleByIdOrThrow(req.user!.companyId!, id);
  sendSuccess(res, schedule);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const schedule = await scheduleService.updateSchedule(
    req.user!.companyId!,
    req.user!.id,
    id,
    req.body as UpdateScheduleDto,
  );
  sendSuccess(res, schedule);
}

export async function list(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListSchedulesQuery;
  const result = await scheduleService.listSchedules(req.user!.companyId!, query, {
    restrictToPublished: isSelfServiceOnly(req),
  });
  sendSuccess(res, result.items, 200, { pagination: result.meta });
}

export async function publish(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const schedule = await scheduleService.publishSchedule(req.user!.companyId!, req.user!.id, id);
  sendSuccess(res, schedule);
}

export async function copyPrevious(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const schedule = await scheduleService.copyPreviousMonth(req.user!.companyId!, req.user!.id, id);
  sendSuccess(res, schedule);
}

export async function createAssignment(req: Request, res: Response): Promise<void> {
  const assignment = await scheduleService.createAssignment(
    req.user!.companyId!,
    req.user!.id,
    req.body as CreateAssignmentDto,
  );
  sendSuccess(res, assignment, 201);
}

export async function updateAssignment(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const assignment = await scheduleService.updateAssignment(
    req.user!.companyId!,
    req.user!.id,
    id,
    req.body as UpdateAssignmentDto,
  );
  sendSuccess(res, assignment);
}

export async function deleteAssignment(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  await scheduleService.deleteAssignment(req.user!.companyId!, req.user!.id, id);
  sendSuccess(res, null);
}
