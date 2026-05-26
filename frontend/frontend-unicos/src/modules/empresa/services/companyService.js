import { apiRequest } from '@/core/services/api'

const COMPANY_BASE = '/ms-empresa/api/empresas'

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

export async function listCompanies({ page = 0, size = 20, sort = 'razaoSocial,asc' } = {}) {
  return normalizePage(await apiRequest(`${COMPANY_BASE}${toQueryString({ page, size, sort })}`))
}

export function getCompanyById(id) {
  return apiRequest(`${COMPANY_BASE}/${id}`)
}

export function getCompanyByCnpj(cnpj) {
  const cleanCnpj = String(cnpj || '').replace(/\D/g, '')
  return apiRequest(`${COMPANY_BASE}/cnpj/${cleanCnpj}`)
}

export function createCompany(payload) {
  return apiRequest(COMPANY_BASE, {
    method: 'POST',
    body: payload
  })
}

export function updateCompany(id, payload) {
  return apiRequest(`${COMPANY_BASE}/${id}`, {
    method: 'PUT',
    body: payload
  })
}

export function deleteCompany(id) {
  return apiRequest(`${COMPANY_BASE}/${id}`, {
    method: 'DELETE'
  })
}

export function resolveCompanyId(user = {}) {
  return user.empresaId
    || user.companyId
    || user.empresa?.id
    || user.empresa?.empresaId
    || user.data?.empresaId
    || user.dados?.empresaId
}

export function resolveCompanyName(user = {}) {
  return user.empresaNome
    || user.nomeEmpresa
    || user.companyName
    || user.empresa?.nomeFantasia
    || user.empresa?.razaoSocial
    || user.empresa?.nome
}
