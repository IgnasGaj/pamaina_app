import { Request, Response } from "express";
import * as departmentService from "@/modules/departments/department.service";
import { CreateDepartmentDto, ListDepartmentsQuery, UpdateDepartmentDto } from "@/modules/departments/department.dto";
import { sendSuccess } from "@/shared/utils/api-response.util";

export async function create(req: Request, res: Response): Promise<void> {
  const department = await departmentService.createDepartment(req.user!.companyId!, req.body as CreateDepartmentDto);
  sendSuccess(res, department, 201);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const department = await departmentService.getDepartmentByIdOrThrow(req.user!.companyId!, id);
  sendSuccess(res, department);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const department = await departmentService.updateDepartment(
    req.user!.companyId!,
    id,
    req.body as UpdateDepartmentDto,
  );
  sendSuccess(res, department);
}

export async function list(req: Request, res: Response): Promise<void> {
  const result = await departmentService.listDepartments(
    req.user!.companyId!,
    req.query as unknown as ListDepartmentsQuery,
  );
  sendSuccess(res, result.items, 200, { pagination: result.meta });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  await departmentService.deleteDepartment(req.user!.companyId!, id);
  sendSuccess(res, { id });
}
