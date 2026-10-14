<template>
  <section class="module-page">
    <div class="module-toolbar">
      <div>
        <p class="eyebrow">Estoque</p>
        <h2>Movimentações</h2>
        <p class="toolbar-description">Consulte o histórico e registre entradas, saídas ou ajustes de estoque.</p>
      </div>
      <button class="primary-action" type="button" @click="openMovementForm">+ Nova movimentação</button>
    </div>

    <form v-if="showForm" class="movement-form" @submit.prevent="saveMovement">
      <div class="form-header">
        <div>
          <p class="eyebrow">Estoque</p>
          <h2>Nova movimentação</h2>
          <p>Data, horário e usuário são registrados automaticamente pelo sistema.</p>
        </div>
        <button class="ghost-action" type="button" @click="closeMovementForm">Fechar</button>
      </div>

      <div class="form-grid">
        <label>Tipo
          <select v-model="form.movimento">
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="ajuste">Ajuste</option>
          </select>
        </label>

        <label v-if="form.movimento === 'ajuste'">Sentido do ajuste
          <select v-model="form.ajusteTipo">
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </label>

        <label>Operação
          <input :value="operationLabel" type="text" readonly class="readonly-field" />
        </label>

        <label>Produto
          <select v-model="form.produtoId" required>
            <option value="" disabled>Selecione...</option>
            <option v-for="p in productsWithStock" :key="p.id" :value="p.id">
              {{ p.codigo }} - {{ p.nome }}
            </option>
          </select>
        </label>

        <div class="quantity-unit-group">
          <label class="quantity-field">Quantidade
            <input v-model.number="form.quantidade" type="number" min="0.01" step="0.01" required />
          </label>

          <label class="unit-field">Unidade
            <select v-model="form.unidade" required>
              <option v-for="unit in unitOptions" :key="unit.value" :value="unit.value">
                {{ unit.label }}
              </option>
            </select>
          </label>
        </div>

        <label>Número da nota fiscal
          <input v-model="form.notaFiscal" type="text" placeholder="Ex: NF-123456" />
        </label>

        <label>Destino
          <input v-model="form.destino" type="text" />
        </label>

        <label class="wide">Observação
          <textarea v-model="form.observacao" rows="3"></textarea>
        </label>
      </div>

      <div class="audit-hint">
        <span>Usuário: <strong>{{ currentUser }}</strong></span>
        <span>Data e horário serão registrados no momento em que a movimentação for salva.</span>
      </div>

      <div v-if="systemMessage" :class="['system-message', systemMessage.type]" role="alert">
        <div class="system-message-icon">!</div>
        <div>
          <strong>{{ systemMessage.title }}</strong>
          <p>{{ systemMessage.text }}</p>
        </div>
      </div>

      <div class="form-actions">
        <button class="secondary-action" type="button" @click="resetForm">Limpar</button>
        <button class="primary-action" type="submit">Salvar movimentação</button>
      </div>
    </form>

    <div class="results-card">
      <div class="results-header">
        <div>
          <h2>Histórico de movimentações</h2>
          <p v-if="!hasActiveFilters">Exibindo as {{ displayedMovements.length }} últimas movimentações</p>
          <p v-else>{{ filteredMovements.length }} movimentação(ões) encontrada(s)</p>
        </div>
      </div>

      <div class="filters-row">
        <ModuleSearch
          v-model="search"
          field-id="movements-search"
          placeholder="Buscar por produto, código, operação, nota fiscal, usuário, destino ou observação"
        />

        <select v-model="typeFilter" class="filter-control">
          <option value="">Todos os tipos</option>
          <option value="entrada">Entradas</option>
          <option value="saida">Saídas</option>
          <option value="ajuste">Ajustes</option>
        </select>

        <label class="date-filter">
          <span>De</span>
          <input v-model="startDate" type="date" class="filter-control" />
        </label>

        <label class="date-filter">
          <span>Até</span>
          <input v-model="endDate" type="date" class="filter-control" />
        </label>

        <button v-if="hasActiveFilters" class="secondary-action clear-filters" type="button" @click="clearFilters">
          Limpar filtros
        </button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Horário</th>
              <th>Tipo</th>
              <th>Operação</th>
              <th>Código</th>
              <th>Produto</th>
              <th>Nota fiscal</th>
              <th>Qtd.</th>
              <th>Destino</th>
              <th>Usuário</th>
              <th>Observação</th>
              <th>Saldo final</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="movement in displayedMovements" :key="movement.id">
              <td>{{ formatDate(movement.data) }}</td>
              <td>{{ formatTime(movement) }}</td>
              <td>
                <span :class="['tag', movementTagClass(movement)]">
                  {{ movementTypeLabel(movement) }}
                </span>
              </td>
              <td><strong>{{ movement.operacao || defaultOperation(movement.tipo) }}</strong></td>
              <td>{{ movement.codigo }}</td>
              <td><strong>{{ movement.produto }}</strong></td>
              <td>{{ movement.notaFiscal || '-' }}</td>
              <td>{{ movement.quantidade }} {{ movement.unidadeMovimentacao || movement.unidade }}</td>
              <td>{{ movement.destino || '-' }}</td>
              <td>{{ movement.usuario || '-' }}</td>
              <td>{{ movement.observacao || '-' }}</td>
              <td><strong>{{ movement.saldoFinal }} {{ movement.unidade }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="!displayedMovements.length" class="empty-state">Nenhuma movimentação encontrada para os filtros informados.</p>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import ModuleSearch from '../components/ModuleSearch.vue'
import { useInventory } from '../composables/useInventory'
import { getCurrentUser } from '../composables/useAuth'

const { productsWithStock, movementsDetailed, addMovement } = useInventory()
const search = ref('')
const typeFilter = ref('')
const startDate = ref('')
const endDate = ref('')
const showForm = ref(false)
const systemMessage = ref(null)
const currentUser = computed(() => getCurrentUser())

const unitOptions = [
  { value: 'UN', label: 'Unidade (UN)' },
  { value: 'PC', label: 'Peça (PÇ)' },
  { value: 'KG', label: 'Quilograma (KG)' },
  { value: 'L', label: 'Litro (L)' },
  { value: 'CX', label: 'Caixa (CX)' },
  { value: 'PCT', label: 'Pacote (PCT)' },
  { value: 'M', label: 'Metro (M)' }
]

const blank = () => ({
  movimento: 'entrada',
  ajusteTipo: 'entrada',
  produtoId: '',
  quantidade: 1,
  unidade: 'UN',
  notaFiscal: '',
  destino: '',
  observacao: ''
})

const form = reactive(blank())

const effectiveType = computed(() =>
  form.movimento === 'ajuste' ? form.ajusteTipo : form.movimento
)

const operationLabel = computed(() =>
  form.movimento === 'ajuste' ? 'Ajuste de estoque' : defaultOperation(effectiveType.value)
)

watch(
  () => form.produtoId,
  (productId) => {
    const product = productsWithStock.value.find((item) => item.id === productId)
    if (product?.unidade) form.unidade = product.unidade
  }
)

watch(
  () => [form.movimento, form.ajusteTipo, form.produtoId, form.quantidade],
  () => {
    systemMessage.value = null
  }
)

const filteredMovements = computed(() => {
  const term = search.value.trim().toLowerCase()

  return movementsDetailed.value.filter((movement) => {
    if (typeFilter.value && movement.categoriaMovimentacao !== typeFilter.value) return false
    if (startDate.value && movement.data < startDate.value) return false
    if (endDate.value && movement.data > endDate.value) return false
    if (!term) return true

    return [
      movement.codigo,
      movement.produto,
      movement.tipo,
      movement.categoriaMovimentacao,
      movement.operacao,
      movement.notaFiscal,
      movement.usuario,
      movement.destino,
      movement.observacao,
      movement.data
    ]
      .join(' ')
      .toLowerCase()
      .includes(term)
  })
})

const hasActiveFilters = computed(() =>
  Boolean(search.value.trim() || typeFilter.value || startDate.value || endDate.value)
)

const displayedMovements = computed(() => {
  if (hasActiveFilters.value) return filteredMovements.value
  return filteredMovements.value.slice(0, 5)
})

function defaultOperation(type) {
  return type === 'saida' ? 'Saída de estoque' : 'Entrada de estoque'
}

function resetForm() {
  Object.assign(form, blank())
  systemMessage.value = null
}

function openMovementForm() {
  resetForm()
  showForm.value = true
}

function closeMovementForm() {
  showForm.value = false
  resetForm()
}

function clearFilters() {
  search.value = ''
  typeFilter.value = ''
  startDate.value = ''
  endDate.value = ''
}

function saveMovement() {
  systemMessage.value = null
  const product = productsWithStock.value.find((item) => item.id === form.produtoId)

  if (effectiveType.value === 'saida' && product && Number(form.quantidade) > Number(product.saldo)) {
    systemMessage.value = {
      type: 'error',
      title: 'Movimentação não realizada',
      text: `Saldo insuficiente para ${product.nome}. Saldo disponível: ${product.saldo} ${product.unidade}. Status atual: ${product.stockStatus.label}.`
    }
    return
  }

  addMovement({
    ...form,
    tipo: effectiveType.value,
    categoriaMovimentacao: form.movimento,
    unidadeMovimentacao: form.unidade,
    operacao: operationLabel.value
  })

  closeMovementForm()
}

function movementTypeLabel(movement) {
  if (movement.categoriaMovimentacao === 'ajuste') {
    return `Ajuste (${movement.tipo === 'saida' ? 'Saída' : 'Entrada'})`
  }
  return movement.tipo === 'saida' ? 'Saída' : 'Entrada'
}

function movementTagClass(movement) {
  if (movement.categoriaMovimentacao === 'ajuste') return 'tag-adjust'
  return movement.tipo === 'entrada' ? 'tag-in' : 'tag-out'
}

function formatDate(value) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR') : '-'
}

