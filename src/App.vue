<script setup>
import { onMounted } from 'vue'
import AlertModal from './components/AlertModal.vue'
import { useAlert } from './composables/useAlert'
import { setRouterAlertFunction } from './Config/router'

const { showAlert, alertConfig, closeAlert, handleConfirm, handleCancel, showAlertModal } = useAlert()

// Make alert available to router
onMounted(() => {
  setRouterAlertFunction(showAlertModal)
})
</script>

<style>
</style>

<template>
    <main>
      <RouterView />

      <!-- Global Alert Modal -->
      <AlertModal
        :show="showAlert"
        :title="alertConfig.title"
        :message="alertConfig.message"
        :type="alertConfig.type"
        :confirmText="alertConfig.confirmText"
        :showCancel="alertConfig.showCancel"
        :cancelText="alertConfig.cancelText"
        @close="closeAlert"
        @confirm="handleConfirm"
        @cancel="handleCancel"
      />
    </main>
</template>

