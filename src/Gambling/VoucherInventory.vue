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
const filterType = ref('active') // 'active', 'redeemed', 'all'

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
}

function closeRedeemModal() {
  selectedVoucher.value = null
  showRedeemModal.value = false
}

async function confirmRedeem() {
  if (!selectedVoucher.value) return

  try {
    await redeemVoucher(selectedVoucher.value.id, auth.currentUser.uid)

    // Update local state
    const index = vouchers.value.findIndex(v => v.id === selectedVoucher.value.id)
    if (index !== -1) {
      vouchers.value[index].redeemed = true
      vouchers.value[index].redeemedAt = new Date()
    }

    closeRedeemModal()
  } catch (error) {
    console.error('Error redeeming voucher:', error)
    showError(error.message || 'Failed to redeem voucher', 'Redemption Failed')
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
  showSuccess('Voucher code copied to clipboard!', 'Copied')
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
        <h1 class="display-4 fw-bold text-white mb-2">
          <span class="header-icon">🎫</span>
          My Vouchers
        </h1>
        <p class="text-white-50">Manage and redeem your earned vouchers</p>
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
        <div class="spinner-border text-light" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredVouchers.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3 class="text-white mb-2">No Vouchers Found</h3>
        <p class="text-white-50 mb-4">
          {{ filterType === 'active' ? 'You don\'t have any active vouchers.' :
             filterType === 'redeemed' ? 'You haven\'t redeemed any vouchers yet.' :
             'Start opening packs to collect vouchers!' }}
        </p>
        <router-link to="/gambling" class="btn btn-primary btn-lg">
          Go to Gacha
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

          <!-- Voucher Code -->
          <div class="voucher-code-section">
            <label class="code-label">Code:</label>
            <div class="code-display">
              <span class="code-text">{{ voucher.code }}</span>
              <button
                class="btn btn-sm btn-outline-secondary copy-btn"
                @click="copyCode(voucher.code)"
                title="Copy code"
              >
                <i class="fas fa-copy"></i>
              </button>
            </div>
          </div>

          <!-- Status & Expiry -->
          <div class="voucher-footer">
            <div v-if="voucher.redeemed" class="status-badge redeemed-badge">
              ✓ Redeemed
            </div>
            <div v-else-if="isExpired(voucher)" class="status-badge expired-badge">
              ⚠️ Expired
            </div>
            <div v-else>
              <div class="expiry-text" :class="{ 'expiry-warning': getDaysUntilExpiry(voucher) <= 3 }">
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
            <h3 class="modal-title">Redeem Voucher?</h3>

            <div class="voucher-preview">
              <div class="preview-icon">{{ selectedVoucher.icon }}</div>
              <h4>{{ selectedVoucher.brand }}</h4>
              <div class="preview-amount">S${{ selectedVoucher.amount }}</div>
              <div class="preview-code">{{ selectedVoucher.code }}</div>
            </div>

            <div class="alert alert-info">
              <strong>Important:</strong> Make sure to use this voucher code before it expires.
              Once redeemed, this action cannot be undone.
            </div>

            <div class="modal-actions">
              <button class="btn btn-secondary" @click="closeRedeemModal">
                Cancel
              </button>
              <button class="btn btn-primary" @click="confirmRedeem">
                Confirm Redeem
              </button>
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
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

.page-header {
  margin-top: 100px;
  text-align: center;
}

.header-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

/* Stats Cards */
.stat-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 1.5rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.stat-card.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: white;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.filter-tab {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-tab:hover {
  background: rgba(255, 255, 255, 0.2);
}

.filter-tab.active {
  background: white;
  color: #1e3c72;
  border-color: white;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
}

/* Voucher Grid */
.voucher-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.voucher-card {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  border: 3px solid;
  position: relative;
  transition: transform 0.3s, box-shadow 0.3s;
}

.voucher-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.voucher-card.expired,
.voucher-card.redeemed {
  opacity: 0.6;
  filter: grayscale(50%);
}

.rarity-badge {
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.35rem 0.75rem;
  border-radius: 0 12px 0 12px;
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  letter-spacing: 1px;
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

.code-text {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  font-size: 1.1rem;
  color: #212529;
  word-break: break-all;
}

.copy-btn {
  flex-shrink: 0;
}

.voucher-footer {
  margin-bottom: 1rem;
  text-align: center;
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
  font-size: 0.9rem;
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

.preview-code {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  font-size: 1.2rem;
  background: white;
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
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
