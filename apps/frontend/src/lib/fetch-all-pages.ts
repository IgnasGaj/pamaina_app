import type { PaginatedResult } from '@/types/api.types'

/**
 * List endpoints cap pageSize at 100 (shared backend pagination contract).
 * The scheduler needs the full roster in one go (up to ~300 employees), so
 * this fetches page 1 to learn the total page count, then fetches the rest
 * in parallel and concatenates — without changing the shared pagination
 * contract used by every other list endpoint in the app.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<PaginatedResult<T>>,
): Promise<T[]> {
  const first = await fetchPage(1)
  if (first.meta.totalPages <= 1) {
    return first.items
  }
  const remainingPages = Array.from({ length: first.meta.totalPages - 1 }, (_, i) => i + 2)
  const rest = await Promise.all(remainingPages.map((page) => fetchPage(page)))
  return [first.items, ...rest.map((page) => page.items)].flat()
}
