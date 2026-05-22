const PERMISSIONS_KEY = 'unicos_permissions'

export function setCurrentPermissions(permissions = []) {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify([...new Set(permissions)]))
}

export function getCurrentPermissions() {
  try {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || '[]')
  } catch {
    return []
  }
}

export function hasPermission(permission) {
  if (!permission) return true
  return getCurrentPermissions().includes(permission)
}

export function hasAnyPermission(permissions = []) {
  if (!permissions.length) return true
  return permissions.some((permission) => hasPermission(permission))
}

export function clearPermissions() {
  localStorage.removeItem(PERMISSIONS_KEY)
}
