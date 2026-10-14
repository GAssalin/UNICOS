import { computed, ref, watch } from 'vue'
import { useInventory } from './useInventory'

const PURCHASES_KEY = 'unicos_purchases_v1'

function readStorage() {
  try { return JSON.parse(localStorage.getItem(PURCHASES_KEY)) || [] } catch { return [] }
}

const purchases = ref(readStorage())
watch(purchases, (value) => localStorage.setItem(PURCHASES_KEY, JSON.stringify(value)), { deep: true })

function uid() { return `cmp-${Date.now()}-${Math.random().toString(16).slice(2)}` }
function number(value) { return Number(value || 0) || 0 }

export function usePurchases() {
  const { addMovement } = useInventory()
  const purchasesTotal = computed(() => purchases.value.filter((p) => p.status === 'Recebida').reduce((sum, p) => sum + number(p.total), 0))

  function rollbackMovements(purchase) {
    if (purchase.status !== 'Recebida') return []
    return purchase.items.map((item) => addMovement({
      produtoId: item.produtoId,
      tipo: 'saida',
      quantidade: number(item.quantidade),
      notaFiscal: purchase.notaFiscal || '',
      destino: purchase.fornecedorNome || 'Estorno de compra',
      operacao: 'Estorno de compra',
      observacao: `Referência: ${purchase.numero}`
    })).filter(Boolean)
  }

  function createMovements(purchase) {
    if (purchase.status !== 'Recebida') return []
    return purchase.items.map((item) => addMovement({
      produtoId: item.produtoId,
      tipo: 'entrada',
      quantidade: number(item.quantidade),
      notaFiscal: purchase.notaFiscal || '',
      destino: 'Estoque',
      operacao: 'Compra',
      observacao: `Referência: ${purchase.numero}`
    })).filter(Boolean)
  }

  function addPurchase(payload) {
    const purchase = { id: uid(), createdAt: new Date().toISOString(), ...payload }
    purchase.movementIds = createMovements(purchase)
    purchases.value.unshift(purchase)
    return { ok: true }
  }

  function updatePurchase(id, payload) {
    const index = purchases.value.findIndex((purchase) => purchase.id === id)
    if (index === -1) return { ok: false, message: 'Compra não encontrada.' }
    const previous = purchases.value[index]
    rollbackMovements(previous)
    const updated = { ...previous, ...payload }
    updated.movementIds = createMovements(updated)
    purchases.value[index] = updated
    return { ok: true }
  }

  function deletePurchase(id) {
    const purchase = purchases.value.find((item) => item.id === id)
    if (purchase) rollbackMovements(purchase)
    purchases.value = purchases.value.filter((item) => item.id !== id)
  }

  return { purchases, purchasesTotal, addPurchase, updatePurchase, deletePurchase }
}
