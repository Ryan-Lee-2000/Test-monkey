<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import navbar from './navbar.vue';
import { db } from './Config/api_services.js';
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const router = useRouter();
const missions = ref([]);
const expandedMissionId = ref(null);
const missionSubmissions = ref({});
const isLoading = ref(true);
const currentUser = ref(null);

onMounted(() => {
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser.value = user;
      const q = query(collection(db, "Missions"), where("owner", "==", user.uid));

      onSnapshot(q, (snapshot) => {
        missions.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        isLoading.value = false;
      }, (error) => {
        console.error("Error fetching missions in real-time:", error);
        isLoading.value = false;
      });
    } else {
      missions.value = [];
      isLoading.value = false;
    }
  });
});

const getStatusClass = (status) => {
  switch (status) {
    case 'Completed':
      return 'badge-modern badge-success';
    case 'Active':
      return 'badge-modern badge-primary';
    case 'In Progress':
      return 'badge-modern badge-warning';
    default:
      return 'badge-modern badge-secondary';
  }
};

const getProgressPercentage = (mission) => {
  if (!mission.num_testers) return 0;
  return Math.round(((mission.submissionCount || 0) / mission.num_testers) * 100);
};

const toggleMission = async (missionId) => {
  if (expandedMissionId.value === missionId) {
    expandedMissionId.value = null;
  } else {
    expandedMissionId.value = missionId;
    // Load submissions for this mission if not already loaded
    if (!missionSubmissions.value[missionId]) {
      await loadMissionSubmissions(missionId);
    }
  }
};

const loadMissionSubmissions = async (missionId) => {
  try {
    const submissionsQuery = query(
      collection(db, "Submissions"),
      where("missionId", "==", missionId)
    );
    const submissionsSnapshot = await getDocs(submissionsQuery);
    const submissions = submissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    missionSubmissions.value[missionId] = submissions;
  } catch (error) {
    console.error("Error loading submissions:", error);
    missionSubmissions.value[missionId] = [];
  }
};

const viewFullReport = (missionId) => {
  router.push(`/dashboard/${missionId}`);
};

// Computed stats
const stats = computed(() => {
  return {
    totalMissions: missions.value.length,
    activeMissions: missions.value.filter(m => m.status === 'Active').length,
    completedMissions: missions.value.filter(m => m.status === 'Completed').length,
    totalSubmissions: missions.value.reduce((sum, m) => sum + (m.submissionCount || 0), 0)
  };
});
</script>

