<template>
  <div class="results-card">
    <div class="results-header">
      <div>
        <h2>{{ config.listTitle }}</h2>
        <p>{{ partners.length }} cadastro(s) encontrado(s)</p>
      </div>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nome</th>
            <th>Documento</th>
            <th>Telefone</th>
            <th>E-mail</th>
            <th v-if="type === 'clients'">Cidade</th>
            <th v-if="type === 'clients'">Responsável</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="partner in partners" :key="partner.id">
            <td>{{ partner.codigo }}</td>
            <td><strong>{{ partner.nome }}</strong></td>
            <td>{{ partner.documento || '-' }}</td>
            <td>{{ partner.telefone || '-' }}</td>
            <td>{{ partner.email || '-' }}</td>
            <td v-if="type === 'clients'">{{ partner.cidade || '-' }}</td>
            <td v-if="type === 'clients'">{{ partner.usuarioResponsavel || '-' }}</td>
            <td>
              <span :class="['status-pill', partner.status === 'Ativo' ? 'active' : 'inactive']">
                {{ partner.status }}
              </span>
            </td>
            <td class="actions">
              <button class="mini-action" type="button" @click="emit('edit', partner)">Editar</button>
              <button class="mini-action danger-text" type="button" @click="emit('remove', partner.id)">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="!partners.length" class="empty-state">Nenhum cadastro encontrado.</p>
  </div>
</template>

<script setup>
defineProps({
  partners: { type: Array, required: true },
  config: { type: Object, required: true },
  type: { type: String, required: true }
})

const emit = defineEmits(['edit', 'remove'])
</script>

<style scoped>
.results-card {
  background: #fff;
  border: 1px solid #dce5ef;
  border-radius: 20px;
  padding: 24px;
  box-shadow: var(--panel-shadow);
}

.results-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.results-header p {
  margin: 0;
  color: #5c6b7a;
}

h2 {
  margin: 6px 0;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1080px;
}

.data-table th,
.data-table td {
  text-align: left;
  padding: 14px 12px;
  border-bottom: 1px solid #eef2f6;
}

.data-table th {
  font-size: 12px;
  color: #5c6b7a;
  text-transform: uppercase;
  letter-spacing: .04em;
}

.status-pill {
  display: inline-flex;
  border-radius: 999px;
  padding: 5px 10px;
  font-weight: 800;
  font-size: 12px;
}

.status-pill.active {
  background: #e8f7ef;
  color: #14763d;
}

.status-pill.inactive {
  background: #eef2f6;
  color: #5c6b7a;
}

.actions {
  display: flex;
  gap: 8px;
}

.mini-action {
  border: 0;
  border-radius: 14px;
  cursor: pointer;
  white-space: nowrap;
  font-weight: 800;
  padding: 8px 10px;
  background: #eef4fb;
  color: #123466;
}

.danger-text {
  color: #bd2f24;
}

.empty-state {
  margin: 16px 0 0;
  color: #5c6b7a;
}
</style>
