<template>
  <section class="module-page">
    <div class="module-toolbar">
      <input v-model="search" class="search-input" placeholder="Pesquisar compra por número, fornecedor, comprador, nota fiscal ou status..." />
      <button class="primary-action" type="button" @click="openCreate">+ Nova compra</button>
    </div>

    <div class="summary-grid">
      <article class="summary-card"><span>Compras cadastradas</span><strong>{{ purchases.length }}</strong></article>
      <article class="summary-card"><span>Compras recebidas</span><strong>{{ receivedCount }}</strong></article>
      <article class="summary-card"><span>Valor recebido</span><strong>{{ currency(purchasesTotal) }}</strong></article>
    </div>

    <form v-if="showForm" class="purchase-form" @submit.prevent="savePurchase">
      <div class="form-header">
        <div><p class="eyebrow">Operação comercial</p><h2>{{ editingId ? 'Editar compra' : 'Cadastrar compra' }}</h2></div>
        <button class="ghost-action" type="button" @click="closeForm">Fechar</button>
      </div>

      <div class="form-card-section">
        <h3>Dados da compra</h3>
        <div class="form-grid">
          <label>Número<input v-model="form.numero" required /></label>
          <label>Fornecedor
            <select v-model="form.fornecedorId" required @change="syncSupplierName">
              <option value="">Selecione um fornecedor</option>
              <option v-for="supplier in activeSuppliers" :key="supplier.id" :value="supplier.id">{{ supplier.nome }}</option>
            </select>
          </label>
          <label>Comprador<input v-model="form.comprador" required /></label>
          <label>Nota fiscal<input v-model="form.notaFiscal" /></label>
          <label>Status
            <select v-model="form.status">
              <option>Pedido</option><option>Pendente</option><option>Recebida</option><option>Cancelada</option>
            </select>
          </label>
        </div>
      </div>

      <div class="form-card-section">
        <div class="section-header"><h3>Produtos</h3><button class="secondary-action" type="button" @click="addItem">+ Adicionar item</button></div>
        <div v-for="(item,index) in form.items" :key="item.localId" class="item-row">
          <label class="product-field">Produto
            <select v-model="item.produtoId" required @change="fillProduct(item)">
              <option value="">Selecione um produto</option>
              <option v-for="product in productsWithStock" :key="product.id" :value="product.id">{{ product.codigo }} — {{ product.nome }}</option>
            </select>
          </label>
          <label>Quantidade<input v-model.number="item.quantidade" type="number" min="0.01" step="0.01" required /></label>
          <label>Valor unitário<input v-model.number="item.precoUnitario" type="number" min="0" step="0.01" required /></label>
          <div class="subtotal"><span>Subtotal</span><strong>{{ currency(itemSubtotal(item)) }}</strong></div>
          <button class="remove-item" type="button" title="Remover item" @click="removeItem(index)">×</button>
        </div>
        <p v-if="!form.items.length" class="empty-state">Adicione ao menos um produto à compra.</p>
      </div>

      <div class="form-card-section totals-card">
        <label>Observações<textarea v-model="form.observacoes" rows="4"></textarea></label>
        <div class="totals"><span class="grand-total">Total <strong>{{ currency(total) }}</strong></span></div>
      </div>

      <div class="form-actions">
        <button class="secondary-action" type="button" @click="closeForm">Cancelar</button>
        <button class="primary-action" type="submit">{{ editingId ? 'Salvar alterações' : 'Salvar compra' }}</button>
      </div>
    </form>

    <div class="results-card">
      <div class="results-header"><div><h2>Compras cadastradas</h2><p>{{ filteredPurchases.length }} compra(s) encontrada(s)</p></div></div>
      <div class="table-wrap">
        <table v-if="filteredPurchases.length" class="data-table">
          <thead><tr><th>Número</th><th>Fornecedor</th><th>Nota fiscal</th><th>Comprador</th><th>Total</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody><tr v-for="purchase in filteredPurchases" :key="purchase.id">
            <td><strong>{{ purchase.numero }}</strong></td><td>{{ purchase.fornecedorNome }}</td><td>{{ purchase.notaFiscal || '-' }}</td><td>{{ purchase.comprador }}</td><td>{{ currency(purchase.total) }}</td>
            <td><span :class="['status-pill', statusClass(purchase.status)]">{{ purchase.status }}</span></td>
            <td><div class="actions"><button class="mini-action" @click="editPurchase(purchase)">Editar</button><button class="mini-action danger" @click="requestDelete(purchase)">Excluir</button></div></td>
          </tr></tbody>
        </table>
        <p v-else class="empty-state">Nenhuma compra encontrada.</p>
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
    <div v-if="deleteTarget" class="modal-backdrop" @click.self="deleteTarget=null"><div class="modal-card"><h3>Excluir compra</h3><p>Deseja excluir a compra <strong>{{ deleteTarget.numero }}</strong>? Se ela tiver sido recebida, será registrada uma movimentação de estorno.</p><div class="modal-actions"><button class="secondary-action" @click="deleteTarget=null">Cancelar</button><button class="danger-action" @click="confirmDelete">Excluir</button></div></div></div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useBusinessPartners } from '../composables/useBusinessPartners'
