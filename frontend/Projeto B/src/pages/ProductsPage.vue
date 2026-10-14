<template>
  <section class="module-page">
    <div class="module-toolbar">
      <ModuleSearch v-model="search" field-id="products-search" placeholder="Buscar por nome, código, fornecedor, nota fiscal ou código de barras" />
      <button class="primary-action" type="button" @click="openCreate">+ Cadastrar produto</button>
    </div>

    <form v-if="showForm" class="product-form" @submit.prevent="saveProduct">
      <div class="form-header">
        <div>
          <p class="eyebrow">{{ editingId ? 'Editar cadastro' : 'Novo cadastro' }}</p>
          <h2>{{ editingId ? 'Editar produto' : 'Cadastrar produto' }}</h2>
        </div>
        <button class="ghost-action" type="button" @click="closeForm">Fechar</button>
      </div>

      <div class="form-grid">
        <label>Nome do produto<input v-model="form.nome" type="text" required placeholder="Ex: Parafuso sextavado" /></label>
        <label>Código / SKU<input v-model="form.codigo" type="text" required placeholder="Ex: PRD-001" /></label>
        <label>Código de barras<input v-model="form.codigoBarras" type="text" placeholder="Ex: 7890000000000" /></label>
        <label>Nota fiscal de referência<input v-model="form.notaFiscal" type="text" placeholder="Ex: NF-123456" /></label>
        <label>
          Fornecedor
          <select v-model="form.fornecedorId">
            <option value="">Selecione um fornecedor</option>
            <option v-for="supplier in supplierOptions" :key="supplier.id" :value="supplier.id">
              {{ supplier.nome }}{{ supplier.codigo ? ` - ${supplier.codigo}` : '' }}
            </option>
          </select>
        </label>
        <label>Categoria<input v-model="form.categoria" type="text" placeholder="Ex: Ferragens" /></label>
        <label>
          Unidade
          <select v-model="form.unidade">
            <option v-for="unit in unitOptions" :key="unit.value" :value="unit.value">
              {{ unit.label }}
            </option>
          </select>
        </label>
        <label v-if="!editingId">Estoque inicial<input v-model.number="form.estoqueInicial" type="number" min="0" step="0.01" placeholder="0" /></label>
        <label>Estoque mínimo<input v-model.number="form.estoqueMinimo" type="number" min="0" step="0.01" placeholder="0" /></label>
        <label>Preço de custo<input v-model.number="form.precoCusto" type="number" min="0" step="0.01" placeholder="0,00" /></label>
        <label>Preço de venda<input v-model.number="form.precoVenda" type="number" min="0" step="0.01" placeholder="0,00" /></label>
      </div>

      <div class="form-actions">
        <button class="secondary-action" type="button" @click="resetForm">Limpar</button>
        <button class="primary-action" type="submit">{{ editingId ? 'Salvar alterações' : 'Salvar produto' }}</button>
      </div>
    </form>

    <div class="results-card">
      <div class="results-header">
        <div><h2>Produtos cadastrados</h2><p>{{ filteredProducts.length }} produto(s) encontrado(s)</p></div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Código</th><th>Produto</th><th>Cód. barras</th><th>NF referência</th><th>Fornecedor</th><th>Categoria</th><th>Saldo</th><th>Preço venda</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in filteredProducts" :key="product.id">
              <td>{{ product.codigo }}</td>
              <td><strong>{{ product.nome }}</strong></td>
              <td>{{ product.codigoBarras || '-' }}</td>
              <td>{{ product.notaFiscal || '-' }}</td>
              <td>{{ supplierName(product) }}</td>
              <td>{{ product.categoria || '-' }}</td>
              <td><span :class="['stock-pill', product.estoqueBaixo ? 'danger' : 'ok']">{{ product.saldo }} {{ product.unidade }}</span></td>
              <td>{{ currency(product.precoVenda) }}</td>
              <td class="actions"><button class="mini-action" @click="editProduct(product)">Editar</button><button class="mini-action danger-text" @click="removeProduct(product.id)">Excluir</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!filteredProducts.length" class="empty-state">Nenhum produto encontrado.</p>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import ModuleSearch from '../components/ModuleSearch.vue'
import { useInventory } from '../composables/useInventory'
import { useBusinessPartners } from '../composables/useBusinessPartners'

const { productsWithStock, addProduct, updateProduct, deleteProduct } = useInventory()
const { suppliers } = useBusinessPartners()
const search = ref('')
const showForm = ref(false)
const editingId = ref(null)

const unitOptions = [
  { value: 'UN', label: 'Unidade (UN)' },
  { value: 'PC', label: 'Peça (PÇ)' },
  { value: 'KG', label: 'Quilograma (KG)' },
  { value: 'L', label: 'Litro (L)' },
  { value: 'CX', label: 'Caixa (CX)' },
  { value: 'PCT', label: 'Pacote (PCT)' },
  { value: 'M', label: 'Metro (M)' }
]

