const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082'
const TOKEN_KEY = 'unicos_access_token'

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE_URL.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearSession() {
  localStorage.removeItem('unicos_auth')
  localStorage.removeItem('unicos_access_token')
  localStorage.removeItem('unicos_user')
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  if (response.status === 204) return null
  return contentType.includes('application/json') ? response.json() : response.text()
}

export async function apiRequest(path, options = {}) {
  const token = getAccessToken()
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body
  })

  const data = await parseResponse(response)

  if (response.status === 401) {
    const message =
      data?.detail ||
      data?.message ||
      data?.mensagem ||
      data?.error ||
      'Usuário ou senha inválidos'

    const isLoginRequest = path.includes('/autenticacao/login')

    if (!isLoginRequest) {
      clearSession()
      window.location.href = '/login'
      throw new Error('Sessão expirada. Faça login novamente.')
    }

    throw new Error(message)
  }

  if (!response.ok) {
    const message = data?.message || data?.mensagem || data?.error || `Erro HTTP ${response.status}`
    throw new Error(message)
  }

  return data
}
