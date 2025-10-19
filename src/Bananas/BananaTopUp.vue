<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { ref, computed } from 'vue'
import { addBananaBalance } from '@/Database/Monkey_Store'
import { getAuth } from 'firebase/auth'
import paypalLogo from '@/assets/paypal.png'

const props = defineProps({
  show: Boolean,
  currentBalance: Number
})

const emit = defineEmits(['close', 'success'])

const selectedPackage = ref({ id: 0, bananas: 0, price: 0, popular: false })
const customAmount = ref(0)
const isProcessing = ref(false)
const showSuccess = ref(false)

const auth = getAuth()

// Banana packages with different price tiers
const packages = [
  { id: 1, bananas: 100, price: 10, popular: false },
  { id: 2, bananas: 500, price: 45, popular: true, savings: '10% off' },
  { id: 3, bananas: 1000, price: 80, popular: false, savings: '20% off' },
  { id: 4, bananas: 5000, price: 400, popular: false, savings: '30% off' }
]

// Payment methods
const paymentMethods = [
  { id: 'card', name: 'Credit/Debit Card', icon: 'fa-credit-card', type: 'icon' },
  { id: 'paypal', name: 'PayPal', image: paypalLogo, type: 'image' },
  { id: 'bank', name: 'Bank Transfer', icon: 'fa-building-columns', type: 'icon' }
]

const selectedPayment = ref('card')

const totalAmount = computed(() => {
  if (selectedPackage.value === 'custom') {
    return parseInt(customAmount.value) || 0
  }
  return selectedPackage.value.id > 0 ? selectedPackage.value.bananas : customAmount.value
})

const totalPrice = computed(() => {
  if (selectedPackage.id === 0) {
    const amount = parseInt(customAmount.value) || 0
    return (amount * 0.1).toFixed(2) // $0.10 per banana for custom
  }
  return selectedPackage.value.id > 0 ? selectedPackage.value.price : (customAmount.value * 0.1).toFixed(2)
})

function selectPackage(pkg) {
  selectedPackage.value = pkg
  customAmount.value = ''
}

function selectCustom() {
  selectedPackage.value = { id: 0, bananas: 0, price: 0, popular: false }
}

async function processPurchase() {
  if (!totalAmount.value || totalAmount.value <= 0) {
    alert('Please select a package or enter a custom amount')
    return
  }

  isProcessing.value = true

  try {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Add bananas to founder account
    await addBananaBalance(auth.currentUser.uid, totalAmount.value)

    showSuccess.value = true

    // Auto close after 2 seconds
    setTimeout(() => {
      emit('success')
      closeModal()
    }, 2000)

  } catch (error) {
    console.error('Error processing purchase:', error)
    alert('Failed to process purchase. Please try again.')
  } finally {
    isProcessing.value = false
  }
}

function closeModal() {
  selectedPackage.value = { id: 0, bananas: 0, price: 0, popular: false }
  customAmount.value = ''
  showSuccess.value = false
  emit('close')
}
</script>

