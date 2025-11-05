<script setup>
import { ref, onMounted, computed } from 'vue'
import { getUserVouchers, redeemVoucher, removeExpiredVouchers } from '@/Database/GachaSystem'
import { getAuth } from 'firebase/auth'
import navbar from '@/navbar.vue'
import { useAlert } from '@/composables/useAlert'

const auth = getAuth()
const { showError, showSuccess } = useAlert()

const vouchers = ref([])
const isLoading = ref(true)
const selectedVoucher = ref(null)
const showRedeemModal = ref(false)
const isRedeeming = ref(false)
const justRedeemed = ref(false)
const filterType = ref('active') // 'active', 'redeemed', 'all'
const copiedCode = ref(null) // Track which code was copied

// Rarity color mapping
const rarityColors = {
  common: '#6c757d',
  rare: '#0d6efd',
  epic: '#9333ea',
  legendary: '#fbbf24'
}

const filteredVouchers = computed(() => {
  const now = new Date()

  switch (filterType.value) {
    case 'active':
      return vouchers.value.filter(v => !v.redeemed && new Date(v.expiresAt) > now)
    case 'redeemed':
      return vouchers.value.filter(v => v.redeemed)
    case 'all':
      return vouchers.value
    default:
      return vouchers.value
  }
})

const voucherStats = computed(() => {
  const now = new Date()
  return {
    total: vouchers.value.length,
    active: vouchers.value.filter(v => !v.redeemed && new Date(v.expiresAt) > now).length,
    redeemed: vouchers.value.filter(v => v.redeemed).length,
    expired: vouchers.value.filter(v => !v.redeemed && new Date(v.expiresAt) <= now).length,
    totalValue: vouchers.value
      .filter(v => !v.redeemed && new Date(v.expiresAt) > now)
      .reduce((sum, v) => sum + v.amount, 0)
  }
})

async function loadVouchers() {
  try {
    isLoading.value = true

    // Clean up expired vouchers first
    await removeExpiredVouchers(auth.currentUser.uid)

    // Fetch updated voucher list
    vouchers.value = await getUserVouchers(auth.currentUser.uid)
  } catch (error) {
    console.error('Error loading vouchers:', error)
  } finally {
    isLoading.value = false
  }
}

function openRedeemModal(voucher) {
  selectedVoucher.value = voucher
  showRedeemModal.value = true
  justRedeemed.value = false
}

function closeRedeemModal() {
  selectedVoucher.value = null
  showRedeemModal.value = false
  justRedeemed.value = false
  isRedeeming.value = false
}

async function confirmRedeem() {
  if (!selectedVoucher.value) return

  try {
    isRedeeming.value = true
    await redeemVoucher(selectedVoucher.value.id, auth.currentUser.uid)

    // Update local state
    const index = vouchers.value.findIndex(v => v.id === selectedVoucher.value.id)
    if (index !== -1) {
      vouchers.value[index].redeemed = true
      vouchers.value[index].redeemedAt = new Date()

      // Update selectedVoucher to show as redeemed
      selectedVoucher.value = vouchers.value[index]
    }

    // Show the code instead of closing
    justRedeemed.value = true
  } catch (error) {
    console.error('Error redeeming voucher:', error)
    showError(error.message || 'Failed to redeem voucher', 'Redemption Failed')
  } finally {
    isRedeeming.value = false
  }
}

function isExpired(voucher) {
  return new Date(voucher.expiresAt) <= new Date()
}

