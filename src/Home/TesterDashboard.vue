<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { onMounted, computed, ref } from "vue"
import navbar from "@/navbar.vue"
import { getAuth } from "firebase/auth"
import { getAllMissions, get_user_missions, getMissions, getUserResponse } from "@/Database/Monkey_Store"
import { useRouter } from 'vue-router'
import MissionPreview from "./Mission_Preview.vue"
import Completed_Mission from "./Completed_Mission.vue"

// Assets
import homepageMonkeyURL from "@/assets/welcome/homepage_monkey.png"
import bananaURL from "@/assets/welcome/banana-icon.png"
import peeledBananaURL from "@/assets/welcome/peeled-banana.png"

const router = useRouter()
const auth = getAuth()

// Tab state
const activeTab = ref('my-missions') // 'my-missions' or 'browse-missions'

// My Missions data
const myMissions = ref({Active:[],Completed:[]})
const myMissionsLoading = ref(true)

// Browse Missions data
const availableMissions = ref([])
const availableMissionsLoading = ref(true)
const selectedMission = ref(null)
const user_name = ref("")

const selected_mission_id = ref('')
const missionName = ref("")
const numberOfUsers = ref("")
const description = ref("")
const duration = ref("")
const bananasPayout = ref("")

const website = ref("")

const totalCost = computed(() => (numberOfUsers.value && bananasPayout.value) 
  ? (numberOfUsers.value * bananasPayout.value).toLocaleString() 
  : '0')
const showPreview = ref(false)

// Filters for browse tab
const searchQuery = ref('')
const sortBy = ref('newest')

// Computed - My Missions
const activeMissions = computed(() =>
  myMissions.value.Active
)

const completedMissions = computed(() =>
  myMissions.value.Completed
)

const totalEarned = computed(() =>
  completedMissions.value.reduce((sum, m) => sum + (m.payout || 0), 0)
)

const avgProgress = computed(() => {
  //if (!activeMissions.value.length) return 0
  return Math.round((completedMissions.value.length / (activeMissions.value.length + completedMissions.value.length)) * 100)
})

// Computed - Browse Missions
const stats = computed(() => {
  if (availableMissions.value.length === 0) {
    return {
      total: 0,
      highestPayout: 0,
      avgPayout: 0,
      quickMissions: 0
    }
  }

  const payouts = availableMissions.value.map(m => m.payout || 0)
  const total = availableMissions.value.length
  const highestPayout = Math.max(...payouts)
  const avgPayout = Math.round(payouts.reduce((a, b) => a + b, 0) / total)
  const quickMissions = availableMissions.value.filter(m => m.duration === '1 day').length

  return { total, highestPayout, avgPayout, quickMissions }
})

const filteredMissions = computed(() => {
  let filtered = availableMissions.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(m =>
      m.name?.toLowerCase().includes(query) ||
      m.description?.toLowerCase().includes(query)
    )
  }

  // Sort
  if (sortBy.value === 'newest') {
    filtered = [...filtered].reverse()
  } else if (sortBy.value === 'payout-high') {
    filtered = [...filtered].sort((a, b) => (b.payout || 0) - (a.payout || 0))
  } else if (sortBy.value === 'payout-low') {
    filtered = [...filtered].sort((a, b) => (a.payout || 0) - (b.payout || 0))
  }

  return filtered
})

// Methods
onMounted(async () => {
  const currentUser = auth.currentUser
  if (currentUser) {
    user_name.value = currentUser.displayName || "User"
  }

  // Load both tabs data
  await Promise.all([
    loadMyMissions(),
    loadAvailableMissions()
  ])
})

async function loadMyMissions() {
  try {
    const uid = auth.currentUser.uid
    const data = await get_user_missions(uid)
    myMissions.value = data || []
  } catch (error) {
    console.error("Error loading my missions:", error)
  } finally {
    myMissionsLoading.value = false
  }
}

async function loadAvailableMissions() {
  try {
    const data = await getMissions()
    availableMissions.value = data.filter(mission => mission.status === 'Active')
  } catch (error) {
    console.error("Error loading available missions:", error)
  } finally {
    availableMissionsLoading.value = false
  }
}

function getProgress(mission) {
  if (!mission.active_testers || !mission.num_testers) return 0
  return Math.round((mission.active_testers.length / mission.num_testers) * 100)
}

function getDaysRemaining(duration) {
  if (!duration) return 'No deadline'
  return `${duration} days left`
}

function formatDuration(duration) {
  if (!duration) return 'Flexible'
  return duration
}

function getPlaceholderImage(missionId) {
  const colors = ['667eea', '764ba2', 'f093fb', '4facfe']
  const colorIndex = missionId?.charCodeAt(0) % colors.length || 0
  return `https://via.placeholder.com/400x200/${colors[colorIndex]}/ffffff?text=Mission`
}

