<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { ref, computed } from "vue"

import Mission_Preview from "./Mission_Preview.vue"
import { createMission, getBananaBalance, deductBananaBalance } from "../Database/Monkey_Store"
import navbar from "@/navbar.vue";
import { useRouter } from 'vue-router'
import { getAuth } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/Config/api_services'

import QuestionsModal from "./QuestionsModal.vue"
import InsufficientBalanceModal from "./InsufficientBalanceModal.vue"
import MissionSuccessModal from "./MissionSuccessModal.vue"
import { QueryFieldFilterConstraint } from "firebase/firestore"

import monkeyUrl from "@/assets/welcome/monkey.png"

const auth = getAuth()

const missionName = ref("")
const numberOfUsers = ref("")
const description = ref("")
const duration = ref("")
const bananasPayout = ref("")
const website =ref("")

const fileLoaded = ref(false)
const showPreview = ref(false)

const showQuestions = ref(false)
const generating = ref(true)
const questions = ref([])
const showInsufficientBalance = ref(false)
const currentBalance = ref(0)
const requiredAmount = ref(0)
const showSuccessModal = ref(false)

const router = useRouter()

const totalCost = computed(() => (numberOfUsers.value && bananasPayout.value) 
  ? (numberOfUsers.value * bananasPayout.value).toLocaleString() 
  : '0')

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    fileLoadSwitch()
    selectedFile.value = file
    fileName.value = file.name
    document.getElementById('fileInput').value = '' //Clear input for next use
    // console.log('log', selectedFile.value)
  }
}

async function checkMission(){
    const required = {
        'missionName': missionName.value,
        'description': description.value,
        'num_testers': numberOfUsers.value,
        'duration': duration.value,
        'payout': bananasPayout.value,
        'website': website.value
    }
    const empty = Object.entries(required).find(([k, v]) => !v)
    if (empty) {
        alert(`Please fill in: ${empty[0].replace(/([A-Z])/g, ' $1').trim()}`)
        return
    }

    // Check banana balance BEFORE generating questions
    const totalMissionCost = numberOfUsers.value * bananasPayout.value
    const balance = await getBananaBalance(auth.currentUser.uid, 'Founder')

    if (balance < totalMissionCost) {
        // Show insufficient balance modal
        currentBalance.value = balance
        requiredAmount.value = totalMissionCost
        showInsufficientBalance.value = true
        return
    }

    // If balance is sufficient, proceed with question generation
    showQuestions.value = true
    await generateQuestions()
    generating.value = false
}

function fileLoadSwitch(){
    if(fileLoaded.value){
        fileLoaded.value = false
    } else{
        fileLoaded.value = true
    }
}

async function generateQuestions(){
    try {
        const generateMissionQuestions = httpsCallable(functions, 'generateMissionQuestions')
        const result = await generateMissionQuestions({
            description: description.value,
            website: website.value
        })

        if (result.data.error) {
            console.error('Error generating questions:', result.data.error)
            alert('Failed to generate questions. Please try again.')
            return
        }

        const questions_arr = result.data.questions
        const new_arr = []
        for(var index in questions_arr){
            new_arr.push({id:index,text:questions_arr[index]})
        }
        questions.value = new_arr
        generating.value = false
    } catch (error) {
        console.error('Error calling Cloud Function:', error)
        alert('Failed to generate questions. Please try again.')
        generating.value = false
    }
}

async function launchMission(updatedQuestions){
      // Use the updated questions from the modal
      if (updatedQuestions) {
        questions.value = updatedQuestions
      }

      console.log(questions.value)

      // Calculate total cost
      const totalMissionCost = numberOfUsers.value * bananasPayout.value

      try {
        //Convert questions object to plain array
        const mission_questions_array = []
        for(var index in questions.value){
          mission_questions_array.push(questions.value[index].text)
        }

        const required = {
          'missionName': missionName.value,
          'description': description.value,
          'num_testers': numberOfUsers.value,
          'duration': duration.value,
          'payout': bananasPayout.value,
          'website': website.value,
          'questions': mission_questions_array
        }

        // Create mission
        await createMission(required)

        // Deduct bananas from founder account
        await deductBananaBalance(auth.currentUser.uid, totalMissionCost)

        // Show success modal
        showSuccessModal.value = true

      } catch (error) {
        console.error('Error creating mission:', error)
        alert('Failed to create mission. Please try again.')
      }
}


function reset(){
  missionName.value = ""
  numberOfUsers.value = ""
  description.value = ""
  duration.value = ""
  bananasPayout.value = ""
  website.value = ""

  fileLoaded.value = false
  showPreview.value = false

  showQuestions.value = false
  generating.value = false
  questions.value = []
  showInsufficientBalance.value = false
  currentBalance.value = 0
  requiredAmount.value = 0
  showSuccessModal.value = false
}

