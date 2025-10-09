<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { ref } from "vue"
import navbar from "@/navbar.vue";

const activeMissions = ref([
  {
    id: 1,
    name: "Mobile Checkout Flow Test",
    company: "TechCorp Inc.",
    description: "Test the checkout process on mobile devices and report any issues with payment flow.",
    progress: 65,
    bananas: 150,
    dueDate: "2025-10-10",
    status: "in-progress",
    tasksCompleted: 13,
    totalTasks: 20
  },
  {
    id: 2,
    name: "Landing Page UX Review",
    company: "Design Studio",
    description: "Review the new landing page design and provide feedback on user experience.",
    progress: 30,
    bananas: 100,
    dueDate: "2025-10-12",
    status: "in-progress",
    tasksCompleted: 6,
    totalTasks: 20
  }
])

const completedMissions = ref([
  {
    id: 3,
    name: "Login System Testing",
    company: "SecureAuth",
    description: "Comprehensive testing of the new authentication system.",
    bananas: 200,
    completedDate: "2025-10-01",
    status: "completed",
    rating: 5
  },
  {
    id: 4,
    name: "Dashboard Navigation Test",
    company: "Analytics Pro",
    description: "Test all navigation elements and report any broken links.",
    bananas: 120,
    completedDate: "2025-09-28",
    status: "completed",
    rating: 4
  }
])

const getStatusColor = (status) => {
  return status === 'in-progress' ? 'primary' : status === 'completed' ? 'success' : 'secondary'
}

const getDaysRemaining = (dueDate) => {
  const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))
  return days > 0 ? `${days} days left` : 'Overdue'
}
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
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <div class="min-vh-100 bg-light" >
    <!-- Header -->
    <div class="hero-header" style="padding-top: 100px;">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h1><i class="fas fa-tasks me-2"></i>My Missions</h1>
            <p class="opacity-75 mb-0">Track and manage your accepted testing missions</p>
          </div>
          <div class="text-end">
            <h3 class="mb-0">🍌 {{ activeMissions.reduce((sum, m) => sum + m.bananas, 0) + completedMissions.reduce((sum, m) => sum + m.bananas, 0) }}</h3>
            <small class="opacity-75">Total Earned</small>
          </div>
        </div>
      </div>
    </div>

    <div class="container py-4">
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
              <h3 class="text-warning mb-0">{{ Math.round(activeMissions.reduce((sum, m) => sum + m.progress, 0) / activeMissions.length) || 0 }}%</h3>
              <small class="text-muted">Avg Progress</small>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-6">
          <div class="card text-center shadow-sm border-0">
            <div class="card-body">
              <h3 class="text-info mb-0">🍌{{ completedMissions.reduce((sum, m) => sum + m.bananas, 0) }}</h3>
              <small class="text-muted">Earned</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Missions -->
      <div class="mb-4">
        <h4 class="mb-3"><i class="fas fa-spinner fa-pulse me-2 text-primary"></i>Active Missions</h4>
        <div class="row g-3">
          <div v-for="mission in activeMissions" :key="mission.id" class="col-lg-6">
            <div class="card mission-card shadow-sm border-0 h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h5 class="card-title mb-0">{{ mission.name }}</h5>
                  <span :class="`badge bg-${getStatusColor(mission.status)}`">{{ mission.status }}</span>
                </div>
                <p class="text-primary small mb-2"><i class="fas fa-building me-1"></i>{{ mission.company }}</p>
                <p class="card-text text-muted small mb-3">{{ mission.description }}</p>
                
                <div class="mb-3">
                  <div class="d-flex justify-content-between small mb-1">
                    <span>Progress: {{ mission.tasksCompleted }}/{{ mission.totalTasks }} tasks</span>
                    <span class="fw-bold">{{ mission.progress }}%</span>
                  </div>
                  <div class="progress">
                    <div :class="`progress-bar bg-${getStatusColor(mission.status)}`" :style="`width: ${mission.progress}%`"></div>
                  </div>
                </div>

                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <span class="badge bg-success me-2">🍌 {{ mission.bananas }}</span>
                    <span class="badge bg-light text-dark"><i class="fas fa-clock me-1"></i>{{ getDaysRemaining(mission.dueDate) }}</span>
                  </div>
                  <button class="btn btn-sm btn-gradient">Continue <i class="fas fa-arrow-right ms-1"></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Completed Missions -->
      <div>
        <h4 class="mb-3"><i class="fas fa-check-circle me-2 text-success"></i>Completed Missions</h4>
        <div class="row g-3">
          <div v-for="mission in completedMissions" :key="mission.id" class="col-lg-6">
            <div class="card mission-card shadow-sm border-0 h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h5 class="card-title mb-0">{{ mission.name }}</h5>
                  <span class="badge bg-success">Completed</span>
                </div>
                <p class="text-primary small mb-2"><i class="fas fa-building me-1"></i>{{ mission.company }}</p>
                <p class="card-text text-muted small mb-3">{{ mission.description }}</p>
                
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <span class="badge bg-success me-2">🍌 {{ mission.bananas }}</span>
                    <span class="badge bg-light text-dark"><i class="fas fa-calendar me-1"></i>{{ mission.completedDate }}</span>
                  </div>
                  <div>
                    <span class="text-warning">
                      <i v-for="n in mission.rating" :key="n" class="fas fa-star"></i>
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
    </div>
  </div>
</template>