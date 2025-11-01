<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import { computed, ref } from "vue"
import { joinMission } from "@/Database/Monkey_Store"

const props = defineProps({
  show: Boolean,
  mission: Object
})

const emit = defineEmits(['close','refresh'])

const loading = ref(false)

const success = ref(false)

const getPlaceholderImage = computed(() => {
  const colors = ['4285f4', 'ea4335', 'fbbc05', '34a853']
  const color = colors[Math.floor(Math.random() * colors.length)]
  const text = encodeURIComponent(props.missionName || 'Mission Preview')
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect fill="%23${color}" width="400" height="200"/><text x="50%" y="50%" text-anchor="middle" fill="white" font-size="24" dy=".3em">${text}</text></svg>`
})

async function joinThisMission(){
  loading.value = true
  await joinMission(props.missionId)
  success.value = true
}

function close_preview(){
  if(loading.value){
    loading.value = false
  }
  if(success.value){
    success.value = false
    emit('refresh')
    return
  }
  emit('close')
}
</script>

<style scoped>
.modal {
  background: rgba(0, 0, 0, 0.5);
}
.iframe-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.iframe-wrapper {
  flex: 1;
  min-height: 0;
}
.questions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.question-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-gray-50);
  border-radius: var(--radius-md);
  align-items: flex-start;
}

.question-number {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  flex-shrink: 0;
}

.question-text {
  color: var(--color-gray-700);
  flex: 1;
}
</style>

<template>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <div v-if="show" class="modal fade show d-block" tabindex="-1" @click.self="emit('close')">
    <div class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title"><i class="fas fa-eye me-2"></i>Mission Preview</h5>
          <button type="button" class="btn-close btn-close-white" @click="emit('close')"></button>
        </div>
        <div v-if="loading" class="text-center py-5">
          <div v-if="success">
            <i class="fa-solid fa-circle-check fa-4x mb-3" style="color: #63E6BE;"></i>
            <h5>Joined Successfully</h5>
            <p class="text-muted">You've successfully joined this mission!</p>
          </div>
          <div v-else>
            <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
            <h5>Joining this Mission</h5>
            <p class="text-muted">Sit tight as we prepare your admission!</p>
          </div>
        </div>
        
        <div class="modal-body p-0" v-else>
          <div class="row g-0">
            <!-- Left side: iframe -->
            <div class="col-md-6 border-end d-flex flex-column">
              <div class="p-3 iframe-container">
                <h6 class="mb-3"><i class="fas fa-desktop me-2"></i>Live Preview</h6>
                <div class="iframe-wrapper bg-dark rounded">
                  <iframe 
                    v-if="mission.website" 
                    :src="mission.website || 'about:blank'"
                    class="w-100 h-100 rounded"
                    sandbox="allow-scripts allow-same-origin"
                    title="Mission Preview"
                  ></iframe>
                  <div v-else class="d-flex align-items-center justify-content-center text-white h-100">
                    <div class="text-center">
                      <i class="fas fa-file-code fa-3x mb-2 opacity-50"></i>
                      <p class="mb-0">No file uploaded</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right side: Mission Card Preview -->
            <div class="col-md-6" style=" height: 100%;overflow-y: auto;overflow-x: hidden;">
              <h4><i class="fas fa-question-circle me-2"></i>Survey Questions</h4>
              <div class="questions-list">
                <div
                  v-for="(result, index) in mission.answers"
                  :key="index"
                  class="question-item"
                >
                  <span class="question-number">Q{{ index + 1 }}</span>
                  <span class="row g-1">
                    <div>
                      <span class="question-text">{{ result.question }}</span>
                    </div>
                    <div>
                      <span class="question-text">{{ result.answer }}</span>
                    </div>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="close_preview()">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>
