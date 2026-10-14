<template>
  <section class="module-page">
    <div class="module-toolbar">
      <input v-model="search" class="search-input" placeholder="Pesquisar venda por número, cliente, vendedor ou status..." />
      <button class="primary-action" type="button" @click="openCreate">+ Nova venda</button>
    </div>

    <div class="summary-grid">
      <article class="summary-card"><span>Vendas cadastradas</span><strong>{{ sales.length }}</strong></article>
      <article class="summary-card"><span>Vendas faturadas</span><strong>{{ billedCount }}</strong></article>
      <article class="summary-card"><span>Valor faturado</span><strong>{{ currency(salesTotal) }}</strong></article>
    </div>

    <form v-if="showForm" class="sale-form" @submit.prevent="saveSale">
      <div class="form-header">
        <div><p class="eyebrow">Operação comercial</p><h2>{{ editingId ? 'Editar venda' : 'Cadastrar venda' }}</h2></div>
        <button class="ghost-action" type="button" @click="closeForm">Fechar</button>
      </div>

      <div class="form-card-section">
        <h3>Dados da venda</h3>
        <div class="form-grid">
          <label>Número<input v-model="form.numero" required placeholder="Ex: VEN-0001" /></label>
          <label>Data<input v-model="form.data" type="date" required /></label>
          <label>Cliente
            <select v-model="form.clienteId" required @change="syncClientName">
              <option value="">Selecione um cliente</option>
              <option v-for="client in activeClients" :key="client.id" :value="client.id">{{ client.nome }}</option>
            </select>
          </label>
          <label>Vendedor<input v-model="form.vendedor" required placeholder="Nome do responsável pela venda" /></label>
          <label>Nota fiscal<input v-model="form.notaFiscal" placeholder="Ex: NF-123456" /></label>
          <label>Status
            <select v-model="form.status">
              <option>Orçamento</option><option>Pendente</option><option>Faturada</option><option>Cancelada</option>
            </select>
          </label>
          <label>Desconto geral (R$)<input v-model.number="form.desconto" type="number" min="0" step="0.01" /></label>
        </div>
      </div>

      <div class="form-card-section">
        <div class="section-header"><h3>Produtos</h3><button class="secondary-action" type="button" @click="addItem">+ Adicionar item</button></div>
        <div v-for="(item,index) in form.items" :key="item.localId" class="item-row">
          <label class="product-field">Produto
            <select v-model="item.produtoId" required @change="fillProduct(item)">
              <option value="">Selecione um produto</option>
              <option v-for="product in productsWithStock" :key="product.id" :value="product.id">{{ product.codigo }} — {{ product.nome }} (saldo: {{ product.saldo }})</option>
            </select>
          </label>
          <label>Quantidade<input v-model.number="item.quantidade" type="number" min="1" step="1" required /></label>
          <label>Valor unitário<input v-model.number="item.precoUnitario" type="number" min="0" step="0.01" required /></label>
          <label>Desconto<input v-model.number="item.desconto" type="number" min="0" step="0.01" /></label>
          <div class="subtotal"><span>Subtotal</span><strong>{{ currency(itemSubtotal(item)) }}</strong></div>
          <button class="remove-item" type="button" title="Remover item" @click="removeItem(index)">×</button>
        </div>
        <p v-if="!form.items.length" class="empty-state">Adicione ao menos um produto à venda.</p>
      </div>

      <div class="form-card-section totals-card">
        <label>Observações<textarea v-model="form.observacoes" rows="4" placeholder="Condições comerciais, prazo ou outras informações"></textarea></label>
        <div class="totals">
          <span>Subtotal <strong>{{ currency(subtotal) }}</strong></span>
          <span>Descontos <strong>- {{ currency(totalDiscount) }}</strong></span>
          <span class="grand-total">Total <strong>{{ currency(total) }}</strong></span>
        </div>
      </div>

      <div class="form-actions">
        <button class="secondary-action" type="button" @click="closeForm">Cancelar</button>
        <button class="primary-action" type="submit">{{ editingId ? 'Salvar alterações' : 'Salvar venda' }}</button>
      </div>
    </form>

    <div class="results-card">
      <div class="results-header"><div><h2>Vendas cadastradas</h2><p>{{ filteredSales.length }} venda(s) encontrada(s)</p></div></div>
      <div class="table-wrap">
        <table v-if="filteredSales.length" class="data-table">
          <thead><tr><th>Número</th><th>Cliente</th><th>Data</th><th>Vendedor</th><th>Total</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody><tr v-for="sale in filteredSales" :key="sale.id">
            <td><strong>{{ sale.numero }}</strong></td><td>{{ sale.clienteNome }}</td><td>{{ formatDate(sale.data) }}</td><td>{{ sale.vendedor }}</td>
            <td>{{ currency(sale.total) }}</td><td><span :class="['status-pill', statusClass(sale.status)]">{{ sale.status }}</span></td>
            <td><div class="actions"><button class="mini-action" @click="editSale(sale)">Editar</button><button class="mini-action danger" @click="requestDelete(sale)">Excluir</button></div></td>
          </tr></tbody>
        </table>
        <p v-else class="empty-state">Nenhuma venda encontrada.</p>
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
    <div v-if="deleteTarget" class="modal-backdrop" @click.self="deleteTarget=null"><div class="modal-card"><h3>Excluir venda</h3><p>Deseja excluir a venda <strong>{{ deleteTarget.numero }}</strong>? Movimentações de estoque vinculadas serão revertidas.</p><div class="modal-actions"><button class="secondary-action" @click="deleteTarget=null">Cancelar</button><button class="danger-action" @click="confirmDelete">Excluir</button></div></div></div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useBusinessPartners } from '../composables/useBusinessPartners'
