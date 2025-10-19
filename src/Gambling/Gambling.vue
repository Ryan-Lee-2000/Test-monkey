<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { ref, onMounted, computed } from "vue"
import { getAuth } from "firebase/auth"
import { useRouter } from 'vue-router'
import navbar from "@/navbar.vue"
import { getUserRole, getBananaBalance } from "../Database/Monkey_Store"
import { canClaimFreePack, getPityCounter, GACHA_CONSTANTS } from "../Database/GachaSystem"
import VoucherPackModal from './VoucherPackModal.vue'
import RecentWinnersFeed from "./RecentWinnersFeed.vue"

const auth = getAuth()
const router = useRouter()

const isFounder = ref(false)
const isLoading = ref(true)
const bananaBalance = ref(0)
const canClaimFree = ref(false)
const pityCounter = ref(0)
const showPackModal = ref(false)
const isFreePack = ref(false)

// Check user role and load data on mount
onMounted(async () => {
  if (auth.currentUser) {
    try {
      const userRole = await getUserRole(auth.currentUser.uid)
      isFounder.value = userRole === 'Founder'

      // If founder, redirect to home
      if (isFounder.value) {
        alert('Gambling is only available for Test Monkeys. As a Founder, you can use bananas to create missions.')
        router.push('/home')
        return
      }

      // Load tester data
      await loadTesterData()
    } catch (error) {
      console.error('Error checking user role:', error)
    } finally {
      isLoading.value = false
    }
  } else {
    isLoading.value = false
  }
})

async function loadTesterData() {
  try {
    // Get banana balance
    bananaBalance.value = await getBananaBalance(auth.currentUser.uid, 'TestMonkey')

    // Check free pack eligibility
    canClaimFree.value = await canClaimFreePack(auth.currentUser.uid)

    // Get pity counter
    pityCounter.value = await getPityCounter(auth.currentUser.uid)
  } catch (error) {
    console.error('Error loading tester data:', error)
  }
}

const packCost = computed(() => GACHA_CONSTANTS.PACK_COST)
const pityThreshold = computed(() => GACHA_CONSTANTS.PITY_THRESHOLD)
const pityProgress = computed(() => Math.min((pityCounter.value / pityThreshold.value) * 100, 100))

function openPaidPack() {
  if (bananaBalance.value < packCost.value) {
    alert(`You need ${packCost.value} bananas to open a pack. You have ${bananaBalance.value}.`)
    return
  }

  isFreePack.value = false
  showPackModal.value = true
}

function openFreePack() {
  if (!canClaimFree.value) {
    alert('You have already claimed your free pack today!')
    return
  }

  isFreePack.value = true
  showPackModal.value = true
}

function closePackModal() {
  showPackModal.value = false
}

async function handlePackOpened(voucher) {
  console.log('Pack opened! Voucher:', voucher)

  // Reload tester data
  await loadTesterData()
}

function goToInventory() {
  router.push('/voucher-inventory')
}
</script>

