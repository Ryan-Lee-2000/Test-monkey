<script setup>
import { ref, onMounted } from 'vue';
import { getCompletedMissionsForFounder } from '@/Database/Monkey_Store';
import navbar from './navbar.vue';

const missions = ref([]);
const isLoading = ref(true);

onMounted(async () => {
  missions.value = await getCompletedMissionsForFounder();
  isLoading.value = false;
});
</script>

<template>
  <navbar/>
  <div class="container mt-5" style="padding-top: 80px;">
    <h1 class="mb-4">Founder Dashboard</h1>
    <p class="text-muted">Review the AI-generated summaries for your completed missions.</p>

    <div v-if="isLoading" class="text-center">
      <div class="spinner-border" role="status"></div>
      <p class="mt-2">Loading completed missions...</p>
    </div>

    <div v-else-if="missions.length === 0" class="alert alert-info">
      You have no completed missions with summaries yet.
    </div>

    <div v-else class="accordion" id="missionAccordion">
      <div v-for="mission in missions" :key="mission.id" class="accordion-item">
        <h2 class="accordion-header" :id="'heading-' + mission.id">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" :data-bs-target="'#collapse-' + mission.id">
            <strong>{{ mission.name }}</strong>
          </button>
        </h2>
        <div :id="'collapse-' + mission.id" class="accordion-collapse collapse" data-bs-parent="#missionAccordion">
          <div class="accordion-body">
            <h5>AI Feedback Summary:</h5>
            <div class="summary-content" v-html="mission.feedbackSummary?.replace(/\n/g, '<br>') || 'No summary available.'"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summary-content {
  background-color: #f8f9fa;
  border-left: 4px solid #667eea;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap; 
}
</style>