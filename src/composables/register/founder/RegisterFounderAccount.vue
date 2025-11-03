<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import RegistrationModal from "../RegistrationModal.vue"

import monkeyUrl from "@/assets/welcome/monkey.png"
import bananaUrl from "@/assets/welcome/banana.png"

const router = useRouter()

const name = ref("")
const email = ref("")
const pwd = ref("")
const cPwd = ref("")

// modal state
const showDialog = ref(false)
const dialogText = ref("")

function goBack(){ router.back() }

function showError(message) {
  dialogText.value = message
  showDialog.value = true
}

function nextStep () {
  if (!name.value.trim()) return showError("Please enter your name.")
  if (!email.value.trim()) return showError("Please enter your email.")
  if (pwd.value.length < 6) return showError("Password must be at least 6 characters.")
  if (pwd.value !== cPwd.value) return showError("Passwords do not match.")

  // stash in sessionStorage
  sessionStorage.setItem("founderReg", JSON.stringify({
    name: name.value, email: email.value, pwd: pwd.value
  }))

  router.push({ name: "RegisterFounderCompany" })
}
</script>

<template>
  <div class="page">
    <div class="card">
      <button class="back" aria-label="Back" @click="goBack">←</button>

      <!-- LEFT -->
      <section class="left">
        <img :src="monkeyUrl" class="monkey" alt="Monkey" />
        <h2 class="welcome">
          Welcome to<br /><span>Test Monkey</span>
        </h2>
        <p class="sub">Create an account to continue your journey with us.</p>
      </section>

      <div class="divider" aria-hidden="true"></div>

      <!-- RIGHT -->
      <section class="right">
        <h1 class="title">Create Account</h1>

        <form class="form" @submit.prevent="nextStep">
          <label class="field">
            <span class="label">Name</span>
            <input v-model="name" type="text" placeholder="Your name" required />
          </label>

          <label class="field">
            <span class="label">Email</span>
            <input v-model="email" type="email" placeholder="Enter your Email" required />
          </label>

          <label class="field">
            <span class="label">Password</span>
            <input v-model="pwd" type="password" minlength="6" placeholder="Enter your Password" required />
          </label>

          <label class="field">
            <span class="label">Confirm Password</span>
            <input v-model="cPwd" type="password" minlength="6" placeholder="Confirm Password" required />
          </label>

          <button class="btn" type="submit">Next</button>
        </form>
      </section>

      <img :src="bananaUrl" class="banana" alt="" />

      <!-- error modal -->
      <RegistrationModal
        :show="showDialog"
        mode="error"
        :message="dialogText"
        @close="showDialog = false"
      />

    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
:global(html), :global(body) { font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, "Helvetica Neue", sans-serif; }

.page{ min-height:100vh; display:grid; place-items:center; padding:36px 16px;
    background: var(--gradient-primary); }

.card{ position:relative; max-width: 980px; width:100%; min-height:560px; display:grid;
  grid-template-columns: 1.05fr 1px 1.2fr; gap:24px; padding:36px 40px; border-radius:22px;
  background: rgba(255,255,255,.14); backdrop-filter: blur(8px);
  --card-border: 1.5px; border: var(--card-border) solid rgba(255,255,255,.45);
  box-shadow: 0 18px 40px rgba(0,0,0,.30), inset 0 0 50px rgba(255,255,255,.18); color:#fff; }

.back{ position:absolute; top:16px; left:16px; background:transparent; border:none; color:#fff; font-size:28px; cursor:pointer }

.left{ display:grid; align-content:center; justify-items:center; text-align:center; gap:8px; padding-right:12px }
.monkey{ width:90px; height:auto; filter: drop-shadow(0 6px 12px rgba(0,0,0,.25)) }
.welcome{ font-size:40px; line-height:1.1; font-weight:800; margin:8px 0 6px; text-shadow:0 2px 4px rgba(0,0,0,.25) }
.welcome span{ filter: drop-shadow(0 2px 6px rgba(0,0,0,.25)) }
.sub{ max-width:360px; color:rgba(255,255,255,.92); line-height:1.7 }

.divider{ width:1px; background:linear-gradient(to bottom, rgba(255,255,255,.55), rgba(255,255,255,.18)); border-radius:1px }

.right{ display:grid; align-content:center; justify-items:start; padding-left:12px }
.title{ font-size:40px; font-weight:800; text-align:center; margin:6px 0 24px; text-shadow:0 2px 4px rgba(0,0,0,.25) }

.form{ display:grid; gap:16px; max-width:720px; width:100%; margin:0 }
.field{ display:grid; gap:8px }
.label{ color:#1f4e1d; font-weight:800 }
.field input{ width:100%; height:48px; border-radius:12px; border:none; padding:0 16px; background:#fff; color:#2b2b2b;
  box-shadow: 0 3px 0 rgba(0,0,0,0.25), 0 8px 18px rgba(0,0,0,0.18); outline:none; }
.field input:focus{ box-shadow: 0 3px 0 rgba(0,0,0,.30), 0 10px 22px rgba(0,0,0,.22), 0 0 0 3px rgba(35,77,34,.25) }

.btn{ margin-top:6px; height:46px; border:none; border-radius:10px; color:#fff; font-weight:800; font-size:16px;
  background: var(--gradient-green-180);
  box-shadow: 0 6px 0 rgba(0,0,0,.25), 0 10px 24px rgba(0,0,0,.25); width:220px; justify-self:center;
  transition:transform .1s ease, box-shadow .15s ease; }
.btn:hover{ transform:translateY(-1px); box-shadow:0 6px 0 rgba(0,0,0,.25), 0 16px 30px rgba(0,0,0,.25) }

.banana{ position:absolute; right:calc(-1 * var(--card-border)); bottom:calc(-1 * var(--card-border));
  width:86px; height:auto; opacity:.95; pointer-events:none; transform: rotate(-3deg) }

@media (max-width: 900px){ .card{ grid-template-columns:1fr; padding:28px 20px 36px } .divider{ display:none } .banana{ width:66px } }
</style>