import { useInventory } from '../composables/useInventory'
import { usePurchases } from '../composables/usePurchases'

const { suppliers } = useBusinessPartners()
const { productsWithStock } = useInventory()
const { purchases, purchasesTotal, addPurchase, updatePurchase, deletePurchase } = usePurchases()

const search=ref(''); const showForm=ref(false); const editingId=ref(null); const toast=ref(''); const deleteTarget=ref(null)
const emptyForm=()=>({numero:`CMP-${String(purchases.value.length+1).padStart(4,'0')}`,fornecedorId:'',fornecedorNome:'',comprador:'',notaFiscal:'',status:'Pedido',observacoes:'',items:[]})
const form=ref(emptyForm())
const activeSuppliers=computed(()=>suppliers.items.value.filter(s=>s.status==='Ativo').slice().sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR')))
const receivedCount=computed(()=>purchases.value.filter(p=>p.status==='Recebida').length)
const total=computed(()=>form.value.items.reduce((sum,item)=>sum+itemSubtotal(item),0))
const filteredPurchases=computed(()=>{const q=search.value.trim().toLowerCase();return purchases.value.filter(p=>[p.numero,p.fornecedorNome,p.comprador,p.notaFiscal,p.status].join(' ').toLowerCase().includes(q)).slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''))})

