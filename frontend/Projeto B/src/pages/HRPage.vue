<template>
  <section class="module-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Módulo Administrativo</p>
        <h1>Recursos Humanos</h1>
        <p>Gerencie funcionários, cargos e usuários vinculados ao sistema.</p>
      </div>
    </header>

    <div class="summary-grid">
      <article class="summary-card"><span>Funcionários</span><strong>{{ employees.length }}</strong></article>
      <article class="summary-card"><span>Cargos</span><strong>{{ roles.length }}</strong></article>
      <article class="summary-card"><span>Usuários</span><strong>{{ users.length }}</strong></article>
    </div>

    <div class="tabs">
      <button :class="{ active: activeTab === 'employees' }" @click="activeTab = 'employees'">Funcionários</button>
      <button :class="{ active: activeTab === 'roles' }" @click="activeTab = 'roles'">Cargos</button>
      <button :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">Usuários</button>
    </div>

    <div class="results-card">
      <div class="results-header">
        <div><h2>{{ currentTitle }}</h2><p>{{ currentDescription }}</p></div>
        <button class="primary-action" type="button" @click="toggleForm">
          {{ showForm ? 'Fechar cadastro' : currentButton }}
        </button>
      </div>

      <div class="search-row">
        <input v-model="search" type="text" :placeholder="searchPlaceholder" />
      </div>

      <!-- Funcionários -->
      <div v-if="showForm && activeTab === 'employees'" class="form-card">
        <h3>{{ editingId ? 'Editar funcionário' : 'Novo funcionário' }}</h3>
        <form class="form-grid" @submit.prevent="saveEmployee">
          <label>Nome completo<input v-model="employeeForm.nome" required placeholder="Ex: João da Silva" /></label>
          <label>CPF<input :value="employeeForm.cpf" maxlength="14" placeholder="000.000.000-00" @input="employeeForm.cpf = maskCpf($event.target.value)" /></label>
          <label>Cargo
            <select v-model="employeeForm.cargoId">
              <option value="">Selecione um cargo</option>
              <option v-for="role in activeRoles" :key="role.id" :value="role.id">{{ role.nome }}</option>
            </select>
          </label>
          <label>Departamento<input v-model="employeeForm.departamento" placeholder="Ex: Administrativo" /></label>
          <label>Data de admissão<input v-model="employeeForm.admissao" type="date" /></label>
          <label>Telefone<input :value="employeeForm.telefone" maxlength="15" placeholder="(11) 99999-9999" @input="employeeForm.telefone = maskPhone($event.target.value)" /></label>
          <label>E-mail<input v-model="employeeForm.email" type="email" placeholder="funcionario@empresa.com" /></label>
          <label>Status
            <select v-model="employeeForm.status">
              <option value="active">Ativo</option><option value="vacation">Férias</option>
              <option value="away">Afastado</option><option value="inactive">Desligado</option>
            </select>
          </label>
          <div class="form-actions">
            <button type="button" class="secondary-action" @click="resetAllForms">{{ editingId ? 'Cancelar edição' : 'Limpar' }}</button>
            <button type="submit" class="primary-action">{{ editingId ? 'Atualizar funcionário' : 'Salvar funcionário' }}</button>
          </div>
        </form>
      </div>

      <!-- Cargos -->
      <div v-if="showForm && activeTab === 'roles'" class="form-card">
        <h3>{{ editingId ? 'Editar cargo' : 'Novo cargo' }}</h3>
        <form class="form-grid" @submit.prevent="saveRole">
          <label>Nome do cargo<input v-model="roleForm.nome" required placeholder="Ex: Analista Administrativo" /></label>
          <label>Departamento<input v-model="roleForm.departamento" required placeholder="Ex: Administrativo" /></label>
          <label>Salário base<input v-model.number="roleForm.salarioBase" type="number" min="0" step="0.01" /></label>
          <label>Status<select v-model="roleForm.status"><option value="active">Ativo</option><option value="inactive">Inativo</option></select></label>
          <label class="full-field">Descrição<textarea v-model="roleForm.descricao" rows="3" placeholder="Principais responsabilidades do cargo"></textarea></label>
          <div class="form-actions">
            <button type="button" class="secondary-action" @click="resetAllForms">{{ editingId ? 'Cancelar edição' : 'Limpar' }}</button>
            <button type="submit" class="primary-action">{{ editingId ? 'Atualizar cargo' : 'Salvar cargo' }}</button>
          </div>
        </form>
      </div>

      <!-- Usuários -->
      <div v-if="showForm && activeTab === 'users'" class="form-card">
        <h3>{{ editingId ? 'Editar usuário' : 'Novo usuário' }}</h3>
        <form class="form-grid" @submit.prevent="saveUser">
          <label>Funcionário
            <select v-model="userForm.employeeId" required>
              <option value="">Selecione um funcionário</option>
              <option v-for="employee in employees" :key="employee.id" :value="employee.id">{{ employee.nome }}</option>
            </select>
          </label>
          <label>Nome de usuário<input v-model.trim="userForm.username" required autocomplete="off" placeholder="Ex: joao.silva" /></label>
          <label>Perfil<select v-model="userForm.profile"><option>Administrador</option><option>Gestor</option><option>Operador</option><option>Consulta</option></select></label>
          <label>Status<select v-model="userForm.status"><option value="active">Ativo</option><option value="inactive">Inativo</option></select></label>
          <label>Senha<input v-model="userForm.password" :required="!editingId" type="password" autocomplete="new-password" placeholder="Mínimo de 6 caracteres" /></label>
          <label>Confirmar senha<input v-model="userForm.passwordConfirmation" :required="!editingId" type="password" autocomplete="new-password" /></label>
          <div class="form-actions">
            <button type="button" class="secondary-action" @click="resetAllForms">{{ editingId ? 'Cancelar edição' : 'Limpar' }}</button>
            <button type="submit" class="primary-action">{{ editingId ? 'Atualizar usuário' : 'Salvar usuário' }}</button>
          </div>
        </form>
      </div>

      <div class="table-wrap">
        <table v-if="filteredItems.length" class="data-table">
          <thead><tr><th v-for="column in currentColumns" :key="column">{{ column }}</th><th>Ações</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredItems" :key="item.id">
              <template v-if="activeTab === 'employees'">
                <td>{{ item.nome }}</td><td>{{ roleName(item.cargoId) || item.cargo || '-' }}</td><td>{{ item.departamento || '-' }}</td>
                <td>{{ formatDate(item.admissao) }}</td><td><span :class="['status-pill', item.status]">{{ employeeStatus(item.status) }}</span></td>
              </template>
              <template v-else-if="activeTab === 'roles'">
                <td>{{ item.nome }}</td><td>{{ item.departamento }}</td><td>{{ currency(item.salarioBase) }}</td>
                <td>{{ employeesByRole(item.id) }}</td><td><span :class="['status-pill', item.status]">{{ item.status === 'active' ? 'Ativo' : 'Inativo' }}</span></td>
              </template>
              <template v-else>
                <td>{{ employeeName(item.employeeId) }}</td><td>{{ item.username }}</td><td>{{ item.profile }}</td>
                <td><span :class="['status-pill', item.status]">{{ item.status === 'active' ? 'Ativo' : 'Inativo' }}</span></td>
              </template>
              <td><div class="actions"><button class="mini-action" type="button" @click="editItem(item)">Editar</button><button class="mini-action danger" type="button" @click="requestDelete(item)">Excluir</button></div></td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty-state">Nenhum registro encontrado.</p>
      </div>
    </div>

    <div v-if="toast" class="toast" role="status">{{ toast }}</div>
    <div v-if="deleteTarget" class="modal-backdrop" @click.self="deleteTarget = null">
      <div class="modal-card"><h3>Confirmar exclusão</h3><p>Deseja realmente excluir <strong>{{ deleteLabel }}</strong>?</p><div class="modal-actions"><button class="secondary-action" @click="deleteTarget = null">Cancelar</button><button class="danger-action" @click="confirmDelete">Excluir</button></div></div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useHR } from '../composables/useHR'

