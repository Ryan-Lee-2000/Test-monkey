<script setup>
import { defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])
const router = useRouter()

function goToGacha() {
  emit('close')
  router.push('/gambling')
}

function closeModal() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-content">
            <!-- Gift Icon -->
            <div class="gift-icon-container">
              <div class="gift-icon">🎁</div>
              <div class="sparkles">✨</div>
            </div>

            <!-- Title -->
            <h2 class="modal-title">Daily Pack Available!</h2>

            <!-- Description -->
            <p class="modal-description">
              Your free daily voucher pack is ready to open!
              Open it now for a chance to win Singapore vouchers.
            </p>

            <!-- Pack Info -->
            <div class="pack-info">
              <div class="info-item">
                <i class="fas fa-gift"></i>
                <span>1 Free Pack</span>
              </div>
              <div class="info-item">
                <i class="fas fa-ticket-alt"></i>
                <span>Random Voucher</span>
              </div>
              <div class="info-item">
                <i class="fas fa-clock"></i>
                <span>Resets Daily</span>
              </div>
            </div>

            <!-- Buttons -->
            <div class="modal-actions">
              <button class="btn-modern btn-success-large" @click="goToGacha">
                <i class="fas fa-box-open me-2"></i>
                Open Pack Now
              </button>
              <button class="btn-modern btn-ghost-dark" @click="closeModal">
                <i class="fas fa-times me-2"></i>
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Modal Backdrop */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: var(--spacing-md);
}

.modal-container {
  max-width: 500px;
  width: 100%;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-content {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-xl);
  text-align: center;
  position: relative;
}

/* Gift Icon */
.gift-icon-container {
  position: relative;
  margin-bottom: var(--spacing-xl);
  display: flex;
  justify-content: center;
  align-items: center;
}

.gift-icon {
  font-size: 80px;
  animation: bounce 2s ease-in-out infinite;
  filter: drop-shadow(0 4px 12px rgba(10, 73, 10, 0.3));
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.sparkles {
  position: absolute;
  font-size: 24px;
  animation: sparkle 1.5s ease-in-out infinite;
  pointer-events: none;
}

@keyframes sparkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2) rotate(180deg);
  }
}

/* Title */
.modal-title {
  color: var(--color-gray-900);
  font-size: 1.75rem;
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-md);
  background: linear-gradient(135deg, #0A490A 0%, #27ae60 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Description */
.modal-description {
  color: var(--color-gray-600);
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: var(--spacing-xl);
}

/* Pack Info */
.pack-info {
  display: flex;
  justify-content: space-around;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-gray-50);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-gray-200);
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  flex: 1;
}

.info-item i {
  font-size: 1.5rem;
  color: #0A490A;
}

.info-item span {
  font-size: 0.875rem;
  color: var(--color-gray-700);
  font-weight: var(--font-weight-semibold);
}

/* Modal Actions */
.modal-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.btn-success-large {
  background: linear-gradient(135deg, #0A490A 0%, #27ae60 100%);
  color: white;
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1.125rem;
  font-weight: var(--font-weight-semibold);
  box-shadow: 0 4px 12px rgba(10, 73, 10, 0.3);
  transition: all var(--transition-base);
}

.btn-success-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(10, 73, 10, 0.4);
}

.btn-success-large:active {
  transform: translateY(0);
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

/* Responsive */
@media (max-width: 576px) {
  .modal-content {
    padding: var(--spacing-xl);
  }

  .gift-icon {
    font-size: 60px;
  }

  .modal-title {
    font-size: 1.5rem;
  }

  .pack-info {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .info-item {
    flex-direction: row;
    justify-content: center;
    gap: var(--spacing-md);
  }

  .info-item i {
    font-size: 1.25rem;
  }
}
</style>
