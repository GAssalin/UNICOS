import { computed, ref, watch } from 'vue'

const CLIENTS_KEY = 'unicos_clients_v1'
const SUPPLIERS_KEY = 'unicos_suppliers_v1'

const defaultClients = [
  {
    id: 'cli-001',
    codigo: 'CLI-001',
    nome: 'Cliente Padrão',
    documento: '00.000.000/0001-00',
    telefone: '(11) 99999-0000',
    email: 'cliente@exemplo.com',
    cidade: 'Santo André',
    status: 'Ativo',
    observacao: 'Cadastro inicial para testes.'
  }
]

const defaultSuppliers = [
  {
    id: 'for-001',
    codigo: 'FOR-001',
    nome: 'Fornecedor Padrão',
    documento: '11.111.111/0001-11',
    telefone: '(11) 3333-0000',
    email: 'fornecedor@exemplo.com',
    cidade: 'São Paulo',
    status: 'Ativo',
    observacao: 'Fornecedor utilizado nos cadastros iniciais.'
  },
  {
    id: 'for-002',
    codigo: 'FOR-002',
    nome: 'Casa dos Insumos',
    documento: '22.222.222/0001-22',
    telefone: '(11) 4444-0000',
    email: 'compras@casadosinsumos.com',
    cidade: 'São Bernardo do Campo',
    status: 'Ativo',
    observacao: 'Fornecedor de materiais de fixação.'
  }
]

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const clients = ref(readStorage(CLIENTS_KEY, defaultClients))
const suppliers = ref(readStorage(SUPPLIERS_KEY, defaultSuppliers))

watch(clients, (value) => localStorage.setItem(CLIENTS_KEY, JSON.stringify(value)), { deep: true })
watch(suppliers, (value) => localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(value)), { deep: true })

function normalizePartner(payload) {
  return {
    codigo: payload.codigo?.trim(),
    nome: payload.nome?.trim(),
    documento: payload.documento?.trim(),
    telefone: payload.telefone?.trim(),
    email: payload.email?.trim(),
    cidade: payload.cidade?.trim(),
    status: payload.status || 'Ativo',
    observacao: payload.observacao?.trim() || ''
  }
}

function createCrud(collection, prefix) {
  function add(payload) {
    collection.value.unshift({
      id: uid(prefix),
      ...normalizePartner(payload)
    })
  }

  function update(id, payload) {
    const index = collection.value.findIndex((item) => item.id === id)
    if (index === -1) return

    collection.value[index] = {
      ...collection.value[index],
      ...normalizePartner(payload)
    }
  }

  function remove(id) {
    collection.value = collection.value.filter((item) => item.id !== id)
  }

  const activeCount = computed(() => collection.value.filter((item) => item.status === 'Ativo').length)

  return {
    items: collection,
    activeCount,
    add,
    update,
    remove
  }
}

export function useBusinessPartners() {
  return {
    clients: createCrud(clients, 'cli'),
    suppliers: createCrud(suppliers, 'for')
  }
}
