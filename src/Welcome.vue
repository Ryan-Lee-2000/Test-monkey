<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter, useRoute } from 'vue-router'
import { onMounted, ref } from "vue";


const router = useRouter()
const isLoading = ref(true)
const showWelcome = ref(false)

import monkeyUrl from "@/assets/welcome/monkey.png"
import bananaUrl from "@/assets/welcome/banana.png"

onMounted(() => {
  const auth = getAuth();
  if(auth.currentUser != null){
    showWelcome.value = false
    isLoading.value = true
    router.push({path: '/Home'})
  } else{
    showWelcome.value = true
    isLoading.value = false
  }
})



</script>

<template>
  <div v-if="isLoading" class="hero-section">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12">
          <div class="welcome-card">
            <div class="app-icon">
              <div class="spinner-border text-white" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            <h1 class="app-title">Firebase Tester</h1>
            <p class="app-subtitle">Checking authentication status...</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="showWelcome" class="welcome-hero">
    <div class="welcome-card">
      <!-- title -->
      <div class="welcome-left">
        <h1 class="welcome-title">
          Welcome to<br />
          <span>Test Monkey</span>
        </h1>
        <p class="welcome-desc">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>

        <div class="welcome-actions">
          <RouterLink to="/Login" class="btn-solid">Login</RouterLink>
          <RouterLink to="/register" class="btn-ghost">Create Account</RouterLink>
        </div>
      </div>

      <!-- monkey -->
      <div class="welcome-right">
        <img :src="monkeyUrl" alt="Monkey" class="monkey-illust" />
      </div>

      <!-- banana -->
      <img :src="bananaUrl" alt="" class="banana-sticker" />
    </div>
  </div>
</template>

<style scoped>
.welcome-hero {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, #0f4d26 0%, #ea8a2f 50%, #d7e86d 100%);
  padding: 36px 16px;
}

.welcome-card {
  position: relative;
  max-width: 980px;
  width: 100%;
  min-height: 460px;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 24px;
  padding: 36px 40px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(8px);
  border: var(--card-border) solid rgba(255, 255, 255, 0.45);
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.3),
    inset 0 0 50px rgba(255, 255, 255, 0.18);
}

.welcome-left {
  align-self: center;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.15);
}

.welcome-title {
  font-size: 54px;
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: 0.2px;
  margin: 0 0 18px;
}

.welcome-title span {
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25));
}

.welcome-desc {
  max-width: 520px;
  font-size: 16px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 26px;
}

.welcome-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.btn-solid,
.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
  height: 44px;
  padding: 0 18px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 16px;
  text-decoration: none;
  transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.btn-solid {
  color: #fff;
  background: linear-gradient(180deg, #2e7d32 0%, #1b5e20 100%);
  box-shadow: 0 6px 0 #163f16, 0 10px 24px rgba(21, 60, 21, 0.45);
  border: none;
}
.btn-solid:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 0 #163f16, 0 16px 30px rgba(21, 60, 21, 0.55);
}

.btn-ghost {
  color: #234d22;
  background: rgba(255, 255, 255, 0.18);
  border: 2px solid rgba(35, 77, 34, 0.9);
  backdrop-filter: blur(4px);
}
.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.28);
}

.welcome-right {
  position: relative;
  display: grid;
  place-items: center;
}
.monkey-illust {
  width: min(240px, 70%);
  height: auto;
  filter:
    drop-shadow(0 8px 20px rgba(0,0,0,0.35))
    drop-shadow(0 2px 6px rgba(0,0,0,0.2));
}

.banana-sticker {
  position: absolute;
  right: 18px;
  bottom: 16px;
  width: 86px;
  height: auto;
  opacity: 0.9;
  pointer-events: none;
  z-index: 2;           
  transform: translate(0, 0) rotate(-3deg);
}

/* responsive */
@media (max-width: 900px) {
  .welcome-card {
    grid-template-columns: 1fr;
    padding: 28px 24px 40px;
  }
  .welcome-right {
    order: -1; 
  }
  .welcome-title { font-size: 40px; }
  .monkey-illust { width: 200px; }
  .banana-sticker { width: 66px; }
}

</style>