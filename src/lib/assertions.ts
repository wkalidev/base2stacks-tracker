export function assertDefined<T>(value: T | null | undefined, msg: string): T {
  if (value === null || value === undefined) throw new Error(msg)
  return value
}

export function assertPositive(value: number, msg: string): number {
  if (value <= 0) throw new Error(msg)
  return value
}

export function assertValidAddress(address: string): string {
  if (!/^S[PM][0-9A-Z]{38,39}$/.test(address)) {
    throw new Error(`Invalid Stacks address: ${address}`)
  }
  return address
}
