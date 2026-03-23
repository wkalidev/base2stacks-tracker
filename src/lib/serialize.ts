export function toJSON(data: any): string {
  return JSON.stringify(data, null, 2)
}

export function fromJSON<T>(json: string): T | null {
  try { return JSON.parse(json) }
  catch { return null }
}

export function safeStringify(data: any): string {
  try { return JSON.stringify(data) }
  catch { return '' }
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return `${str.slice(0, maxLen)}...`
}