const supplierOptions = computed(() =>
  suppliers.items.value
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
)

const emptyForm = () => ({ codigo: '', codigoBarras: '', notaFiscal: '', nome: '', categoria: '', unidade: 'UN', fornecedorId: '', estoqueInicial: 0, estoqueMinimo: 0, precoCusto: 0, precoVenda: 0 })
const form = reactive(emptyForm())

const filteredProducts = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return productsWithStock.value
  return productsWithStock.value.filter((product) => [
    product.codigo,
    product.codigoBarras,
    product.notaFiscal,
    product.nome,
    product.categoria,
    supplierName(product)
  ].join(' ').toLowerCase().includes(term))
})

function supplierName(product) {
  if (product.fornecedorId) {
    const supplier = suppliers.items.value.find((item) => item.id === product.fornecedorId)
    if (supplier) return supplier.nome
  }

  return product.fornecedor || '-'
}

function selectedSupplier() {
  return suppliers.items.value.find((item) => item.id === form.fornecedorId)
}

function productPayload() {
  const supplier = selectedSupplier()
  return {
    ...form,
    fornecedorId: supplier?.id || '',
    fornecedor: supplier?.nome || ''
  }
}

function currency(value) { return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function resetForm() { Object.assign(form, emptyForm()) }
function openCreate() { editingId.value = null; resetForm(); showForm.value = true }
function closeForm() { showForm.value = false; editingId.value = null; resetForm() }
function saveProduct() { const payload = productPayload(); editingId.value ? updateProduct(editingId.value, payload) : addProduct(payload); closeForm() }
function editProduct(product) {
  editingId.value = product.id
  const linkedSupplierId = product.fornecedorId || suppliers.items.value.find((item) => item.nome === product.fornecedor)?.id || ''
  Object.assign(form, { ...product, fornecedorId: linkedSupplierId, estoqueInicial: 0 })
  showForm.value = true
}
function removeProduct(id) { if (confirm('Deseja excluir este produto? O histórico de movimentações será preservado.')) deleteProduct(id) }
</script>

<style scoped>
.module-page{display:flex;flex-direction:column;gap:20px}.module-toolbar{display:flex;gap:14px;align-items:center}.module-toolbar>*:first-child{flex:1}.product-form,.results-card{background:#fff;border:1px solid #dce5ef;border-radius:20px;padding:24px;box-shadow:var(--panel-shadow)}.eyebrow{margin:0;color:#5c6b7a;text-transform:uppercase;letter-spacing:.08em;font-size:12px}h2{margin:6px 0 6px}.results-header p{margin:0;color:#5c6b7a}.form-header,.form-actions,.results-header{display:flex;justify-content:space-between;gap:12px;align-items:center}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:18px}.form-grid label{display:flex;flex-direction:column;gap:8px;font-weight:700;color:#1c2a39}.form-grid input,.form-grid select{border:1px solid #dce5ef;border-radius:14px;padding:13px 14px;outline:none;background:#fff;font:inherit}.form-grid input:focus,.form-grid select:focus{border-color:#1d5be3;box-shadow:0 0 0 3px rgba(29,91,227,.12)}.form-actions{justify-content:flex-end;margin-top:18px}.primary-action,.secondary-action,.ghost-action,.mini-action{border:0;border-radius:14px;padding:13px 18px;font-weight:800;cursor:pointer;white-space:nowrap}.primary-action{background:linear-gradient(135deg,#1d5be3,#0f44bd);color:#fff;box-shadow:0 10px 22px rgba(29,91,227,.22)}.secondary-action{background:#eef4fb;color:#123466}.ghost-action{background:transparent;color:#1d5be3}.table-wrap{overflow-x:auto}.data-table{width:100%;border-collapse:collapse;min-width:1120px}.data-table th,.data-table td{text-align:left;padding:14px 12px;border-bottom:1px solid #eef2f6}.data-table th{font-size:12px;color:#5c6b7a;text-transform:uppercase;letter-spacing:.04em}.stock-pill{display:inline-flex;border-radius:999px;padding:5px 10px;font-weight:800;font-size:12px}.stock-pill.ok{background:#e8f7ef;color:#14763d}.stock-pill.danger{background:#fff0ef;color:#bd2f24}.actions{display:flex;gap:8px}.mini-action{padding:8px 10px;background:#eef4fb;color:#123466}.danger-text{color:#bd2f24}.empty-state{margin:16px 0 0;color:#5c6b7a}@media(max-width:780px){.module-toolbar,.form-header,.form-actions{flex-direction:column;align-items:stretch}.form-grid{grid-template-columns:1fr}}
</style>
