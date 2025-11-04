<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { useRouter } from 'vue-router'

const props = defineProps({
  show: Boolean,
  missionName: String,
  totalCost: [String, Number]
})

const emit = defineEmits(['close'])
const router = useRouter()

function handleGoHome() {
  emit('close')
  router.push({path: '/home'})
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
              <i class="fas fa-check-circle text-success"></i>
            </div>
          </div>

          <!-- Title -->
          <h3 class="fw-bold mb-3 text-success">Mission Created Successfully!</h3>

          <!-- Message -->
          <p class="text-muted mb-4">
            Your mission "<strong>{{ missionName }}</strong>" has been launched and is now live for testers.
          </p>

          <!-- Cost Details -->
          <div class="cost-details p-4 mb-4 rounded-3">
            <div class="row g-3">
              <div class="col-12">
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">
                    <i class="fas fa-coins me-2"></i>Bananas Deducted:
                  </span>
                  <span class="fs-4 fw-bold text-success">🍌 {{ typeof totalCost === 'string' ? totalCost : totalCost.toLocaleString() }}</span>
                </div>
              </div>
            </div>

            <!-- Info Box -->
            <div class="mt-3 p-3 bg-light rounded-2">
              <small class="text-muted">
                <i class="fas fa-info-circle me-1"></i>
                Bananas will be distributed automatically when testers complete your mission.
              </small>
            </div>
          </div>

          <!-- Success Features -->
          <div class="success-features mb-4">
            <div class="feature-item">
              <i class="fas fa-rocket text-primary me-2"></i>
              <span>Mission is now live</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-users text-primary me-2"></i>
              <span>Testers can start working</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-bell text-primary me-2"></i>
              <span>You'll be notified of submissions</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="d-grid gap-2">
            <button class="btn btn-success btn-lg fw-bold" @click="handleGoHome">
              <i class="fas fa-home me-2"></i>Go to Home
            </button>
            <button class="btn btn-ghost-dark" @click="emit('close')">
              Close
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
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
  animation: scaleIn 0.3s ease-out;
}

.icon-circle i {
  font-size: 40px;
}

.cost-details {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.modal-content {
  overflow: hidden;
}

h3 {
  color: #28a745;
}

.success-features {
  text-align: left;
}

.feature-item {
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  color: #495057;
}

.feature-item i {
  font-size: 1.1rem;
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
</style>