function getDaysUntilExpiry(voucher) {
  const now = new Date()
  const expiry = new Date(voucher.expiresAt)
  const diffTime = expiry - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

function copyCode(code) {
  navigator.clipboard.writeText(code)
  copiedCode.value = code

  // Reset after 2 seconds
  setTimeout(() => {
    copiedCode.value = null
  }, 2000)
}

onMounted(() => {
  loadVouchers()
})
</script>

<template>
  <div class="inventory-page">
    <navbar />

    <div class="container py-5">
      <!-- Header -->
      <div class="page-header mb-5">
        <div class="header-content">
          <h1 class="display-4 fw-bold mb-2">
            <span class="header-icon">🎫</span>
            My Vouchers
          </h1>
          <p>Manage and redeem your earned vouchers</p>
        </div>
        <div class="header-actions">
          <router-link to="/gambling" class="btn-modern btn-ghost-dark">
            <i class="fas fa-arrow-left me-2"></i>Back to Gacha
          </router-link>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row g-4 mb-5">
        <div class="col-md-3 col-sm-6">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-value">{{ voucherStats.total }}</div>
            <div class="stat-label">Total Vouchers</div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card active">
            <div class="stat-icon">✅</div>
            <div class="stat-value">{{ voucherStats.active }}</div>
            <div class="stat-label">Active</div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-value">S${{ voucherStats.totalValue }}</div>
            <div class="stat-label">Total Value</div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-value">{{ voucherStats.redeemed }}</div>
            <div class="stat-label">Redeemed</div>
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs mb-4">
        <button
          class="filter-tab"
          :class="{ active: filterType === 'active' }"
          @click="filterType = 'active'"
        >
          Active ({{ voucherStats.active }})
        </button>
        <button
          class="filter-tab"
          :class="{ active: filterType === 'redeemed' }"
          @click="filterType = 'redeemed'"
        >
          Redeemed ({{ voucherStats.redeemed }})
        </button>
        <button
          class="filter-tab"
          :class="{ active: filterType === 'all' }"
          @click="filterType = 'all'"
        >
          All ({{ voucherStats.total }})
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border" style="color: #0A490A;" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3" style="color: var(--color-gray-700);">Loading vouchers...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredVouchers.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3 class="mb-2">No Vouchers Found</h3>
        <p class="mb-4">
          {{ filterType === 'active' ? 'You don\'t have any active vouchers.' :
             filterType === 'redeemed' ? 'You haven\'t redeemed any vouchers yet.' :
             'Start opening packs to collect vouchers!' }}
        </p>
        <router-link to="/gambling" class="btn-modern btn-primary">
          <i class="fas fa-gift me-2"></i>Go to Gacha
        </router-link>
      </div>

      <!-- Voucher Grid -->
      <div v-else class="voucher-grid">
        <div
          v-for="voucher in filteredVouchers"
          :key="voucher.id"
          class="voucher-card"
          :class="{
            'expired': isExpired(voucher),
            'redeemed': voucher.redeemed
          }"
          :style="{
            borderColor: rarityColors[voucher.rarity]
          }"
        >
          <!-- Rarity Badge -->
          <div
            class="rarity-badge"
            :style="{ background: rarityColors[voucher.rarity] }"
          >
            {{ voucher.rarity.toUpperCase() }}
          </div>

          <!-- Voucher Icon -->
          <div class="voucher-icon">{{ voucher.icon }}</div>

          <!-- Voucher Details -->
          <h4 class="voucher-brand">{{ voucher.brand }}</h4>
          <div class="voucher-amount">S${{ voucher.amount }}</div>

          <!-- Voucher Code (only show if redeemed) -->
          <div v-if="voucher.redeemed" class="voucher-code-section">
            <label class="code-label">Code:</label>
            <div class="code-display">
              <span class="code-text">{{ voucher.code }}</span>
              <button
                class="btn btn-sm copy-btn"
                :class="copiedCode === voucher.code ? 'btn-success' : 'btn-outline-secondary'"
                @click="copyCode(voucher.code)"
                :title="copiedCode === voucher.code ? 'Copied!' : 'Copy code'"
              >
                <i v-if="copiedCode === voucher.code" class="fas fa-check"></i>
                <i v-else class="fas fa-copy"></i>
              </button>
            </div>
          </div>
          <div v-else class="voucher-code-section locked">
            <label class="code-label">Code:</label>
            <div class="code-display locked-code">
              <span class="code-text">••••••••</span>
              <i class="fas fa-lock" style="color: var(--color-gray-400);"></i>
            </div>
            <p class="unlock-hint">Redeem to reveal code</p>
          </div>

          <!-- Status & Expiry -->
          <div class="voucher-footer">
            <div v-if="voucher.redeemed" class="redeemed-info">
              <div class="status-badge redeemed-badge">
                ✓ Redeemed
              </div>
              <div class="expiry-text mt-2" :class="{ 'expiry-warning': getDaysUntilExpiry(voucher) <= 3 }">
                <i class="fas fa-clock me-1"></i>
                {{ isExpired(voucher) ? 'Code expired' :
                   getDaysUntilExpiry(voucher) === 1 ? 'Code expires tomorrow' :
                   `Code expires in ${getDaysUntilExpiry(voucher)} days` }}
              </div>
            </div>
            <div v-else-if="isExpired(voucher)" class="status-badge expired-badge">
              ⚠️ Expired
            </div>
            <div v-else>
              <div class="expiry-text" :class="{ 'expiry-warning': getDaysUntilExpiry(voucher) <= 3 }">
                <i class="fas fa-clock me-1"></i>
                {{ getDaysUntilExpiry(voucher) <= 0 ? 'Expired' :
                   getDaysUntilExpiry(voucher) === 1 ? 'Expires tomorrow' :
                   `Expires in ${getDaysUntilExpiry(voucher)} days` }}
              </div>
            </div>
          </div>

          <!-- Redeem Button -->
          <button
            v-if="!voucher.redeemed && !isExpired(voucher)"
            class="btn btn-primary w-100 redeem-btn"
            @click="openRedeemModal(voucher)"
          >
            Redeem Voucher
          </button>
        </div>
      </div>
    </div>

    <!-- Redeem Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showRedeemModal && selectedVoucher"
          class="modal-backdrop"
          @click.self="closeRedeemModal"
        >
          <div class="redeem-modal">
            <!-- Before Redemption -->
            <div v-if="!justRedeemed">
              <h3 class="modal-title">Redeem Voucher?</h3>

              <div class="voucher-preview">
                <div class="preview-icon">{{ selectedVoucher.icon }}</div>
                <h4>{{ selectedVoucher.brand }}</h4>
                <div class="preview-amount">S${{ selectedVoucher.amount }}</div>
                <div class="preview-rarity-badge" :style="{ background: rarityColors[selectedVoucher.rarity] }">
                  {{ selectedVoucher.rarity.toUpperCase() }}
                </div>
              </div>

              <div class="alert alert-info">
                <strong>Important:</strong> Your voucher code will be revealed after you confirm redemption.
                Make sure to copy and use the code before it expires. This action cannot be undone.
              </div>

              <div class="modal-actions">
                <button class="btn btn-ghost-dark" @click="closeRedeemModal" :disabled="isRedeeming">
                  Cancel
                </button>
                <button class="btn btn-primary" @click="confirmRedeem" :disabled="isRedeeming">
                  <i v-if="!isRedeeming" class="fas fa-unlock me-2"></i>
                  <span v-else class="spinner-border spinner-border-sm me-2"></span>
                  {{ isRedeeming ? 'Redeeming...' : 'Confirm & Reveal Code' }}
                </button>
              </div>
            </div>

            <!-- After Redemption - Show Code -->
            <div v-else class="redeemed-success">
              <div class="success-header">
                <i class="fas fa-check-circle success-icon-large"></i>
                <h3 class="modal-title">Voucher Redeemed!</h3>
              </div>

              <div class="voucher-preview">
                <div class="preview-icon">{{ selectedVoucher.icon }}</div>
                <h4>{{ selectedVoucher.brand }}</h4>
                <div class="preview-amount">S${{ selectedVoucher.amount }}</div>
              </div>

              <div class="code-reveal-section">
                <label class="code-label">Your Voucher Code:</label>
                <div class="code-display-modal">
                  <span class="code-text-large">{{ selectedVoucher.code }}</span>
                  <button
                    class="btn btn-sm copy-btn-modal"
                    :class="copiedCode === selectedVoucher.code ? 'btn-success-solid' : 'btn-outline-success'"
                    @click="copyCode(selectedVoucher.code)"
                    :title="copiedCode === selectedVoucher.code ? 'Copied!' : 'Copy code'"
                  >
                    <i v-if="copiedCode === selectedVoucher.code" class="fas fa-check me-2"></i>
                    <i v-else class="fas fa-copy me-2"></i>
                    {{ copiedCode === selectedVoucher.code ? 'Copied!' : 'Copy' }}
                  </button>
                </div>
              </div>

              <div class="alert alert-success">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Code revealed!</strong> Make sure to copy and use this code before it expires.
                <div class="mt-2" style="font-size: 0.9rem;">
                  <i class="fas fa-clock me-1"></i>
                  <strong>
                    {{ isExpired(selectedVoucher) ? 'Code has expired!' :
                       getDaysUntilExpiry(selectedVoucher) === 1 ? 'Expires tomorrow' :
                       `Expires in ${getDaysUntilExpiry(selectedVoucher)} days` }}
                  </strong>
                </div>
              </div>

              <div class="modal-actions">
                <button class="btn btn-primary w-100" @click="closeRedeemModal">
                  <i class="fas fa-check me-2"></i>Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.inventory-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ebe9 100%);
  padding-top: 100px;
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.page-header h1 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-sm);
}

