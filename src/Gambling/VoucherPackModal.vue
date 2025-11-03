<script setup>
import { ref, computed, watch } from 'vue'
import { openVoucherPack, GACHA_CONSTANTS } from '@/Database/GachaSystem'
import { getAuth } from 'firebase/auth'

const props = defineProps({
  show: Boolean,
  isFree: Boolean
})

const emit = defineEmits(['close', 'packOpened'])

const auth = getAuth()

// Reset state when modal is shown
watch(() => props.show, (newValue) => {
  if (newValue) {
    // Modal is opening, reset all state
    revealedVoucher.value = null
    showPackAnimation.value = false
    showVoucherReveal.value = false
    error.value = ''
    isOpening.value = false
  }
})

// Animation states
const isOpening = ref(false)
const showPackAnimation = ref(false)
const showVoucherReveal = ref(false)
const revealedVoucher = ref(null)
const error = ref('')

// Rarity color mapping
const rarityColors = {
  common: '#6c757d',
  rare: '#0d6efd',
  epic: '#9333ea',
  legendary: '#fbbf24'
}

const rarityGlow = {
  common: 'rgba(108, 117, 125, 0.5)',
  rare: 'rgba(13, 110, 253, 0.6)',
  epic: 'rgba(147, 51, 234, 0.7)',
  legendary: 'rgba(251, 191, 36, 0.8)'
}

const packCost = computed(() => GACHA_CONSTANTS.PACK_COST)

async function openPack() {
  if (isOpening.value) return

  try {
    // Reset all state first
    error.value = ''
    revealedVoucher.value = null
    showVoucherReveal.value = false
    isOpening.value = true
    showPackAnimation.value = true

    // Simulate pack opening animation delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Call gacha system
    const voucher = await openVoucherPack(auth.currentUser.uid, props.isFree)

    revealedVoucher.value = voucher

    // Transition to voucher reveal
    showPackAnimation.value = false
    showVoucherReveal.value = true

    // Auto-close after showing voucher
    setTimeout(() => {
      closeModal()
      emit('packOpened', voucher)
    }, 4000)

  } catch (err) {
    console.error('Error opening pack:', err)
    error.value = err.message || 'Failed to open pack'
    isOpening.value = false
    showPackAnimation.value = false
  }
}

function closeModal() {
  if (isOpening.value) return // Prevent closing during animation

  showPackAnimation.value = false
  showVoucherReveal.value = false
  revealedVoucher.value = null
  error.value = ''
  isOpening.value = false
  emit('close')
}

function handleBackdropClick(event) {
  if (event.target === event.currentTarget) {
    closeModal()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="modal-backdrop"
        @click="handleBackdropClick"
      >
        <div class="modal-container">
          <!-- Error State -->
          <div v-if="error" class="error-container">
            <div class="error-icon">⚠️</div>
            <h3 class="error-title">Oops!</h3>
            <p class="error-message">{{ error }}</p>
            <button class="btn btn-primary mt-3" @click="closeModal">Close</button>
          </div>

          <!-- Initial Pack Display -->
          <div v-else-if="!showPackAnimation && !showVoucherReveal" class="pack-preview">
            <div class="pack-box" :class="{ 'free-pack': isFree }">
              <div class="pack-icon">📦</div>
              <h2 class="pack-title">
                {{ isFree ? 'Free Daily Pack' : 'Voucher Pack' }}
              </h2>
              <p class="pack-description">
                {{ isFree ? 'Your free daily pack is ready!' : `Contains 1 random voucher` }}
              </p>

              <div v-if="!isFree" class="pack-cost">
                <span class="banana-icon">🍌</span>
                <span class="cost-amount">{{ packCost }}</span>
              </div>

              <div class="pack-odds mt-4">
                <h4 class="odds-title">Drop Rates:</h4>
                <div class="odds-list">
                  <div class="odd-item">
                    <span class="rarity-badge" style="background: #6c757d;">Common</span>
                    <span>{{ isFree ? '85%' : '70%' }}</span>
                  </div>
                  <div class="odd-item">
                    <span class="rarity-badge" style="background: #0d6efd;">Rare</span>
                    <span>{{ isFree ? '12%' : '20%' }}</span>
                  </div>
                  <div class="odd-item">
                    <span class="rarity-badge" style="background: #9333ea;">Epic</span>
                    <span>{{ isFree ? '3%' : '8%' }}</span>
                  </div>
                  <div class="odd-item" v-if="!isFree">
                    <span class="rarity-badge" style="background: #fbbf24; color: #000;">Legendary</span>
                    <span>2%</span>
                  </div>
                </div>
              </div>

              <div class="button-group">
                <button
                  v-if="isFree"
                  class="btn btn-primary btn-lg open-btn"
                  style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);"
                  @click="openPack"
                  :disabled="isOpening"
                >
                  Open Free Pack
                </button>
                <button
                  v-else
                  class="btn btn-primary btn-lg open-btn"
                  @click="openPack"
                  :disabled="isOpening"
                >
                  Open Pack
                </button>
                <button
                  class="btn btn-secondary btn-lg"
                  @click="closeModal"
                  :disabled="isOpening"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <!-- Pack Opening Animation -->
          <div v-else-if="showPackAnimation" class="pack-opening-animation">
            <div class="spinning-pack">
              <div class="pack-3d">📦</div>
            </div>
            <h3 class="opening-text">Opening pack...</h3>
            <div class="sparkles">
              <span class="sparkle">✨</span>
              <span class="sparkle">✨</span>
              <span class="sparkle">✨</span>
            </div>
          </div>

          <!-- Voucher Reveal -->
          <div v-else-if="showVoucherReveal && revealedVoucher" class="voucher-reveal">
            <div
              class="voucher-card"
              :style="{
                borderColor: rarityColors[revealedVoucher.rarity],
                boxShadow: `0 0 40px ${rarityGlow[revealedVoucher.rarity]}`
              }"
            >
              <div class="rarity-banner modal-header" :style="{ background: rarityColors[revealedVoucher.rarity] }">
                {{ revealedVoucher.rarity.toUpperCase() }}
                <button type="button" class="btn-close btn-close-white" @click="emit('close')"></button>
              </div>

              <div class="voucher-icon-large">{{ revealedVoucher.icon }}</div>

              <h2 class="voucher-brand">{{ revealedVoucher.brand }}</h2>

              <div class="voucher-amount">
                S${{ revealedVoucher.amount }}
              </div>

              <div class="voucher-code-display">
                <small class="text-muted">Voucher Code</small>
                <div class="code-box">{{ revealedVoucher.code }}</div>
              </div>

              <div class="expiry-info">
                <small>Expires: {{ new Date(revealedVoucher.expiresAt).toLocaleDateString() }}</small>
              </div>
            </div>

            <div class="confetti">
              <span class="confetti-piece">🎊</span>
              <span class="confetti-piece">🎉</span>
              <span class="confetti-piece">✨</span>
              <span class="confetti-piece">🎊</span>
              <span class="confetti-piece">🎉</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(8px);
}

