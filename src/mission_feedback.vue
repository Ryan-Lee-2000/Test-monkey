<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMissionById, submitMissionFeedback,retrieveFile } from '@/Database/Monkey_Store'
import { getAuth } from "firebase/auth";
import navbar from './navbar.vue';

const route = useRoute()
const mission = ref(null)
const answers = ref([])
const isLoading = ref(true)
const router = useRouter()
const isSubmitting = ref(false)

const showMoreDescription = ref(false)

const fileUrl = ref('') // Add this for the iframe URL

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
  fileUrl.value = await retrieveFile(missionId)
  console.log('fileUrl',fileUrl.value)
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
  <div class="min-vh-100 bg-light" >
    <navbar/>
    <div class="feedback-layout">
      <div class="website-panel"> 
        <iframe 
          v-if="fileUrl"
          :src="fileUrl"
          sandbox="allow-scripts allow-forms"
          frameborder="0"
          width="100%"
          height="100%"
        ></iframe>
        <iframe 
          v-else
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
              <div>
                <p class="text-muted description-text" :class="{ expanded: showMoreDescription }">
                  {{ mission.description }}
                </p>
                <p class="text-decoration-none fw-semibold link-color" style="cursor:pointer;" @click="showMoreDescription = !showMoreDescription">
                  {{ showMoreDescription ? 'show less' : 'show more' }}
                </p>
              </div>
            </div>

            <form @submit.prevent="handleSubmit" class="feedback-form">
              <div v-for="(item, index) in answers" :key="index" class="mb-4">
                <label class="form-label fw-semibold">{{ index + 1 }}. {{ item.question }} <span class="text-danger">*</span></label>
                <textarea v-model="item.answer" class="form-control" rows="4" required 
                placeholder="Type your answer here..."></textarea>
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
  </div>
  
</template>

<style scoped>
.feedback-layout {
  display: flex;
  height: 100vh;
  border: 1px black solid;
  width: 100%;
}

.website-panel {
  flex: 3; 
  height: 100%;
  padding-top: 40px;
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
  padding-top: 40px;
  padding-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;
  margin-bottom: 1.5rem;
}

.feedback-form {
  display: flex;
  flex-direction: column;
}

.description-text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 4;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  max-height: 6em;
  transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.description-text.expanded {
  display: block;
  -webkit-line-clamp: unset;
  max-height: 100vh;
}

.link-color {
  color: #764ba2;
}

.link-color i {
  transition: transform 0.3s ease;
}
</style>