import { useInventory } from '../composables/useInventory'
import { useSales } from '../composables/useSales'

const { clients } = useBusinessPartners()
const { productsWithStock } = useInventory()
const { sales, salesTotal, addSale, updateSale, deleteSale } = useSales()

const search=ref(''); const showForm=ref(false); const editingId=ref(null); const toast=ref(''); const deleteTarget=ref(null)
const today=()=>new Date().toISOString().slice(0,10)
const emptyForm=()=>({numero:`VEN-${String(sales.value.length+1).padStart(4,'0')}`,data:today(),clienteId:'',clienteNome:'',vendedor:'',notaFiscal:'',status:'Orçamento',desconto:0,observacoes:'',items:[]})
const form=ref(emptyForm())
const activeClients=computed(()=>clients.items.value.filter(c=>c.status==='Ativo').sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR')))
const billedCount=computed(()=>sales.value.filter(s=>s.status==='Faturada').length)
const subtotal=computed(()=>form.value.items.reduce((sum,item)=>sum+(Number(item.quantidade)||0)*(Number(item.precoUnitario)||0),0))
const itemDiscounts=computed(()=>form.value.items.reduce((sum,item)=>sum+(Number(item.desconto)||0),0))
const totalDiscount=computed(()=>itemDiscounts.value+(Number(form.value.desconto)||0))
const total=computed(()=>Math.max(0,subtotal.value-totalDiscount.value))
const filteredSales=computed(()=>{const q=search.value.trim().toLowerCase();return sales.value.filter(s=>[s.numero,s.clienteNome,s.vendedor,s.status].join(' ').toLowerCase().includes(q)).slice().sort((a,b)=>b.data.localeCompare(a.data))})

function localId(){return `${Date.now()}-${Math.random()}`}
function addItem(){form.value.items.push({localId:localId(),produtoId:'',produtoNome:'',quantidade:1,precoUnitario:0,desconto:0})}
function removeItem(index){form.value.items.splice(index,1)}
function fillProduct(item){const p=productsWithStock.value.find(x=>x.id===item.produtoId);if(p){item.produtoNome=p.nome;item.precoUnitario=Number(p.precoVenda)||0}}
function syncClientName(){form.value.clienteNome=activeClients.value.find(c=>c.id===form.value.clienteId)?.nome||''}
function itemSubtotal(item){return Math.max(0,(Number(item.quantidade)||0)*(Number(item.precoUnitario)||0)-(Number(item.desconto)||0))}
function currency(value){return Number(value||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function formatDate(value){if(!value)return '-';const [y,m,d]=value.split('-');return `${d}/${m}/${y}`}
function statusClass(status){return ({Faturada:'success',Pendente:'warning',Cancelada:'danger',Orçamento:'neutral'})[status]||'neutral'}
function notify(message){toast.value=message;setTimeout(()=>{if(toast.value===message)toast.value=''},2800)}
function openCreate(){editingId.value=null;form.value=emptyForm();addItem();showForm.value=true;window.scrollTo({top:0,behavior:'smooth'})}
function closeForm(){showForm.value=false;editingId.value=null;form.value=emptyForm()}
function saveSale(){
  if(!form.value.items.length)return notify('Adicione ao menos um produto.')
  if(form.value.items.some(i=>!i.produtoId||Number(i.quantidade)<=0))return notify('Revise os produtos e quantidades informados.')
  syncClientName()
  const payload={...form.value,items:form.value.items.map(({localId,...item})=>({...item})),subtotal:subtotal.value,desconto:Number(form.value.desconto)||0,total:total.value}
  const result=editingId.value?updateSale(editingId.value,payload):addSale(payload)
  if(!result.ok)return notify(result.message)
  notify(editingId.value?'Venda atualizada com sucesso.':'Venda cadastrada com sucesso.');closeForm()
}
function editSale(sale){editingId.value=sale.id;form.value={...emptyForm(),...sale,items:sale.items.map(i=>({...i,localId:localId()}))};showForm.value=true;window.scrollTo({top:0,behavior:'smooth'})}
function requestDelete(sale){deleteTarget.value=sale}
function confirmDelete(){deleteSale(deleteTarget.value.id);deleteTarget.value=null;notify('Venda excluída e estoque atualizado.')}
</script>

<style scoped>
.module-page{display:flex;flex-direction:column;gap:20px}.module-toolbar{display:flex;gap:14px;align-items:center}.search-input{flex:1}.summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.summary-card,.sale-form,.results-card{background:#fff;border:1px solid #dce5ef;border-radius:20px;padding:24px;box-shadow:var(--panel-shadow)}.summary-card{display:flex;flex-direction:column;gap:10px}.summary-card span{color:#5c6b7a;font-weight:700}.summary-card strong{font-size:28px;color:#123466}.form-header,.form-actions,.results-header,.section-header{display:flex;justify-content:space-between;gap:12px;align-items:center}.eyebrow{margin:0;color:#5c6b7a;text-transform:uppercase;letter-spacing:.08em;font-size:12px}.form-header h2,.results-header h2{margin:6px 0;color:#123466}.results-header p{margin:0;color:#5c6b7a}.form-card-section{background:#f8fbff;border:1px solid #e3ebf5;border-radius:18px;padding:20px;margin-top:18px}.form-card-section h3{margin:0 0 16px;color:#123466}.form-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.form-grid label,.item-row label,.totals-card>label{display:flex;flex-direction:column;gap:8px;font-weight:700;color:#1c2a39}.search-input,.form-grid input,.form-grid select,.item-row input,.item-row select,.totals-card textarea{width:100%;min-height:52px;border:1px solid #dce5ef;border-radius:14px;padding:13px 14px;outline:none;font:inherit;background:#fff;box-sizing:border-box}.primary-action,.secondary-action,.ghost-action,.mini-action,.danger-action{border:0;border-radius:14px;padding:13px 18px;font-weight:800;cursor:pointer}.primary-action{background:linear-gradient(135deg,#1d5be3,#0f44bd);color:#fff}.secondary-action{background:#eef4fb;color:#123466}.ghost-action{background:transparent;color:#1d5be3}.danger-action{background:#bd2f24;color:#fff}.item-row{display:grid;grid-template-columns:minmax(260px,2fr) repeat(3,minmax(110px,1fr)) minmax(120px,1fr) 40px;gap:12px;align-items:end;padding:14px 0;border-bottom:1px solid #e5edf6}.subtotal{display:flex;flex-direction:column;gap:8px;padding-bottom:12px}.subtotal span{font-size:12px;color:#5c6b7a;font-weight:700}.remove-item{width:38px;height:38px;border:0;border-radius:10px;background:#ffe9e9;color:#b42318;font-size:24px;cursor:pointer;margin-bottom:7px}.totals-card{display:grid;grid-template-columns:1fr 320px;gap:24px}.totals{display:flex;flex-direction:column;gap:12px;padding:12px 0}.totals span{display:flex;justify-content:space-between;color:#5c6b7a}.totals .grand-total{font-size:20px;color:#123466;border-top:1px solid #dce5ef;padding-top:12px}.form-actions{justify-content:flex-end;margin-top:18px}.table-wrap{overflow-x:auto}.data-table{width:100%;border-collapse:collapse;min-width:980px}.data-table th,.data-table td{text-align:left;padding:14px 12px;border-bottom:1px solid #eef2f6}.data-table th{font-size:12px;color:#5c6b7a;text-transform:uppercase}.status-pill{display:inline-flex;border-radius:999px;padding:5px 10px;font-weight:800;font-size:12px}.status-pill.success{background:#e8f7ef;color:#14763d}.status-pill.warning{background:#fff7df;color:#946200}.status-pill.danger{background:#fff0ef;color:#bd2f24}.status-pill.neutral{background:#eef4fb;color:#123466}.actions{display:flex;gap:8px}.mini-action{padding:8px 10px;background:#eef4fb;color:#123466}.mini-action.danger{background:#ffe9e9;color:#b42318}.empty-state{color:#5c6b7a}.toast{position:fixed;right:28px;bottom:28px;z-index:1200;background:#123466;color:#fff;padding:14px 18px;border-radius:14px;font-weight:700}.modal-backdrop{position:fixed;inset:0;z-index:1100;background:rgba(6,25,54,.48);display:grid;place-items:center;padding:20px}.modal-card{width:min(460px,100%);background:#fff;border-radius:20px;padding:24px}.modal-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:22px}@media(max-width:1050px){.form-grid{grid-template-columns:repeat(2,1fr)}.item-row{grid-template-columns:1fr 1fr}.remove-item{margin:0}.totals-card{grid-template-columns:1fr}}@media(max-width:780px){.module-toolbar,.form-header,.form-actions,.results-header,.section-header{flex-direction:column;align-items:stretch}.summary-grid,.form-grid,.item-row{grid-template-columns:1fr}}
</style>
