import { apiRequest } from '@/core/services/api'
import { getProductById } from '@/modules/produtos/services/productService'

const STOCK_BALANCE_BASE = '/ms-estoque/v1/estoques-produtos'
const STOCK_BASE = '/ms-estoque/v1/estoques'

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

async function safeGetProduct(produtoId) {
  if (!produtoId) return null

  try {
    return await getProductById(produtoId)
  } catch {
    return null
  }
}

async function safeGetStock(estoqueId) {
  if (!estoqueId) return null

  try {
    return await apiRequest(`${STOCK_BASE}/${estoqueId}`)
  } catch {
    return null
  }
}

export async function listStockBalances({ page = 0, size = 20, sort = 'id,asc', estoqueId = '', produtoId = '' } = {}) {
  const endpoint = estoqueId || produtoId
    ? `${STOCK_BALANCE_BASE}/pesquisa${toQueryString({ estoqueId, produtoId, page, size, sort })}`
    : `${STOCK_BALANCE_BASE}${toQueryString({ page, size, sort })}`

  const pageResponse = normalizePage(await apiRequest(endpoint))

  const content = await Promise.all(pageResponse.content.map(async (item) => {
    const [produto, estoque] = await Promise.all([
      safeGetProduct(item.produtoId),
      safeGetStock(item.estoqueId)
    ])

    const quantidadeAtual = Number(item.quantidadeAtual || 0)
    const quantidadeReservada = Number(item.quantidadeReservada || 0)
    const quantidadeDisponivel = Number(item.quantidadeDisponivel ?? quantidadeAtual - quantidadeReservada)
    const precoBase = Number(produto?.precoBase || 0)

    return {
      ...item,
      produto,
      estoque,
      codigoProduto: produto?.codigo || item.produtoId,
      nomeProduto: produto?.nome || `Produto ${item.produtoId}`,
      nomeEstoque: estoque?.nome || `Estoque ${item.estoqueId}`,
      unidade: produto?.unidadeMedida?.codigo || produto?.unidadeMedidaCodigo || produto?.unidade || 'UN',
      categoria: produto?.categoria?.nome || produto?.categoriaNome || '-',
      quantidadeAtual,
      quantidadeReservada,
      quantidadeDisponivel,
      valorEstoque: quantidadeAtual * precoBase,
      estoqueBaixo: quantidadeDisponivel <= 0
    }
  }))

  return { ...pageResponse, content }
}

export async function listStocks({ page = 0, size = 100, sort = 'nome,asc' } = {}) {
  return normalizePage(await apiRequest(`${STOCK_BASE}${toQueryString({ page, size, sort })}`))
}

export function adjustStockBalance({ estoqueId, produtoId, quantidadeAtual, quantidadeReservada = 0 }) {
  return apiRequest(`${STOCK_BALANCE_BASE}/estoque/${estoqueId}/produto/${produtoId}/ajuste${toQueryString({
    quantidadeAtual,
    quantidadeReservada
  })}`, {
    method: 'PATCH'
  })
}