<template>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">

  <!-- Bootstrap Modal Overlay -->
  <div v-if="show" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.7);" @click.self="closeModal">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg rounded-4">

        <!-- Header -->
        <div class="modal-header border-bottom border-2 p-4">
          <h2 class="modal-title fs-3 fw-bold text-success mb-0">
            <i class="fas fa-banana me-2"></i>Top Up Bananas
          </h2>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>

        <!-- Success Message -->
        <div v-if="showSuccess" class="modal-body text-center py-5">
          <div class="success-animation mb-4">
            <i class="fas fa-check-circle text-success" style="font-size: 80px;"></i>
          </div>
          <h3 class="text-success fs-4 fw-bold mb-3">Purchase Successful!</h3>
          <p class="text-muted fs-5">{{ totalAmount.toLocaleString() }} bananas have been added to your account</p>
        </div>

        <!-- Purchase Form -->
        <div v-else class="modal-body p-4">

          <!-- Current Balance -->
          <div class="alert alert-warning d-flex justify-content-between align-items-center mb-4 rounded-3">
            <span class="fw-semibold">Current Balance:</span>
            <strong class="fs-4">🍌 {{ currentBalance.toLocaleString() }} bananas</strong>
          </div>

          <!-- Package Selection -->
          <h5 class="fw-semibold mb-3 mt-4">Select a Package</h5>
          <div class="row g-3 mb-4">
            <div
              v-for="pkg in packages"
              :key="pkg.id"
              class="col-6 col-lg-3"
            >
              <div
                class="card package-card h-100 text-center position-relative cursor-pointer"
                :class="{
                  'border-success border-3 bg-success bg-opacity-10': selectedPackage.id === pkg.id,
                  'border-warning': pkg.popular && selectedPackage.id !== pkg.id,
                  'border-2': selectedPackage.id !== pkg.id
                }"
                @click="selectPackage(pkg)"
              >
                <!-- Selected Checkmark -->
                <div v-if="selectedPackage.id === pkg" class="position-absolute top-0 start-0 m-2">
                  <span class="badge bg-success rounded-circle p-2">
                    <i class="fas fa-check"></i>
                  </span>
                </div>

                <!-- Popular Badge -->
                <span v-if="pkg.popular" class="position-absolute top-0 start-50 translate-middle badge bg-warning text-dark">
                  Most Popular
                </span>

                <!-- Savings Badge -->
                <span v-if="pkg.savings" class="position-absolute top-0 end-0 m-2 badge bg-success">
                  {{ pkg.savings }}
                </span>

                <div class="card-body d-flex flex-column justify-content-center py-4">
                  <div class="banana-icon fs-1 mb-2">🍌</div>
                  <h3 class="fs-3 fw-bold mb-1">{{ pkg.bananas.toLocaleString() }}</h3>
                  <p class="text-muted small mb-3">Bananas</p>
                  <div class="fs-5 fw-bold text-success">${{ pkg.price }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Custom Amount -->
          <div class="card bg-light border-0 p-4 mb-4">
            <h5 class="fw-semibold mb-3">Or Enter Custom Amount</h5>
            <div class="input-group mb-2">
              <input
                type="number"
                v-model="customAmount"
                placeholder="Enter amount"
                min="1"
                class="form-control form-control-lg"
                @focus="selectCustom"
              />
              <span class="input-group-text bg-white">bananas</span>
            </div>
            <small class="text-muted">Custom rate: $0.10 per banana</small>
          </div>

          <!-- Payment Method -->
          <h5 class="fw-semibold mb-3">Payment Method</h5>
          <div class="row g-3 mb-4">
            <div
              v-for="method in paymentMethods"
              :key="method.id"
              class="col-12 col-md-4"
            >
              <div
                class="card payment-method-card h-100 cursor-pointer"
                :class="{
                  'border-success border-3 bg-success bg-opacity-10': selectedPayment === method.id,
                  'border-2': selectedPayment !== method.id
                }"
                @click="selectedPayment = method.id"
              >
                <div class="card-body d-flex align-items-center gap-3 py-3">
                  <i v-if="method.type === 'icon'" class="fas fs-3 text-muted" :class="method.icon"></i>
                  <img v-else-if="method.type === 'image'" :src="method.image" alt="PayPal" class="payment-logo">
                  <span class="fw-medium">{{ method.name }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Summary -->
          <div class="card bg-light border-0 p-3 mb-3">
            <div class="d-flex justify-content-between mb-2">
              <span class="fw-medium">Bananas:</span>
              <strong>{{ totalAmount.toLocaleString() }}</strong>
            </div>
            <div class="d-flex justify-content-between pt-2 border-top border-2">
              <span class="fw-bold fs-5">Total:</span>
              <strong class="fs-5 text-success">${{ totalPrice }}</strong>
            </div>
          </div>

          <!-- Purchase Button -->
          <button
            class="btn btn-success btn-lg w-100 fw-bold py-3 mb-3"
            :disabled="!totalAmount || isProcessing"
            @click="processPurchase"
          >
            <span v-if="isProcessing">
              <span class="spinner-border spinner-border-sm me-2"></span>
              Processing...
            </span>
            <span v-else>
              <i class="fas fa-shopping-cart me-2"></i>
              Complete Purchase
            </span>
          </button>

          <!-- Disclaimer -->
          <p class="text-center text-muted small mb-0">
            <i class="fas fa-info-circle me-1"></i>
            This is a simulated purchase. No actual money will be charged.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.package-card,
.payment-method-card {
  transition: all 0.3s ease;
}

.package-card:hover,
.payment-method-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.package-card.border-success,
.payment-method-card.border-success {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 8px 20px rgba(25, 135, 84, 0.3);
}

.success-animation {
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Override Bootstrap input focus for custom styling */
.form-control:focus {
  border-color: #198754;
  box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25);
}

/* Payment logo styling */
.payment-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
  filter: grayscale(100%);
  opacity: 0.85;
}
</style>