.modal-container {
  position: relative;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

/* Error State */
.error-container {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-title {
  color: #dc3545;
  margin-bottom: 1rem;
}

.error-message {
  color: #6c757d;
}

/* Pack Preview */
.pack-preview {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  color: white;
}

.pack-box.free-pack {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 20px;
  padding: 2rem;
}

.pack-icon {
  font-size: 6rem;
  margin-bottom: 1rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.pack-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.pack-description {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 1.5rem;
}

.pack-cost {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-size: 1.5rem;
  font-weight: bold;
}

.pack-odds {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 1.5rem;
  text-align: left;
}

.odds-title {
  font-size: 1rem;
  margin-bottom: 1rem;
  text-align: center;
}

.odds-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.odd-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.rarity-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: bold;
  color: white;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: center;
}

.open-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-weight: bold;
  padding: 0.75rem 2rem;
  transition: transform 0.2s;
}

.open-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.open-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Pack Opening Animation */
.pack-opening-animation {
  text-align: center;
  padding: 4rem 2rem;
}

.spinning-pack {
  margin-bottom: 2rem;
}

.pack-3d {
  font-size: 8rem;
  animation: spin3d 2s linear infinite;
}

@keyframes spin3d {
  0% { transform: rotateY(0deg) rotateX(0deg); }
  50% { transform: rotateY(180deg) rotateX(180deg); }
  100% { transform: rotateY(360deg) rotateX(360deg); }
}

.opening-text {
  color: white;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.sparkles {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.sparkle {
  font-size: 2rem;
  animation: sparkle 1s ease-in-out infinite;
}

.sparkle:nth-child(2) {
  animation-delay: 0.3s;
}

.sparkle:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes sparkle {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
  50% { transform: scale(1.5) rotate(180deg); opacity: 0.5; }
}

/* Voucher Reveal */
.voucher-reveal {
  position: relative;
  animation: revealFade 0.5s ease-out;
}

@keyframes revealFade {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

.voucher-card {
  background: white;
  border-radius: 20px;
  padding: 3rem 2rem;
  text-align: center;
  border: 4px solid;
  position: relative;
  overflow: hidden;
}

.rarity-banner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 0.75rem;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  letter-spacing: 2px;
}

.voucher-icon-large {
  font-size: 6rem;
  margin: 2rem 0 1rem;
}

.voucher-brand {
  font-size: 2.5rem;
  font-weight: bold;
  color: #212529;
  margin-bottom: 1rem;
}

.voucher-amount {
  font-size: 3rem;
  font-weight: bold;
  color: #28a745;
  margin-bottom: 2rem;
}

.voucher-code-display {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.code-box {
  font-family: 'Courier New', monospace;
  font-size: 1.5rem;
  font-weight: bold;
  color: #212529;
  letter-spacing: 2px;
  margin-top: 0.5rem;
}

.expiry-info {
  color: #6c757d;
  font-size: 0.9rem;
}

.confetti {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  font-size: 2rem;
  animation: confettiFall 3s ease-out forwards;
}

.confetti-piece:nth-child(1) {
  left: 10%;
  animation-delay: 0s;
}

.confetti-piece:nth-child(2) {
  left: 30%;
  animation-delay: 0.2s;
}

.confetti-piece:nth-child(3) {
  left: 50%;
  animation-delay: 0.4s;
}

.confetti-piece:nth-child(4) {
  left: 70%;
  animation-delay: 0.6s;
}

.confetti-piece:nth-child(5) {
  left: 90%;
  animation-delay: 0.8s;
}

@keyframes confettiFall {
  0% {
    top: -10%;
    transform: rotate(0deg);
    opacity: 1;
  }
  100% {
    top: 110%;
    transform: rotate(720deg);
    opacity: 0;
  }
}

/* Modal Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
