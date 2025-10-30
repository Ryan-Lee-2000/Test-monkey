import { ref } from 'vue'

const showAlert = ref(false)
const alertConfig = ref({
  title: 'Alert',
  message: '',
  type: 'info',
  confirmText: 'OK',
  showCancel: false,
  cancelText: 'Cancel',
  onConfirm: null,
  onCancel: null
})

export function useAlert() {
  function showAlertModal(message, options = {}) {
    alertConfig.value = {
      title: options.title || 'Alert',
      message,
      type: options.type || 'info',
      confirmText: options.confirmText || 'OK',
      showCancel: options.showCancel || false,
      cancelText: options.cancelText || 'Cancel',
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null
    }
    showAlert.value = true
  }

  function showError(message, title = 'Error') {
    showAlertModal(message, { type: 'error', title })
  }

  function showSuccess(message, title = 'Success') {
    showAlertModal(message, { type: 'success', title })
  }

  function showWarning(message, title = 'Warning') {
    showAlertModal(message, { type: 'warning', title })
  }

  function showInfo(message, title = 'Information') {
    showAlertModal(message, { type: 'info', title })
  }

  function confirm(message, options = {}) {
    return new Promise((resolve) => {
      showAlertModal(message, {
        ...options,
        showCancel: true,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      })
    })
  }

  function closeAlert() {
    showAlert.value = false
  }

  function handleConfirm() {
    if (alertConfig.value.onConfirm) {
      alertConfig.value.onConfirm()
    }
    closeAlert()
  }

  function handleCancel() {
    if (alertConfig.value.onCancel) {
      alertConfig.value.onCancel()
    }
    closeAlert()
  }

  return {
    showAlert,
    alertConfig,
    showAlertModal,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    confirm,
    closeAlert,
    handleConfirm,
    handleCancel
  }
}