<template>
  <navbar/>
  <div class="gacha-page position-relative overflow-hidden">
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

    <!-- Gacha Content (Test Monkeys Only) -->
    <div v-else class="container py-5">
      <!-- Header -->
      <div class="text-center mb-5">
        <h1 class="gacha-title mb-3">🎁 VOUCHER GACHA 🎁</h1>
        <p class="subtitle text-white-50">Open packs to win Singapore vouchers!</p>
      </div>

      <!-- Stats Section -->
      <div class="row g-4 mb-5">
        <div class="col-md-4">
          <div class="stat-card banana-card">
            <div class="stat-icon">🍌</div>
            <div class="stat-value">{{ bananaBalance.toLocaleString() }}</div>
            <div class="stat-label">Bananas</div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stat-card pity-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-value">{{ pityCounter }} / {{ pityThreshold }}</div>
            <div class="stat-label">Pity Counter</div>
            <div class="progress mt-2" style="height: 8px;">
              <div
                class="progress-bar bg-warning"
                :style="{ width: pityProgress + '%' }"
              ></div>
            </div>
            <small class="text-white-50 mt-1 d-block">
              {{ pityThreshold - pityCounter }} pulls until guaranteed Epic
            </small>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stat-card free-card">
            <div class="stat-icon">🎉</div>
            <div class="stat-value">{{ canClaimFree ? 'Available' : 'Claimed' }}</div>
            <div class="stat-label">Daily Free Pack</div>
          </div>
        </div>
      </div>

      <!-- Pack Options -->
      <div class="row g-4 mb-5">
        <!-- Standard Pack -->
        <div class="col-lg-6">
          <div class="pack-card standard-pack">
            <div class="pack-icon-large">📦</div>
            <h2 class="pack-name">Voucher Pack</h2>
            <p class="pack-description">
              Contains 1 random voucher from Common to Legendary rarity
            </p>

            <div class="pack-cost-display">
              <span class="banana-icon">🍌</span>
              <span class="cost-value">{{ packCost }}</span>
              <span class="cost-label">Bananas</span>
            </div>

            <div class="pack-rates">
              <h5 class="rates-title">Drop Rates:</h5>
              <div class="rate-item">
                <span class="rate-rarity common">Common</span>
                <span class="rate-percent">70%</span>
              </div>
              <div class="rate-item">
                <span class="rate-rarity rare">Rare</span>
                <span class="rate-percent">20%</span>
              </div>
              <div class="rate-item">
                <span class="rate-rarity epic">Epic</span>
                <span class="rate-percent">8%</span>
              </div>
              <div class="rate-item">
                <span class="rate-rarity legendary">Legendary</span>
                <span class="rate-percent">2%</span>
              </div>
            </div>

            <button
              class="btn btn-primary btn-lg w-100 open-pack-btn"
              @click="openPaidPack"
              :disabled="bananaBalance < packCost"
            >
              <i class="fas fa-box-open me-2"></i>
              Open Pack
            </button>

            <div v-if="bananaBalance < packCost" class="insufficient-warning">
              ⚠️ Insufficient bananas
            </div>
          </div>
        </div>

        <!-- Free Daily Pack -->
        <div class="col-lg-6">
          <div class="pack-card free-pack-card">
            <div class="free-badge">FREE</div>
            <div class="pack-icon-large">🎁</div>
            <h2 class="pack-name">Daily Free Pack</h2>
            <p class="pack-description">
              Claim your free pack once per day! Lower rates but totally free!
            </p>

            <div class="pack-cost-display free-cost">
              <span class="cost-value">FREE</span>
              <span class="cost-label">Once per day</span>
            </div>

            <div class="pack-rates">
              <h5 class="rates-title">Drop Rates:</h5>
              <div class="rate-item">
                <span class="rate-rarity common">Common</span>
                <span class="rate-percent">85%</span>
              </div>
              <div class="rate-item">
                <span class="rate-rarity rare">Rare</span>
                <span class="rate-percent">12%</span>
              </div>
              <div class="rate-item">
                <span class="rate-rarity epic">Epic</span>
                <span class="rate-percent">3%</span>
              </div>
              <div class="rate-item">
                <span class="rate-rarity legendary-disabled">Legendary</span>
                <span class="rate-percent">0%</span>
              </div>
            </div>

            <button
              class="btn btn-success btn-lg w-100 open-pack-btn"
              @click="openFreePack"
              :disabled="!canClaimFree"
            >
              <i class="fas fa-gift me-2"></i>
              Claim Free Pack
            </button>

            <div v-if="!canClaimFree" class="claimed-notice">
              ✓ Already claimed today
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="text-center mb-4">
        <button class="btn btn-outline-light btn-lg me-3" @click="goToInventory">
          <i class="fas fa-wallet me-2"></i>
          View My Vouchers
        </button>
        <router-link to="/home" class="btn btn-outline-light btn-lg">
          <i class="fas fa-tasks me-2"></i>
          Complete Missions
        </router-link>
      </div>

      <!-- Recent Winners and Info Section -->
      <div class="row g-4 mt-5">
        <!-- Recent Winners Feed -->
        <div class="col-lg-5">
          <RecentWinnersFeed />
        </div>

        <!-- Info Cards -->
        <div class="col-lg-7">
          <div class="row g-4">
            <div class="col-md-6">
              <div class="info-card">
                <div class="info-icon">💡</div>
                <h4 class="info-title">How it Works</h4>
                <p class="info-text">
                  Use bananas earned from missions to open voucher packs. Each pack contains 1 random Singapore voucher!
                </p>
              </div>
            </div>
            <div class="col-md-6">
              <div class="info-card">
                <div class="info-icon">🎯</div>
                <h4 class="info-title">Pity System</h4>
                <p class="info-text">
                  After {{ pityThreshold }} packs without an Epic or Legendary, your next pack guarantees an Epic voucher!
                </p>
              </div>
            </div>
            <div class="col-md-12">
              <div class="info-card">
                <div class="info-icon">⏰</div>
                <h4 class="info-title">Voucher Expiry</h4>
                <p class="info-text">
                  All vouchers expire 30 days after winning. Make sure to redeem them before they expire!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pack Opening Modal -->
    <VoucherPackModal
      :show="showPackModal"
      :isFree="isFreePack"
      @close="closePackModal"
      @packOpened="handlePackOpened"
    />
  </div>