.page-header p {
  color: var(--color-gray-600);
  font-size: var(--font-size-base);
}

.header-icon {
  font-size: 2.5rem;
  display: inline-block;
  margin-right: 0.5rem;
}

/* Stats Cards */
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

.stat-card.active {
  border-left: 4px solid #0A490A;
  background: linear-gradient(135deg, rgba(10, 73, 10, 0.05) 0%, rgba(15, 90, 15, 0.05) 100%);
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

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: var(--spacing-xl);
}

.filter-tab {
  background: var(--color-white);
  border: 2px solid var(--color-gray-200);
  color: var(--color-gray-700);
  padding: 0.625rem 1.5rem;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tab:hover {
  background: var(--color-gray-50);
  border-color: var(--color-gray-300);
}

.filter-tab.active {
  background: linear-gradient(135deg, #0A490A 0%, #0f5a0f 100%);
  color: white;
  border-color: #0A490A;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-gray-200);
}

.empty-state h3 {
  color: var(--color-gray-900);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
}

.empty-state p {
  color: var(--color-gray-600);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
  color: var(--color-gray-400);
}

/* Voucher Grid */
.voucher-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.voucher-card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  border: 2px solid;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: var(--shadow-sm);
}

.voucher-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.voucher-card.expired,
.voucher-card.redeemed {
  opacity: 0.65;
  filter: grayscale(40%);
}

.rarity-badge {
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.4rem 0.85rem;
  border-radius: 0 var(--radius-lg) 0 var(--radius-md);
  color: white;
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.5px;
}

.voucher-icon {
  font-size: 3.5rem;
  text-align: center;
  margin: 1rem 0;
}

.voucher-brand {
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.5rem;
  color: #212529;
}

.voucher-amount {
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  color: #28a745;
  margin-bottom: 1rem;
}

.voucher-code-section {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.voucher-code-section.locked {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px dashed var(--color-gray-300);
}

.code-label {
  font-size: 0.85rem;
  color: #6c757d;
  display: block;
  margin-bottom: 0.5rem;
}

.code-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.code-display.locked-code {
  opacity: 0.6;
}

.code-text {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  font-size: 1.1rem;
  color: #212529;
  word-break: break-all;
}

.unlock-hint {
  margin-top: 0.5rem;
  margin-bottom: 0;
  font-size: 0.8rem;
  color: var(--color-gray-500);
  text-align: center;
  font-style: italic;
}

.copy-btn {
  flex-shrink: 0;
}

.voucher-footer {
  margin-bottom: 1rem;
  text-align: center;
}

.redeemed-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
}

.redeemed-badge {
  background: #d4edda;
  color: #155724;
}

.expired-badge {
  background: #f8d7da;
  color: #721c24;
}

.expiry-text {
  font-size: 0.85rem;
  color: #6c757d;
}

.expiry-warning {
  color: #dc3545;
  font-weight: bold;
}

.redeem-btn {
  font-weight: bold;
  padding: 0.75rem;
}

/* Redeem Modal */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.redeem-modal {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
}

.modal-title {
  text-align: center;
  margin-bottom: 1.5rem;
}

.voucher-preview {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 1.5rem;
}

.preview-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.preview-amount {
  font-size: 2rem;
  font-weight: bold;
  color: #28a745;
  margin: 1rem 0;
}

.preview-rarity-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-full);
  color: white;
  font-size: 0.9rem;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.5px;
  margin-top: 0.5rem;
}

