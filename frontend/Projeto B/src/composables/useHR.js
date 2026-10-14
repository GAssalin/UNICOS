import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'unicos_hr_data'

const defaultData = {
  employees: [],
  roles: [],
  users: []
}

const savedData = localStorage.getItem(STORAGE_KEY)

const state = ref(savedData ? JSON.parse(savedData) : defaultData)

watch(
  state,
  () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
  },
  { deep: true }
)

function createId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random())
}

export function useHR() {
  const employees = computed(() => state.value.employees)
  const roles = computed(() => state.value.roles)
  const users = computed(() => state.value.users)

  function addEmployee(employee) {
    state.value.employees.push({
      id: createId(),
      createdAt: new Date().toISOString(),
      ...employee
    })
  }

  function updateEmployee(id, employee) {
    const index = state.value.employees.findIndex((item) => item.id === id)
    if (index !== -1) {
      state.value.employees[index] = {
        ...state.value.employees[index],
        ...employee
      }
    }
  }

  function deleteEmployee(id) {
    state.value.employees = state.value.employees.filter((item) => item.id !== id)
  }

  function addRole(role) {
    state.value.roles.push({
      id: createId(),
      createdAt: new Date().toISOString(),
      ...role
    })
  }

  function updateRole(id, role) {
    const index = state.value.roles.findIndex((item) => item.id === id)
    if (index !== -1) {
      state.value.roles[index] = {
        ...state.value.roles[index],
        ...role
      }
    }
  }

  function deleteRole(id) {
    state.value.roles = state.value.roles.filter((item) => item.id !== id)
  }

  function addUser(user) {
    state.value.users.push({
      id: createId(),
      createdAt: new Date().toISOString(),
      ...user
    })
  }

  function updateUser(id, user) {
    const index = state.value.users.findIndex((item) => item.id === id)
    if (index !== -1) {
      state.value.users[index] = {
        ...state.value.users[index],
        ...user
      }
    }
  }

  function deleteUser(id) {
    state.value.users = state.value.users.filter((item) => item.id !== id)
  }

  return {
    employees,
    roles,
    users,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addRole,
    updateRole,
    deleteRole,
    addUser,
    updateUser,
    deleteUser
  }
}