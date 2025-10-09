<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { onMounted, computed, ref } from "vue"
import navbar from "@/navbar.vue";
import { getAuth} from "firebase/auth";
import { get_user_missions } from "./Database/Monkey_Store";

const missions = ref([])
const isLoading = ref(true)

const activeMissions = computed(() => 
  missions.value.filter(m => m.status === 'Active')
)

const completedMissions = computed(() => 
  missions.value.filter(m => m.status === 'Completed')
)

onMounted(async () => {
  try {
    const auth = getAuth();
    const uid = auth.currentUser.uid
    const data= await get_user_missions(uid)
    console.log('Fetched missions:', data)
    missions.value = data || []
    console.log(missions.value)
  } catch (error) {
    console.error("Error loading missions:", error)
  } finally {
    isLoading.value = false
  }
})

const getProgress = (mission) => {
  if (!mission.active_testers || !mission.num_testers) return 0
  return Math.round((mission.active_testers.length / mission.num_testers) * 100)
}

const getDaysRemaining = (duration) => {
  if (!duration) return 'No deadline'
  return `${duration} days left`
}

const totalEarned = computed(() => 
  completedMissions.value.reduce((sum, m) => sum + (m.payout || 0), 0)
)

const avgProgress = computed(() => {
  if (!activeMissions.value.length) return 0
  return Math.round(activeMissions.value.reduce((sum, m) => sum + getProgress(m), 0) / activeMissions.value.length)
})
</script>

<style scoped>
.hero-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 0;
}

.mission-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.mission-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

.progress {
  height: 8px;
}

.btn-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}
</style>

<template>
  <navbar/>
  <div class="min-vh-100 bg-light">
    <!-- Header -->
    <div class="hero-header" style="padding-top: 100px;">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h1><i class="fas fa-tasks me-2"></i>My Missions</h1>
            <p class="opacity-75 mb-0">Track and manage your accepted testing missions</p>
          </div>
          <div>
            <h3 class="mb-0">🍌 {{ totalEarned }}</h3>
            <small class="opacity-75">Total Earned</small>
          </div>
        </div>
      </div>
    </div>

    <div class="container py-4">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-muted mt-3">Loading your missions...</p>
      </div>

      <template v-else>
        <!-- Stats -->
        <div class="row g-3 mb-4">
          <div class="col-md-3 col-6">
            <div class="card text-center shadow-sm border-0">
              <div class="card-body">
                <h3 class="text-primary mb-0">{{ activeMissions.length }}</h3>
                <small class="text-muted">Active</small>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-6">
            <div class="card text-center shadow-sm border-0">
              <div class="card-body">
                <h3 class="text-success mb-0">{{ completedMissions.length }}</h3>
                <small class="text-muted">Completed</small>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-6">
            <div class="card text-center shadow-sm border-0">
              <div class="card-body">
                <h3 class="text-warning mb-0">{{ avgProgress }}%</h3>
                <small class="text-muted">Avg Progress</small>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-6">
            <div class="card text-center shadow-sm border-0">
              <div class="card-body">
                <h3 class="text-info mb-0">🍌{{ totalEarned }}</h3>
                <small class="text-muted">Earned</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Missions -->
        <div v-if="activeMissions.length > 0" class="mb-4">
          <h4 class="mb-3"><i class="fas fa-spinner fa-pulse me-2 text-primary"></i>Active Missions</h4>
          <div class="row g-3">
            <div v-for="mission in activeMissions" :key="mission.id" class="col-lg-6">
              <div class="card mission-card shadow-sm border-0 h-100">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title mb-0">{{ mission.name }}</h5>
                    <span class="badge bg-primary">{{ mission.status }}</span>
                  </div>
                  <p class="card-text text-muted small mb-3">{{ mission.description }}</p>
                  
                  <div class="mb-3">
                    <div class="d-flex justify-content-between small mb-1">
                      <span>Testers: {{ mission.active_testers?.length || 0 }}/{{ mission.num_testers }}</span>
                      <span class="fw-bold">{{ getProgress(mission) }}%</span>
                    </div>
                    <div class="progress">
                      <div class="progress-bar bg-primary" :style="`width: ${getProgress(mission)}%`"></div>
                    </div>
                  </div>

                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <span class="badge bg-success me-2">🍌 {{ mission.payout }}</span>
                      <span class="badge bg-light text-dark"><i class="fas fa-clock me-1"></i>{{ getDaysRemaining(mission.duration) }}</span>
                    </div>
                    <button class="btn btn-sm btn-gradient">Continue <i class="fas fa-arrow-right ms-1"></i></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Completed Missions -->
        <div v-if="completedMissions.length > 0">
          <h4 class="mb-3"><i class="fas fa-check-circle me-2 text-success"></i>Completed Missions</h4>
          <div class="row g-3">
            <div v-for="mission in completedMissions" :key="mission.id" class="col-lg-6">
              <div class="card mission-card shadow-sm border-0 h-100">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title mb-0">{{ mission.name }}</h5>
                    <span class="badge bg-success">{{ mission.status }}</span>
                  </div>
                  <p class="card-text text-muted small mb-3">{{ mission.description }}</p>
                  
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <span class="badge bg-success me-2">🍌 {{ mission.payout }}</span>
                      <span class="badge bg-light text-dark"><i class="fas fa-calendar me-1"></i>Completed</span>
                    </div>
                    <div>
                      <span class="text-warning">
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="activeMissions.length === 0 && completedMissions.length === 0" class="text-center py-5">
          <i class="fas fa-inbox text-muted" style="font-size: 4rem; opacity: 0.3;"></i>
          <h4 class="mt-3 text-muted">No missions yet</h4>
          <p class="text-muted">Browse available missions and start earning bananas!</p>
          <button class="btn btn-gradient mt-3">Browse Missions</button>
        </div>
      </template>
    </div>
  </div>
</template>