function showMission(missionId) {
  const mission = availableMissions.value.find(m => m.mission_id === missionId)
  console.log(mission)
  if (mission) {
    selectedMission.value = mission
    selected_mission_id.value = mission.mission_id
    missionName.value = mission.name
    description.value = mission.description
    numberOfUsers.value = mission.num_testers
    duration.value = mission.duration
    bananasPayout.value = mission.payout
    website.value = mission.website
    showPreview.value = true
  }
}

const user_submission = ref({website: '', answers:[]})
const show_selected_c_mission = ref(false)

async function showCompletedMission(missionId){
  const uid = auth.currentUser.uid
  const mission = completedMissions.value.find(m => m.mission_id === missionId)
  if(mission){
    const submission = await getUserResponse(missionId,uid)
    console.log(submission)
    user_submission.value.website = mission.website
    user_submission.value.answers = submission
    show_selected_c_mission.value = true
  }
}

function closeMissionPreview() {
  selectedMission.value = null
}

function goToMission(missionId) {
  console.log(missionId)
  router.push(`/mission/feedback/${missionId}`)
}

async function refreshMissions(){
  try {
    loadMyMissions(),
    loadAvailableMissions()
  } catch (err) {
    error.value = 'Failed to load missions. Please try again.'
    console.error('Error loading missions:', err)
  } finally {
    showPreview.value = false
    activeTab.value = 'my-missions'
  }
}
</script>

