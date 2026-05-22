export const MENU_ITEMS = [
  { label: 'Empresa', to: '/empresa', permission: 'EMPRESA_LISTAR' },
  { label: 'Clientes', to: '/clientes', permission: 'CLIENTE_LISTAR' },
  { label: 'Estoque', to: '/estoque', permission: 'ESTOQUE_LISTAR' },
  { label: 'Produtos', to: '/produtos', permission: 'PRODUTO_LISTAR' }
].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