</template>

<style scoped>
.gacha-page {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  min-height: 100vh;
  padding-top: 30px;
}

.gacha-title {
  font-size: 3.5rem;
  font-weight: bold;
  background: linear-gradient(45deg, #FFD700, #FFA500, #FFD700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 3px;
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}

.subtitle {
  font-size: 1.2rem;
}

/* Stat Cards */
.stat-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.banana-card {
  border-color: #FFD700;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.2));
}

.pity-card {
  border-color: #9333ea;
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(168, 85, 247, 0.2));
}

.free-card {
  border-color: #28a745;
  background: linear-gradient(135deg, rgba(40, 167, 69, 0.2), rgba(52, 195, 143, 0.2));
}

.stat-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
}

/* Pack Cards */
.pack-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 25px;
  padding: 2.5rem;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  transition: transform 0.3s;
  height: 100%;
}

.pack-card:hover {
  transform: scale(1.02);
}

.standard-pack {
  border: 3px solid #667eea;
}

.free-pack-card {
  border: 3px solid #28a745;
}

.free-badge {
  position: absolute;
  top: -15px;
  right: 20px;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 50px;
  font-weight: bold;
  font-size: 1.1rem;
  box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
}

.pack-icon-large {
  font-size: 5rem;
  margin-bottom: 1rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.pack-name {
  font-size: 2rem;
  font-weight: bold;
  color: #212529;
  margin-bottom: 1rem;
}

.pack-description {
  color: #6c757d;
  margin-bottom: 2rem;
  font-size: 1.05rem;
}

.pack-cost-display {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50px;
  padding: 1rem 2rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.free-cost {
  background: linear-gradient(135deg, #28a745, #20c997);
}

.banana-icon {
  font-size: 2rem;
}

.cost-value {
  font-size: 2rem;
  font-weight: bold;
  color: white;
}

.cost-label {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
}

.pack-rates {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
}

.rates-title {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  text-align: center;
  color: #212529;
}

.rate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: white;
  border-radius: 8px;
}

.rate-rarity {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: bold;
  color: white;
}

.rate-rarity.common {
  background: #6c757d;
}

.rate-rarity.rare {
  background: #0d6efd;
}

.rate-rarity.epic {
  background: #9333ea;
}

.rate-rarity.legendary {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #000;
}

.rate-rarity.legendary-disabled {
  background: #dee2e6;
  color: #6c757d;
}

.rate-percent {
  font-weight: bold;
  color: #212529;
}

.open-pack-btn {
  font-weight: bold;
  font-size: 1.2rem;
  padding: 1rem;
  transition: all 0.3s;
}

.open-pack-btn:not(:disabled):hover {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.open-pack-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.insufficient-warning,
.claimed-notice {
  margin-top: 1rem;
  color: #dc3545;
  font-weight: bold;
}

.claimed-notice {
  color: #28a745;
}

/* Info Cards */
.info-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.info-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.info-title {
  color: white;
  font-size: 1.3rem;
  margin-bottom: 1rem;
}

.info-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  line-height: 1.6;
}
</style>