</script>


<template>
  <navbar/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <div class="min-vh-100 page">
    <!-- Header -->
    <div class="hero-header" style="padding-top: 100px;">
      <div class="container-fluid header-flex">
        <img :src="monkeyUrl" alt="Monkey" class="brand-monkey" />
        <div class="header-text">
          <h1><i class="me-2"></i>Create New Mission</h1>
          <p class="opacity-75 mb-0">Set up a testing mission for your web application</p>
        </div>
      </div>
    </div>

    <div class="container py-4">
      <div class="row g-4">
        <!-- Main Form -->
        <div class="col-lg-8">
          <div class="card shadow-sm border-0 rounded-4 mb-4 card-style">
            <div class="card-body p-4">
              <h5 class="card-title mb-4 form-title"><i class="fas fa-info-circle text-primary me-2"></i>Basic Information</h5>
              
              <div class="mb-3">
                <label for="missionName" class="form-label fw-semibold">
                  <i class="fas fa-file-signature me-2"></i>Mission Name <span class="text-danger">*</span>
                </label>
                <input
                  type="text"
                  class="form-control form-control-lg"
                  id="missionName"
                  placeholder="e.g. Mobile App Checkout Flow Test"
                  v-model="missionName"
                  maxlength="100"
                >
              </div>

              <div class="mb-3">
                <label for="description" class="form-label fw-semibold">
                  <i class="fas fa-align-left me-2"></i>Description <span class="text-danger">*</span>
                </label>
                <textarea
                  class="form-control"
                  id="description"
                  rows="5"
                  placeholder="Describe what testers should focus on... Be specific about the features to test, user flows, or issues you want identified."
                  v-model="description"
                  maxlength="1000"
                ></textarea>
                <div class="d-flex justify-content-between mt-1">
                  <small class="text-muted">Be clear and specific to get better feedback</small>
                  <small class="text-muted">{{ description.length }}/1000</small>
                </div>
              </div>

              <div class="row g-3">
                <div class="col-md-6">
                  <label for="numberOfUsers" class="form-label fw-semibold"><i class="fas fa-users me-2"></i>Number of Testers <span class="text-danger">*</span></label>
                  <input type="number" class="form-control" id="numberOfUsers" placeholder="e.g. 50" min="1" v-model="numberOfUsers">
                </div>
                <div class="col-md-6">
                  <label for="duration" class="form-label fw-semibold"><i class="fas fa-clock me-2"></i>Duration <span class="text-danger">*</span></label>
                  <select class="form-select" id="duration" v-model="duration">
                    <option value="">Select duration</option>
                    <option value="1">1 Day</option>
                    <option value="3">3 Days</option>
                    <option value="7">1 Week</option>
                    <option value="14">2 Weeks</option>
                    <option value="30">1 Month</option>
                  </select>
                </div>
              </div>

              <div class="mt-3">
                <label for="bananasPayout" class="form-label fw-semibold">
                  <i class="fas fa-coins me-2"></i>Bananas Per Tester <span class="text-danger">*</span>
                </label>
                <input type="number" class="form-control banana-input" id="bananasPayout" placeholder="e.g. 7" min="1" v-model="bananasPayout">
                <small class="text-muted">Each tester will receive this amount upon mission completion</small>
              </div>

              <div class="alert alert-warning d-flex align-items-start mt-3 border-0 shadow-sm" role="alert">
                <i class="fas fa-lightbulb me-2 mt-1 fs-5"></i>
                <div>
                  <strong>Pricing Guide:</strong>
                  <div class="mt-1 small">
                    💡 Recommended: <strong>5-10 bananas</strong> per tester<br>
                    💰 100 bananas ≈ $10 SGD<br>
                    ⚡ Quick tasks: 5 bananas | Complex tasks: 10+ bananas
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Website Link -->
          <div class="card shadow-sm border-0 rounded-4 card-style">
            <div class="card-body p-4">
              <h5 class="card-title mb-4 form-title">
                <i class="fas fa-link text-primary me-2"></i>Website to Test
              </h5>
              <div class="mb-3">
                <label for="websiteLink" class="form-label fw-semibold">
                  <i class="fas fa-globe me-2"></i>Website URL <span class="text-danger">*</span>
                </label>
                <div class="input-group input-group-lg">
                  <span class="input-group-text bg-white">
                    <i class="fas fa-external-link-alt text-muted"></i>
                  </span>
                  <input
                    type="url"
                    class="form-control"
                    id="websiteLink"
                    placeholder="https://www.example.com"
                    v-model="website"
                  >
                </div>
                <small class="text-muted">Enter the complete URL including https://</small>
              </div>

              <div class="alert alert-info border-0 shadow-sm d-flex align-items-start" role="alert">
                <i class="fas fa-info-circle me-2 mt-1"></i>
                <div class="small">
                  <strong>AI-Powered Questions:</strong> Our AI will automatically generate relevant testing questions based on your mission description and website.
                </div>
              </div>
              <!-- <h5 class="card-title mb-4"><i class="fas fa-upload text-primary me-2"></i>Upload Test Page</h5>
              
              <div class="btn-group w-100 mb-3" role="group">
                <input type="radio" class="btn-check" name="fileType" id="htmlType" value="html" v-model="fileType" checked>
                <label class="btn btn-outline btn-custom" for="htmlType"><i class="fab fa-html5 me-2"></i>HTML</label>
                <input type="radio" class="btn-check" name="fileType" id="jsType" value="js" v-model="fileType">
                <label class="btn btn-outline btn-custom" for="jsType"><i class="fab fa-js me-2"></i>JavaScript</label>
              </div>

              <div  :class="['file-upload', { active: fileLoaded }]" @click="$refs.fileInput.click()">
                <input ref="fileInput" id="fileInput" type="file" class="d-none" :disabled="fileLoaded" :accept="fileType === 'html' ? '.html,.htm' : '.js'" @change="handleFileUpload">
                <i :class="fileLoaded ? 'fas fa-check-circle text-success' : 'fas fa-cloud-upload-alt text-muted'" style="font-size: 3rem;"></i>
                <h5 class="mt-3" >{{ fileLoaded ? 'File Ready' : 'Drag & Drop or Click to Upload' }}</h5>
                <p class="text-muted mb-0">{{ fileType === 'html' ? 'HTML' : 'JavaScript' }} files only (Max 10MB)</p>
              </div>

              <div v-if="fileLoaded" class="d-flex justify-content-between align-items-center bg-light rounded p-3 mt-3">
                <div><i :class="fileType === 'html' ? 'fab fa-html5' : 'fab fa-js'" class="me-2 fs-4"></i><strong>{{ fileName }}</strong></div>
                <button class="btn btn-sm btn-danger px-3" @click="()=>{
                    selectedFile.value = 
                    fileLoadSwitch()
                    fileName = ''
                } ">X</button>
              </div>

              <div class="alert alert-secondary d-flex align-items-start mt-3 security" role="alert">
                <i class="fas fa-shield-alt me-2 mt-1"></i>
                <div><strong>Security:</strong> Your code is securely stored and sandboxed during testing.</div>
              </div> -->
            </div>
          </div>
        </div>

        <!-- Summary Sidebar -->
        <div class="col-lg-4">
          <div class="card shadow-sm border-0 rounded-4 sticky-top summary-style" style="top: 5rem;">
            <div class="card-body p-4">
              <h5 class="card-title mb-4 form-title">
                <i class="fas fa-receipt text-primary me-2"></i>Mission Summary
              </h5>

              <div class="summary-box p-3 mb-3">
                <div class="summary-item">
                  <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-users text-primary me-2"></i>
                    <span class="text-muted small">Number of Testers</span>
                  </div>
                  <div class="fs-4 fw-bold">{{ numberOfUsers || '0' }}</div>
                </div>

                <div class="summary-divider"></div>

                <div class="summary-item">
                  <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-clock text-primary me-2"></i>
                    <span class="text-muted small">Duration</span>
                  </div>
                  <div class="fs-4 fw-bold">{{ duration ? duration + (duration == 1 ? ' Day' : ' Days') : 'Not set' }}</div>
                </div>

                <div class="summary-divider"></div>

                <div class="summary-item">
                  <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-coins text-warning me-2"></i>
                    <span class="text-muted small">Bananas per Tester</span>
                  </div>
                  <div class="fs-4 fw-bold">{{ bananasPayout || '0' }} 🍌</div>
                </div>
              </div>

              <div class="total-cost-box text-center p-4 mb-3">
                <div class="text-white-50 small mb-1">TOTAL COST</div>
                <div class="display-5 fw-bold text-white mb-0">🍌 {{ totalCost }}</div>
                <div class="text-white-50 small mt-2">
                  ≈ ${{ ((numberOfUsers || 0) * (bananasPayout || 0) * 0.1).toFixed(2) }} SGD
                </div>
              </div>

              <div class="alert alert-success border-0 shadow-sm mb-3" role="alert">
                <div class="d-flex align-items-start">
                  <i class="fas fa-magic me-2 mt-1"></i>
                  <small>Bananas will be distributed automatically when testers complete your mission.</small>
                </div>
              </div>

              <div class="d-grid gap-2">
                <button class="btn btn-outline-success btn-lg" @click="showPreview = true">
                  <i class="fas fa-eye me-2"></i>Preview Mission
                </button>
                <button class="btn btn-gradient btn-lg fw-bold" @click="checkMission">
                  <i class="fas fa-rocket me-2"></i>Launch Mission
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Mission_Preview 
      :show="showPreview"
      :missionName="missionName"
      :description="description"
      :numberOfUsers="numberOfUsers"
      :duration="duration"
      :bananasPayout="bananasPayout"
      :totalCost="totalCost"
      :website="website"
      @close="showPreview = false"
      @launch="{{showPreview = false; checkMission()}}"
    />
    <QuestionsModal
    :show="showQuestions"
    :generating="generating"
    :questions="questions"
    @close="{{ showQuestions = false; generating = true; questions = [] }}"
    @launch="launchMission"/>

    <InsufficientBalanceModal
      :show="showInsufficientBalance"
      :currentBalance="currentBalance"
      :requiredAmount="requiredAmount"
      @close="showInsufficientBalance = false"
    />

    <MissionSuccessModal
      :show="showSuccessModal"
      :missionName="missionName"
      :totalCost="totalCost"
      @close="{{ showSuccessModal = false; reset() }}"
    />
  </div>
