<template>
  <section class="module-page">
    <div class="module-toolbar">
      <ModuleSearch
        v-model="search"
        field-id="products-search"
        placeholder="Buscar por nome do produto"
        @keyup.enter="loadProductsBySearch"
      />
      <button class="secondary-action" type="button" :disabled="loading" @click="loadProductsBySearch">Buscar</button>
      <button class="primary-action" type="button" @click="openCreate">+ Cadastrar produto</button>
    </div>

    <p v-if="error" class="feedback error-message">{{ error }}</p>
    <p v-if="successMessage" class="feedback success-message">{{ successMessage }}</p>

    <form v-if="showForm" class="product-form" @submit.prevent="handleSaveProduct">
      <div class="form-header">
        <div>
          <p class="eyebrow">{{ editingId ? 'Editar cadastro' : 'Novo cadastro' }}</p>
          <h2>{{ editingId ? 'Editar produto' : 'Cadastrar produto' }}</h2>
        </div>
        <button class="ghost-action" type="button" @click="closeForm">Fechar</button>
      </div>

      <div class="form-grid">
        <label>
          Nome do produto
          <input v-model="form.nome" type="text" required placeholder="Ex: Parafuso sextavado" />
        </label>

        <label>
          Código / SKU
          <input v-model="form.codigo" type="text" :disabled="!!editingId" required placeholder="Ex: PRD-001" />
        </label>

        <label>
          Tipo do produto
          <select v-model="form.tipoProduto" required>
            <option value="PRODUTO">Produto físico</option>
            <option value="SERVICO">Serviço</option>
            <option value="DIGITAL">Produto digital</option>
            <option value="ASSINATURA">Assinatura</option>
          </select>
        </label>

        <label>
          Unidade de medida
          <select v-model="form.unidadeMedidaId" required>
            <option value="">Selecione...</option>
            <option v-for="unit in units" :key="unit.id" :value="unit.id">
              {{ unit.codigo }} - {{ unit.descricao }}
            </option>
          </select>
        </label>

        <label>
          Categoria
          <select v-model="form.categoriaId">
            <option value="">Sem categoria</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.nome }}
            </option>
          </select>
        </label>

        <label>
          Marca
          <select v-model="form.marcaId">
            <option value="">Sem marca</option>
            <option v-for="brand in brands" :key="brand.id" :value="brand.id">
              {{ brand.nome }}
            </option>
          </select>
        </label>

        <label>
          Código de barras
          <input v-model="form.codigoBarras" type="text" placeholder="Ex: 7890000000000" />
        </label>

        <label>
          Preço base
          <input v-model.number="form.precoBase" type="number" min="0" step="0.01" placeholder="0,00" />
        </label>

        <label>
          Peso
          <input v-model.number="form.peso" type="number" min="0" step="0.0001" placeholder="0" />
        </label>

        <label>
          Volume
          <input v-model.number="form.volume" type="number" min="0" step="0.0001" placeholder="0" />
        </label>

        <label class="full-field">
          Descrição
          <textarea v-model="form.descricao" rows="3" placeholder="Descrição opcional do produto"></textarea>
        </label>
      </div>

      <div class="form-actions">
        <button class="secondary-action" type="button" :disabled="saving" @click="resetForm">Limpar</button>
        <button class="primary-action" type="submit" :disabled="saving">
          {{ saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar produto' }}
        </button>
      </div>
    </form>

    <div class="results-card">
      <div class="results-header">
        <div>
          <h2>Produtos cadastrados</h2>
          <p>{{ totalElements }} produto(s) encontrado(s)</p>
        </div>
        <button class="secondary-action" type="button" :disabled="loading" @click="refreshProducts">
          {{ loading ? 'Carregando...' : 'Atualizar' }}
        </button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Preço base</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id">
              <td>{{ product.codigo }}</td>
              <td><strong>{{ product.nome }}</strong></td>
              <td>{{ formatProductType(product.tipoProduto) }}</td>
              <td>{{ currency(product.precoBase) }}</td>
              <td>
                <span :class="['stock-pill', product.ativo ? 'ok' : 'danger']">
                  {{ product.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="actions">
                <button class="mini-action" type="button" @click="editProduct(product)">Editar</button>
                <button class="mini-action" type="button" @click="changeStatus(product)">
                  {{ product.ativo ? 'Inativar' : 'Ativar' }}
                </button>
                <button class="mini-action danger-text" type="button" @click="removeProduct(product.id)">Excluir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="!loading && !products.length" class="empty-state">Nenhum produto encontrado.</p>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import ModuleSearch from '@/shared/components/ModuleSearch.vue'
import { useProducts } from '@/modules/produtos/composables/useProducts'

const {
  products,
  units,
  categories,
  brands,
  totalElements,
  loading,
  saving,
  error,
  loadProducts,
  loadOptions,
  findProduct,
  saveProduct,
  removeProduct: deleteProduct,
  toggleProductStatus
} = useProducts()

const search = ref('')
const showForm = ref(false)
const editingId = ref(null)
const successMessage = ref('')

const emptyForm = () => ({
  codigo: '',
  nome: '',
  descricao: '',
  tipoProduto: 'PRODUTO',
  unidadeMedidaId: '',
  categoriaId: '',
  marcaId: '',
  codigoBarras: '',
  precoBase: 0,
  peso: '',
  volume: ''
})

const form = reactive(emptyForm())

onMounted(async () => {
  await Promise.all([loadOptions(), loadProducts()])
})

function currency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatProductType(type) {
  const labels = {
    PRODUTO: 'Produto físico',
    SERVICO: 'Serviço',
    DIGITAL: 'Produto digital',
    ASSINATURA: 'Assinatura'
  }

  return labels[type] || type || '-'
}

function resetForm() {
  Object.assign(form, emptyForm())
}

function openCreate() {
  successMessage.value = ''
  editingId.value = null
  resetForm()
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
  resetForm()
}

async function loadProductsBySearch() {
  await loadProducts({ page: 0, nome: search.value })
}

async function refreshProducts() {
  await loadProducts({ nome: search.value })
}

async function handleSaveProduct() {
  successMessage.value = ''

  await saveProduct(form, editingId.value)
  successMessage.value = editingId.value ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.'
  closeForm()
  await refreshProducts()
}

async function editProduct(product) {
  successMessage.value = ''
  const detail = await findProduct(product.id)

  editingId.value = detail.id
  Object.assign(form, {
    codigo: detail.codigo || '',
    nome: detail.nome || '',
    descricao: detail.descricao || '',
    tipoProduto: detail.tipoProduto || 'PRODUTO',
    unidadeMedidaId: detail.unidadeMedidaId || '',
    categoriaId: detail.categoriaId || '',
    marcaId: detail.marcaId || '',
    codigoBarras: detail.codigoBarras || '',
    precoBase: detail.precoBase || 0,
    peso: detail.peso || '',
    volume: detail.volume || ''
  })
  showForm.value = true
}

async function removeProduct(id) {
  if (!confirm('Deseja excluir este produto?')) return

  successMessage.value = ''
  await deleteProduct(id)
  successMessage.value = 'Produto excluído com sucesso.'
  await refreshProducts()
}

async function changeStatus(product) {
  successMessage.value = ''
  await toggleProductStatus(product)
  successMessage.value = product.ativo ? 'Produto inativado com sucesso.' : 'Produto ativado com sucesso.'
  await refreshProducts()
}
</script>

<style scoped>
.module-page{display:flex;flex-direction:column;gap:20px}.module-toolbar{display:flex;gap:14px;align-items:center}.module-toolbar>*:first-child{flex:1}.product-form,.results-card{background:#fff;border:1px solid #dce5ef;border-radius:20px;padding:24px;box-shadow:var(--panel-shadow)}.eyebrow{margin:0;color:#5c6b7a;text-transform:uppercase;letter-spacing:.08em;font-size:12px}h2{margin:6px 0 6px}.results-header p{margin:0;color:#5c6b7a}.form-header,.form-actions,.results-header{display:flex;justify-content:space-between;gap:12px;align-items:center}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:18px}.form-grid label{display:flex;flex-direction:column;gap:8px;font-weight:700;color:#1c2a39}.form-grid input,.form-grid select,.form-grid textarea{border:1px solid #dce5ef;border-radius:14px;padding:13px 14px;outline:none;font:inherit;background:#fff}.form-grid input:focus,.form-grid select:focus,.form-grid textarea:focus{border-color:#1d5be3;box-shadow:0 0 0 3px rgba(29,91,227,.12)}.full-field{grid-column:1/-1}.form-actions{justify-content:flex-end;margin-top:18px}.primary-action,.secondary-action,.ghost-action,.mini-action{border:0;border-radius:14px;padding:13px 18px;font-weight:800;cursor:pointer;white-space:nowrap}.primary-action:disabled,.secondary-action:disabled{opacity:.65;cursor:not-allowed}.primary-action{background:linear-gradient(135deg,#1d5be3,#0f44bd);color:#fff;box-shadow:0 10px 22px rgba(29,91,227,.22)}.secondary-action{background:#eef4fb;color:#123466}.ghost-action{background:transparent;color:#1d5be3}.table-wrap{overflow-x:auto}.data-table{width:100%;border-collapse:collapse;min-width:900px}.data-table th,.data-table td{text-align:left;padding:14px 12px;border-bottom:1px solid #eef2f6}.data-table th{font-size:12px;color:#5c6b7a;text-transform:uppercase;letter-spacing:.04em}.stock-pill{display:inline-flex;border-radius:999px;padding:5px 10px;font-weight:800;font-size:12px}.stock-pill.ok{background:#e8f7ef;color:#14763d}.stock-pill.danger{background:#fff0ef;color:#bd2f24}.actions{display:flex;gap:8px;flex-wrap:wrap}.mini-action{padding:8px 10px;background:#eef4fb;color:#123466}.danger-text{color:#bd2f24}.empty-state{margin:16px 0 0;color:#5c6b7a}.feedback{border-radius:14px;padding:12px 14px;margin:0;font-weight:700}.error-message{background:#fff0ef;color:#bd2f24;border:1px solid #ffd3cf}.success-message{background:#e8f7ef;color:#14763d;border:1px solid #bfebd0}@media(max-width:780px){.module-toolbar,.form-header,.form-actions,.results-header{flex-direction:column;align-items:stretch}.form-grid{grid-template-columns:1fr}.full-field{grid-column:auto}}
</style>