<template>
  <navbar/>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <div>
        <h1>Founder Dashboard</h1>
        <p class="text-muted">Review and manage all your feedback missions</p>
      </div>
      <router-link to="/createMission" class="btn-modern btn-primary">
        <i class="fas fa-plus me-2"></i>Create Mission
      </router-link>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card card-modern">
        <div class="stat-icon stat-icon-primary">
          <i class="fas fa-rocket"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalMissions }}</div>
          <div class="stat-label">Total Missions</div>
        </div>
      </div>

      <div class="stat-card card-modern">
        <div class="stat-icon stat-icon-success">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.completedMissions }}</div>
          <div class="stat-label">Completed</div>
        </div>
      </div>

      <div class="stat-card card-modern">
        <div class="stat-icon stat-icon-warning">
          <i class="fas fa-spinner"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.activeMissions }}</div>
          <div class="stat-label">Active</div>
        </div>
      </div>

      <div class="stat-card card-modern">
        <div class="stat-icon stat-icon-info">
          <i class="fas fa-comments"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalSubmissions }}</div>
          <div class="stat-label">Total Feedback</div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading missions...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="missions.length === 0" class="empty-state card-modern">
      <i class="fas fa-inbox empty-icon"></i>
      <h3>No missions yet</h3>
      <p>Create your first mission to start gathering feedback from Test Monkeys</p>
      <router-link to="/createMission" class="btn-modern btn-primary">
        <i class="fas fa-plus me-2"></i>Create Your First Mission
      </router-link>
    </div>

    <!-- Missions List -->
    <div v-else class="missions-list">
      <div
        v-for="mission in missions"
        :key="mission.id"
        class="mission-card card-modern"
        :class="{ 'expanded': expandedMissionId === mission.id }"
      >
        <!-- Mission Header (Always Visible) -->
        <div class="mission-header" @click="toggleMission(mission.id)">
          <div class="mission-info">
            <div class="mission-title-row">
              <h3 class="mission-title">{{ mission.name || 'Unnamed Mission' }}</h3>
              <span :class="getStatusClass(mission.status)">{{ mission.status }}</span>
            </div>
            <p class="mission-description">{{ mission.description || 'No description provided' }}</p>

            <div class="mission-meta">
              <span class="meta-item">
                <i class="fas fa-link"></i>
                {{ mission.website }}
              </span>
              <span class="meta-item">
                <i class="fas fa-coins"></i>
                {{ mission.payout }} 🍌 per tester
              </span>
              <span class="meta-item">
                <i class="fas fa-calendar"></i>
                {{ mission.duration }} days
              </span>
            </div>
          </div>

          <div class="mission-actions">
            <div class="progress-indicator">
              <div class="progress-circle">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="35" fill="none" stroke="var(--color-gray-200)" stroke-width="6"/>
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke="var(--color-primary)"
                    stroke-width="6"
                    stroke-dasharray="220"
                    :stroke-dashoffset="220 - (220 * getProgressPercentage(mission) / 100)"
                    transform="rotate(-90 40 40)"
                    style="transition: stroke-dashoffset 0.5s ease;"
                  />
                </svg>
                <div class="progress-text">
                  <div class="progress-percentage">{{ getProgressPercentage(mission) }}%</div>
                  <div class="progress-count">{{ mission.submissionCount || 0 }}/{{ mission.num_testers }}</div>
                </div>
              </div>
            </div>
            <button class="expand-btn" @click.stop @click="toggleMission(mission.id)">
              <i class="fas" :class="expandedMissionId === mission.id ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
            </button>
          </div>
        </div>

        <!-- Mission Details (Expandable) -->
        <transition name="expand">
          <div v-if="expandedMissionId === mission.id" class="mission-details">
            <div class="details-section">
              <h4><i class="fas fa-question-circle me-2"></i>Survey Questions</h4>
              <div class="questions-list">
                <div
                  v-for="(question, index) in mission.questions"
                  :key="index"
                  class="question-item"
                >
                  <span class="question-number">Q{{ index + 1 }}</span>
                  <span class="question-text">{{ question }}</span>
                </div>
              </div>
            </div>

            <div class="details-section" v-if="mission.status === 'Completed'">
              <h4><i class="fas fa-chart-line me-2"></i>AI Analysis</h4>
              <div v-if="mission.aiReport" class="ai-report">
                <div v-if="mission.aiReport.sentimentKeywords" class="sentiment-cloud">
                  <span
                    v-for="(kw, idx) in mission.aiReport.sentimentKeywords.slice(0, 10)"
                    :key="idx"
                    class="sentiment-keyword"
                    :style="{ fontSize: `${12 + (kw.weight * 2)}px` }"
                  >
                    {{ kw.word }}
                  </span>
                </div>
                <p v-if="mission.aiReport.overview" class="ai-overview">{{ mission.aiReport.overview }}</p>
              </div>
              <p v-else class="text-muted">AI analysis will be available once all submissions are processed.</p>
            </div>

            <div class="details-section" v-if="missionSubmissions[mission.id]?.length > 0">
              <h4><i class="fas fa-comments me-2"></i>Submissions ({{ missionSubmissions[mission.id].length }})</h4>
              <div class="submissions-preview">
                <div
                  v-for="submission in missionSubmissions[mission.id].slice(0, 3)"
                  :key="submission.id"
                  class="submission-item"
                >
                  <div class="submission-header">
                    <span class="submission-tester">Tester {{ submission.testerId.slice(-6) }}</span>
                    <span class="submission-date">{{ new Date(submission.submittedAt?.toDate()).toLocaleDateString() }}</span>
                  </div>
                  <div class="submission-answers">
                    <div v-for="(answer, idx) in submission.answers.slice(0, 2)" :key="idx" class="answer-preview">
                      <strong>{{ answer.question }}:</strong> {{ answer.answer.slice(0, 100) }}{{ answer.answer.length > 100 ? '...' : '' }}
                    </div>
                  </div>
                </div>
                <p v-if="missionSubmissions[mission.id].length > 3" class="text-muted text-center mt-3">
                  And {{ missionSubmissions[mission.id].length - 3 }} more submissions...
                </p>
              </div>
            </div>

            <div class="details-actions">
              <button
                v-if="mission.status === 'Completed'"
                @click="viewFullReport(mission.id)"
                class="btn-modern btn-primary"
              >
                <i class="fas fa-chart-bar me-2"></i>View Full Report
              </button>
              <button v-else class="btn-modern btn-ghost-dark" disabled>
                <i class="fas fa-hourglass-half me-2"></i>Waiting for submissions
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-2xl);
  padding-top: 100px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-2xl);
}

