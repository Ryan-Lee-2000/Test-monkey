<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import { computed } from "vue"

const props = defineProps({
  show: Boolean,
  missionName: String,
  description: String,
  numberOfUsers: [String, Number],
  duration: [String, Number],
  bananasPayout: [String, Number],
  totalCost: String,
  website: String
})

const emit = defineEmits(['close'])

const getPlaceholderImage = computed(() => {
  const colors = ['4285f4', 'ea4335', 'fbbc05', '34a853']
  const color = colors[Math.floor(Math.random() * colors.length)]
  const text = encodeURIComponent(props.missionName || 'Mission Preview')
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect fill="%23${color}" width="400" height="200"/><text x="50%" y="50%" text-anchor="middle" fill="white" font-size="24" dy=".3em">${text}</text></svg>`
})
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
        
        <div class="modal-body p-0">
          <div class="row g-0">
            <!-- Left side: iframe -->
            <div class="col-md-6 border-end d-flex flex-column">
              <div class="p-3 iframe-container">
                <h6 class="mb-3"><i class="fas fa-desktop me-2"></i>Live Preview</h6>
                <div class="iframe-wrapper bg-dark rounded">
                  <iframe 
                    v-if="website" 
                    :src="website || 'about:blank'"
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
            <div class="col-md-6">
              <div class="p-3 bg-light">
                <p class="text-muted mb-2"><i class="fas fa-info-circle me-1"></i>This is how your mission will appear to testers:</p>
                
                <div class="card shadow-sm border-0">
                  <img :src="getPlaceholderImage" class="card-img-top" alt="Mission preview" style="height: 200px; object-fit: cover;">
                  <div class="card-body">
                    <h5 class="card-title">{{ missionName || 'Mission Name' }}</h5>
                    <div class="text-primary mb-2"><i class="fas fa-building me-2"></i>Your Company</div>
                    <p class="card-text text-muted small">{{ description || 'Mission description will appear here...' }}</p>
                    
                    <div class="d-flex flex-wrap gap-2 mb-3">
                      <span class="badge bg-light text-dark"><i class="fas fa-map-marker-alt me-1"></i>Remote</span>
                      <span class="badge bg-success">🍌 {{ bananasPayout || '0' }}</span>
                      <span class="badge bg-info text-dark">{{ duration ? duration + (duration == 1 ? ' Day' : ' Days') : 'Duration TBD' }}</span>
                    </div>
                  </div>
                  <div class="card-footer bg-white d-flex justify-content-between align-items-center">
                    <small class="text-muted">Just now</small>
                    <button class="btn btn-sm btn-primary"><i class="fas fa-paper-plane me-2"></i>Apply</button>
                  </div>
                </div>
              </div>

              <!-- Stats Preview -->
              <div class="p-3 bg-light border-top">
                <h6 class="mb-3"><i class="fas fa-chart-bar me-2"></i>Mission Statistics</h6>
                <div class="row g-2">
                  <div class="col-4">
                    <div class="card text-center">
                      <div class="card-body p-2">
                        <h4 class="text-primary mb-0">{{ numberOfUsers || '0' }}</h4>
                        <small class="text-muted">Testers</small>
                      </div>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="card text-center">
                      <div class="card-body p-2">
                        <h4 class="text-success mb-0">🍌{{ bananasPayout || '0' }}</h4>
                        <small class="text-muted">Per Tester</small>
                      </div>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="card text-center">
                      <div class="card-body p-2">
                        <h4 class="text-info mb-0">🍌{{ totalCost }}</h4>
                        <small class="text-muted">Total</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="emit('close')">Close</button>
          <button type="button" class="btn btn-primary">Looks Good - Launch Mission</button>
        </div>
      </div>
    </div>
  </div>
</template>