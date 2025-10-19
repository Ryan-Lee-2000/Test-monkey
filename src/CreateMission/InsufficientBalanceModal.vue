<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { computed } from 'vue'
import { useBananaTopUp } from '@/composables/useBananaTopUp'

const props = defineProps({
  show: Boolean,
  currentBalance: Number,
  requiredAmount: Number
})

const emit = defineEmits(['close'])

const { openTopUp } = useBananaTopUp()

const shortfall = computed(() => {
  return props.requiredAmount - props.currentBalance
})

function handleTopUp() {
  emit('close') // Close the insufficient balance modal
  openTopUp()   // Open the banana top-up modal
}
</script>

<template>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">

  <!-- Bootstrap Modal -->
  <div v-if="show" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.7);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg rounded-4">

        <!-- Header -->
        <div class="modal-header border-0 pb-0">
          <button type="button" class="btn-close" @click="emit('close')"></button>
        </div>

        <!-- Body -->
        <div class="modal-body text-center px-5 pb-5">
          <!-- Icon -->
          <div class="mb-4">
            <div class="icon-circle mx-auto">
              <i class="fas fa-exclamation-triangle text-warning"></i>
            </div>
          </div>

          <!-- Title -->
          <h3 class="fw-bold mb-3">Insufficient Banana Balance</h3>

          <!-- Message -->
          <p class="text-muted mb-4">
            You don't have enough bananas to create this mission. Please top up your account to continue.
          </p>

          <!-- Balance Details -->
          <div class="balance-details p-4 mb-4 rounded-3">
            <div class="row g-3 text-start">
              <div class="col-12">
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">
                    <i class="fas fa-wallet me-2"></i>Current Balance:
                  </span>
                  <span class="fs-5 fw-bold">🍌 {{ currentBalance.toLocaleString() }}</span>
                </div>
              </div>
              <div class="col-12">
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">
                    <i class="fas fa-receipt me-2"></i>Required Amount:
                  </span>
                  <span class="fs-5 fw-bold">🍌 {{ requiredAmount.toLocaleString() }}</span>
                </div>
              </div>
              <div class="col-12">
                <hr class="my-2">
              </div>
              <div class="col-12">
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-danger fw-semibold">
                    <i class="fas fa-minus-circle me-2"></i>Shortfall:
                  </span>
                  <span class="fs-4 fw-bold text-danger">🍌 {{ shortfall.toLocaleString() }}</span>
                </div>
              </div>
            </div>

            <!-- SGD Conversion -->
            <div class="mt-3 p-3 bg-light rounded-2">
              <small class="text-muted d-block mb-1">
                <i class="fas fa-info-circle me-1"></i>You need approximately
              </small>
              <div class="fw-bold text-success">
                ${{ (shortfall * 0.1).toFixed(2) }} SGD worth of bananas
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="d-grid gap-2">
            <button class="btn btn-success btn-lg fw-bold" @click="handleTopUp">
              <i class="fas fa-plus-circle me-2"></i>Top Up Bananas
            </button>
            <button class="btn btn-outline-secondary" @click="emit('close')">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.icon-circle i {
  font-size: 40px;
}

.balance-details {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.modal-content {
  overflow: hidden;
}

h3 {
  color: #212529;
}
</style>