.success-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.success-icon-large {
  font-size: 3.5rem;
  color: #27ae60;
  margin-bottom: 0.5rem;
}

.redeemed-success .modal-title {
  color: #27ae60;
  margin-bottom: 1rem;
}

.code-reveal-section {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1.25rem;
  margin: 1.5rem 0;
  border: 2px solid #27ae60;
}

.code-reveal-section .code-label {
  font-size: 0.9rem;
  color: #6c757d;
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  text-align: center;
}

.code-display-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.code-text-large {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  font-size: 1.5rem;
  color: #212529;
  background: white;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  border: 2px dashed #27ae60;
  letter-spacing: 2px;
  word-break: break-all;
  text-align: center;
}

.copy-btn-modal {
  padding: 0.5rem 1.25rem;
  font-weight: 600;
  border: 2px solid #27ae60;
  color: #27ae60;
  background: white;
  transition: all 0.2s;
}

.copy-btn-modal:hover {
  background: #27ae60;
  color: white;
  transform: translateY(-1px);
}

.btn-success-solid {
  background: #27ae60 !important;
  color: white !important;
  border-color: #27ae60 !important;
}

.btn-success-solid:hover {
  background: #229954 !important;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.modal-actions .btn {
  flex: 1;
  padding: 0.75rem;
  font-weight: bold;
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
