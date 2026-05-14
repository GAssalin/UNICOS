import { apiRequest } from '@/core/services/api'

const PRODUCT_BASE = '/ms-produto/v1/produtos'

function toQueryString(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value)
    }
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

function normalizePage(page) {
  if (Array.isArray(page)) {
    return { content: page, totalElements: page.length, totalPages: 1, number: 0, size: page.length }
  }

  return {
    content: page?.content || [],
    totalElements: page?.totalElements || 0,
    totalPages: page?.totalPages || 0,
    number: page?.number || 0,
    size: page?.size || 0
  }
}

export async function listProducts({ page = 0, size = 20, sort = 'nome,asc', nome = '' } = {}) {
  const endpoint = nome?.trim()
    ? `${PRODUCT_BASE}/pesquisa${toQueryString({ nome: nome.trim(), page, size, sort })}`
    : `${PRODUCT_BASE}${toQueryString({ page, size, sort })}`

  return normalizePage(await apiRequest(endpoint))
}

export function getProductById(id) {
  return apiRequest(`${PRODUCT_BASE}/${id}`)
}

export function createProduct(payload) {
  return apiRequest(PRODUCT_BASE, {
    method: 'POST',
    body: payload
  })
}

export function updateProduct(id, payload) {
  return apiRequest(`${PRODUCT_BASE}/${id}`, {
    method: 'PUT',
    body: payload
  })
}

export function deleteProduct(id) {
  return apiRequest(`${PRODUCT_BASE}/${id}`, {
    method: 'DELETE'
  })
}

export function activateProduct(id) {
  return apiRequest(`${PRODUCT_BASE}/${id}/ativar`, { method: 'PUT' })
}

export function inactivateProduct(id) {
  return apiRequest(`${PRODUCT_BASE}/${id}/inativar`, { method: 'PUT' })
}

export async function listUnits({ page = 0, size = 100, sort = 'codigo,asc' } = {}) {
  return normalizePage(await apiRequest(`${PRODUCT_BASE}/unidades-medida${toQueryString({ page, size, sort })}`))
}

export async function listCategories({ page = 0, size = 100, sort = 'nome,asc' } = {}) {
  return normalizePage(await apiRequest(`${PRODUCT_BASE}/categorias${toQueryString({ page, size, sort })}`))
}

export async function listBrands({ page = 0, size = 100, sort = 'nome,asc' } = {}) {
  return normalizePage(await apiRequest(`${PRODUCT_BASE}/marcas-produto${toQueryString({ page, size, sort })}`))
}
