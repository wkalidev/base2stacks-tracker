export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function ariaLabel(label: string): { 'aria-label': string } {
  return { 'aria-label': label }
}
