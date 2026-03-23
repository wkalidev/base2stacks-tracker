export interface Page<T> {
  items:   T[]
  total:   number
  page:    number
  perPage: number
  hasMore: boolean
}

export function paginate<T>(items: T[], page: number, perPage: number): Page<T> {
  const start  = (page - 1) * perPage
  const sliced = items.slice(start, start + perPage)
  return {
    items:   sliced,
    total:   items.length,
    page,
    perPage,
    hasMore: start + perPage < items.length,
  }
}

export function calcTotalPages(total: number, perPage: number): number {
  return Math.ceil(total / perPage)
}
