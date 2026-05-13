import { authenticate } from '@/modules/auth/services/authService'
import { clearSession } from '@/core/services/api'

const AUTH_KEY = 'unicos_auth'
const TOKEN_KEY = 'unicos_access_token'
const USER_KEY = 'unicos_user'

export function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === 'true' && !!localStorage.getItem(TOKEN_KEY)
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export async function login(email, senha) {
  const normalizedEmail = email?.trim()
  const normalizedPassword = senha?.trim()

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error('Preencha e-mail e senha.')
  }

  const auth = await authenticate({ email: normalizedEmail, senha: normalizedPassword })

  console.log(auth);

  if (!auth.raw.tokenAccess) {
    throw new Error('Login realizado, mas o backend não retornou o token. Verifique o campo token/tokenAccess/accessToken no response.')
  }

  localStorage.setItem(AUTH_KEY, 'true')
  localStorage.setItem(TOKEN_KEY, auth.raw.tokenAccess)
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user || { email: normalizedEmail }))

  return auth
}

export function logout() {
  clearSession()
}
