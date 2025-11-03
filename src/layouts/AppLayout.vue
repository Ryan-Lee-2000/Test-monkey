<script setup>
import navbar from "@/navbar.vue"
</script>

<template>
  <div class="app-layout">
    <navbar />
    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.app-main {
  padding-top: 80px; /* Matches navbar fixed height */
  min-height: calc(100vh - 80px);
}
</style>