const activeTab = ref('employees')
const showForm = ref(false)
const search = ref('')
const editingId = ref(null)
const deleteTarget = ref(null)
const toast = ref('')

const { employees, roles, users, addEmployee, updateEmployee, deleteEmployee, addRole, updateRole, deleteRole, addUser, updateUser, deleteUser } = useHR()

const emptyEmployee = () => ({ nome: '', cpf: '', cargoId: '', departamento: '', admissao: '', telefone: '', email: '', status: 'active' })
const emptyRole = () => ({ nome: '', departamento: '', descricao: '', salarioBase: 0, status: 'active' })
const emptyUser = () => ({ employeeId: '', username: '', profile: 'Operador', status: 'active', password: '', passwordConfirmation: '' })
const employeeForm = ref(emptyEmployee())
const roleForm = ref(emptyRole())
const userForm = ref(emptyUser())

const activeRoles = computed(() => roles.value.filter((role) => role.status === 'active').sort((a,b) => a.nome.localeCompare(b.nome, 'pt-BR')))
const normalizedSearch = computed(() => search.value.trim().toLowerCase())
const filteredItems = computed(() => {
  const source = activeTab.value === 'employees' ? employees.value : activeTab.value === 'roles' ? roles.value : users.value
  return source.filter((item) => JSON.stringify(item).toLowerCase().includes(normalizedSearch.value)).slice().sort((a,b) => String(a.nome || a.username || '').localeCompare(String(b.nome || b.username || ''), 'pt-BR'))
})
const currentTitle = computed(() => activeTab.value === 'employees' ? 'Funcionários' : activeTab.value === 'roles' ? 'Cargos' : 'Usuários')
const currentDescription = computed(() => activeTab.value === 'employees' ? 'Cadastro e acompanhamento dos colaboradores.' : activeTab.value === 'roles' ? 'Cadastro de cargos, departamentos e faixas salariais.' : 'Cadastro de usuários e perfis de acesso ao sistema.')
const currentButton = computed(() => activeTab.value === 'employees' ? 'Novo funcionário' : activeTab.value === 'roles' ? 'Novo cargo' : 'Novo usuário')
const searchPlaceholder = computed(() => `Pesquisar ${currentTitle.value.toLowerCase()}...`)
const currentColumns = computed(() => activeTab.value === 'employees' ? ['Nome','Cargo','Departamento','Admissão','Status'] : activeTab.value === 'roles' ? ['Cargo','Departamento','Salário base','Funcionários','Status'] : ['Funcionário','Usuário','Perfil','Status'])
const deleteLabel = computed(() => deleteTarget.value?.nome || deleteTarget.value?.username || 'este registro')

