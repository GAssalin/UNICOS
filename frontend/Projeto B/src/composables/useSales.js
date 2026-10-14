import { computed, ref, watch } from 'vue'
import { useInventory } from './useInventory'

const SALES_KEY = 'unicos_sales_v1'

function readStorage() {
  try { return JSON.parse(localStorage.getItem(SALES_KEY)) || [] } catch { return [] }
}

const sales = ref(readStorage())
watch(sales, (value) => localStorage.setItem(SALES_KEY, JSON.stringify(value)), { deep: true })

function uid() { return `vnd-${Date.now()}-${Math.random().toString(16).slice(2)}` }
function number(value) { return Number(value || 0) || 0 }

export function useSales() {
  const { productsWithStock, addMovement } = useInventory()
  const salesTotal = computed(() => sales.value.filter((s) => s.status !== 'Cancelada').reduce((sum, s) => sum + number(s.total), 0))

  function validateStock(items, previousSale = null) {
    for (const item of items) {
      const product = productsWithStock.value.find((p) => p.id === item.produtoId)
      const previousQty = previousSale?.status === 'Faturada'
        ? number(previousSale.items.find((old) => old.produtoId === item.produtoId)?.quantidade)
        : 0
      if (!product || number(item.quantidade) > product.saldo + previousQty) {
        return `Estoque insuficiente para ${product?.nome || 'o produto selecionado'}. Disponível: ${product?.saldo || 0}.`
      }
    }
    return ''
  }

  function rollbackMovements(sale) {
    if (sale.status !== 'Faturada') return []
    return sale.items.map((item) => addMovement({
      produtoId: item.produtoId,
      tipo: 'entrada',
      quantidade: number(item.quantidade),
      notaFiscal: sale.notaFiscal || '',
      destino: 'Estoque',
      operacao: 'Estorno de venda',
      observacao: `Referência: ${sale.numero}`
    })).filter(Boolean)
  }

  function createMovements(sale) {
    if (sale.status !== 'Faturada') return []
    return sale.items.map((item) => addMovement({
      produtoId: item.produtoId,
      tipo: 'saida',
      quantidade: number(item.quantidade),
      destino: sale.clienteNome,
      notaFiscal: sale.notaFiscal || '',
      operacao: 'Venda',
      observacao: `Referência: ${sale.numero}`
    })).filter(Boolean)
  }

  function addSale(payload) {
    const sale = { id: uid(), createdAt: new Date().toISOString(), ...payload }
    const validation = sale.status === 'Faturada' ? validateStock(sale.items) : ''
    if (validation) return { ok: false, message: validation }
    sale.movementIds = createMovements(sale)
    sales.value.unshift(sale)
    return { ok: true }
  }

  function updateSale(id, payload) {
    const index = sales.value.findIndex((sale) => sale.id === id)
    if (index === -1) return { ok: false, message: 'Venda não encontrada.' }
    const previous = sales.value[index]
    const validation = payload.status === 'Faturada' ? validateStock(payload.items, previous) : ''
    if (validation) return { ok: false, message: validation }
    rollbackMovements(previous)
    const updated = { ...previous, ...payload }
    updated.movementIds = createMovements(updated)
    sales.value[index] = updated
    return { ok: true }
  }

  function deleteSale(id) {
    const sale = sales.value.find((item) => item.id === id)
    if (sale) rollbackMovements(sale)
    sales.value = sales.value.filter((item) => item.id !== id)
  }

  return { sales, salesTotal, addSale, updateSale, deleteSale }
}
