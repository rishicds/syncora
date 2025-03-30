export function hasPermission(roles: any[], permission: string): boolean {
  if (!roles || roles.length === 0) return false

  return roles.some((role) => role.permissions && role.permissions[permission] === true)
}