function notify(message) { toast.value = message; window.setTimeout(() => { if (toast.value === message) toast.value = '' }, 2600) }
function toggleForm() { if (showForm.value) resetAllForms(); else showForm.value = true }
function resetAllForms() { employeeForm.value = emptyEmployee(); roleForm.value = emptyRole(); userForm.value = emptyUser(); editingId.value = null; showForm.value = false }
function maskCpf(value) { return value.replace(/\D/g,'').slice(0,11).replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2') }
function maskPhone(value) { const n=value.replace(/\D/g,'').slice(0,11); return n.length > 10 ? n.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3') : n.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3') }
function formatDate(value) { if (!value) return '-'; const [y,m,d]=value.split('-'); return y && m && d ? `${d}/${m}/${y}` : value }
function currency(value) { return Number(value || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) }
function employeeStatus(status) { return ({active:'Ativo',vacation:'Férias',away:'Afastado',inactive:'Desligado'})[status] || 'Não informado' }
function roleName(id) { return roles.value.find((r) => r.id === id)?.nome || '' }
function employeeName(id) { return employees.value.find((e) => e.id === id)?.nome || 'Funcionário não encontrado' }
function employeesByRole(id) { return employees.value.filter((e) => e.cargoId === id).length }

function saveEmployee() { const payload={...employeeForm.value}; editingId.value ? updateEmployee(editingId.value,payload) : addEmployee(payload); notify(editingId.value ? 'Funcionário atualizado com sucesso.' : 'Funcionário cadastrado com sucesso.'); resetAllForms() }
function saveRole() { const payload={...roleForm.value}; editingId.value ? updateRole(editingId.value,payload) : addRole(payload); notify(editingId.value ? 'Cargo atualizado com sucesso.' : 'Cargo cadastrado com sucesso.'); resetAllForms() }
function saveUser() {
  if (userForm.value.password || userForm.value.passwordConfirmation) {
    if (userForm.value.password.length < 6) return notify('A senha deve ter pelo menos 6 caracteres.')
    if (userForm.value.password !== userForm.value.passwordConfirmation) return notify('As senhas não coincidem.')
  }
  const duplicate=users.value.some((u)=>u.username.toLowerCase()===userForm.value.username.toLowerCase() && u.id!==editingId.value)
  if (duplicate) return notify('Este nome de usuário já está em uso.')
  const payload={...userForm.value}; delete payload.passwordConfirmation
  if (!payload.password) delete payload.password
  editingId.value ? updateUser(editingId.value,payload) : addUser(payload)
  notify(editingId.value ? 'Usuário atualizado com sucesso.' : 'Usuário cadastrado com sucesso.'); resetAllForms()
}
function editItem(item) { editingId.value=item.id; showForm.value=true; if(activeTab.value==='employees') employeeForm.value={...emptyEmployee(),...item}; else if(activeTab.value==='roles') roleForm.value={...emptyRole(),...item}; else userForm.value={...emptyUser(),...item,password:'',passwordConfirmation:''} }
function requestDelete(item) { deleteTarget.value=item }
function confirmDelete() {
  const item=deleteTarget.value
  if(activeTab.value==='roles' && employeesByRole(item.id)>0){ notify('Não é possível excluir um cargo vinculado a funcionários.'); deleteTarget.value=null; return }
  if(activeTab.value==='employees'){ deleteEmployee(item.id); users.value.filter(u=>u.employeeId===item.id).forEach(u=>deleteUser(u.id)) }
  else if(activeTab.value==='roles') deleteRole(item.id)
  else deleteUser(item.id)
  deleteTarget.value=null; notify('Registro excluído com sucesso.'); resetAllForms()
}
watch(activeTab,()=>{ search.value=''; deleteTarget.value=null; resetAllForms() })
</script>

