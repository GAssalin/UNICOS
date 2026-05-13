import { apiRequest } from '@/core/services/api'

const LOGIN_PATH = import.meta.env.VITE_AUTH_LOGIN_PATH || '/ms-autenticacao/v1/autenticacao/login'

function findToken(response) {
  return response?.token
    || response?.tokenAccess
    || response?.accessToken
    || response?.access_token
    || response?.jwt
    || response?.data?.token
    || response?.data?.tokenAccess
    || response?.data?.accessToken
    || response?.dados?.token
    || response?.dados?.tokenAccess
    || response?.dados?.accessToken
}

function findUser(response, email) {
  return response?.user
    || response?.usuario
    || response?.data?.user
    || response?.data?.usuario
    || response?.dados?.user
    || response?.dados?.usuario
    || { email }
}

export async function authenticate({ email, senha }) {
  const response = await apiRequest(LOGIN_PATH, {
    method: 'POST',
    body: { email, senha }
  })

  return {
    token: findToken(response),
    user: findUser(response, email),
    raw: response
  }
}