</template>

<style scoped>
.page{
  background: linear-gradient(to top, #0f4d26 7%, #F97A02 26%, #FC9D05 54%, #FDC955 77%, #ABD453 90%);
}

.header-text h1{
  color: #0A490A;
  font-weight: bold;
  font-size: 60px;
  margin-bottom: 0.2rem;
}

.header-text p{
  color: black;
  margin-top: 0;
  margin-left: 15px;
}

.brand-monkey{
  width: 150px;
  height: auto;
  margin-left: 20px;
  filter: drop-shadow(0 6px 12px rgba(0,0,0,.25));
}

.header-flex{
  display: flex;
  align-items: center;
}

.header-text{
  display: flex;
  flex-direction: column;
  padding: 25px 0;
  margin-left: 10px;
}

.card-style{
  position: relative;
  --card-border: 1.5px; 
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border: var(--card-border) solid rgba(255, 255, 255, 0.45);
  box-shadow:
  0 18px 40px rgba(0, 0, 0, 0.30),
  inset 0 0 50px rgba(255, 255, 255, 0.18);
  border-radius: 22px;
  overflow: hidden;
  max-width: 980px;
  width: 100%;
  margin: 0 auto;
}

.summary-style{
  --card-border: 1.5px; 
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border: var(--card-border) solid rgba(255, 255, 255, 0.45);
  box-shadow:
  0 18px 40px rgba(0, 0, 0, 0.30),
  inset 0 0 50px rgba(255, 255, 255, 0.18);
  border-radius: 22px;
  overflow: hidden;
  max-width: 980px;
  width: 100%;
  margin: 0 auto;
}

.form-title{
  font-weight: bold;
  color: #0A490A;
  font-size: 23px;
}

.form-control{
  border-radius: 20px;
  box-shadow: 0 2px 0 rgba(0,0,0,.15), 0 6px 12px rgba(0,0,0,.15);

}

.btn-custom{
  color: black;             
  background-color: white;     
  transition: all 0.3s ease;
  border-radius: 10px;
  font-weight: bold;
}

.btn-custom:hover {
  background-color:rgb(222, 222, 222);
  color: black;
}

.btn-check:checked + .btn-custom {
  background-color:#0A490AC7;
  color: white;
}

.security{
  background-color: white;
}

.hero-header {
  padding-bottom:10px;
}

.form-control:focus, .form-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.25rem rgba(102, 126, 234, 0.25);
}

