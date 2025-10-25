<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"

const props = defineProps({
  show: Boolean,
  mode: {
    type: String,
    default: 'loading',
    validator: (value) => ['loading', 'success', 'error'].includes(value)
  },
  message: String
})

const emit = defineEmits(['close'])

const titles = {
  loading: 'Creating Account',
  success: 'Success!',
  error: 'Registration Failed'
}

const iconClasses = {
  loading: 'fas fa-spinner fa-spin text-primary',
  success: 'fas fa-check-circle text-success',
  error: 'fas fa-exclamation-circle text-danger'
}

const titleClasses = {
  loading: 'text-primary',
  success: 'text-success',
  error: 'text-danger'
}

const circleClasses = {
  loading: 'icon-circle-loading',
  success: 'icon-circle-success',
  error: 'icon-circle-error'
}
</script>

<template>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">

  <div v-if="show" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0, 0, 0, 0.7);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg rounded-4">

        <!-- Header (only for error) -->
        <div v-if="mode === 'error'" class="modal-header border-0 pb-0">
          <button type="button" class="btn-close" @click="emit('close')"></button>
        </div>

        <!-- Body -->
        <div class="modal-body text-center px-5 pb-5" :class="{ 'pt-5': mode !== 'error' }">
          <!-- Icon -->
          <div class="mb-4">
            <div class="icon-circle mx-auto" :class="circleClasses[mode]">
              <i :class="iconClasses[mode]"></i>
            </div>
          </div>

          <!-- Title -->
          <h3 class="fw-bold mb-3" :class="titleClasses[mode]">
            {{ titles[mode] }}
          </h3>

          <!-- Message -->
          <p class="text-muted mb-4">{{ message }}</p>

          <!-- Close Button (only for error) -->
          <div v-if="mode === 'error'" class="d-grid">
            <button class="btn btn-danger btn-lg fw-bold" @click="emit('close')">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Bootstrap Modal Styles */
.icon-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-circle-error {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c2c7 100%);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.icon-circle-success {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
  animation: scaleIn 0.3s ease-out;
}

.icon-circle-loading {
  background: linear-gradient(135deg, #cfe2ff 0%, #9ec5fe 100%);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
}

.icon-circle i {
  font-size: 40px;
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
