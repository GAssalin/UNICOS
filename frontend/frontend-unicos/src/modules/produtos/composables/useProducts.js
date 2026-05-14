import { computed, reactive, ref } from 'vue'
import {
  activateProduct,
  createProduct,
  deleteProduct,
  getProductById,
  inactivateProduct,
  listBrands,
  listCategories,
  listProducts,
  listUnits,
  updateProduct
} from '@/modules/produtos/services/productService'

const state = reactive({
  products: [],
  units: [],
  categories: [],
  brands: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0
})

const loading = ref(false)
const saving = ref(false)
const error = ref('')

function extractErrorMessage(err, fallback = 'Não foi possível executar a operação.') {
  return err?.message || fallback
}

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isNaN(number) ? null : number
}

function normalizeProduct(product = {}) {
  return {
    ...product,
    precoBase: product.precoBase ?? 0,
    ativo: product.ativo !== false
  }
}

export function buildProductPayload(form, { includeCodigo = true } = {}) {
  const payload = {
    nome: String(form.nome || '').trim(),
    descricao: String(form.descricao || '').trim() || null,
    tipoProduto: form.tipoProduto || 'PRODUTO',
    unidadeMedidaId: toNumberOrNull(form.unidadeMedidaId),
    categoriaId: toNumberOrNull(form.categoriaId),
    marcaId: toNumberOrNull(form.marcaId),
    codigoBarras: String(form.codigoBarras || '').trim() || null,
    precoBase: Number(form.precoBase || 0),
    peso: form.peso === '' || form.peso === null || form.peso === undefined ? null : Number(form.peso),
    volume: form.volume === '' || form.volume === null || form.volume === undefined ? null : Number(form.volume)
  }

  if (includeCodigo) {
    payload.codigo = String(form.codigo || '').trim()
  }

  return payload
}

export function useProducts() {
  async function loadProducts({ page = state.page, size = state.size, nome = '' } = {}) {
    loading.value = true
    error.value = ''

    try {
      const response = await listProducts({ page, size, nome })
      state.products = response.content.map(normalizeProduct)
      state.page = response.number
      state.size = response.size || size
      state.totalElements = response.totalElements
      state.totalPages = response.totalPages
    } catch (err) {
      error.value = extractErrorMessage(err, 'Não foi possível carregar os produtos.')
      state.products = []
    } finally {
      loading.value = false
    }
  }

  async function loadOptions() {
    try {
      const [unitsPage, categoriesPage, brandsPage] = await Promise.all([
        listUnits(),
        listCategories(),
        listBrands()
      ])

      state.units = unitsPage.content.filter((item) => item.ativo !== false)
      state.categories = categoriesPage.content.filter((item) => item.ativo !== false)
      state.brands = brandsPage.content.filter((item) => item.ativo !== false)
    } catch (err) {
      error.value = extractErrorMessage(err, 'Não foi possível carregar as opções do cadastro.')
    }
  }

  async function findProduct(id) {
    return normalizeProduct(await getProductById(id))
  }

  async function saveProduct(form, editingId = null) {
    saving.value = true
    error.value = ''

    try {
      if (editingId) {
        return normalizeProduct(await updateProduct(editingId, buildProductPayload(form, { includeCodigo: false })))
      }

      return normalizeProduct(await createProduct(buildProductPayload(form)))
    } catch (err) {
      error.value = extractErrorMessage(err, 'Não foi possível salvar o produto.')
      throw err
    } finally {
      saving.value = false
    }
  }

  async function removeProduct(id) {
    saving.value = true
    error.value = ''

    try {
      await deleteProduct(id)
    } catch (err) {
      error.value = extractErrorMessage(err, 'Não foi possível excluir o produto.')
      throw err
    } finally {
      saving.value = false
    }
  }

  async function toggleProductStatus(product) {
    saving.value = true
    error.value = ''

    try {
      return product.ativo ? await inactivateProduct(product.id) : await activateProduct(product.id)
    } catch (err) {
      error.value = extractErrorMessage(err, 'Não foi possível alterar o status do produto.')
      throw err
    } finally {
      saving.value = false
    }
  }

  return {
    products: computed(() => state.products),
    units: computed(() => state.units),
    categories: computed(() => state.categories),
    brands: computed(() => state.brands),
    page: computed(() => state.page),
    size: computed(() => state.size),
    totalElements: computed(() => state.totalElements),
    totalPages: computed(() => state.totalPages),
    loading,
    saving,
    error,
    loadProducts,
    loadOptions,
    findProduct,
    saveProduct,
    removeProduct,
    toggleProductStatus
  }
}
