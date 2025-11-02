<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { computed, onMounted, ref, watch, nextTick } from "vue"


const props = defineProps({
  show: Boolean,
  questions: Array,
  generating: Boolean,
  missionName: String,
})


const emit = defineEmits(['close', 'confirm', 'launch'])

// Create a local copy of questions that we can modify
const localQuestions = ref([])

// Watch for changes in props.questions
watch(() => props.questions, (newQuestions) => {
  if (newQuestions && newQuestions.length > 0) {
    localQuestions.value = newQuestions.map(q => ({...q}))
  }
}, { immediate: true })

const addQuestion = async () => {
  const newId = Date.now()
  localQuestions.value.push({
    id: newId,
    text: ""
  })

  // Wait for DOM to update, then scroll to and focus the new question
  await nextTick()
  const newQuestionElement = document.querySelector(`[data-question-id="${newId}"]`)
  if (newQuestionElement) {
    newQuestionElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const textarea = newQuestionElement.querySelector('textarea')
    if (textarea) {
      textarea.focus()
    }
  }
}

const removeQuestion = (id) => {
  localQuestions.value = localQuestions.value.filter(q => q.id !== id)
}

// const regenerate = () => {
//   isGenerating.value = true
//   setTimeout(() => {
//     isGenerating.value = false
//   }, 2000)
// }

// const generate = () => {
//   isGenerating.value = true
//   setTimeout(() => {
//     isGenerating.value = false
//   }, 2000)
// }

const confirm = () => {
  emit('confirm', localQuestions.value)
  emit('close')
}

const handleLaunch = () => {
  // Pass the modified questions back to parent before launching
  emit('launch', localQuestions.value)
}


computed(()=>props.show ? console.log('showing questions') : console.log("not showing questions"))


</script>

<style scoped>
.modal {
  background: rgba(0, 0, 0, 0.5);
}

.question-item {
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  transition: all 0.3s;
}

.question-item:hover {
  border-color: #0f4d26;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.btn-gradient {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
  border: none;
  color: white;
}

.question-number {
  background: #0f4d26;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}
</style>

<template>
  <div v-if="show" class="modal fade show d-block" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header text-white" style="background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);">
          <div>
            <h5 class="modal-title mb-1 text-white"><i class="fas fa-question-circle me-2"></i>AI-Generated Questions</h5>
            <small class="opacity-75">Review and customize questions for testers</small>
          </div>
          <button type="button" class="btn-close btn-close-white" @click="emit('close')"></button>
        </div>
        
        <div class="modal-body">
          <div v-if="generating" class="text-center py-5">
            <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
            <h5>Generating questions with AI...</h5>
            <p class="text-muted">Analyzing your mission description</p>
          </div>

          <template v-else>
            <div class="alert d-flex align-items-start mb-4" style="background-color: #48C564;">
              <i class="fas fa-lightbulb me-2 mt-1"></i>
              <div>
                <strong>AI Generated Questions</strong>
                <p class="mb-0 small">These questions were created based on your mission description. You can edit, remove, or add new questions.</p>
              </div>
            </div>

            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0"><i class="fas fa-list-ol me-2"></i>Questions ({{ localQuestions.length }})</h6>
                <div>
                  <!-- <button class="btn btn-sm btn-outline-secondary me-2" @click="regenerate">
                    <i class="fas fa-sync-alt me-1"></i>Regenerate
                  </button> -->
                  <button class="btn btn-sm btn-success" @click="addQuestion">
                    <i class="fas fa-plus me-1"></i>Add Question
                  </button>
                </div>
              </div>

              <div v-for="(question, index) in localQuestions" :key="question.id" class="question-item" :data-question-id="question.id">
                <div class="d-flex gap-3">
                  <div class="question-number">{{ index + 1 }}</div>

                  <div class="flex-grow-1">
                    <div class="row g-2 mb-2">
                      <div class="col-md-12">
                        <textarea
                          v-model="question.text"
                          class="form-control"
                          rows="2"
                          placeholder="Enter question text"
                        ></textarea>
                      </div>
                    </div>

                    <div class="d-flex justify-content-between align-items-center">
                      <small class="text-muted">
                      </small>
                      <button
                        class="btn btn-sm btn-outline-danger"
                        @click="removeQuestion(question.id)"
                        :disabled="localQuestions.length === 1"
                      >
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="alert alert-secondary">
              <small><i class="fas fa-info-circle me-1"></i>Testers will answer these questions after completing your mission. Their responses will help you gather structured feedback.</small>
            </div>
          </template>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost-dark" @click="emit('close')">Cancel</button>
          <button type="button" class="btn btn-gradient" @click="handleLaunch" :disabled="generating">
            <i class="fas fa-check me-2"></i>Confirm & Launch Mission
          </button>
        </div>
      </div>
    </div>
  </div>
</template>