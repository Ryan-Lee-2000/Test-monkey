<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { ref, computed, onMounted } from "vue"
import { getMissions } from "../Database/Monkey_Store";
import { getAuth, onAuthStateChanged, signOut  } from "firebase/auth";
import { getUserName } from "../Database/Monkey_Store";
import Mission_Preview from "./Mission_Preview.vue";
import homepageMonkeyURL from "@/assets/welcome/homepage_monkey.png";
import missionImage from "@/assets/welcome/mission_image.webp"
import bananaURL from "@/assets/welcome/banana.png"
import peeledBananaURL from "@/assets/welcome/peeled_banana.png"

const missions = ref([])
const isLoading = ref(false)
const error = ref(null)
const searchQuery = ref("")
const selectedJobType = ref("all")
const user_name = ref('')

const auth = getAuth();

const selected_mission_id = ref('')
const missionName = ref("")
const numberOfUsers = ref("")
const description = ref("")
const duration = ref("")
const bananasPayout = ref("")
const selectedFile = ref(null)
const fileName = ref("")
const fileType = ref("html")

const website = ref("")

const totalCost = computed(() => (numberOfUsers.value && bananasPayout.value) 
  ? (numberOfUsers.value * bananasPayout.value).toLocaleString() 
  : '0')
const showPreview = ref(false)



// Initialize missions from database
onMounted(async () => {
  user_name.value = auth.currentUser.displayName;

  isLoading.value = true
  error.value = null
  
  try {
    missions.value = await getMissions()
  } catch (err) {
    error.value = 'Failed to load missions. Please try again.'
    console.error('Error loading missions:', err)
  } finally {
    isLoading.value = false
  }
})

// Computed filtered missions
const filteredMissions = computed(() => {
  if (!missions.value || missions.value.length === 0) return []
  
  return missions.value.filter(mission => {
    const matchesSearch = 
      mission.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      mission.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesType = selectedJobType.value === "all"
    
    return matchesSearch && matchesType
  })
})

// Computed stats
const stats = computed(() => {
  const payouts = missions.value.map(m => m.payout || 0)
  return {
    total: filteredMissions.value.length,
    highestPayout: payouts.length > 0 ? Math.max(...payouts) : 0,
    avgPayout: payouts.length > 0 
      ? Math.round(payouts.reduce((sum, p) => sum + p, 0) / payouts.length)
      : 0,
    quickMissions: missions.value.filter(m => m.duration === '1').length
  }
})

// Generate placeholder image URL
const getPlaceholderImage = (missionId) => {
  const colors = ['4285f4', 'ea4335', 'fbbc05', '34a853', 'ff6d01', '9c27b0']
  const index = missionId ? Math.abs(missionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) : 0
  const color = colors[index % colors.length]
  return `https://picsum.photos/400/200?random=${index}`
}

// Format duration
const formatDuration = (duration) => {
  const durationMap = {
    '1': '1 day',
    '3': '3 days',
    '7': '1 week',
    '30': '1 month'
  }
  return durationMap[duration] || `${duration} days`
}

function showMission(id){
  console.log(id)
  var selected_mission = {}
  for(var index in missions.value){
    if(missions.value[index].mission_id == id){
      console.log("mission found: ", missions.value[index].mission_id)
      selected_mission = missions.value[index];
      break
    }
  }
  if(selected_mission){
    console.log(selected_mission)
      //     :show="showPreview"
      // :missionName="missionName" -
      // :description="description" -
      // :numberOfUsers="numberOfUsers"
      // :duration="duration"
      // :bananasPayout="bananasPayout"
      // :totalCost="totalCost"
      // :selectedFile="selectedFile"
      // :fileName="fileName"
      // :fileType="fileType"
      selected_mission_id.value = selected_mission.mission_id
      missionName.value = selected_mission.name
      description.value = selected_mission.description
      //mission_id.value = selected_mission.mission_id
      numberOfUsers.value = selectedFile.num_testers
      duration.value = selected_mission.duration
      bananasPayout.value = selected_mission.payout
      website.value = selected_mission.website
      selectedFile.value = 'user_file'
      fileName.value = 'file_name'
      fileType.value = 'file_type'
      showPreview.value = true

  }
  
}

async function refreshMissions(){
  showPreview.value = false
  isLoading.value = true
  error.value = null
  
  try {
    missions.value = await getMissions()
  } catch (err) {
    error.value = 'Failed to load missions. Please try again.'
    console.error('Error loading missions:', err)
  } finally {
    isLoading.value = false
  }
}



</script>

