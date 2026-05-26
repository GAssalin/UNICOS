<template>
  <section class="module-page">
    <div class="module-toolbar">
      <ModuleSearch
        v-model="search"
        field-id="company-search"
        placeholder="Buscar por CNPJ"
        @keyup.enter="loadCompaniesBySearch"
      />
      <button class="secondary-action" type="button" :disabled="loading" @click="loadCompaniesBySearch">Buscar</button>
      <button class="primary-action" type="button" @click="openCreate">+ Cadastrar empresa</button>
    </div>

    <p v-if="error" class="feedback error-message">{{ error }}</p>
    <p v-if="successMessage" class="feedback success-message">{{ successMessage }}</p>

    <form v-if="showForm" class="company-form" @submit.prevent="handleSaveCompany">
      <div class="form-header">
        <div>
          <p class="eyebrow">{{ editingId ? 'Editar cadastro' : 'Novo cadastro' }}</p>
          <h2>{{ editingId ? 'Editar empresa' : 'Cadastrar empresa' }}</h2>
        </div>
        <button class="ghost-action" type="button" @click="closeForm">Fechar</button>
      </div>

      <div class="form-grid">
        <label>
          Razão social
          <input v-model="form.razaoSocial" type="text" required placeholder="Ex: UniCoS Tecnologia LTDA" />
        </label>

        <label>
          Nome fantasia
          <input v-model="form.nomeFantasia" type="text" placeholder="Ex: UniCoS" />
        </label>

        <label>
          CNPJ
          <input v-model="form.cnpj" type="text" :disabled="!!editingId" required placeholder="Ex: 00000000000100" />
        </label>

        <label>
          Tipo da empresa
          <select v-model="form.tipoEmpresa" required>
            <option value="MATRIZ">Matriz</option>
            <option value="FILIAL">Filial</option>
          </select>
        </label>

        <label>
          Status
          <select v-model="form.statusEmpresa" required>
            <option value="ATIVA">Ativa</option>
            <option value="SUSPENSA">Suspensa</option>
            <option value="ENCERRADA">Encerrada</option>
          </select>
        </label>

        <label>
          Regime tributário
          <select v-model="form.regimeTributario" required>
            <option value="SIMPLES_NACIONAL">Simples Nacional</option>
            <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
            <option value="LUCRO_REAL">Lucro Real</option>
          </select>
        </label>

        <label>
          Data de abertura
          <input v-model="form.dataAbertura" type="date" />
        </label>

        <label>
          Pessoa jurídica ID
          <input v-model.number="form.pessoaJuridicaId" type="number" min="1" placeholder="Opcional" />
        </label>
      </div>

      <div class="form-actions">
        <button class="secondary-action" type="button" :disabled="saving" @click="resetForm">Limpar</button>
        <button class="primary-action" type="submit" :disabled="saving">
          {{ saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar empresa' }}
        </button>
      </div>
    </form>

    <div class="results-card">
      <div class="results-header">
        <div>
          <h2>Empresas cadastradas</h2>
          <p>{{ totalElements }} empresa(s) encontrada(s)</p>
        </div>
        <button class="secondary-action" type="button" :disabled="loading" @click="refreshCompanies">
          {{ loading ? 'Carregando...' : 'Atualizar' }}
        </button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>CNPJ</th>
              <th>Empresa</th>
              <th>Tipo</th>
              <th>Regime</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="company in companies" :key="company.id">
              <td>{{ formatCnpj(company.cnpj) }}</td>
              <td>
                <strong>{{ company.nomeFantasia || company.razaoSocial }}</strong>
                <small>{{ company.razaoSocial }}</small>
              </td>
              <td>{{ formatType(company.tipoEmpresa) }}</td>
              <td>{{ formatRegime(company.regimeTributario) }}</td>
              <td>
                <span :class="['status-pill', statusClass(company.statusEmpresa)]">
                  {{ formatStatus(company.statusEmpresa) }}
                </span>
              </td>
              <td class="actions">
                <button class="mini-action" type="button" @click="editCompany(company)">Editar</button>
                <button class="mini-action danger-text" type="button" @click="removeCompany(company.id)">Excluir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="!loading && !companies.length" class="empty-state">Nenhuma empresa encontrada.</p>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import ModuleSearch from '@/shared/components/ModuleSearch.vue'
import {
  createCompany,
  deleteCompany,
  getCompanyByCnpj,
  getCompanyById,
  listCompanies,
  updateCompany
} from '@/modules/empresa/services/companyService'

const companies = ref([])
const totalElements = ref(0)
const page = ref(0)
const size = ref(20)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')
const search = ref('')
const showForm = ref(false)
const editingId = ref(null)

const emptyForm = () => ({
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  tipoEmpresa: 'MATRIZ',
  statusEmpresa: 'ATIVA',
  regimeTributario: 'SIMPLES_NACIONAL',
  dataAbertura: '',
  pessoaJuridicaId: ''
})

const form = reactive(emptyForm())

onMounted(refreshCompanies)

function extractErrorMessage(err, fallback = 'Não foi possível executar a operação.') {
  return err?.message || fallback
}

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isNaN(number) ? null : number
}

function buildPayload({ includeCnpj = true } = {}) {
  const payload = {
    razaoSocial: String(form.razaoSocial || '').trim(),
    nomeFantasia: String(form.nomeFantasia || '').trim() || null,
    tipoEmpresa: form.tipoEmpresa,
    statusEmpresa: form.statusEmpresa,
    regimeTributario: form.regimeTributario,
    dataAbertura: form.dataAbertura || null,
    pessoaJuridicaId: toNumberOrNull(form.pessoaJuridicaId)
  }

  if (includeCnpj) {
    payload.cnpj = String(form.cnpj || '').replace(/\D/g, '')
  }

  return payload
}

async function refreshCompanies() {
  loading.value = true
  error.value = ''

  try {
    const response = await listCompanies({ page: page.value, size: size.value })
    companies.value = response.content
    totalElements.value = response.totalElements
    page.value = response.number
    size.value = response.size || size.value
  } catch (err) {
    error.value = extractErrorMessage(err, 'Não foi possível carregar as empresas.')
    companies.value = []
    totalElements.value = 0
  } finally {
    loading.value = false
  }
}

async function loadCompaniesBySearch() {
  const cleanCnpj = String(search.value || '').replace(/\D/g, '')

  if (!cleanCnpj) {
    await refreshCompanies()
    return
  }

  loading.value = true
  error.value = ''

  try {
    const company = await getCompanyByCnpj(cleanCnpj)
    companies.value = company ? [company] : []
    totalElements.value = companies.value.length
  } catch (err) {
    error.value = extractErrorMessage(err, 'Empresa não encontrada para o CNPJ informado.')
    companies.value = []
    totalElements.value = 0
  } finally {
    loading.value = false
  }
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

async function handleSaveCompany() {
  saving.value = true
  error.value = ''
  successMessage.value = ''

  try {
    if (editingId.value) {
      await updateCompany(editingId.value, buildPayload({ includeCnpj: false }))
      successMessage.value = 'Empresa atualizada com sucesso.'
    } else {
      await createCompany(buildPayload())
      successMessage.value = 'Empresa cadastrada com sucesso.'
    }

    closeForm()
    await refreshCompanies()
  } catch (err) {
    error.value = extractErrorMessage(err, 'Não foi possível salvar a empresa.')
  } finally {
    saving.value = false
  }
}

async function editCompany(company) {
  successMessage.value = ''
  error.value = ''

  try {
    const detail = await getCompanyById(company.id)
    editingId.value = detail.id
    Object.assign(form, {
      razaoSocial: detail.razaoSocial || '',
      nomeFantasia: detail.nomeFantasia || '',
      cnpj: detail.cnpj || '',
      tipoEmpresa: detail.tipoEmpresa || 'MATRIZ',
      statusEmpresa: detail.statusEmpresa || 'ATIVA',
      regimeTributario: detail.regimeTributario || 'SIMPLES_NACIONAL',
      dataAbertura: detail.dataAbertura || '',
      pessoaJuridicaId: detail.pessoaJuridicaId || ''
    })
    showForm.value = true
  } catch (err) {
    error.value = extractErrorMessage(err, 'Não foi possível carregar os dados da empresa.')
  }
}

async function removeCompany(id) {
  if (!confirm('Deseja excluir esta empresa?')) return

  saving.value = true
  error.value = ''
  successMessage.value = ''

  try {
    await deleteCompany(id)
    successMessage.value = 'Empresa excluída com sucesso.'
    await refreshCompanies()
  } catch (err) {
    error.value = extractErrorMessage(err, 'Não foi possível excluir a empresa.')
  } finally {
    saving.value = false
  }
}

function formatCnpj(cnpj) {
  const value = String(cnpj || '').replace(/\D/g, '')
  if (value.length !== 14) return cnpj || '-'
  return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

function formatType(type) {
  const labels = { MATRIZ: 'Matriz', FILIAL: 'Filial' }
  return labels[type] || type || '-'
}

function formatStatus(status) {
  const labels = { ATIVA: 'Ativa', SUSPENSA: 'Suspensa', ENCERRADA: 'Encerrada' }
  return labels[status] || status || '-'
}

function formatRegime(regime) {
  const labels = {
    SIMPLES_NACIONAL: 'Simples Nacional',
    LUCRO_PRESUMIDO: 'Lucro Presumido',
    LUCRO_REAL: 'Lucro Real'
  }
  return labels[regime] || regime || '-'
}

function statusClass(status) {
  if (status === 'ATIVA') return 'ok'
  if (status === 'SUSPENSA') return 'warning'
  return 'danger'
}
</script>

<style scoped>
.module-page{display:flex;flex-direction:column;gap:20px}.module-toolbar{display:flex;gap:14px;align-items:center}.module-toolbar>*:first-child{flex:1}.company-form,.results-card{background:#fff;border:1px solid #dce5ef;border-radius:20px;padding:24px;box-shadow:var(--panel-shadow)}.eyebrow{margin:0;color:#5c6b7a;text-transform:uppercase;letter-spacing:.08em;font-size:12px}h2{margin:6px 0 6px}.results-header p{margin:0;color:#5c6b7a}.form-header,.form-actions,.results-header{display:flex;justify-content:space-between;gap:12px;align-items:center}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:18px}.form-grid label{display:flex;flex-direction:column;gap:8px;font-weight:700;color:#1c2a39}.form-grid input,.form-grid select{border:1px solid #dce5ef;border-radius:14px;padding:13px 14px;outline:none;font:inherit;background:#fff}.form-grid input:focus,.form-grid select:focus{border-color:#1d5be3;box-shadow:0 0 0 3px rgba(29,91,227,.12)}.form-actions{justify-content:flex-end;margin-top:18px}.primary-action,.secondary-action,.ghost-action,.mini-action{border:0;border-radius:14px;padding:13px 18px;font-weight:800;cursor:pointer;white-space:nowrap}.primary-action:disabled,.secondary-action:disabled{opacity:.65;cursor:not-allowed}.primary-action{background:linear-gradient(135deg,#1d5be3,#0f44bd);color:#fff;box-shadow:0 10px 22px rgba(29,91,227,.22)}.secondary-action{background:#eef4fb;color:#123466}.ghost-action{background:transparent;color:#1d5be3}.table-wrap{overflow-x:auto}.data-table{width:100%;border-collapse:collapse;min-width:920px}.data-table th,.data-table td{text-align:left;padding:14px 12px;border-bottom:1px solid #eef2f6;vertical-align:top}.data-table th{font-size:12px;color:#5c6b7a;text-transform:uppercase;letter-spacing:.04em}.data-table small{display:block;color:#5c6b7a;margin-top:3px}.status-pill{display:inline-flex;border-radius:999px;padding:5px 10px;font-weight:800;font-size:12px}.status-pill.ok{background:#e8f7ef;color:#14763d}.status-pill.danger{background:#fff0ef;color:#bd2f24}.status-pill.warning{background:#fff6df;color:#936300}.actions{display:flex;gap:8px;flex-wrap:wrap}.mini-action{padding:8px 10px;background:#eef4fb;color:#123466}.danger-text{color:#bd2f24}.empty-state{margin:16px 0 0;color:#5c6b7a}.feedback{border-radius:14px;padding:12px 14px;margin:0;font-weight:700}.error-message{background:#fff0ef;color:#bd2f24;border:1px solid #ffd3cf}.success-message{background:#e8f7ef;color:#14763d;border:1px solid #bfebd0}@media(max-width:780px){.module-toolbar,.form-header,.form-actions,.results-header{flex-direction:column;align-items:stretch}.form-grid{grid-template-columns:1fr}}
</style>
