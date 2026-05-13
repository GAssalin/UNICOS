export const MENU_ITEMS = [
  { label: 'Compras', to: '/compras' },
  { label: 'Estoque', to: '/estoque' },
  { label: 'Logística', to: '/logistica' },
  { label: 'Movimentações', to: '/movimentacoes' },
  { label: 'Produção', to: '/producao' },
  { label: 'Produtos', to: '/produtos' },
  { label: 'Qualidade', to: '/qualidade' },
  { label: 'RH', to: '/rh' },
  { label: 'TI', to: '/ti' },
  { label: 'Vendas', to: '/vendas' }
].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