<template>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <div class="w-100 h-100 page">
    <!-- Header -->
    <div class="dashboard-header h-100 py-1 mb-4">
      <div class="container">
        <div class="header-content">
          <img :src="homepageMonkeyURL" class="header-image " alt="Header Monkey" />
          <div class="header-text">
            <h1 class="mb-2">{{ user_name }}'s Dashboard</h1>
            <p class="mb-0 opacity-75">Welcome back! Check out the latest missions.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Loading missions...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-danger d-flex align-items-center" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>
        <span>{{ error }}</span>
        <button class="btn btn-sm btn-outline-danger ms-auto" @click="onMounted">Retry</button>
      </div>

      <!-- Main Content -->
      <template v-else>
        <!-- Stats Cards -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-md-3">
            <div class="card stats-card text-center shadow-sm">
              <div class="card-body">
                <small class="text-muted">Available Missions</small>
                <div class="stats-row">
                  <img :src="missionImage" class="mission-image"/>
                  <h2 class="stats-num text-primary mb-0">{{ stats.total }}</h2>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="card stats-card text-center shadow-sm">
              <div class="card-body">
                <small class="text-muted">Highest Payout</small>
                <div class="highest-row">
                  <img :src="bananaURL" class="banana-image"/>
                  <h2 class="stats-num text-success mb-0">${{ stats.highestPayout }}</h2>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="card stats-card text-center shadow-sm">
              <div class="card-body">
                <small class="text-muted">Avg Payout</small>
                <div class="avg-row">
                  <img :src="peeledBananaURL" class="peeledBanana-image"/>
                  <h2 class="stats-num text-warning mb-0">${{ stats.avgPayout }}</h2>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="card stats-card text-center shadow-sm">
              <div class="card-body">
                <small class="text-muted">Quick Missions (1 day)</small>
                <h2 class="stats-num text-info mb-0">{{ stats.quickMissions }}</h2>
              </div>
            </div>
          </div>
        </div>

        <!-- Search and Filters -->
        <!-- <div class="card shadow-sm mb-4">
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-8">
                <div class="input-group">
                  <span class="input-group-text bg-white">
                    <i class="fas fa-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Search missions or keywords..."
                    v-model="searchQuery"
                  />
                </div>
              </div>
              <div class="col-md-4">
                <select class="form-select" v-model="selectedJobType">
                  <option value="all">All Missions</option>
                </select>
              </div>
            </div>
          </div>
        </div> -->

        <div class="d-flex align-items-center mb-4 border-0">
          <div class="flex-grow-1 me-3">
            <div class="search-bar-container">
              <i class="fas fa-search search-icon"></i>
              <input
                type="text"
                class="search-input"
                placeholder="Search missions or keywords..."
                v-model="searchQuery"
              />
            </div>
          </div>
    
          <div>
            <select class="form-select search-dropdown" v-model="selectedJobType">
              <option value="all">All Missions</option>
            </select>
          </div>
        </div>

        <!-- Mission Grid -->
        <div class="row g-4" v-if="filteredMissions.length > 0">
          <div 
            v-for="mission in filteredMissions" 
            :key="mission.mission_id"
            class="col-12 col-sm-6 col-lg-4 col-xl-3"
          >
            <div class="card h-100 shadow-sm mission-card">
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
                    <i class="fas fa-dollar-sign me-1"></i>{{ mission.payout }}
                  </span>
                  <span class="badge bg-primary bg-opacity-10 text-primary">
                    <i class="fas fa-users me-1"></i>{{ mission.num_testers }}
                  </span>
                </div>
              </div>
              
              <div class="card-footer bg-white d-flex justify-content-between align-items-center">
                <small class="text-muted text-truncate me-2">ID: {{ mission.mission_id.slice(0, 8) }}...</small>
                <button class="btn btn-sm btn-primary" @click="showMission(mission.mission_id)">
                  <i class="fas fa-paper-plane me-1"></i>Apply
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div v-else class="text-center py-5 text-muted">
          <i class="fas fa-search fa-4x mb-3 opacity-50"></i>
          <h4 class="no-results">No missions found</h4>
          <p class="no-results">Try adjusting your search criteria</p>
        </div>
      </template>
    </div>
    <Mission_Preview 
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
  </div>
</template>

<style scoped>
.page {
  background: linear-gradient(to top, #0f4d26 7%, #F97A02 26%, #FC9D05 54%, #FDC955 77%, #ABD453 90%);
  min-height: 100vh;
  padding-bottom: 2rem;
}

.dashboard-header {
  /* padding-top: 100px !important; */
  padding-top: 70px !important;
  background: transparent;
  color: black;
  padding: 2rem 0 3rem 0;
  overflow: visible;
}

.header-content {
  display: flex;
  align-items: center;
  /* gap: 2rem; */
  flex-wrap: wrap;
}

.header-image {
  width: clamp(150px, 25vw, 300px);
  height: auto;
  transform: rotate(-24deg);
  flex-shrink: 0;
}

.header-text {
  flex: 1;
  min-width: 250px;
}

.dashboard-header h1 {
  color: #0A490A;
  font-weight: bold;
  font-size: clamp(28px, 5vw, 60px);
}

@media (max-width: 767px) {
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .header-image {
    transform: rotate(-15deg);
  }
}

.stats-row,
.highest-row,
.avg-row{
  display: flex;
  justify-content: center;
  align-items: center;
}

.mission-image,
.banana-image,
.peeledBanana-image{
  width: 45px;
  height: 45px;
}

.search-bar-container {
  display: flex;
  align-items: center;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 50px;          /* makes it oval */
  padding: 0.5rem 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;
  height: 45px;
}

.search-bar-container:focus-within {
  border-color: #007bff;        /* blue border on focus */
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.search-icon {
  color: #888;
  font-size: 1rem;
  margin-right: 0.75rem;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  background: transparent;
}

.search-dropdown{
  width: 200px;
  height: 45px;
  border-radius: 50px;
}

.no-results{
  font-weight: bold;
}

.stats-card{
  border-radius: 20px;
  border: 4px solid #ff7700;
  box-shadow: 0 6px 0 rgba(0,0,0,.25), 0 10px 24px rgba(0,0,0,.25);
}

.stats-card .card-body {
  padding: 0.5rem 1rem;
}

.stats-num{
  font-weight: bold;
}

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
</style>