.file-upload {
  border: 2px dashed #cbd5e0;
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s;
}

.file-upload:hover { border-color: #667eea; background: #f0f4ff; }
.file-upload.active { border-color: #48bb78; background: #f0fff4; border-style: solid; }

.banana-input {
  padding-left: 3rem !important;
  background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text x="2" y="18" font-size="16">🍌</text></svg>');
  background-repeat: no-repeat;
  background-position: 12px center;
  background-size: 20px;
}

.btn-gradient {
  background: #0A490AEB;
  border: none;
  color: white;
}

.btn-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  color: white;
}

.total-cost-box {
  background: linear-gradient(135deg, #0A490A 0%, #0f5a0f 100%);
  color: white;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(10, 73, 10, 0.3);
}

.summary-box {
  background: #f8f9fa;
  border-radius: 1rem;
  border: 1px solid #e9ecef;
}

.summary-item {
  padding: 0.5rem 0;
}

.summary-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #dee2e6, transparent);
  margin: 0.75rem 0;
}

.form-control-lg {
  border-radius: 0.75rem;
}

.input-group-text {
  border-radius: 0.75rem 0 0 0.75rem;
  border: 1px solid #ced4da;
}

.input-group .form-control {
  border-radius: 0 0.75rem 0.75rem 0;
}
</style>