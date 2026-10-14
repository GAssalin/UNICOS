const TOKEN_KEY = 'token'
const CURRENT_USER_KEY = 'unicos_current_user'

export function isAuthenticated() {
  return !!localStorage.getItem(TOKEN_KEY)
}

export function getCurrentUser() {
  return localStorage.getItem(CURRENT_USER_KEY) || 'Usuário não identificado'
}

export function login(user) {
  if (!user?.trim()) {
    throw new Error('Usuário não identificado.')
  }

  localStorage.setItem(CURRENT_USER_KEY, user.trim())
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(CURRENT_USER_KEY)
}
