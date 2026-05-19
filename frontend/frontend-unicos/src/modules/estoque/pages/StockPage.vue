<template>
  <section class="module-page">
    <div class="module-toolbar">
      <ModuleSearch
        v-model="search"
        field-id="stock-search"
        placeholder="Buscar produto, código ou estoque"
        @keyup.enter="loadStock"
      />
      <select v-model="selectedStockId" class="stock-select" @change="loadStock">
        <option value="">Todos os estoques</option>
        <option v-for="stock in stocks" :key="stock.id" :value="stock.id">
          {{ stock.codigo }} - {{ stock.nome }}
        </option>
      </select>
      <button class="secondary-action" type="button" :disabled="loading" @click="loadStock">
        {{ loading ? 'Carregando...' : 'Buscar' }}
      </button>
    </div>

    <p v-if="error" class="feedback error-message">{{ error }}</p>

    <div class="results-card">
      <div class="results-header">
        <div>
          <p class="eyebrow">Estoque atual</p>
          <h2>Saldo por produto</h2>
          <p>{{ totalElements }} registro(s) encontrado(s) no backend de estoque.</p>
        </div>
        <button class="secondary-action" type="button" :disabled="loading" @click="refreshStock">
          Atualizar
        </button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Produto</th>
              <th>Estoque</th>
              <th>Categoria</th>
              <th>Atual</th>
              <th>Reservado</th>
              <th>Disponível</th>
              <th>Valor em estoque</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredBalances" :key="item.id">
              <td>{{ item.codigoProduto }}</td>
              <td><strong>{{ item.nomeProduto }}</strong></td>
              <td>{{ item.nomeEstoque }}</td>
              <td>{{ item.categoria }}</td>
              <td>{{ number(item.quantidadeAtual) }} {{ item.unidade }}</td>
              <td>{{ number(item.quantidadeReservada) }} {{ item.unidade }}</td>
              <td>{{ number(item.quantidadeDisponivel) }} {{ item.unidade }}</td>
              <td>{{ currency(item.valorEstoque) }}</td>
              <td>
                <span :class="['stock-pill', item.estoqueBaixo ? 'danger' : 'ok']">
                  {{ item.estoqueBaixo ? 'Indisponível' : 'OK' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="!loading && !filteredBalances.length" class="empty-state">
        Nenhum saldo de estoque encontrado.
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import ModuleSearch from '@/shared/components/ModuleSearch.vue'
import { listStockBalances, listStocks } from '@/modules/estoque/services/inventoryService'

const balances = ref([])
const stocks = ref([])
const totalElements = ref(0)
const loading = ref(false)
const error = ref('')
const search = ref('')
const selectedStockId = ref('')

onMounted(async () => {
  await Promise.all([loadStocks(), loadStock()])
})

const filteredBalances = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return balances.value

  return balances.value.filter((item) => [
    item.codigoProduto,
    item.nomeProduto,
    item.nomeEstoque,
    item.categoria
  ].join(' ').toLowerCase().includes(term))
})

async function loadStocks() {
  try {
    const response = await listStocks()
    stocks.value = response.content
  } catch {
    stocks.value = []
  }
}

async function loadStock() {
  loading.value = true
  error.value = ''

  try {
    const response = await listStockBalances({
      page: 0,
      size: 100,
      estoqueId: selectedStockId.value
    })

    balances.value = response.content
    totalElements.value = response.totalElements
  } catch (err) {
    error.value = err?.message || 'Não foi possível carregar os saldos de estoque.'
    balances.value = []
    totalElements.value = 0
  } finally {
    loading.value = false
  }
}

function refreshStock() {
  loadStock()
}

function currency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function number(value) {
  return Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 4 })
}
</script>

<style scoped>
.module-page { display: flex; flex-direction: column; gap: 20px; }
.module-toolbar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.stock-select { min-height: 44px; border: 1px solid #dce5ef; border-radius: 14px; padding: 0 12px; background: #fff; color: #1b2a38; font-weight: 600; }
.results-card { background: #fff; border: 1px solid #dce5ef; border-radius: 20px; padding: 24px; box-shadow: var(--panel-shadow); }
.results-header { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 16px; }
.eyebrow { margin: 0; color: #5c6b7a; text-transform: uppercase; letter-spacing: .08em; font-size: 12px; }
h2 { margin: 6px 0; }
.results-header p { margin: 0; color: #5c6b7a; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; min-width: 1080px; }
.data-table th, .data-table td { text-align: left; padding: 14px 12px; border-bottom: 1px solid #eef2f6; }
.data-table th { font-size: 12px; color: #5c6b7a; text-transform: uppercase; }
.stock-pill { display: inline-flex; border-radius: 999px; padding: 5px 10px; font-weight: 800; font-size: 12px; }
.stock-pill.ok { background: #e8f7ef; color: #14763d; }
.stock-pill.danger { background: #fff0ef; color: #bd2f24; }
.feedback { margin: 0; padding: 12px 14px; border-radius: 14px; font-weight: 700; }
.error-message { background: #fff0ef; color: #bd2f24; }
.empty-state { color: #5c6b7a; font-weight: 700; text-align: center; padding: 18px 0 0; }
.secondary-action { border: 1px solid #c9d6e2; background: #fff; color: #0b3575; border-radius: 14px; padding: 12px 16px; font-weight: 800; cursor: pointer; }
.secondary-action:disabled { opacity: .65; cursor: not-allowed; }
</style>
