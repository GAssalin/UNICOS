<template>
  <section class="module-page">
    <div class="module-toolbar">
      <ModuleSearch
        v-model="search"
        :field-id="`${config.storageName}-search`"
        :placeholder="`Buscar por nome, código, documento, e-mail ou cidade`"
      />
      <button class="primary-action" type="button" @click="openCreate">+ {{ config.createLabel }}</button>
    </div>

    <div class="summary-grid">
      <article class="summary-card">
        <span>Total cadastrado</span>
        <strong>{{ partners.length }}</strong>
      </article>
      <article class="summary-card">
        <span>Cadastros ativos</span>
        <strong>{{ activeCount }}</strong>
      </article>
      <article class="summary-card">
        <span>Cadastros inativos</span>
        <strong>{{ partners.length - activeCount }}</strong>
      </article>
    </div>

    <form v-if="showForm" class="partner-form" @submit.prevent="savePartner">
      <div class="form-header">
        <div>
          <p class="eyebrow">{{ editingId ? 'Editar cadastro' : 'Novo cadastro' }}</p>
          <h2>{{ editingId ? config.editTitle : config.formTitle }}</h2>
        </div>
        <button class="ghost-action" type="button" @click="closeForm">Fechar</button>
      </div>

      <div class="form-grid">
        <label>Nome / Razão social<input v-model="form.nome" type="text" required placeholder="Ex: Empresa ABC" /></label>
        <label>Código<input v-model="form.codigo" type="text" required :placeholder="config.codePlaceholder" /></label>
        <label>CPF / CNPJ<input v-model="form.documento" type="text" placeholder="Ex: 00.000.000/0001-00" /></label>
        <label>Telefone<input v-model="form.telefone" type="text" placeholder="Ex: (11) 99999-9999" /></label>
        <label>E-mail<input v-model="form.email" type="email" placeholder="Ex: contato@empresa.com" /></label>
        <label>Cidade<input v-model="form.cidade" type="text" placeholder="Ex: Santo André" /></label>
        <label>Status
          <select v-model="form.status">
            <option>Ativo</option>
            <option>Inativo</option>
          </select>
        </label>
        <label class="full-field">Observação<textarea v-model="form.observacao" rows="3" placeholder="Informações adicionais sobre o cadastro"></textarea></label>
      </div>

      <div class="form-actions">
        <button class="secondary-action" type="button" @click="resetForm">Limpar</button>
        <button class="primary-action" type="submit">{{ editingId ? 'Salvar alterações' : config.saveLabel }}</button>
      </div>
    </form>

    <div class="results-card">
      <div class="results-header">
        <div>
          <h2>{{ config.listTitle }}</h2>
          <p>{{ filteredPartners.length }} cadastro(s) encontrado(s)</p>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Documento</th>
              <th>Telefone</th>
              <th>E-mail</th>
              <th>Cidade</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="partner in filteredPartners" :key="partner.id">
              <td>{{ partner.codigo }}</td>
              <td><strong>{{ partner.nome }}</strong></td>
              <td>{{ partner.documento || '-' }}</td>
              <td>{{ partner.telefone || '-' }}</td>
              <td>{{ partner.email || '-' }}</td>
              <td>{{ partner.cidade || '-' }}</td>
              <td><span :class="['status-pill', partner.status === 'Ativo' ? 'active' : 'inactive']">{{ partner.status }}</span></td>
              <td class="actions">
                <button class="mini-action" type="button" @click="editPartner(partner)">Editar</button>
                <button class="mini-action danger-text" type="button" @click="removePartner(partner.id)">Excluir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="!filteredPartners.length" class="empty-state">Nenhum cadastro encontrado.</p>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import ModuleSearch from '../components/ModuleSearch.vue'
import { useBusinessPartners } from '../composables/useBusinessPartners'

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ['clients', 'suppliers'].includes(value)
  }
})

const configs = {
  clients: {
    storageName: 'clientes',
    createLabel: 'Cadastrar cliente',
    formTitle: 'Cadastrar cliente',
    editTitle: 'Editar cliente',
    saveLabel: 'Salvar cliente',
    listTitle: 'Clientes cadastrados',
    codePlaceholder: 'Ex: CLI-001',
    confirmDelete: 'Deseja excluir este cliente?'
  },
  suppliers: {
    storageName: 'fornecedores',
    createLabel: 'Cadastrar fornecedor',
    formTitle: 'Cadastrar fornecedor',
    editTitle: 'Editar fornecedor',
    saveLabel: 'Salvar fornecedor',
    listTitle: 'Fornecedores cadastrados',
    codePlaceholder: 'Ex: FOR-001',
    confirmDelete: 'Deseja excluir este fornecedor?'
  }
}

