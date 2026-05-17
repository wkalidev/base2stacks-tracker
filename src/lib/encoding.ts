/**
 * Clarity value encoding helpers
 * Simplifies building function arguments for contract calls
 */

export interface ClarityArg {
  type: 'uint' | 'int' | 'bool' | 'principal' | 'string-ascii' | 'string-utf8' | 'buffer' | 'none' | 'some'
  value?: string | number | bigint | boolean | ClarityArg
}

export function uint(value: bigint | number): ClarityArg {
  return { type: 'uint', value: BigInt(value).toString() }
}

export function principal(address: string): ClarityArg {
  return { type: 'principal', value: address }
}

export function stringAscii(value: string): ClarityArg {
  return { type: 'string-ascii', value }
}

export function bool(value: boolean): ClarityArg {
  return { type: 'bool', value }
}

export function none(): ClarityArg {
  return { type: 'none' }
}

export function some(inner: ClarityArg): ClarityArg {
  return { type: 'some', value: inner }
}

export function encodeArgs(args: ClarityArg[]): string {
  return JSON.stringify(args)
}

export function buildContractCall(
  contractId: string,
  functionName: string,
  args: ClarityArg[]
): { contractAddress: string; contractName: string; functionName: string; args: ClarityArg[] } {
  const [contractAddress, contractName] = contractId.split('.')
  return { contractAddress, contractName, functionName, args }
}
