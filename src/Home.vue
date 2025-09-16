<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { ref, onMounted } from "vue"
import { getAuth, onAuthStateChanged, signOut  } from "firebase/auth";
import { useRouter } from 'vue-router'
import { exampleMissionData } from "./Database/Monkey_Store";

// Sample job data - replace with your actual data source
const Missions = ref(exampleMissionData())

const filteredMissions = ref([])
const searchQuery = ref("")
const selectedJobType = ref("all")

// Initialize filtered Missions
onMounted(() => {
  filteredMissions.value = Missions.value
})

// Search and filter functionality
const filterMissions = () => {
  filteredMissions.value = Missions.value.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesType = selectedJobType.value === "all" || job.type.toLowerCase() === selectedJobType.value.toLowerCase()
    
    return matchesSearch && matchesType
  })
}

// Generate placeholder image URL
const getPlaceholderImage = (jobId) => {
  const colors = ['4285f4', 'ea4335', 'fbbc05', '34a853', 'ff6d01', '9c27b0']
  const color = colors[jobId % colors.length]
  // Using picsum.photos as primary, with inline SVG as fallback
  return `https://picsum.photos/400/200?random=${jobId}`
}

const user_name = ref("")
const auth = getAuth();
const router = useRouter()
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/auth.user
    user_name.value = user.providerData[0].displayName
    // ...
  } else {
    // User is signed out
    console.log("User has been signed out")
  }
});

</script>

<template>
  <div class="min-vh-100 bg-light">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-md-8">
            <h1 class="mb-2">{{user_name}}'s Dashboard</h1>
            <p class="mb-0 opacity-75">Missions are ready for you</p>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <!-- Stats Cards -->
      <div class="row mb-4">
        <div class="col-6 col-md-3 mb-3">
          <div class="stats-card">
            <div class="stats-number">{{ filteredMissions.length }}</div>
            <div class="stats-label">Available Missions</div>
          </div>
        </div>
        <div class="col-6 col-md-3 mb-3">
          <div class="stats-card">
            <div class="stats-number">{{ Missions.filter(job => job.type === 'Full-time').length }}</div>
            <div class="stats-label">Full-time</div>
          </div>
        </div>
        <div class="col-6 col-md-3 mb-3">
          <div class="stats-card">
            <div class="stats-number">{{ Missions.filter(job => job.type === 'Contract').length }}</div>
            <div class="stats-label">Contract</div>
          </div>
        </div>
        <div class="col-6 col-md-3 mb-3">
          <div class="stats-card">
            <div class="stats-number">{{ new Set(Missions.map(job => job.company)).size }}</div>
            <div class="stats-label">Companies</div>
          </div>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="search-filters">
        <div class="row g-3">
          <div class="col-md-8">
            <div class="input-group">
              <span class="input-group-text bg-white border-end-0">
                <i class="fas fa-search text-muted"></i>
              </span>
              <input
                type="text"
                class="form-control border-start-0"
                placeholder="Search Missions, companies, or keywords..."
                v-model="searchQuery"
                @input="filterMissions"
              />
            </div>
          </div>
          <div class="col-md-4">
            <select class="form-select" v-model="selectedJobType" @change="filterMissions">
              <option value="all">All Job Types</option>
              <option value="full-time">Full-time</option>
              <option value="contract">Contract</option>
              <option value="part-time">Part-time</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Job Grid -->
      <div class="row" v-if="filteredMissions.length > 0">
        <div 
          v-for="job in filteredMissions" 
          :key="job.id"
          class="col-12 col-sm-6 col-lg-4 col-xl-3 mb-4"
        >
          <div class="card job-card h-100">
            <img 
              :src="getPlaceholderImage(job.id)" 
              :alt="job.name"
              class="job-image"
            />
            <div class="job-content">
              <h5 class="job-title">{{ job.name }}</h5>
              <div class="job-company">
                <i class="fas fa-building me-2"></i>{{ job.company }}
              </div>
              <p class="job-description">{{ job.description }}</p>
              
              <div class="job-meta">
                <span class="job-tag">
                  <i class="fas fa-map-marker-alt me-1"></i>{{ job.length }}
                </span>
                <span class="job-tag salary">{{ job.salary }}</span>
                <span class="job-tag type">{{ job.type }}</span>
              </div>
            </div>
            
            <div class="job-footer">
              <small class="job-posted">{{ job.posted }}</small>
              <button class="btn btn-apply">
                <i class="fas fa-paper-plane me-2"></i>Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-else class="no-Missions">
        <i class="fas fa-search"></i>
        <h4>No Missions found</h4>
        <p>Try adjusting your search criteria or filters</p>
      </div>
    </div>
  </div>
</template>


<style scoped>
.dashboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 0;
  margin-bottom: 2rem;
  padding-top: 75px;
}

.search-filters {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.job-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: none;
  overflow: hidden;
  height: 100%;
  cursor: pointer;
}

.job-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.job-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  background: #f8f9fa;
}

.job-content {
  padding: 1.5rem;
}

.job-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.job-company {
  color: #667eea;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.job-description {
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.job-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.job-tag {
  background: #f1f3f4;
  color: #5f6368;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.job-tag.salary {
  background: #e8f5e8;
  color: #2e7d32;
}

.job-tag.type {
  background: #e3f2fd;
  color: #1976d2;
}

.job-footer {
  padding: 0 1.5rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.job-posted {
  color: #9ca3af;
  font-size: 0.8rem;
}

.btn-apply {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  transition: transform 0.2s ease;
}

.btn-apply:hover {
  transform: scale(1.05);
  color: white;
}

.form-control, .form-select {
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  transition: border-color 0.3s ease;
}

.form-control:focus, .form-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.stats-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stats-number {
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
}

.stats-label {
  color: #6c757d;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.no-Missions {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.no-Missions i {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: 1.5rem 0;
  }
  
  .search-filters {
    padding: 1rem;
  }
  
  .job-content {
    padding: 1rem;
  }
  
  .job-footer {
    padding: 0 1rem 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .btn-apply {
    width: 100%;
  }
}
</style>