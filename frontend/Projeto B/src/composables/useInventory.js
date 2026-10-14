import { computed, ref, watch } from 'vue'
import { getCurrentUser } from './useAuth'

const PRODUCTS_KEY = 'unicos_products_v1'
const MOVEMENTS_KEY = 'unicos_movements_v1'

const defaultProducts = [
  {
    id: 'prd-001',
    codigo: 'PRD-001',
    codigoBarras: '7890000000011',
    notaFiscal: 'NF-000101',
    nome: 'Parafuso Sextavado 1/4”',
    categoria: 'Ferragens',
    unidade: 'UN',
    fornecedor: 'Fornecedor Padrão',
    estoqueMinimo: 20,
    precoCusto: 0.35,
    precoVenda: 0.75
  },
  {
    id: 'prd-002',
    codigo: 'PRD-002',
    codigoBarras: '7890000000028',
    notaFiscal: 'NF-000102',
    nome: 'Arruela Lisa 1/4”',
    categoria: 'Ferragens',
    unidade: 'UN',
    fornecedor: 'Fornecedor Padrão',
    estoqueMinimo: 30,
    precoCusto: 0.1,
    precoVenda: 0.25
  },
  {
    id: 'prd-003',
    codigo: 'PRD-003',
    codigoBarras: '7890000000035',
    notaFiscal: 'NF-000103',
    nome: 'Bucha 8mm',
    categoria: 'Fixação',
    unidade: 'UN',
    fornecedor: 'Casa dos Insumos',
    estoqueMinimo: 40,
    precoCusto: 0.22,
    precoVenda: 0.5
  }
]

const defaultMovements = [
  { id: 'mov-001', produtoId: 'prd-001', tipo: 'entrada', quantidade: 50, data: '2026-04-20', horario: '08:10:00', usuario: 'Sistema', notaFiscal: 'NF-000101', fornecedor: 'Fornecedor Padrão', destino: '', observacao: 'Estoque inicial' },
  { id: 'mov-002', produtoId: 'prd-002', tipo: 'entrada', quantidade: 35, data: '2026-04-20', horario: '08:15:00', usuario: 'Sistema', notaFiscal: 'NF-000102', fornecedor: 'Fornecedor Padrão', destino: '', observacao: 'Estoque inicial' },
  { id: 'mov-003', produtoId: 'prd-003', tipo: 'entrada', quantidade: 60, data: '2026-04-21', horario: '09:20:00', usuario: 'Sistema', notaFiscal: 'NF-000103', fornecedor: 'Casa dos Insumos', destino: '', observacao: 'Compra' },
  { id: 'mov-004', produtoId: 'prd-001', tipo: 'saida', quantidade: 42, data: '2026-04-22', horario: '14:32:00', usuario: 'Sistema', notaFiscal: '', fornecedor: '', destino: 'Produção', observacao: 'Ordem de produção' },
  { id: 'mov-005', produtoId: 'prd-002', tipo: 'saida', quantidade: 8, data: '2026-04-23', horario: '16:05:00', usuario: 'Sistema', notaFiscal: '', fornecedor: '', destino: 'Manutenção', observacao: 'Uso interno' }
]

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function migrateMovement(movement) {
  return {
    ...movement,
    horario: movement.horario || '',
    usuario: movement.usuario || 'Sistema / registro anterior',
    notaFiscal: movement.notaFiscal || '',
    destino: movement.destino || movement.fornecedor || '',
    operacao: movement.operacao || (movement.tipo === 'saida' ? 'Saída de estoque' : 'Entrada de estoque'),
    categoriaMovimentacao: movement.categoriaMovimentacao || (movement.operacao === 'Ajuste de estoque' ? 'ajuste' : movement.tipo),
    unidadeMovimentacao: movement.unidadeMovimentacao || movement.unidade || '',
    createdAt: movement.createdAt || ''
  }
}

const products = ref(readStorage(PRODUCTS_KEY, defaultProducts))
const movements = ref(readStorage(MOVEMENTS_KEY, defaultMovements).map(migrateMovement))

watch(products, (value) => localStorage.setItem(PRODUCTS_KEY, JSON.stringify(value)), { deep: true })
watch(movements, (value) => localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(value)), { deep: true })

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeNumber(value) {
  return Number(String(value ?? 0).replace(',', '.')) || 0
}

function getStockStatus(saldo) {
  if (saldo < 10) {
    return {
      label: 'Estoque crítico',
      description: 'Quantidade abaixo do nível mínimo operacional.',
      className: 'critical'
    }
  }

  if (saldo < 20) {
    return {
      label: 'Estoque adequado',
      description: 'Quantidade dentro do nível operacional esperado.',
      className: 'adequate'
    }
  }

  if (saldo > 30) {
    return {
      label: 'Estoque excedente',
      description: 'Quantidade acima da necessidade operacional.',
      className: 'surplus'
    }
  }

  return {
    label: 'Estoque regular',
    description: 'Quantidade estável para operação.',
    className: 'regular'
  }
}

const productsWithStock = computed(() => products.value.map((product) => {
  const saldo = movements.value
    .filter((movement) => movement.produtoId === product.id)
    .reduce((total, movement) => total + (movement.tipo === 'entrada' ? normalizeNumber(movement.quantidade) : -normalizeNumber(movement.quantidade)), 0)

  const stockStatus = getStockStatus(saldo)

  return {
    ...product,
    saldo,
    valorEstoque: saldo * normalizeNumber(product.precoCusto),
    estoqueBaixo: saldo < 10,
    stockStatus
  }
}))

