import { z } from "zod";
import { PaginatedResult, PaginationMeta, PaginationQuery } from "@/shared/types/pagination.types";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export function toPrismaSkipTake(query: PaginationQuery): { skip: number; take: number } {
  return {
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  };
}

export function buildPaginationMeta(query: PaginationQuery, totalItems: number): PaginationMeta {
  return {
    page: query.page,
    pageSize: query.pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / query.pageSize)),
  };
}

export function buildPaginatedResult<T>(
  items: T[],
  query: PaginationQuery,
  totalItems: number,
): PaginatedResult<T> {
  return { items, meta: buildPaginationMeta(query, totalItems) };
}
