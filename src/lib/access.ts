/**
 * Access control helpers — mirrors toolkit-access.clar
 */

export type Role = 'admin' | 'minter' | 'pauser' | 'operator'

export interface RoleRegistry {
  roles: Map<string, Set<Role>>
}

export function createRegistry(): RoleRegistry {
  return { roles: new Map() }
}

export function addRole(registry: RoleRegistry, address: string, role: Role): void {
  if (!registry.roles.has(address)) registry.roles.set(address, new Set())
  registry.roles.get(address)!.add(role)
}

export function removeRole(registry: RoleRegistry, address: string, role: Role): void {
  registry.roles.get(address)?.delete(role)
}

export function hasRole(registry: RoleRegistry, address: string, role: Role): boolean {
  return registry.roles.get(address)?.has(role) ?? false
}

export function isAdmin(registry: RoleRegistry, address: string): boolean {
  return hasRole(registry, address, 'admin')
}

export function requireRole(registry: RoleRegistry, address: string, role: Role): void {
  if (!hasRole(registry, address, role))
    throw new Error(`Address ${address} does not have role: ${role}`)
}
