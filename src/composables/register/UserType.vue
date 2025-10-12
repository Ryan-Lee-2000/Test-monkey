<script setup>
import { useRouter } from "vue-router"
import monkeyUrl from "@/assets/welcome/monkey.png"
import bananaUrl from "@/assets/welcome/banana.png"

const router = useRouter()

function pickFounder() {
  router.push({ name: "RegisterFounderAccount" })
}

function pickTester() {
  router.push("/register/tester")        
}
</script>

<template>
  <div class="auth-hero">
    <div class="auth-card">
      <!-- Left: monkey + title + subtitle (centered by global classes) -->
      <section class="auth-left">
        <img :src="monkeyUrl" class="monkey" alt="Monkey" />
        <h2 class="title">
          Welcome to<br />
          <span>Test Monkey</span>
        </h2>
        <p class="subtitle">
          Create an account to continue your journey with us.
        </p>
      </section>

      <!-- vertical divider -->
      <div class="auth-divider" aria-hidden="true"></div>

      <!-- Right: Role selection -->
      <section class="auth-right">
        <h1 class="heading">I am a</h1>

        <div class="grid gap-3" style="display:grid; gap:16px; width: min(360px, 90%);">
          <button class="btn-green" style="width:100%;" @click="pickFounder">Founder</button>
          <button class="btn-green" style="width:100%;" @click="pickTester">Tester</button>
        </div>
      </section>

      <!-- banana sticker -->
      <img :src="bananaUrl" alt="" class="banana-sticker" />
    </div>
  </div>
</template>

<style scoped>
</style>
