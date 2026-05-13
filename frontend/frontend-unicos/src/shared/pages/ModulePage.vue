<template>
  <section class="module-page">
    <div class="placeholder-card">
      <p class="eyebrow">Módulo</p>
      <h2>{{ title }}</h2>
      <p>Este módulo já está roteado e pronto para receber telas, componentes, services e regras específicas.</p>
    </div>
  </section>
</template>

<script setup>
defineProps({ title: { type: String, required: true } })
</script>

<style scoped>
.module-page{display:flex;flex-direction:column;gap:20px}.placeholder-card{background:#fff;border:1px solid #dce5ef;border-radius:22px;padding:28px;box-shadow:var(--panel-shadow)}.eyebrow{margin:0;color:#5c6b7a;text-transform:uppercase;letter-spacing:.08em;font-size:12px}h2{margin:8px 0}p{color:#5c6b7a}
</style>