.dashboard-header h1 {
  margin: 0;
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
}

.dashboard-header p {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-base);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-2xl);
  flex-shrink: 0;
}

.stat-icon-primary {
  background-color: var(--color-primary-bg);
  color: var(--color-primary);
}

.stat-icon-success {
  background-color: var(--color-success-bg);
  color: var(--color-success);
}

.stat-icon-warning {
  background-color: var(--color-warning-bg);
  color: var(--color-warning);
}

.stat-icon-info {
  background-color: var(--color-secondary-bg);
  color: var(--color-secondary);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  line-height: 1;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
  margin-top: var(--spacing-xs);
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: var(--spacing-3xl);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
}

.empty-icon {
  font-size: 64px;
  color: var(--color-gray-300);
  margin-bottom: var(--spacing-lg);
}

.empty-state h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-sm);
}

.empty-state p {
  color: var(--color-gray-600);
  margin-bottom: var(--spacing-xl);
}

/* Missions List */
.missions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.mission-card {
  overflow: hidden;
  transition: all var(--transition-base);
}

.mission-card.expanded {
  box-shadow: var(--shadow-lg);
}

.mission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-xl);
  cursor: pointer;
  padding: var(--spacing-lg);
  transition: background-color var(--transition-fast);
}

.mission-header:hover {
  background-color: var(--color-gray-50);
}

.mission-info {
  flex: 1;
  min-width: 0;
}

.mission-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.mission-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  margin: 0;
}

.mission-description {
  color: var(--color-gray-600);
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-sm);
}

.mission-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
}

.meta-item i {
  color: var(--color-gray-400);
}

.mission-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.progress-indicator {
  position: relative;
}

.progress-circle {
  position: relative;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.progress-percentage {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
}

.progress-count {
  font-size: var(--font-size-xs);
  color: var(--color-gray-600);
}

.expand-btn {
  width: 40px;
  height: 40px;
  border: none;
  background-color: var(--color-gray-100);
  border-radius: var(--radius-full);
  color: var(--color-gray-600);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-btn:hover {
  background-color: var(--color-gray-200);
  color: var(--color-gray-900);
}

/* Mission Details */
.mission-details {
  padding: 0 var(--spacing-lg) var(--spacing-lg);
  border-top: 1px solid var(--color-gray-200);
}

.details-section {
  margin-top: var(--spacing-xl);
}

.details-section h4 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
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

.ai-report {
  padding: var(--spacing-lg);
  background-color: var(--color-secondary-bg);
  border-radius: var(--radius-md);
}

.sentiment-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.sentiment-keyword {
  padding: var(--spacing-xs) var(--spacing-md);
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-full);
  color: var(--color-gray-800);
  font-weight: var(--font-weight-medium);
}

.ai-overview {
  color: var(--color-gray-700);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.submissions-preview {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.submission-item {
  padding: var(--spacing-md);
  background-color: var(--color-gray-50);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-primary);
}

.submission-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.submission-tester {
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  font-size: var(--font-size-sm);
}

.submission-date {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
}

.submission-answers {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.answer-preview {
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
  line-height: var(--line-height-relaxed);
}

.answer-preview strong {
  color: var(--color-gray-900);
}

.details-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-gray-200);
}

/* Expand Transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 2000px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-container {
    padding: var(--spacing-lg);
    padding-top: 80px;
  }

  .dashboard-header {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .mission-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .mission-actions {
    width: 100%;
    justify-content: space-between;
  }

  .mission-meta {
    flex-direction: column;
    gap: var(--spacing-xs);
  }
}
</style>