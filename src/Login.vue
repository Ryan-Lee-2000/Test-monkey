<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { ref } from "vue"
import { getAuth, signInWithEmailAndPassword , updateProfile} from "firebase/auth"
import { useRouter, useRoute } from 'vue-router'

const email = ref("")
const pwd = ref("")
const loading = ref(false)
const router = useRouter()

function login(){
    loading.value = true
    signInWithEmailAndPassword(getAuth(), email.value, pwd.value).then((userCredential) =>{
        router.replace({path: '/Home'})
    }).catch((error) =>{
        console.log(error.code)
        alert(error.message)
    }).finally(() => {
        loading.value = false
    })
}
</script>



<template>
  <div class="cool-bg">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12">
          <div class="login-card">
            <div class="row g-0">
              <!-- Brand Section -->
              <div class="col-lg-5 d-none d-lg-flex">
                <div class="brand-section">
                  <div class="brand-icon">
                    <i class="fas fa-user-shield" style="font-size: inherit;"></i>
                  </div>
                  <h2 class="mb-3">Welcome Back!</h2>
                  <p class="mb-0 opacity-75">
                    Sign in to your account to continue your journey with us.
                  </p>
                </div>
              </div>
              
              <!-- Form Section -->
              <div class="col-lg-7">
                <div class="form-section">
                  <!-- Mobile brand header -->
                  <div class="d-lg-none text-center mb-4">
                    <div class="brand-icon mx-auto mb-3" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                      <i class="fas fa-user-shield" style="font-size: inherit;"></i>
                    </div>
                    <h2 class="text-primary mb-2">Welcome Back!</h2>
                    <p class="text-muted">Sign in to your account</p>
                  </div>
                  
                  <!-- Desktop header -->
                  <div class="d-none d-lg-block mb-4">
                    <h2 class="text-primary mb-2">Sign In</h2>
                    <p class="text-muted">Enter your credentials to access your account</p>
                  </div>
                  
                  <form @submit.prevent="login">
                    <div class="mb-3">
                      <label for="email_address" class="form-label">
                        <i class="fas fa-envelope me-2"></i>Email Address
                      </label>
                      <input
                        type="email"
                        class="form-control"
                        name="email_address"
                        id="email_address"
                        placeholder="Enter your email"
                        v-model="email"
                        required
                      />
                    </div>
                    
                    <div class="mb-4">
                      <label for="pwd" class="form-label">
                        <i class="fas fa-lock me-2"></i>Password
                      </label>
                      <input
                        type="password"
                        class="form-control"
                        name="pwd"
                        id="pwd"
                        placeholder="Enter your password"
                        v-model="pwd"
                        required
                      />
                    </div>
                    
                    <label class="mb-3 form-check" style="width: fit-content;" role="button" for="remember">
                      <input type="checkbox" class="form-check-input" id="remember" role="button">
                      <label class="form-check-label" for="remember" role="button">
                        Remember me
                      </label>
                    </label>
                    
                    <button
                      type="submit"
                      class="btn btn-primary btn-login"
                      :disabled="loading"
                    >
                      <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                      {{ loading ? 'Signing In...' : 'Sign In' }}
                    </button>
                    
                    <div class="text-center mt-3">
                      <p class="text-decoration-none link-color">Forgot your password?</p>
                    </div>
                    
                    <hr class="my-4">
                    
                    <div class="text-center">
                      <p class="text-muted mb-0">
                        Don't have an account? 
                        <p @click="router.push('/register')" class="text-decoration-none fw-semibold link-color">Sign up here</p>
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cool-bg {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.login-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border-radius: 20px;
    overflow: hidden;
    max-width: 900px;
    width: 100%;
}

.brand-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 3rem 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 400px;
}

.brand-icon {
    width: 80px;
    height: 80px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    font-size: 2rem;
}

.form-section {
    padding: 3rem 2rem;
}

.form-control {
    border: 2px solid #e9ecef;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 16px;
    transition: all 0.3s ease;
}

.form-control:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.form-label {
    font-weight: 600;
    color: #495057;
    margin-bottom: 8px;
}

.btn-login {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 12px;
    padding: 12px 2rem;
    font-weight: 600;
    font-size: 16px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    width: 100%;
}

.btn-login:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-login:disabled {
    opacity: 0.7;
    transform: none;
}


.link-color{
    color: #764ba2;
}

.link-color:hover{
    cursor:pointer;
}

.spinner-border-sm {
    width: 1rem;
    height: 1rem;
}

@media (max-width: 768px) {
    .brand-section {
        padding: 2rem 1rem;
        min-height: 200px;
    }
    
    .form-section {
        padding: 2rem 1rem;
    }
    
    .brand-icon {
        width: 60px;
        height: 60px;
        font-size: 1.5rem;
    }
}
</style>