function localId(){return `${Date.now()}-${Math.random()}`}
function addItem(){form.value.items.push({localId:localId(),produtoId:'',produtoNome:'',quantidade:1,precoUnitario:0})}
function removeItem(index){form.value.items.splice(index,1)}
function fillProduct(item){const p=productsWithStock.value.find(x=>x.id===item.produtoId);if(p){item.produtoNome=p.nome;item.precoUnitario=Number(p.precoCusto)||0}}
function syncSupplierName(){form.value.fornecedorNome=activeSuppliers.value.find(s=>s.id===form.value.fornecedorId)?.nome||''}
function itemSubtotal(item){return (Number(item.quantidade)||0)*(Number(item.precoUnitario)||0)}
function currency(value){return Number(value||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function statusClass(status){return ({Recebida:'success',Pendente:'warning',Cancelada:'danger',Pedido:'neutral'})[status]||'neutral'}
function notify(message){toast.value=message;setTimeout(()=>{if(toast.value===message)toast.value=''},2800)}
function openCreate(){editingId.value=null;form.value=emptyForm();addItem();showForm.value=true;window.scrollTo({top:0,behavior:'smooth'})}
function closeForm(){showForm.value=false;editingId.value=null;form.value=emptyForm()}
function savePurchase(){if(!form.value.items.length)return notify('Adicione ao menos um produto.');if(form.value.items.some(i=>!i.produtoId||Number(i.quantidade)<=0))return notify('Revise os produtos e quantidades informados.');syncSupplierName();const payload={...form.value,items:form.value.items.map(({localId,...item})=>({...item})),total:total.value};const result=editingId.value?updatePurchase(editingId.value,payload):addPurchase(payload);if(!result.ok)return notify(result.message);notify(editingId.value?'Compra atualizada com sucesso.':'Compra cadastrada com sucesso.');closeForm()}
function editPurchase(purchase){editingId.value=purchase.id;form.value={...emptyForm(),...purchase,items:purchase.items.map(i=>({...i,localId:localId()}))};showForm.value=true;window.scrollTo({top:0,behavior:'smooth'})}
function requestDelete(purchase){deleteTarget.value=purchase}
function confirmDelete(){deletePurchase(deleteTarget.value.id);deleteTarget.value=null;notify('Compra excluída. Histórico de estoque preservado por movimentação de estorno.')}
</script>

<style scoped>
.module-page{display:flex;flex-direction:column;gap:20px}.module-toolbar{display:flex;gap:14px;align-items:center}.search-input{flex:1}.summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.summary-card,.purchase-form,.results-card{background:#fff;border:1px solid #dce5ef;border-radius:20px;padding:24px;box-shadow:var(--panel-shadow)}.summary-card{display:flex;flex-direction:column;gap:10px}.summary-card span{color:#5c6b7a;font-weight:700}.summary-card strong{font-size:28px;color:#123466}.form-header,.form-actions,.results-header,.section-header{display:flex;justify-content:space-between;gap:12px;align-items:center}.eyebrow{margin:0;color:#5c6b7a;text-transform:uppercase;letter-spacing:.08em;font-size:12px}.form-header h2,.results-header h2{margin:6px 0;color:#123466}.results-header p{margin:0;color:#5c6b7a}.form-card-section{background:#f8fbff;border:1px solid #e3ebf5;border-radius:18px;padding:20px;margin-top:18px}.form-card-section h3{margin:0 0 16px;color:#123466}.form-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.form-grid label,.item-row label,.totals-card>label{display:flex;flex-direction:column;gap:8px;font-weight:700;color:#1c2a39}.search-input,.form-grid input,.form-grid select,.item-row input,.item-row select,.totals-card textarea{width:100%;min-height:52px;border:1px solid #dce5ef;border-radius:14px;padding:13px 14px;outline:none;font:inherit;background:#fff;box-sizing:border-box}.primary-action,.secondary-action,.ghost-action,.mini-action,.danger-action{border:0;border-radius:14px;padding:13px 18px;font-weight:800;cursor:pointer}.primary-action{background:linear-gradient(135deg,#1d5be3,#0f44bd);color:#fff}.secondary-action{background:#eef4fb;color:#123466}.ghost-action{background:transparent;color:#1d5be3}.danger-action{background:#bd2f24;color:#fff}.item-row{display:grid;grid-template-columns:minmax(300px,2fr) 150px 170px minmax(140px,1fr) 40px;gap:12px;align-items:end;padding:14px 0;border-bottom:1px solid #e5edf6}.subtotal{display:flex;flex-direction:column;gap:8px;padding-bottom:12px}.subtotal span{font-size:12px;color:#5c6b7a;font-weight:700}.remove-item{width:38px;height:38px;border:0;border-radius:10px;background:#ffe9e9;color:#b42318;font-size:24px;cursor:pointer;margin-bottom:7px}.totals-card{display:grid;grid-template-columns:1fr 320px;gap:24px}.totals{display:flex;flex-direction:column;gap:12px;padding:12px 0}.totals .grand-total{font-size:20px;color:#123466;border-top:1px solid #dce5ef;padding-top:12px;display:flex;justify-content:space-between}.form-actions{justify-content:flex-end;margin-top:18px}.table-wrap{overflow-x:auto}.data-table{width:100%;border-collapse:collapse;min-width:1050px}.data-table th,.data-table td{text-align:left;padding:14px 12px;border-bottom:1px solid #eef2f6}.data-table th{font-size:12px;color:#5c6b7a;text-transform:uppercase}.status-pill{display:inline-flex;border-radius:999px;padding:5px 10px;font-weight:800;font-size:12px}.status-pill.success{background:#e8f7ef;color:#14763d}.status-pill.warning{background:#fff7df;color:#946200}.status-pill.danger{background:#fff0ef;color:#bd2f24}.status-pill.neutral{background:#eef4fb;color:#123466}.actions{display:flex;gap:8px}.mini-action{padding:8px 10px;background:#eef4fb;color:#123466}.mini-action.danger{background:#ffe9e9;color:#b42318}.empty-state{color:#5c6b7a}.toast{position:fixed;right:28px;bottom:28px;z-index:1200;background:#123466;color:#fff;padding:14px 18px;border-radius:14px;font-weight:700}.modal-backdrop{position:fixed;inset:0;z-index:1100;background:rgba(6,25,54,.48);display:grid;place-items:center;padding:20px}.modal-card{width:min(460px,100%);background:#fff;border-radius:20px;padding:24px}.modal-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:22px}@media(max-width:1050px){.form-grid{grid-template-columns:repeat(2,1fr)}.item-row{grid-template-columns:1fr 1fr}.totals-card{grid-template-columns:1fr}}@media(max-width:780px){.module-toolbar,.form-header,.form-actions,.results-header,.section-header{flex-direction:column;align-items:stretch}.summary-grid,.form-grid,.item-row{grid-template-columns:1fr}}
</style>