const { clients, suppliers } = useBusinessPartners()
const crud = computed(() => (props.type === 'clients' ? clients : suppliers))
const config = computed(() => configs[props.type])

const search = ref('')
const showForm = ref(false)
const editingId = ref(null)

const emptyForm = () => ({
  codigo: '',
  nome: '',
  documento: '',
  telefone: '',
  email: '',
  cidade: '',
  status: 'Ativo',
  observacao: ''
})

const form = reactive(emptyForm())
const partners = computed(() => crud.value.items.value)
const activeCount = computed(() => crud.value.activeCount.value)

const filteredPartners = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return partners.value

  return partners.value.filter((partner) =>
    [partner.codigo, partner.nome, partner.documento, partner.telefone, partner.email, partner.cidade, partner.status]
      .join(' ')
      .toLowerCase()
      .includes(term)
  )
})

function resetForm() {
  Object.assign(form, emptyForm())
}

function openCreate() {
  editingId.value = null
  resetForm()
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
  resetForm()
}

function savePartner() {
  if (editingId.value) {
    crud.value.update(editingId.value, form)
  } else {
    crud.value.add(form)
  }

  closeForm()
}

function editPartner(partner) {
  editingId.value = partner.id
  Object.assign(form, partner)
  showForm.value = true
}

function removePartner(id) {
  if (confirm(config.value.confirmDelete)) {
    crud.value.remove(id)
  }
}
</script>

<style scoped>
.module-page{display:flex;flex-direction:column;gap:20px}.module-toolbar{display:flex;gap:14px;align-items:center}.module-toolbar>*:first-child{flex:1}.summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.summary-card,.partner-form,.results-card{background:#fff;border:1px solid #dce5ef;border-radius:20px;padding:24px;box-shadow:var(--panel-shadow)}.summary-card{display:flex;flex-direction:column;gap:10px}.summary-card span{color:#5c6b7a;font-weight:700}.summary-card strong{font-size:30px;color:#123466}.eyebrow{margin:0;color:#5c6b7a;text-transform:uppercase;letter-spacing:.08em;font-size:12px}h2{margin:6px 0 6px}.results-header p{margin:0;color:#5c6b7a}.form-header,.form-actions,.results-header{display:flex;justify-content:space-between;gap:12px;align-items:center}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:18px}.form-grid label{display:flex;flex-direction:column;gap:8px;font-weight:700;color:#1c2a39}.full-field{grid-column:1/-1}.form-grid input,.form-grid select,.form-grid textarea{border:1px solid #dce5ef;border-radius:14px;padding:13px 14px;outline:none;font:inherit}.form-grid input:focus,.form-grid select:focus,.form-grid textarea:focus{border-color:#1d5be3;box-shadow:0 0 0 3px rgba(29,91,227,.12)}.form-actions{justify-content:flex-end;margin-top:18px}.primary-action,.secondary-action,.ghost-action,.mini-action{border:0;border-radius:14px;padding:13px 18px;font-weight:800;cursor:pointer;white-space:nowrap}.primary-action{background:linear-gradient(135deg,#1d5be3,#0f44bd);color:#fff;box-shadow:0 10px 22px rgba(29,91,227,.22)}.secondary-action{background:#eef4fb;color:#123466}.ghost-action{background:transparent;color:#1d5be3}.table-wrap{overflow-x:auto}.data-table{width:100%;border-collapse:collapse;min-width:1080px}.data-table th,.data-table td{text-align:left;padding:14px 12px;border-bottom:1px solid #eef2f6}.data-table th{font-size:12px;color:#5c6b7a;text-transform:uppercase;letter-spacing:.04em}.status-pill{display:inline-flex;border-radius:999px;padding:5px 10px;font-weight:800;font-size:12px}.status-pill.active{background:#e8f7ef;color:#14763d}.status-pill.inactive{background:#eef2f6;color:#5c6b7a}.actions{display:flex;gap:8px}.mini-action{padding:8px 10px;background:#eef4fb;color:#123466}.danger-text{color:#bd2f24}.empty-state{margin:16px 0 0;color:#5c6b7a}@media(max-width:780px){.module-toolbar,.form-header,.form-actions{flex-direction:column;align-items:stretch}.summary-grid,.form-grid{grid-template-columns:1fr}}
</style>
