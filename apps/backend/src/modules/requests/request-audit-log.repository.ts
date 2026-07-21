import { AuditAction, Prisma, PrismaClient, RequestAuditLog } from "@prisma/client";
import { prisma } from "@/config/prisma";

type Client = PrismaClient | Prisma.TransactionClient;

export interface CreateRequestAuditLogData {
  companyId: string;
  requestId: string;
  action: AuditAction;
  performedBy: string;
  details?: Prisma.InputJsonValue;
}

export class RequestAuditLogRepository {
  async create(data: CreateRequestAuditLogData, client: Client = prisma): Promise<RequestAuditLog> {
    return client.requestAuditLog.create({ data });
  }

  /** The most recent log of a given action for a request — e.g. the approval snapshot a later revocation needs to restore from. */
  async findLatestForRequest(
    requestId: string,
    action: AuditAction,
    client: Client = prisma,
  ): Promise<RequestAuditLog | null> {
    return client.requestAuditLog.findFirst({
      where: { requestId, action },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const requestAuditLogRepository = new RequestAuditLogRepository();
