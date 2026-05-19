import { apiRequest } from '@/core/services/api'

const COMPANY_BASE = '/ms-empresa/v1/empresas'

export function getCompanyById(id) {
  return apiRequest(`${COMPANY_BASE}/${id}`)
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
