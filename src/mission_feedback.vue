<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMissionById, submitMissionFeedback } from '@/Database/Monkey_Store'
import { getAuth } from "firebase/auth";

const route = useRoute()
const mission = ref(null)
const answers = ref([])
const isLoading = ref(true)
const router = useRouter()
const isSubmitting = ref(false)

onMounted(async () => {
  const missionId = route.params.missionId;
  mission.value = await getMissionById(missionId);

  if (mission.value && mission.value.questions) {
    answers.value = mission.value.questions.map(questionText => ({
      question: questionText,
      answer: ''
    }));
  }

  isLoading.value = false;
});

async function handleSubmit() {
  isSubmitting.value = true;
  try {
    const auth = getAuth();
    const submissionData = {
      missionId: route.params.missionId,
      testerId: auth.currentUser.uid,
      testerName: auth.currentUser.displayName,
      answers: answers.value 
    };


    await submitMissionFeedback(submissionData);
    
    alert("Feedback submitted successfully! You will now be returned to your mission list.");
    router.push('/missionList');

  } catch (error) {
    alert("There was an error submitting your feedback. Please try again.");
  } finally {
    isSubmitting.value = false; 
  }
}
</script>

<template>
  <div class="feedback-layout">
    <!-- RYAN THE DIV BLOCK IS HEREEE -->
    <div class="website-panel"> 
      <iframe 
        srcdoc="<!DOCTYPE html><html><head><style>body{display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;background-color:#f0f2f5;color:#6c757d;}h1{font-size:2rem;}</style></head><body><h1>Founder's Website Will Load Here</h1></body></html>"
        frameborder="0"
        width="100%"
        height="100%"
      ></iframe>
    </div>

    <div class="form-panel">
      <div v-if="isLoading" class="text-center p-5">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading Mission Questions...</p>
      </div>

      <div v-else class="form-content">
        <div v-if="mission">
          <div class="mission-header">
            <h3>{{ mission.name }}</h3>
            <p class="text-muted">{{ mission.description }}</p>
          </div>

          <form @submit.prevent="handleSubmit" class="feedback-form">
            <div v-for="(item, index) in answers" :key="index" class="mb-4">
              <label class="form-label fw-semibold">{{ index + 1 }}. {{ item.question }}</label>
              <textarea v-model="item.answer" class="form-control" rows="4" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary w-100" :disabled="isSubmitting">
                {{ isSubmitting ? 'Submitting...' : 'Submit Feedback' }}
            </button>
          </form>
        </div>
        <div v-else>
          <h3>Mission Not Found</h3>
          <p>Could not load mission details.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.feedback-layout {
  display: flex;
  height: calc(100vh - 80px);
  width: 100%;
}


.website-panel {
  flex: 3; 
  height: 100%;
  border-right: 1px solid #dee2e6;
}


.form-panel {
  flex: 2; 
  height: 100%;
  display: flex;
  flex-direction: column;
}

.form-content {
  padding: 1.5rem;
  overflow-y: auto;
}

.mission-header {
  padding-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;
  margin-bottom: 1.5rem;
}

.feedback-form {
  display: flex;
  flex-direction: column;
}
</style>