<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMissionById, submitMissionFeedback,retrieveFile } from '@/Database/Monkey_Store'
import { getAuth } from "firebase/auth";
import navbar from './navbar.vue';
import { useAlert } from '@/composables/useAlert';

const route = useRoute()
const mission = ref(null)
const answers = ref([])
const isLoading = ref(true)
const router = useRouter()
const isSubmitting = ref(false)
const { showSuccess, showError } = useAlert()

const showMoreDescription = ref(false)

const website_view = ref('') // Add this for the iframe URL
const website_link = ref('')

onMounted(async () => {
  const missionId = route.params.missionId;
  const mission_data = await getMissionById(missionId);

  website_link.value = mission_data.website

  mission.value = mission_data

  if (mission.value && mission.value.questions) {
    answers.value = mission.value.questions.map(questionText => ({
      question: questionText,
      answer: ''
    }));
  }

  isLoading.value = false;
  //website_view.value = await retrieveFile(missionId)

  
  console.log('fileUrl',website_view.value)
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

    showSuccess("Feedback submitted successfully! You will now be returned to your mission list.", "Submission Complete");
    setTimeout(() => {
      router.push('/missionList');
    }, 1500);

  } catch (error) {
    showError("There was an error submitting your feedback. Please try again.", "Submission Failed");
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="page" style="height: fit-content;">
    <navbar/>
    <div class="feedback-layout">
      <!-- Website Preview Panel -->
      <div class="website-panel">
        <iframe
          v-if="website_link"
          :src="website_link"
          sandbox="allow-scripts allow-forms"
          frameborder="0"
          width="100%"
          height="100%"
        ></iframe>
        <iframe
          v-else
          srcdoc="<!DOCTYPE html><html><head><style>body{display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;}h1{font-size:2rem;text-align:center;padding:2rem;}</style></head><body><h1>🌐 Founder's Website Will Load Here</h1></body></html>"
          frameborder="0"
          width="100%"
          height="100%"
        ></iframe>
      </div>

      <!-- Feedback Form Panel -->
      <div class="form-panel">
        <div v-if="isLoading" class="text-center p-5">
          <div class="spinner-border text-success" style="width: 3rem; height: 3rem;" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3 fw-bold text-dark">Loading Mission Questions...</p>
        </div>

        <div v-else class="form-content">
          <div v-if="mission">
            <!-- Mission Header Card -->
            <div class="mission-header-card">
              <h3 class="mission-title">{{ mission.name }}</h3>
              <div>
                <p class="description-text" :class="{ expanded: showMoreDescription }">
                  {{ mission.description }}
                </p>
                <button
                  class="btn btn-link p-0 link-color text-decoration-none fw-semibold"
                  @click="showMoreDescription = !showMoreDescription"
                >
                  {{ showMoreDescription ? '▲ show less' : '▼ show more' }}
                </button>
              </div>

              <!-- Mission Info Badges -->
              <div class="d-flex gap-2 mt-3 flex-wrap">
                <span class="badge badge-custom bg-success">
                  <i class="fas fa-coins me-1"></i>🍌 {{ mission.payout }} Bananas
                </span>
                <span class="badge badge-custom bg-primary">
                  <i class="fas fa-clock me-1"></i>{{ mission.duration }} days
                </span>
              </div>
            </div>

            <!-- Feedback Form -->
            <form @submit.prevent="handleSubmit" class="feedback-form">
              <div v-for="(item, index) in answers" :key="index" class="question-card">
                <label class="question-label">
                  <span class="question-number">Q{{ index + 1 }}</span>
                  {{ item.question }}
                  <span class="text-danger">*</span>
                </label>
                <textarea
                  v-model="item.answer"
                  class="form-control answer-textarea"
                  rows="4"
                  required
                  placeholder="Share your detailed feedback here..."
                ></textarea>
              </div>

              <button
                type="submit"
                class="btn btn-submit w-100"
                :disabled="isSubmitting"
              >
                <i class="fas fa-paper-plane me-2"></i>
                {{ isSubmitting ? 'Submitting...' : 'Submit Feedback' }}
              </button>
            </form>
          </div>
          <div v-else class="text-center py-5">
            <i class="fas fa-exclamation-circle text-danger mb-3" style="font-size: 3rem;"></i>
            <h3 class="text-dark">Mission Not Found</h3>
            <p class="text-muted">Could not load mission details.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Main Layout */
.page {
  width: 100%;
  min-height: 100dvh;
}

.feedback-layout {
  display: flex;
  height: calc(100dvh - 80px);
  width: 100%;
  margin-top: 80px;
  overflow: hidden;
  
}

/* Website Preview Panel */
.website-panel {
  flex: 3;
  height: 100%;
  border-right: 3px solid #0f4d26;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  position: relative;
}

.website-panel iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

/* Form Panel */
.form-panel {
  flex: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Custom scrollbar for form panel */
.form-panel::-webkit-scrollbar {
  width: 12px;
}

.form-panel::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.form-panel::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
  border-radius: 10px;
}

.form-panel::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
}

.form-content {
  padding: 2rem;
  flex: 1;
}

/* Mission Header Card */
.mission-header-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 3px solid #0f4d26;
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.25), 0 10px 24px rgba(0, 0, 0, 0.25);
}

.mission-title {
  color: #0A490A;
  font-weight: bold;
  font-size: 1.75rem;
  margin-bottom: 1rem;
}

.description-text {
  color: #495057;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  max-height: 4.8em;
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.description-text.expanded {
  display: block;
  -webkit-line-clamp: unset;
  line-clamp: unset;
  max-height: 100vh;
}

.link-color {
  color: #764ba2;
  font-size: 0.9rem;
}

.link-color:hover {
  color: #0A490A;
}

.badge-custom {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  border-radius: 50px;
  font-weight: 600;
}

/* Feedback Form */
.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 3px solid #0f4d26;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.25), 0 10px 24px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.25), 0 12px 28px rgba(0, 0, 0, 0.3);
}

.question-label {
  display: block;
  color: #0A490A;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.question-number {
  display: inline-block;
  background: #0A490A;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.9rem;
  margin-right: 0.5rem;
  font-weight: bold;
}

.answer-textarea {
  border-radius: 15px;
  border: 2px solid #dee2e6;
  padding: 0.75rem;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  resize: vertical;
}

.answer-textarea:focus {
  border-color: #0A490A;
  box-shadow: 0 0 0 0.25rem rgba(10, 73, 10, 0.15);
  outline: none;
}

/* Submit Button */
.btn-submit {
  background: #0A490A;
  border: none;
  color: white;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 15px;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.25), 0 10px 24px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-top: 1rem;
}

.btn-submit:hover:not(:disabled) {
  background: #0f5a0f;
  transform: translateY(-2px);
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.25), 0 12px 28px rgba(0, 0, 0, 0.3);
}

.btn-submit:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.25), 0 6px 16px rgba(0, 0, 0, 0.25);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 768px) {
  .page {
    position: relative;
    height: auto;
    min-height: 100dvh;
  }

  .feedback-layout {
    flex-direction: column;
    height: auto;
    min-height: calc(100dvh - 70px);
    overflow: visible;
  }

  .website-panel {
    height: 60vh;
    min-height: 400px;
    border-right: none;
    border-bottom: 3px solid #ff7700;
    position: relative;
  }

  .form-panel {
    height: auto;
    overflow-y: visible;
    overflow-x: hidden;
  }

  .form-content {
    padding: 1.5rem;
  }
}

/* Loading State */
.spinner-border {
  border-width: 0.3rem;
}
</style>