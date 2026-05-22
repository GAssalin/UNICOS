import { apiRequest } from '@/core/services/api'

const PERMISSIONS_PATH = import.meta.env.VITE_PERMISSOES_USUARIO_PATH || '/ms-permissao/v1/permissoes/minhas'

function normalizePermissions(response) {
  const permissions = response?.permissoes
    || response?.permissions
    || response?.data?.permissoes
    || response?.dados?.permissoes
    || response

  if (!Array.isArray(permissions)) return []

  return permissions
    .map((permission) => {
      if (typeof permission === 'string') return permission
      return permission?.nome || permission?.name || permission?.authority || permission?.permissao
    })
    .filter(Boolean)
}

export async function fetchUserPermissions() {
  const response = await apiRequest(PERMISSIONS_PATH, { method: 'GET' })
  return normalizePermissions(response)
}
