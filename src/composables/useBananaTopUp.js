import { ref } from 'vue'

// Shared state for banana top-up modal
const showTopUpModal = ref(false)

export function useBananaTopUp() {
  const openTopUp = () => {
    showTopUpModal.value = true
  }

  const closeTopUp = () => {
    showTopUpModal.value = false
  }

  return {
    showTopUpModal,
    openTopUp,
    closeTopUp
  }
}