<style scoped>
.module-page{display:flex;flex-direction:column;gap:20px}.page-header h1{margin:4px 0;color:#123466}.page-header p,.results-header p{margin:0;color:#5c6b7a}.eyebrow{margin:0;color:#5c6b7a;text-transform:uppercase;letter-spacing:.08em;font-size:12px;font-weight:800}.summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.summary-card,.results-card,.form-card{background:#fff;border:1px solid #dce5ef;border-radius:20px;padding:24px;box-shadow:var(--panel-shadow)}.summary-card{display:flex;flex-direction:column;gap:10px}.summary-card span{color:#5c6b7a;font-weight:700}.summary-card strong{font-size:30px;color:#123466}.tabs{display:flex;gap:10px;background:#eef4fb;padding:8px;border-radius:18px;width:fit-content}.tabs button{border:0;background:transparent;color:#123466;font-weight:800;padding:12px 18px;border-radius:14px;cursor:pointer}.tabs button.active{background:#fff;box-shadow:0 8px 18px rgba(16,35,92,.12)}.results-header{display:flex;justify-content:space-between;gap:12px;align-items:center}.results-header h2{margin:0 0 4px;color:#123466}.primary-action,.secondary-action,.danger-action,.mini-action{border:0;border-radius:14px;padding:13px 18px;font-weight:800;cursor:pointer}.primary-action{background:linear-gradient(135deg,#1d5be3,#0f44bd);color:#fff;box-shadow:0 10px 22px rgba(29,91,227,.22)}.secondary-action{background:#eef4fb;color:#123466}.danger-action{background:#bd2f24;color:#fff}.form-card{margin-top:18px;background:#f8fbff}.form-card h3{margin-top:0;color:#123466}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.form-grid label{display:flex;flex-direction:column;gap:8px;font-weight:700;color:#1c2a39}.form-grid input,.form-grid select,.form-grid textarea,.search-row input{width:100%;min-height:52px;border:1px solid #dce5ef;border-radius:14px;padding:13px 14px;outline:none;font:inherit;color:#102033;background:#fff;box-sizing:border-box}.form-grid input:focus,.form-grid select:focus,.form-grid textarea:focus,.search-row input:focus{border-color:#1d5be3;box-shadow:0 0 0 3px rgba(29,91,227,.12)}.full-field{grid-column:1/-1}.form-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:12px}.search-row{margin-top:18px}.table-wrap{margin-top:18px;overflow-x:auto}.data-table{width:100%;border-collapse:collapse;min-width:860px}.data-table th,.data-table td{text-align:left;padding:14px 12px;border-bottom:1px solid #eef2f6}.data-table th{font-size:12px;color:#5c6b7a;text-transform:uppercase;letter-spacing:.04em}.status-pill{display:inline-flex;border-radius:999px;padding:5px 10px;font-weight:800;font-size:12px}.status-pill.active{background:#e8f7ef;color:#14763d}.status-pill.vacation{background:#fff7df;color:#946200}.status-pill.away{background:#fff0ef;color:#bd5b24}.status-pill.inactive{background:#eef2f6;color:#5c6b7a}.actions{display:flex;gap:8px}.mini-action{padding:8px 12px;background:#eef4fb;color:#123466}.mini-action.danger{background:#ffe9e9;color:#b42318}.empty-state{margin:18px 0 0;color:#5c6b7a}.toast{position:fixed;right:28px;bottom:28px;z-index:1200;background:#123466;color:#fff;padding:14px 18px;border-radius:14px;box-shadow:0 18px 36px rgba(18,52,102,.25);font-weight:700}.modal-backdrop{position:fixed;inset:0;z-index:1100;background:rgba(6,25,54,.48);display:grid;place-items:center;padding:20px}.modal-card{width:min(440px,100%);background:#fff;border-radius:20px;padding:24px;box-shadow:0 28px 70px rgba(6,25,54,.3)}.modal-card h3{margin-top:0;color:#123466}.modal-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:22px}@media(max-width:780px){.summary-grid,.form-grid{grid-template-columns:1fr}.tabs,.results-header{width:100%;flex-direction:column;align-items:stretch}.full-field{grid-column:auto}}
</style>