<template>
  <navbar />
  <div class="min-vh-100 page">
    <!-- Header -->
    <div class="dashboard-header py-1 mb-4">
      <div class="container">
        <div class="header-content">
          <img :src="homepageMonkeyURL" class="header-image" alt="Header Monkey" />
          <div class="header-text">
            <h1 class="mb-2">Test Monkey</h1>
            <p class="mb-0 opacity-75">Welcome back, {{ user_name }}! Check out the latest missions.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <!-- Tab Navigation -->
      <ul class="nav nav-tabs custom-tabs mb-4" role="tablist">
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            :class="{ active: activeTab === 'my-missions' }"
            @click="activeTab = 'my-missions'"
            type="button"
            role="tab"
          >
            <i class="fas fa-tasks me-2"></i>
            My Missions
            <span v-if="activeMissions.length > 0" class="badge bg-primary ms-2">{{ activeMissions.length }}</span>
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            :class="{ active: activeTab === 'browse-missions' }"
            @click="activeTab = 'browse-missions'"
            type="button"
            role="tab"
          >
            <i class="fas fa-compass me-2"></i>
            Browse Missions
            <span v-if="stats.total > 0" class="badge bg-success ms-2">{{ stats.total }}</span>
          </button>
        </li>
      </ul>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- My Missions Tab -->
        <div v-show="activeTab === 'my-missions'" class="tab-pane fade" :class="{ 'show active': activeTab === 'my-missions' }">
          <!-- Loading State -->
          <div v-if="myMissionsLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted mt-3">Loading your missions...</p>
          </div>

          <template v-else>
            <!-- Stats -->
            <div class="row g-3 mb-4">
              <div class="col-md-3 col-6">
                <div class="card-modern text-center">
                  <div class="card-body">
                    <small class="text-muted">Active</small>
                    <h3 class="stats-num text-primary mb-0">{{ activeMissions.length }}</h3>
                  </div>
                </div>
              </div>
              <div class="col-md-3 col-6">
                <div class="card-modern text-center">
                  <div class="card-body">
                    <small class="text-muted">Completed</small>
                    <h3 class="stats-num text-success mb-0">{{ completedMissions.length }}</h3>
                  </div>
                </div>
              </div>
              <div class="col-md-3 col-6">
                <div class="card-modern text-center">
                  <div class="card-body">
                    <small class="text-muted">Avg Progress</small>
                    <h3 class="stats-num text-warning mb-0">{{ avgProgress }}%</h3>
                  </div>
                </div>
              </div>
              <div class="col-md-3 col-6">
                <div class="card-modern text-center">
                  <div class="card-body">
                    <small class="text-muted">Earned</small>
                    <h3 class="stats-num text-info mb-0">🍌{{ totalEarned }}</h3>
                  </div>
                </div>
              </div>
            </div>

            <!-- Active Missions -->
            <div v-if="activeMissions.length > 0" class="mb-4">
              <h4 class="mb-3"><i class="fas fa-spinner fa-pulse me-2 text-primary"></i>Active Missions</h4>
              <div class="row g-3">
                <div v-for="mission in activeMissions" :key="mission.id" class="col-lg-6">
                  <div class="card-modern h-100">
                    <div class="card-body">
                      <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title mb-0">{{ mission.name }}</h5>
                        <span class="badge-modern badge-primary">{{ mission.status }}</span>
                      </div>
                      <p class="card-text text-muted small mb-3">{{ mission.description }}</p>

                      <!-- <div class="mb-3">
                        <div class="d-flex justify-content-between small mb-1">
                          <span>Testers: {{ mission.active_testers?.length || 0 }}/{{ mission.num_testers }}</span>
                          <span class="fw-bold">{{ getProgress(mission) }}%</span>
                        </div>
                        <div class="progress">
                          <div class="progress-bar bg-primary" :style="`width: ${getProgress(mission)}%`"></div>
                        </div>
                      </div> -->

                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <small class="text-muted"><i class="fas fa-clock me-1"></i>{{ getDaysRemaining(mission.duration) }}</small><br>
                          <small class="text-success"><i class="fas fa-coins me-1"></i>🍌{{ mission.payout || 0 }}</small>
                        </div>
                        <button class="btn-modern btn-primary btn-sm" @click="goToMission(mission.mission_id)">
                          <i class="fas fa-play me-1"></i>Continue
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mb-4" v-else>
              <!-- <h4 class="mb-3"><i class="fas fa-spinner fa-pulse me-2 text-primary"></i>Active Missions</h4> -->
              <div class="row g-3" style="display: flex; justify-content: left; text-align: left;">
                <h5 class="text"><i class="fas fa-spinner fa-pulse me-2 text-primary"></i>No Active Missions</h5>
                <div class="row g-1 mb-4 ps-4">
                  <p class="text-muted">Browse available missions to get started!</p>
                  <button class="btn-modern btn-primary" style="width: fit-content;" @click="activeTab = 'browse-missions'">
                    <i class="fas fa-compass me-2"></i>Browse Missions
                  </button>
                </div>
              
              </div>
            </div>

            <!-- Completed Missions -->
            <div v-if="completedMissions.length > 0" class="mb-4">
              <h4 class="mb-3"><i class="fas fa-check-circle me-2 text-success"></i>Completed Missions</h4>
              <div class="row g-3">
                <div v-for="mission in completedMissions" :key="mission.id" class="col-lg-6">
                  <div class="card-modern h-100 opacity-75">
                    <div class="card-body">
                      <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title mb-0">{{ mission.name }}</h5>
                        <span class="badge-modern badge-success">Completed</span>
                      </div>
                      <p class="card-text text-muted small mb-3">{{ mission.description }}</p>

                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <small class="text-success"><i class="fas fa-coins me-1"></i>🍌{{ mission.payout || 0 }} earned</small>
                        </div>
                        <button class="btn-modern btn-ghost-dark btn-sm view-btn"
                        @click="showCompletedMission(mission.mission_id)">
                          <i class="fas fa-eye me-1"></i>View Submission
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="myMissions.length === 0" class="text-center py-5">
              <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
              <h5 class="text-muted">No missions yet</h5>
              <p class="text-muted">Browse available missions to get started!</p>
              <button class="btn-modern btn-primary" @click="activeTab = 'browse-missions'">
                <i class="fas fa-compass me-2"></i>Browse Missions
              </button>
            </div>
          </template>
        </div>

        <!-- Browse Missions Tab -->
        <div v-show="activeTab === 'browse-missions'" class="tab-pane fade" :class="{ 'show active': activeTab === 'browse-missions' }">
          <!-- Stats -->
          <div class="row g-3 mb-4">
            <div class="col-6 col-md-3">
              <div class="card-modern text-center">
                <div class="card-body">
                  <small class="text-muted">Total Missions</small>
                  <h2 class="stats-num text-primary mb-0">{{ stats.total }}</h2>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="card-modern text-center">
                <div class="card-body">
                  <small class="text-muted">Highest Payout</small>
                  <div class="highest-row">
                    <img :src="bananaURL" class="banana-image" />
                    <h2 class="stats-num text-success mb-0">{{ stats.highestPayout }} 🍌</h2>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="card-modern text-center">
                <div class="card-body">
                  <small class="text-muted">Avg Payout</small>
                  <div class="avg-row">
                    <img :src="peeledBananaURL" class="peeledBanana-image" />
                    <h2 class="stats-num text-warning mb-0">{{ stats.avgPayout }} 🍌</h2>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="card-modern text-center">
                <div class="card-body">
                  <small class="text-muted">Quick Missions (1 day)</small>
                  <h2 class="stats-num text-info mb-0">{{ stats.quickMissions }}</h2>
                </div>
              </div>
            </div>
          </div>

          <!-- Filters -->
          <div class="row g-3 mb-4">
            <div class="col-md-8">
              <input
                v-model="searchQuery"
                type="text"
                class="form-input"
                placeholder="Search missions..."
              />
            </div>
            <div class="col-md-4">
              <select v-model="sortBy" class="form-select form-input">
                <option value="newest">Newest First</option>
                <option value="payout-high">Highest Payout</option>
                <option value="payout-low">Lowest Payout</option>
              </select>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="availableMissionsLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted mt-3">Loading available missions...</p>
          </div>

          <!-- Mission Grid -->
          <div v-else-if="filteredMissions.length > 0" class="row g-4">
            <div
              v-for="mission in filteredMissions"
              :key="mission.mission_id"
              class="col-12 col-sm-6 col-lg-4 col-xl-3"
            >
              <div class="card h-100 shadow-sm mission-card" @click="showMission(mission.mission_id)">
                <img
                  :src="getPlaceholderImage(mission.mission_id)"
                  :alt="mission.name"
                  class="card-img-top"
                  style="height: 200px; object-fit: cover;"
                  @error="$event.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22200%22%3E%3Crect fill=%22%23667eea%22 width=%22400%22 height=%22200%22/%3E%3C/svg%3E'"
                />
                <div class="card-body d-flex flex-column">
                  <h5 class="card-title">{{ mission.name }}</h5>
                  <p class="card-text text-muted small flex-grow-1 text-truncate-3">
                    {{ mission.description }}
                  </p>

                  <div class="d-flex flex-wrap gap-2 mb-3">
                    <span class="badge bg-light text-dark">
                      <i class="fas fa-clock me-1"></i>{{ formatDuration(mission.duration) }}
                    </span>
                    <span class="badge bg-success bg-opacity-10 text-success">
                      🍌 {{ mission.payout }}
                    </span>
                    <span class="badge bg-primary bg-opacity-10 text-primary">
                      <i class="fas fa-users me-1"></i>{{ mission.num_testers }}
                    </span>
                  </div>
                </div>

                <div class="card-footer bg-white d-flex justify-content-between align-items-center">
                  <small class="text-muted text-truncate me-2">ID: {{ mission.mission_id.slice(0, 8) }}...</small>
                  <button class="btn btn-sm btn-primary" @click.stop="showMission(mission.mission_id)">
                    <i class="fas fa-paper-plane me-1"></i>Apply
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- No Results -->
          <div v-else class="text-center py-5 text-muted">
            <i class="fas fa-search fa-3x mb-3"></i>
            <h5>No missions found</h5>
            <p>Try adjusting your search or filters</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Mission Preview Modal -->
  <MissionPreview
      :show="showPreview"
      :missionId="selected_mission_id"
      :missionName="missionName"
      :description="description"
      :numberOfUsers="numberOfUsers"
      :duration="duration"
      :bananasPayout="bananasPayout"
      :totalCost="totalCost"
      :website="website"
      @close="showPreview = false"
      @refresh="refreshMissions()"
  />

  <Completed_Mission 
  :show="show_selected_c_mission" 
  :mission="user_submission"
  @close="show_selected_c_mission = false"
  />
  
