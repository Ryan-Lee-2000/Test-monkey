<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter, useRoute } from 'vue-router'
import { onMounted, ref } from "vue";


const router = useRouter()
const isLoading = ref(true)
const showWelcome = ref(false)

onMounted(() => {
  const auth = getAuth();
  if(auth.currentUser != null){
    showWelcome.value = false
    isLoading.value = true
    router.push({path: '/Home'})
  } else{
    showWelcome.value = true
    isLoading.value = false
  }
})



</script>

<template>
  <div v-if="isLoading" class="hero-section">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12">
          <div class="welcome-card">
            <div class="app-icon">
              <div class="spinner-border text-white" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            <h1 class="app-title">Firebase Tester</h1>
            <p class="app-subtitle">Checking authentication status...</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="showWelcome" class="hero-section">
    <!-- Floating background elements -->
     <div class="w-100 p-5">
      <div class="floating-elements">
        <div class="floating-circle circle-1"></div>
        <div class="floating-circle circle-2"></div>
        <div class="floating-circle circle-3"></div>
      </div>
      
      <div class="container justify-content-centerr" style="margin: auto;">
        <div class="row justify-content-center">
          <div class="col-12">
            <div class="welcome-card">
              <!-- App Icon -->
              <div class="app-icon">
                <i class="fas fa-rocket"></i>
              </div>
              
              <!-- Main Content -->
              <h1 class="app-title">Firebase Tester</h1>
              <p class="app-subtitle">
                Experience seamless authentication and real-time data management with our powerful Firebase integration platform.
              </p>
              
              <!-- Action Buttons -->
              <div class="action-buttons">
                <RouterLink to="/Login" class="btn-custom btn-primary-custom">
                  <i class="fas fa-sign-in-alt"></i>
                  Sign In
                </RouterLink>
                <RouterLink to="/register" class="btn-custom btn-outline-custom">
                  <i class="fas fa-user-plus"></i>
                  Create Account
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
    position: relative;
    overflow: hidden;
}

.hero-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="50" cy="10" r="1" fill="%23ffffff" opacity="0.05"/><circle cx="20" cy="80" r="1" fill="%23ffffff" opacity="0.05"/><circle cx="80" cy="30" r="1" fill="%23ffffff" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    pointer-events: none;
}

.welcome-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    border-radius: 24px;
    padding: 3rem 2rem;
    max-width: 600px;
    width: 100%;
    text-align: center;
    position: relative;
    z-index: 1;
    animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.app-icon {
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 2rem;
    font-size: 3rem;
    color: white;
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
}

.app-title {
    font-size: 3.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 1rem;
    line-height: 1.2;
}

.app-subtitle {
    font-size: 1.25rem;
    color: #6c757d;
    margin-bottom: 2.5rem;
    font-weight: 400;
    line-height: 1.5;
}

.action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 2rem;
}

.btn-custom {
    padding: 12px 2rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 16px;
    text-decoration: none;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    min-width: 140px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.btn-primary-custom {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-primary-custom:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    color: white;
}

.btn-outline-custom {
    background: transparent;
    color: #667eea;
    border: 2px solid #667eea;
}

.btn-outline-custom:hover {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.features-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.feature-item {
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
}

.floating-elements {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    overflow: hidden;
}

.floating-circle {
    position: absolute;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    animation: float 6s ease-in-out infinite;
}

.circle-1 {
    width: 60px;
    height: 60px;
    top: 20%;
    left: 10%;
    animation-delay: 0s;
}

.circle-2 {
    width: 100px;
    height: 100px;
    top: 60%;
    right: 15%;
    animation-delay: 2s;
}

.circle-3 {
    width: 40px;
    height: 40px;
    bottom: 30%;
    left: 20%;
    animation-delay: 4s;
}

@keyframes float {
    0%, 100% {
        transform: translateY(0) rotate(0deg);
    }
    50% {
        transform: translateY(-20px) rotate(180deg);
    }
}

@media (max-width: 768px) {
    .welcome-card {
        margin: 1rem;
        padding: 2rem 1.5rem;
    }
    
    .app-title {
        font-size: 2.5rem;
    }
    
    .app-subtitle {
        font-size: 1.1rem;
    }
    
    .action-buttons {
        flex-direction: column;
        align-items: center;
    }
    
    .btn-custom {
        width: 100%;
        max-width: 280px;
    }
    
    .app-icon {
        width: 80px;
        height: 80px;
        font-size: 2.5rem;
    }
}

@media (max-width: 576px) {
    .features-list {
        flex-direction: column;
        align-items: center;
    }
    
    .feature-item {
        width: fit-content;
    }
}
</style>