function formatTime(movement) {
  if (movement.horario) return movement.horario.slice(0, 5)
  if (movement.createdAt) {
    return new Date(movement.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  return '-'
}
</script>

<style scoped>
.module-page{display:flex;flex-direction:column;gap:20px}
.module-toolbar{display:flex;justify-content:space-between;gap:16px;align-items:center}
.module-toolbar h2{margin:4px 0}
.toolbar-description{margin:0;color:#5c6b7a}
.movement-form,.results-card{background:#fff;border:1px solid #dce5ef;border-radius:20px;padding:24px;box-shadow:var(--panel-shadow)}
.eyebrow{margin:0;color:#5c6b7a;text-transform:uppercase;letter-spacing:.08em;font-size:12px}
.form-header h2,.results-header h2{margin:6px 0}
.form-header p,.results-header p{margin:0;color:#5c6b7a}
.form-header,.form-actions,.results-header{display:flex;justify-content:space-between;gap:12px;align-items:center}
.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:18px}
.form-grid label{display:flex;flex-direction:column;gap:8px;font-weight:700}
.form-grid .wide{grid-column:1/-1}
.form-grid input,.form-grid select,.form-grid textarea,.filter-control{border:1px solid #dce5ef;border-radius:14px;padding:13px 14px;outline:none;background:#fff;font:inherit;box-sizing:border-box}
.form-grid textarea{width:100%;resize:vertical}
.form-grid input:focus,.form-grid select:focus,.form-grid textarea:focus,.filter-control:focus{border-color:#1d5be3;box-shadow:0 0 0 3px rgba(29,91,227,.12)}
.readonly-field{background:#f4f7fb!important;color:#5c6b7a}
.quantity-unit-group{display:flex;gap:12px;align-items:flex-end}
.quantity-unit-group label{margin:0}
.quantity-field{flex:0 0 130px}
.unit-field{flex:1;min-width:180px}
.audit-hint{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:16px;padding:12px 14px;border-radius:14px;background:#f6f9fd;color:#5c6b7a;font-size:13px}
.audit-hint strong{color:#123466}
.system-message{display:flex;gap:12px;align-items:flex-start;margin-top:16px;padding:14px 16px;border-radius:14px;border:1px solid}
.system-message.error{background:#fff4f2;border-color:#f4b8b1;color:#8f2017}
.system-message-icon{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#bd2f24;color:#fff;font-weight:900;flex:0 0 auto}
.system-message strong{display:block;margin-bottom:4px}
.system-message p{margin:0;color:inherit;line-height:1.45}
.form-actions{justify-content:flex-end;margin-top:18px}
.primary-action,.secondary-action,.ghost-action{border:0;border-radius:14px;padding:13px 18px;font-weight:800;cursor:pointer;white-space:nowrap}
.primary-action{background:linear-gradient(135deg,#1d5be3,#0f44bd);color:#fff;box-shadow:0 10px 22px rgba(29,91,227,.22)}
.secondary-action{background:#eef4fb;color:#123466}
.ghost-action{background:transparent;color:#1d5be3}
.filters-row{display:grid;grid-template-columns:minmax(260px,1fr) 180px 170px 170px auto;gap:12px;align-items:end;margin-top:18px}
.filter-control{width:100%;min-height:48px}
.date-filter{display:flex;flex-direction:column;gap:6px;color:#5c6b7a;font-size:12px;font-weight:800}
.clear-filters{min-height:48px}
.table-wrap{overflow-x:auto;margin-top:18px}
.data-table{width:100%;border-collapse:collapse;min-width:1450px}
.data-table th,.data-table td{text-align:left;padding:14px 12px;border-bottom:1px solid #eef2f6;vertical-align:top}
.data-table th{font-size:12px;color:#5c6b7a;text-transform:uppercase;white-space:nowrap}
.tag{display:inline-flex;border-radius:999px;padding:5px 10px;font-weight:800;white-space:nowrap}
.tag-in{background:#e8f7ef;color:#14763d}
.tag-out{background:#fff0ef;color:#bd2f24}
.tag-adjust{background:#eef4fb;color:#123466}
.empty-state{margin:16px 0 0;color:#5c6b7a}
@media(max-width:1050px){.filters-row{grid-template-columns:1fr 1fr}.quantity-unit-group{grid-column:1/-1}}
@media(max-width:780px){.module-toolbar,.form-header,.form-actions{flex-direction:column;align-items:stretch}.form-grid,.filters-row{grid-template-columns:1fr}.quantity-unit-group{grid-column:auto;flex-direction:column;align-items:stretch}.quantity-field,.unit-field{flex:1 1 auto;min-width:0}}
</style>
