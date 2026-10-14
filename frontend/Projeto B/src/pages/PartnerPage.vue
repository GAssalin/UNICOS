<template>
  <section class="module-page">
    <div class="module-toolbar">
      <ModuleSearch
        v-model="search"
        :field-id="`${config.storageName}-search`"
        placeholder="Buscar por nome, código, documento, e-mail, cidade ou responsável"
      />
      <button class="primary-action" type="button" @click="openCreate">+ {{ config.createLabel }}</button>
    </div>

    <PartnerSummary
      :total="partners.length"
      :active="activeCount"
      :inactive="partners.length - activeCount"
    />

    <PartnerForm
      v-if="showForm"
      :form="form"
      :config="config"
      :type="type"
      :editing-id="editingId"
      @save="savePartner"
      @cancel="closeForm"
      @reset="resetForm"
    />

    <PartnerTable
      :partners="filteredPartners"
      :config="config"
      :type="type"
      @edit="editPartner"
      @remove="removePartner"
    />
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import ModuleSearch from '../components/ModuleSearch.vue'
import PartnerForm from '../components/partners/PartnerForm.vue'
import PartnerSummary from '../components/partners/PartnerSummary.vue'
import PartnerTable from '../components/partners/PartnerTable.vue'
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
  cep: '',
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  usuarioResponsavel: '',
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
    [
      partner.codigo,
      partner.nome,
      partner.documento,
      partner.telefone,
      partner.email,
      partner.cidade,
      partner.usuarioResponsavel,
      partner.status
    ]
      .join(' ')
      .toLowerCase()
      .includes(term)
  )
})

watch(
  () => props.type,
  () => {
    closeForm()
    search.value = ''
  }
)

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
  Object.assign(form, emptyForm(), partner)
  showForm.value = true
}

function removePartner(id) {
  if (confirm(config.value.confirmDelete)) {
    crud.value.remove(id)
  }
}
</script>

<style scoped>
.module-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.module-toolbar {
  display: flex;
  gap: 14px;
  align-items: center;
}

.module-toolbar > *:first-child {
  flex: 1;
}

.primary-action {
  border: 0;
  border-radius: 14px;
  padding: 13px 18px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  background: linear-gradient(135deg, #1d5be3, #0f44bd);
  color: #fff;
  box-shadow: 0 10px 22px rgba(29, 91, 227, .22);
}

@media (max-width: 780px) {
  .module-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
