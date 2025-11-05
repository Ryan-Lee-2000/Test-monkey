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
import { useAlert } from "@/composables/useAlert"
import { useUserData } from "@/composables/useUserData"

const auth = getAuth()
const router = useRouter()
const { showInfo, showWarning } = useAlert()
const { refreshBalance } = useUserData()

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
        showInfo('Gambling is only available for Test Monkeys. As a Founder, you can use bananas to create missions.', 'Access Restricted')
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
    showWarning(`You need ${packCost.value} bananas to open a pack. You have ${bananaBalance.value}.`, 'Insufficient Bananas')
    return
  }

  isFreePack.value = false
  showPackModal.value = true
}

function openFreePack() {
  if (!canClaimFree.value) {
    showInfo('You have already claimed your free pack today!', 'Free Pack Claimed')
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

  // Reload tester data (for the page stat cards)
  await loadTesterData()

  // Also refresh the navbar balance
  await refreshBalance()
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
      <div class="spinner-border" style="width: 3rem; height: 3rem; color: #0A490A;"></div>
      <p class="mt-3" style="color: var(--color-gray-700);">Loading...</p>
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
        <p class="subtitle">Open packs to win Singapore vouchers!</p>
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
                class="progress-bar"
                style="background: linear-gradient(135deg, #0A490A 0%, #0f5a0f 100%);"
                :style="{ width: pityProgress + '%' }"
              ></div>
            </div>
            <small class="mt-1 d-block" style="color: var(--color-gray-600); font-size: 0.85rem;">
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
              class="btn btn-primary btn-lg w-100 open-pack-btn"
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
      <div class="text-center mb-4 action-buttons">
        <button class="btn-modern btn-ghost-dark me-3" @click="goToInventory">
          <i class="fas fa-wallet me-2"></i>
          View My Vouchers
        </button>
        <router-link to="/home" class="btn-modern btn-primary">
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
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ebe9 100%);
  min-height: 100vh;
  padding-top: 100px;
}

.gacha-title {
  font-size: 2.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.1rem;
  color: var(--color-gray-600);
}

/* Stat Cards */
.stat-card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  text-align: center;
  border: 1px solid var(--color-gray-200);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.banana-card {
  border-left: 4px solid #0A490A;
}

.pity-card {
  border-left: 4px solid #0f5a0f;
}

.free-card {
  border-left: 4px solid #27ae60;
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.95rem;
  color: var(--color-gray-600);
}

/* Pack Cards */
.pack-card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  text-align: center;
  box-shadow: var(--shadow-md);
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
  border: 2px solid var(--color-gray-200);
}

.pack-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.standard-pack {
  border-color: #0A490A;
}

.free-pack-card {
  border-color: #27ae60;
}

.free-badge {
  position: absolute;
  top: -12px;
  right: 20px;
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: white;
  padding: 0.4rem 1.2rem;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-semibold);
  font-size: 0.9rem;
  box-shadow: var(--shadow-sm);
}

.pack-icon-large {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.pack-name {
  font-size: 1.75rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin-bottom: 0.75rem;
}

.pack-description {
  color: var(--color-gray-600);
  margin-bottom: 1.5rem;
  font-size: 1rem;
  line-height: 1.5;
}

.pack-cost-display {
  background: linear-gradient(135deg, #0A490A 0%, #0f5a0f 100%);
  border-radius: var(--radius-full);
  padding: 0.75rem 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.free-cost {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
}

.banana-icon {
  font-size: 1.5rem;
}

.cost-value {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: white;
}

.cost-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.95);
}

.pack-rates {
  background: var(--color-gray-50);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  text-align: left;
  border: 1px solid var(--color-gray-200);
}

.rates-title {
  font-size: 1rem;
  margin-bottom: var(--spacing-md);
  text-align: center;
  color: var(--color-gray-900);
  font-weight: var(--font-weight-semibold);
}

.rate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
  background: var(--color-white);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-gray-200);
}

.rate-rarity {
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: var(--font-weight-semibold);
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
  background: linear-gradient(135deg, #0A490A 0%, #0f5a0f 100%);
  color: white;
}

.rate-rarity.legendary-disabled {
  background: var(--color-gray-300);
  color: var(--color-gray-600);
}

.rate-percent {
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
}

.open-pack-btn {
  font-weight: var(--font-weight-semibold);
  font-size: 1.05rem;
  padding: 0.875rem;
  transition: all 0.2s;
  border: none;
}

.open-pack-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.open-pack-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.insufficient-warning,
.claimed-notice {
  margin-top: var(--spacing-md);
  font-weight: var(--font-weight-semibold);
  font-size: 0.9rem;
}

.insufficient-warning {
  color: var(--color-danger);
}

.claimed-notice {
  color: var(--color-success);
}

/* Info Cards */
.info-card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  text-align: center;
  border: 1px solid var(--color-gray-200);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.info-icon {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-md);
}

.info-title {
  color: var(--color-gray-900);
  font-size: 1.2rem;
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
}

.info-text {
  color: var(--color-gray-600);
  font-size: 0.95rem;
  line-height: 1.6;
}

/* Container styling */
.container {
  max-width: 1400px;
}
</style>