function addProduct(payload) {
  const product = {
    id: uid('prd'),
    codigo: payload.codigo?.trim(),
    codigoBarras: payload.codigoBarras?.trim(),
    notaFiscal: payload.notaFiscal?.trim() || '',
    nome: payload.nome?.trim(),
    categoria: payload.categoria?.trim(),
    unidade: payload.unidade?.trim() || 'UN',
    fornecedorId: payload.fornecedorId?.trim() || '',
    fornecedor: payload.fornecedor?.trim() || '',
    estoqueMinimo: normalizeNumber(payload.estoqueMinimo),
    precoCusto: normalizeNumber(payload.precoCusto),
    precoVenda: normalizeNumber(payload.precoVenda)
  }

  products.value.unshift(product)

  const estoqueInicial = normalizeNumber(payload.estoqueInicial)
  if (estoqueInicial > 0) {
    addMovement({
      produtoId: product.id,
      tipo: 'entrada',
      quantidade: estoqueInicial,
      data: new Date().toISOString().slice(0, 10),
      notaFiscal: product.notaFiscal,
      destino: 'Estoque',
      operacao: 'Estoque inicial',
      categoriaMovimentacao: 'entrada',
      unidadeMovimentacao: product.unidade,
      observacao: ''
    })
  }
}

function updateProduct(id, payload) {
  const index = products.value.findIndex((product) => product.id === id)
  if (index === -1) return

  products.value[index] = {
    ...products.value[index],
    codigo: payload.codigo?.trim(),
    codigoBarras: payload.codigoBarras?.trim(),
    notaFiscal: payload.notaFiscal?.trim() || '',
    nome: payload.nome?.trim(),
    categoria: payload.categoria?.trim(),
    unidade: payload.unidade?.trim() || 'UN',
    fornecedorId: payload.fornecedorId?.trim() || '',
    fornecedor: payload.fornecedor?.trim() || '',
    estoqueMinimo: normalizeNumber(payload.estoqueMinimo),
    precoCusto: normalizeNumber(payload.precoCusto),
    precoVenda: normalizeNumber(payload.precoVenda)
  }
}

function deleteProduct(id) {
  // O cadastro pode ser removido, mas o histórico de movimentações é preservado
  // para não quebrar a rastreabilidade/auditoria do estoque.
  products.value = products.value.filter((product) => product.id !== id)
}

function currentTime() {
  return new Date().toLocaleTimeString('pt-BR', { hour12: false })
}

function addMovement(payload) {
  const quantity = normalizeNumber(payload.quantidade)
  if (!payload.produtoId || quantity <= 0) return

  const product = products.value.find((item) => item.id === payload.produtoId)

  const movement = {
    id: uid('mov'),
    produtoId: payload.produtoId,
    tipo: payload.tipo || 'entrada',
    quantidade: quantity,
    data: payload.data || new Date().toISOString().slice(0, 10),
    horario: payload.horario || currentTime(),
    createdAt: new Date().toISOString(),
    usuario: payload.usuario?.trim() || getCurrentUser(),
    notaFiscal: payload.notaFiscal?.trim() || '',
    destino: payload.destino?.trim() || '',
    operacao: payload.operacao?.trim() || (payload.tipo === 'saida' ? 'Saída de estoque' : 'Entrada de estoque'),
    categoriaMovimentacao: payload.categoriaMovimentacao || payload.tipo || 'entrada',
    unidadeMovimentacao: payload.unidadeMovimentacao?.trim() || product?.unidade || 'UN',
    observacao: payload.observacao?.trim() || ''
  }

  movements.value.unshift(movement)
  return movement.id
}

// Mantida para integrações internas (ex.: compatibilidade com versões anteriores).
// A interface de Movimentações não permite exclusão manual para preservar a rastreabilidade.
function deleteMovement(id) {
  movements.value = movements.value.filter((movement) => movement.id !== id)
}

function movementOrderValue(movement, index) {
  const date = movement.data || '1970-01-01'
  const time = movement.horario || '00:00:00'
  const created = movement.createdAt || ''
  return `${date}T${time}|${created}|${String(index).padStart(8, '0')}`
}

const movementsDetailed = computed(() => {
  const indexed = movements.value.map((movement, index) => ({ movement, index }))
  const chronological = indexed.slice().sort((a, b) =>
    movementOrderValue(a.movement, a.index).localeCompare(movementOrderValue(b.movement, b.index))
  )

  const balanceByProduct = new Map()
  const finalBalanceByMovement = new Map()

  for (const { movement } of chronological) {
    const current = balanceByProduct.get(movement.produtoId) || 0
    const quantity = normalizeNumber(movement.quantidade)
    const next = current + (movement.tipo === 'entrada' ? quantity : -quantity)
    balanceByProduct.set(movement.produtoId, next)
    finalBalanceByMovement.set(movement.id, next)
  }

  return indexed
    .map(({ movement, index }) => {
      const product = products.value.find((item) => item.id === movement.produtoId)
      return {
        ...movement,
        produto: product?.nome || 'Produto removido',
        codigo: product?.codigo || '-',
        unidade: product?.unidade || movement.unidadeMovimentacao || 'UN',
        unidadeMovimentacao: movement.unidadeMovimentacao || product?.unidade || 'UN',
        categoriaMovimentacao: movement.categoriaMovimentacao || movement.tipo,
        saldoFinal: finalBalanceByMovement.get(movement.id) ?? 0,
        _order: movementOrderValue(movement, index)
      }
    })
    .sort((a, b) => b._order.localeCompare(a._order))
})

export function useInventory() {
  return {
    products,
    movements,
    productsWithStock,
    movementsDetailed,
    addProduct,
    updateProduct,
    deleteProduct,
    addMovement,
    deleteMovement,
    getStockStatus
  }
}
