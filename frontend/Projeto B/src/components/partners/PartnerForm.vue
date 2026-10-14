<template>
  <form class="partner-form" @submit.prevent="emit('save')">
    <div class="form-header">
      <div>
        <p class="eyebrow">{{ editingId ? 'Editar cadastro' : 'Novo cadastro' }}</p>
        <h2>{{ editingId ? config.editTitle : config.formTitle }}</h2>
      </div>
      <button class="ghost-action" type="button" @click="emit('cancel')">Fechar</button>
    </div>

    <div class="form-card-section">
      <h3>Dados principais</h3>

      <div class="form-grid">
        <label>
          Nome / Razão social
          <input v-model="form.nome" type="text" required placeholder="Ex: Empresa ABC" />
        </label>

        <label>
          Código
          <input v-model="form.codigo" type="text" required :placeholder="config.codePlaceholder" />
        </label>

        <label>
          CPF / CNPJ
          <input v-model="form.documento" type="text" placeholder="Ex: 00.000.000/0001-00" />
        </label>

        <label>
          Telefone
          <input v-model="form.telefone" type="text" placeholder="Ex: (11) 99999-9999" />
        </label>

        <label class="span-2">
          E-mail
          <input v-model="form.email" type="email" placeholder="Ex: contato@empresa.com" />
        </label>
      </div>
    </div>

    <div v-if="type === 'clients'" class="form-card-section">
      <h3>Endereço</h3>

      <div class="address-grid">
        <label>
          CEP
          <input v-model="form.cep" placeholder="Ex: 00000-000" />
        </label>

        <label class="span-2">
          Rua
          <input v-model="form.rua" placeholder="Nome da rua" />
        </label>

        <label>
          Número
          <input v-model="form.numero" placeholder="Ex: 123" />
        </label>

        <label class="span-2">
          Complemento
          <input v-model="form.complemento" placeholder="Apartamento, bloco, referência..." />
        </label>

        <label>
          Bairro
          <input v-model="form.bairro" placeholder="Bairro" />
        </label>

        <label>
          Cidade
          <input v-model="form.cidade" placeholder="Cidade" />
        </label>

        <label>
          Estado
          <input v-model="form.estado" placeholder="UF" maxlength="2" />
        </label>
      </div>
    </div>

    <div v-if="type === 'clients'" class="form-card-section">
      <h3>Responsável</h3>

      <div class="form-grid form-grid-small">
        <label>
          Usuário responsável
          <input v-model="form.usuarioResponsavel" placeholder="Nome do responsável pelo cliente" />
        </label>
      </div>
    </div>

    <div class="form-card-section">
      <h3>Informações complementares</h3>

      <div class="form-grid">
        <label>
          Status
          <select v-model="form.status">
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </label>

        <label>
          Observações
          <textarea
            v-model="form.observacao"
            rows="4"
            placeholder="Informações adicionais sobre o cadastro"
          ></textarea>
        </label>
      </div>
    </div>

    <div class="form-actions">
      <button class="secondary-action" type="button" @click="emit('reset')">Limpar</button>
      <button class="primary-action" type="submit">{{ editingId ? 'Salvar alterações' : config.saveLabel }}</button>
    </div>
  </form>
</template>

<script setup>
defineProps({
  form: { type: Object, required: true },
  config: { type: Object, required: true },
  type: { type: String, required: true },
  editingId: { type: [String, Number, null], default: null }
})

const emit = defineEmits(['save', 'cancel', 'reset'])
</script>

<style scoped>
.partner-form {
  background: #fff;
  border: 1px solid #dce5ef;
  border-radius: 20px;
  padding: 24px;
  box-shadow: var(--panel-shadow);
}

.form-header,
.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.eyebrow {
  margin: 0;
  color: #5c6b7a;
  text-transform: uppercase;
  letter-spacing: .08em;
  font-size: 12px;
}

h2 {
  margin: 6px 0;
}

.form-card-section {
  background: #ffffff;
  border: 1px solid #e3ebf5;
  border-radius: 18px;
  padding: 20px;
  margin-top: 18px;
}

.form-card-section h3 {
  margin: 0 0 16px;
  color: #123466;
  font-size: 18px;
}

.form-grid,
.address-grid {
  display: grid;
  gap: 16px;
}

.form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid-small {
  max-width: 620px;
}

.address-grid {
  grid-template-columns: 220px 1fr 1fr;
  align-items: end;
}

.form-grid label,
.address-grid label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 700;
  color: #1c2a39;
}

.span-2 {
  grid-column: span 2;
}

input,
select,
textarea {
  width: 100%;
  min-height: 52px;
  border: 1px solid #dce5ef;
  border-radius: 14px;
  padding: 13px 14px;
  outline: none;
  font: inherit;
  color: #102033;
  background: #fff;
  box-sizing: border-box;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #1d5be3;
  box-shadow: 0 0 0 3px rgba(29, 91, 227, .12);
}

textarea {
  min-height: 120px;
  padding-top: 14px;
  resize: vertical;
}

.form-actions {
  justify-content: flex-end;
  margin-top: 18px;
}

.primary-action,
.secondary-action,
.ghost-action {
  border: 0;
  border-radius: 14px;
  padding: 13px 18px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.primary-action {
  background: linear-gradient(135deg, #1d5be3, #0f44bd);
  color: #fff;
  box-shadow: 0 10px 22px rgba(29, 91, 227, .22);
}

.secondary-action {
  background: #eef4fb;
  color: #123466;
}

.ghost-action {
  background: transparent;
  color: #1d5be3;
}

@media (max-width: 900px) {
  .address-grid {
    grid-template-columns: 1fr 1fr;
  }

  .span-2 {
    grid-column: span 2;
  }
}

@media (max-width: 780px) {
  .form-header,
  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .form-grid,
  .address-grid {
    grid-template-columns: 1fr;
  }

  .span-2 {
    grid-column: auto;
  }
}
</style>