</template>

<style scoped>
.page {
  background: var(--color-gray-50);
  min-height: 100vh;
  padding-top: 80px;
}

.dashboard-header {
  background: var(--gradient-green);
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.header-image {
  width: clamp(120px, 20vw, 200px);
  height: auto;
  transform: rotate(-24deg);
  flex-shrink: 0;
}

.header-text {
  flex: 1;
  min-width: 250px;
}

.header-text h1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
  color: white;
}

.header-text p {
  color: rgba(255, 255, 255, 0.95);
}

/* Custom Tabs */
.custom-tabs {
  border-bottom: 2px solid var(--color-gray-200);
}

.custom-tabs .nav-link {
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--color-gray-600);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-md) var(--spacing-lg);
  transition: all var(--transition-base);
  background: transparent;
}

.custom-tabs .nav-link:hover {
  color: var(--color-secondary);
  border-bottom-color: var(--color-secondary-light);
}

.custom-tabs .nav-link.active {
  color: var(--color-secondary);
  border-bottom-color: var(--color-secondary);
  background: transparent;
}

/* Stats */
.stats-num {
  font-weight: var(--font-weight-bold);
}

.banana-image, .peeledBanana-image {
  width: 40px;
  height: auto;
}

.highest-row, .avg-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

/* Mission Cards */
.mission-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.mission-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

.text-truncate-3 {
  display: -webkit-box;
  line-clamp: 4;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  overflow: hidden;
}

.view-btn{
  color: black;
}

.view-btn:hover{
  color: var(--color-success)
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .header-image {
    transform: rotate(-12deg);
  }

  .custom-tabs .nav-link {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
  }
}
</style>
