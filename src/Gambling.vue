<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { ref, onMounted } from "vue"
import { getAuth} from "firebase/auth";
import { useRouter } from 'vue-router'
import navbar from "@/navbar.vue";
import { Roulette } from "vue3-roulette";
import { getUserRole } from "./Database/Monkey_Store";

const user_name = ref("")
const auth = getAuth();
const router = useRouter()
const wheel = ref(null);
const showFireworks = ref(false);
const isFounder = ref(false);
const isLoading = ref(true);

// Check user role on mount
onMounted(async () => {
  if (auth.currentUser) {
    try {
      const userRole = await getUserRole(auth.currentUser.uid)
      isFounder.value = userRole === 'Founder'

      // If founder, redirect to home
      if (isFounder.value) {
        alert('Gambling is only available for Test Monkeys. As a Founder, you can use bananas to create missions.')
        router.push('/home')
      }
    } catch (error) {
      console.error('Error checking user role:', error)
    } finally {
      isLoading.value = false
    }
  } else {
    isLoading.value = false
  }
});

const items = [
  { id: 1, name: "Banana", htmlContent: "🍌<br>Banana", textColor: "#000", background: "#FFD700" },
  { id: 2, name: "Apple", htmlContent: "🍎<br>Apple", textColor: "#fff", background: "#DC143C" },
  { id: 3, name: "Orange", htmlContent: "🍊<br>Orange", textColor: "#000", background: "#FF8C00" },
  { id: 4, name: "Cherry", htmlContent: "🍒<br>Cherry", textColor: "#fff", background: "#8B0000" },
  { id: 5, name: "Grape", htmlContent: "🍇<br>Grape", textColor: "#fff", background: "#6B46C1" },
  { id: 6, name: "Lemon", htmlContent: "🍋<br>Lemon", textColor: "#000", background: "#FFF44F" },
];

function launchWheel(){
  wheel.value.launchWheel();
  showFireworks.value = false;
}

function wheelStartedCallback(){
  console.log('start wheel')
  showFireworks.value = false;
}

function wheelEndedCallback(){
  console.log('End Wheel')
  showFireworks.value = true;
  createFireworks();
  
  setTimeout(() => {
    showFireworks.value = false;
  }, 3000);
}

function createFireworks() {
  const container = document.querySelector('.fireworks-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      createFireworkBurst(container);
    }, i * 200);
  }
}

function createFireworkBurst(container) {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FF1493'];
  const x = Math.random() * 100;
  const y = Math.random() * 60 + 20;
  
  const burst = document.createElement('div');
  burst.className = 'firework-burst';
  burst.style.left = x + '%';
  burst.style.top = y + '%';
  
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'firework-particle';
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    
    const angle = (Math.PI * 2 * i) / 30;
    const velocity = 50 + Math.random() * 50;
    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity;
    
    particle.style.setProperty('--tx', tx + 'px');
    particle.style.setProperty('--ty', ty + 'px');
    
    burst.appendChild(particle);
  }
  
  container.appendChild(burst);
  
  setTimeout(() => {
    burst.remove();
  }, 1500);
}
</script>

<style scoped>
.casino-bg {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  min-height: 100vh;
}

.casino-title {
  font-size: 4rem;
  font-weight: bold;
  background: linear-gradient(45deg, #FFD700, #FFA500, #FFD700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 4px;
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}

.banana-balance {
  color: #FFD700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.wheel-box {
  background: rgba(0, 0, 0, 0.5);
  border: 3px solid #FFD700;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
}

.wheel-box::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 20px solid #FFD700;
  filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8));
}

.spin-btn {
  background: linear-gradient(45deg, #FFD700, #FFA500);
  border: none;
  color: #000;
  font-weight: bold;
  letter-spacing: 2px;
  box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);
  transition: all 0.3s ease;
}

.spin-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 30px rgba(255, 215, 0, 0.6);
}

.fireworks-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

.firework-burst {
  position: absolute;
}

.firework-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  animation: explode 1.5s ease-out forwards;
}

@keyframes explode {
  0% {
    transform: translate(0, 0);
    opacity: 1;
  }
  100% {
    transform: translate(var(--tx), var(--ty));
    opacity: 0;
  }
}

.corner-decoration {
  width: 100px;
  height: 100px;
  border: 3px solid #FFD700;
  opacity: 0.3;
}
</style>

<template>
  <navbar/>
  <div class="casino-bg position-relative overflow-hidden" style="padding-top: 30px;">
    <!-- Loading State -->
    <div v-if="isLoading" class="container py-5 text-center">
      <div class="spinner-border text-warning" style="width: 3rem; height: 3rem;"></div>
      <p class="text-white mt-3">Loading...</p>
    </div>

    <!-- Access Denied for Founders -->
    <div v-else-if="isFounder" class="container py-5 text-center">
      <div class="alert alert-warning d-inline-block" role="alert">
        <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
        <h3>Access Restricted</h3>
        <p class="mb-0">Gambling is only available for Test Monkeys. As a Founder, you can use bananas to create missions.</p>
      </div>
    </div>

    <!-- Casino Content (Test Monkeys Only) -->
    <div v-else>
      <!-- Corner decorations -->
      <div class="corner-decoration position-absolute top-0 start-0 m-3 border-end-0 border-bottom-0"></div>
      <div class="corner-decoration position-absolute top-0 end-0 m-3 border-start-0 border-bottom-0"></div>
      <div class="corner-decoration position-absolute bottom-0 start-0 m-3 border-end-0 border-top-0"></div>
      <div class="corner-decoration position-absolute bottom-0 end-0 m-3 border-start-0 border-top-0"></div>

      <div class="container py-5">
      <div class="text-center mb-5">
        <h1 class="casino-title mb-3">🎰 BANANA CASINO 🎰</h1>
        <div class="banana-balance fs-4 fw-bold">🍌 Your Bananas: 1,000</div>
      </div>
      
      <div class="row justify-content-center">
        <div class="col-lg-6">
          <div class="wheel-box position-relative rounded-4 p-5">
            <div style="width: fit-content; margin-inline: auto;">
                <Roulette 
                ref="wheel" 
                :items="items"
                @wheel-start="wheelStartedCallback"
                @wheel-end="wheelEndedCallback"
                />
            </div>
            
            
            <button class="btn spin-btn btn-lg w-100 mt-4 py-3 fs-5 rounded-pill text-uppercase" @click="launchWheel">
              🎲 SPIN THE WHEEL 🎲
            </button>
            
            <div class="text-center mt-3 text-warning fw-bold fs-5">
              {{ showFireworks ? '🎉 CONGRATULATIONS! 🎉' : 'Click to spin!' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Fireworks container -->
      <div v-if="showFireworks" class="fireworks-container"></div>
    </div>
    </div>
  </div>
</template>