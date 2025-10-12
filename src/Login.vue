<script setup>
// Styles + Bootstrap
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"

// Vue / Firebase
import { ref } from "vue"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import { useRouter } from "vue-router"

// Form state
const email = ref("")
const pwd = ref("")
const loading = ref(false)
// Dialog (loading / success) state
import loadingImg from "@/assets/welcome/loading.png"
import successImg from "@/assets/welcome/green-tick.png"

const showDialog = ref(false)
const dialogMode = ref("loading")  // "loading" | "success"
const dialogText = ref("Logging in…")

const router = useRouter()

// Assets
import monkeyUrl from "@/assets/welcome/monkey.png"
import bananaUrl from "@/assets/welcome/banana.png"

function login () {
  if (loading.value) return
  loading.value = true

  // show loading dialog
  showDialog.value = true
  dialogMode.value = "loading"
  dialogText.value = "Logging in…"

  signInWithEmailAndPassword(getAuth(), email.value, pwd.value)
    .then(() => {
      // switch to success state briefly, then go Home
      dialogMode.value = "success"
      dialogText.value = "Successfully Login."
      setTimeout(() => router.replace({ path: "/Home" }), 900)
    })
    .catch((error) => {
      showDialog.value = false
      console.log(error.code)
      alert(error.message)
    })
    .finally(() => {
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
            <!-- grid container -->
            <div class="row g-0 card-grid">
              <!-- Left: mascot + copy -->
              <div class="col-lg-5">
                <section class="brand-section">
                  <img :src="monkeyUrl" alt="Monkey" class="brand-monkey" />
                  <h2 class="brand-title">
                    Welcome to<br />
                    <span>Test Monkey</span>
                  </h2>
                  <p class="brand-subtitle">
                    Create an account to continue your journey with us.
                  </p>
                </section>
              </div>

              <!-- Vertical divider on desktop -->
              <div class="v-divider d-none d-lg-block" aria-hidden="true"></div>

              <!-- Right: form -->
              <div class="col-lg-7">
                <section class="form-section">
                  <h2 class="form-title">Login</h2>

                  <form class="auth-form" @submit.prevent="login">
                    <!-- Login modal -->
                    <transition name="fade">
                      <div v-if="showDialog" class="modal-mask" role="dialog" aria-modal="true">
                        <div class="modal-card" role="status" aria-live="assertive">
                          <img
                            v-if="dialogMode === 'loading'"
                            :src="loadingImg"
                            alt="Loading"
                            class="modal-img"
                          />
                          <img
                            v-else
                            :src="successImg"
                            alt="Success"
                            class="modal-img"
                          />
                          <p class="modal-text">{{ dialogText }}</p>
                        </div>
                      </div>
                    </transition>

                    <div class="mb-3">
                      <label for="email_address" class="form-label">Email</label>
                      <input
                        type="email"
                        class="form-control"
                        id="email_address"
                        placeholder="Enter your Email"
                        v-model="email"
                        required
                      />
                    </div>

                    <div class="mb-2">
                      <label for="pwd" class="form-label">Password</label>
                      <input
                        type="password"
                        class="form-control"
                        id="pwd"
                        placeholder="Enter your Password"
                        v-model="pwd"
                        required
                      />
                    </div>

                    <p class="helper text-center mb-4">Forgot your password?</p>

                    <!-- centered button -->
                    <button
                      type="submit"
                      class="btn btn-primary btn-login"
                      :disabled="loading"
                    >
                      <span
                        v-if="loading"
                        class="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      {{ loading ? "Signing In..." : "Login" }}
                    </button>

                    <hr class="my-4" />

                    <div class="text-center">
                      <div class="text-muted mb-0">
                        Don't have an account?
                        <span
                          class="link-color fw-semibold"
                          role="button"
                          @click="router.push('/register')"
                        >
                          Sign up here
                        </span>
                      </div>
                    </div>
                  </form>
                </section>
              </div>
            </div>

            <!-- Banana sticker (bottom-right, on the card border line) -->
            <img :src="bananaUrl" alt="" class="banana-sticker" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Inter font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
:global(html), :global(body) {
  font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, "Helvetica Neue", sans-serif;
}

/* Background */
.cool-bg {
  background: linear-gradient(180deg, #0f4d26 0%, #ea8a2f 50%, #d7e86d 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Card */
.login-card {
  position: relative;
  --card-border: 1.5px; 
  background: rgba(255, 255, 255, 0.14);
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
.card-grid { position: relative; }

/* Left pane */
.brand-section {
  min-height: 100%;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;  /* vertical center */
  align-items: center;      /* horizontal center in left pane */
  text-align: center;
  color: #fff;
}
.brand-monkey {
  width: 86px;
  height: auto;
  margin-bottom: 14px;
  filter: drop-shadow(0 6px 12px rgba(0,0,0,.25));
}
.brand-title {
  font-weight: 800;
  font-size: 34px;
  line-height: 1.12;
  margin: 4px 0 8px;
  text-shadow: 0 2px 4px rgba(0,0,0,.25);
}
.brand-title span { filter: drop-shadow(0 2px 6px rgba(0,0,0,.25)); }
.brand-subtitle { max-width: 320px; opacity: .95; }

/* Divider at the boundary of col-lg-5 */
.v-divider{
  position: absolute;
  top: 24px;
  bottom: 24px;
  left: 41.666%;       
  width: 1px;
  background: rgba(255,255,255,0.8);
  border-radius: 1px;
  pointer-events: none;
}

/* Right pane */
.form-section {
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;  /* vertical center */
  align-items: center;      /* horizontal center */
}
.form-title {
  color: #ffffff;
  font-weight: 800;
  font-size: 40px;
  text-shadow: 0 2px 4px rgba(0,0,0,.25);
  margin-bottom: 12px;
}

/* Constrain form width and auto-center */
.auth-form{
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
}

/* Inputs */
.form-label { font-weight: 700; color: #1f4e1d; }
.form-control {
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 16px;
  background: #fff;
  box-shadow:
    0 3px 0 rgba(0,0,0,.25),
    0 8px 18px rgba(0,0,0,.18);
  transition: box-shadow .2s ease;
}
.form-control:focus {
  outline: none;
  box-shadow:
    0 3px 0 rgba(0,0,0,.30),
    0 10px 22px rgba(0,0,0,.22),
    0 0 0 3px rgba(35, 77, 34, 0.25);
}

/* Centered, short login button */
.btn-login {
  display: block;         
  width: 220px;           
  margin: 0 auto;          /* center horizontally */
  background: linear-gradient(180deg, #2e7d32 0%, #1b5e20 100%);
  border: none;
  border-radius: 12px;
  padding: 12px 2rem;
  font-weight: 800;
  font-size: 16px;
  color: #fff;
  box-shadow: 0 6px 0 rgba(0,0,0,.25), 0 10px 24px rgba(0,0,0,.25);
  transition: transform .15s ease, box-shadow .15s ease;
}
.btn-login:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 0 rgba(0,0,0,.25), 0 16px 30px rgba(0,0,0,.25);
}
.btn-login:disabled { opacity: .7; transform: none; }

.link-color { color: #234d22; }
.link-color:hover { cursor: pointer; text-decoration: underline; }
.helper { color: #234d22; opacity: .9; }

/* Banana sticker */
.banana-sticker{
  position: absolute;
  right: calc(-1 * var(--card-border));
  bottom: calc(-1 * var(--card-border));
  width: 86px;
  height: auto;
  opacity: .95;
  pointer-events: none;
  transform: rotate(-3deg);
  z-index: 2;
}

/* Responsive */
@media (max-width: 992px){
  .v-divider{ display:none; }
}
@media (max-width: 900px){
  .banana-sticker{ width: 66px; }
}
@media (max-width: 768px){
  .brand-section{ padding: 2rem 1.25rem; }
  .form-section{ padding: 2rem 1.25rem; }
  .brand-monkey{ width: 72px; }
  .form-title{ font-size: 32px; }
}
/* ===== Modal / Overlay for login ===== */
.modal-mask {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,.35);
  display: grid;
  place-items: center;
  z-index: 20;           /* above all in the card */
  backdrop-filter: blur(2px);
}

.modal-card {
  min-width: 220px;
  max-width: 340px;
  padding: 18px 20px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 14px 32px rgba(0,0,0,.25);
  display: grid;
  justify-items: center;
  gap: 12px;
}

.modal-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.modal-text {
  color: #2b2b2b;
  font-weight: 600;
}

/* simple fade transition */
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

</style>
