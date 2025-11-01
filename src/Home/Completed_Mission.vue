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
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.modal-content {
  border: none;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  overflow: hidden;
}

.modal-header {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
  border-bottom: none;
  padding: 1.25rem 1.5rem;
}

.modal-title {
  font-weight: 600;
  font-size: 1.25rem;
}

.iframe-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.iframe-wrapper {
  flex: 1;
  min-height: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-header {
  font-size: 0.875rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.75rem;
}

.answers-section {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background: #ffffff;
  padding: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 3px solid #FFD700;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-item {
  background: linear-gradient(135deg, #fffef7 0%, #ffffff 100%);
  border: 1px solid #e9ecef;
  border-left: 4px solid #2e7d32;
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.question-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.15);
  border-left-color: #1b5e20;
  background: linear-gradient(135deg, #fffef0 0%, #ffffff 100%);
}

.question-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.question-number {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  flex-shrink: 0;
  min-width: 45px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(46, 125, 50, 0.3);
}

.question-text {
  color: #2d3748;
  font-weight: 600;
  font-size: 1rem;
  line-height: 1.5;
}

.answer-section {
  margin-top: 0.75rem;
  padding-left: 3.5rem;
}

.answer-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #2e7d32;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.375rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.answer-text {
  color: #4a5568;
  font-size: 0.9375rem;
  line-height: 1.6;
  background: #fffef7;
  padding: 0.875rem 1rem;
  border-radius: 8px;
  border: 1px solid #FFE55C;
}

.modal-footer {
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  padding: 1rem 1.5rem;
}

.btn-secondary {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
  border: none;
  padding: 0.625rem 1.5rem;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s ease;
  color: white;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.25), 0 14px 28px rgba(0, 0, 0, 0.15);
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.25), 0 16px 32px rgba(0, 0, 0, 0.2);
}

.btn-secondary:active {
  transform: translateY(0);
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.25), 0 10px 20px rgba(0, 0, 0, 0.15);
}

/* Scrollbar styling */
.answers-section::-webkit-scrollbar {
  width: 8px;
}

.answers-section::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.answers-section::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
  border-radius: 4px;
}

.answers-section::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #1b5e20 0%, #0f4d26 100%);
}

.no-preview {
  background: linear-gradient(135deg, #1b5e20 0%, #0f4d26 100%);
}

/* Success/Loading state styling to match theme */
.text-primary {
  color: #2e7d32 !important;
}

.spinner-border.text-primary {
  border-color: #2e7d32;
  border-right-color: transparent;
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
              <div class="p-4 iframe-container">
                <h6 class="mb-3 preview-header">
                  <i class="fas fa-desktop me-2"></i>Website Preview
                </h6>
                <div class="iframe-wrapper bg-dark rounded">
                  <iframe
                    v-if="mission.website"
                    :src="mission.website || 'about:blank'"
                    class="w-100 h-100 rounded"
                    sandbox="allow-scripts allow-same-origin"
                    title="Mission Preview"
                  ></iframe>
                  <div v-else class="d-flex align-items-center justify-content-center text-white h-100 no-preview rounded">
                    <div class="text-center p-4">
                      <i class="fas fa-globe fa-4x mb-3 opacity-50"></i>
                      <p class="mb-0 opacity-75">No website available</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right side: Mission Question and answers -->
            <div class="col-md-6 answers-section">
              <h4 class="section-title">
                <i class="fas fa-clipboard-list me-2"></i>Your Answers
              </h4>
              <div class="questions-list">
                <div
                  v-for="(result, index) in mission.answers"
                  :key="index"
                  class="question-item"
                >
                  <div class="question-header">
                    <span class="question-number">Q{{ index + 1 }}</span>
                    <span class="question-text">{{ result.question }}</span>
                  </div>
                  <div class="answer-section">
                    <div class="answer-label">
                      <i class="fas fa-comment-dots"></i>
                      Your Response
                    </div>
                    <div class="answer-text">{{ result.answer }}</div>
                  </div>
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
