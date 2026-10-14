<template>
  <div class="summary-grid">
    <article class="summary-card">
      <span>Total cadastrado</span>
      <strong>{{ total }}</strong>
    </article>

    <article class="summary-card">
      <span>Cadastros ativos</span>
      <strong>{{ active }}</strong>
    </article>

    <article class="summary-card">
      <span>Cadastros inativos</span>
      <strong>{{ inactive }}</strong>
    </article>
  </div>
</template>

<script setup>
defineProps({
  total: { type: Number, required: true },
  active: { type: Number, required: true },
  inactive: { type: Number, required: true }
})
</script>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  background: #fff;
  border: 1px solid #dce5ef;
  border-radius: 20px;
  padding: 24px;
  box-shadow: var(--panel-shadow);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-card span {
  color: #5c6b7a;
  font-weight: 700;
}

.summary-card strong {
  font-size: 30px;
  color: #123466;
}

@media (max-width: 780px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
