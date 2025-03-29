import type { RolePermissions } from "@/types/role.types"

export function hasPermission(permissions: RolePermissions, permission: keyof RolePermissions): boolean {
  return permissions[permission] === true
}

export function combinePermissions(rolePermissions: RolePermissions[]): RolePermissions {
  if (rolePermissions.length === 0) {
    return {} as RolePermissions
  }

  // Start with the first role's permissions
  const result = { ...rolePermissions[0] }

  // Combine with other roles (OR operation)
  for (let i = 1; i < rolePermissions.length; i++) {
    const permissions = rolePermissions[i]
    for (const key in permissions) {
      if (Object.prototype.hasOwnProperty.call(permissions, key)) {
        const typedKey = key as keyof RolePermissions
        result[typedKey] = result[typedKey] || permissions[typedKey]
      }
    }
  }

  return result
}

