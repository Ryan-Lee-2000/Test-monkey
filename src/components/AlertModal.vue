<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"

const props = defineProps({
  show: Boolean,
  title: {
    type: String,
    default: 'Alert'
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info', // 'info', 'success', 'warning', 'error'
    validator: (value) => ['info', 'success', 'warning', 'error'].includes(value)
  },
  confirmText: {
    type: String,
    default: 'OK'
  },
  showCancel: {
    type: Boolean,
    default: false
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  }
})

const emit = defineEmits(['close', 'confirm', 'cancel'])

const iconConfig = {
  info: { icon: 'fa-info-circle', color: 'text-primary', bg: '#cfe2ff' },
  success: { icon: 'fa-check-circle', color: 'text-success', bg: '#d1e7dd' },
  warning: { icon: 'fa-exclamation-triangle', color: 'text-warning', bg: '#fff3cd' },
  error: { icon: 'fa-times-circle', color: 'text-danger', bg: '#f8d7da' }
}

function handleConfirm() {
  emit('confirm')
  emit('close')
}

function handleCancel() {
  emit('cancel')
  emit('close')
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
            <div
              class="icon-circle mx-auto"
              :style="{ background: iconConfig[type].bg }"
            >
              <i
                class="fas"
                :class="[iconConfig[type].icon, iconConfig[type].color]"
              ></i>
            </div>
          </div>

          <!-- Title -->
          <h4 class="fw-bold mb-3">{{ title }}</h4>

          <!-- Message -->
          <p class="text-muted mb-4" style="white-space: pre-line;">{{ message }}</p>

          <!-- Actions -->
          <div class="d-flex gap-2 justify-content-center">
            <button
              v-if="showCancel"
              class="btn btn-outline-secondary px-4"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              class="btn px-4 fw-bold"
              :class="{
                'btn-primary': type === 'info',
                'btn-success': type === 'success',
                'btn-warning': type === 'warning',
                'btn-danger': type === 'error'
              }"
              @click="handleConfirm"
            >
              {{ confirmText }}
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
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: scaleIn 0.3s ease-out;
}

.icon-circle i {
  font-size: 40px;
}

.modal-content {
  overflow: hidden;
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
