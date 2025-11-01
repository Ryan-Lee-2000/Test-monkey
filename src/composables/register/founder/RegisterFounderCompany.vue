<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth"
import { getFunctions, httpsCallable } from "firebase/functions"
import { createUser } from "@/Database/Monkey_Store"
import RegistrationModal from "../RegistrationModal.vue"
import EmailVerification from "../EmailVerification.vue"

import monkeyUrl from "@/assets/welcome/monkey.png"
import bananaUrl from "@/assets/welcome/banana.png"

const router = useRouter()
const functions = getFunctions()

const base = ref({ name: "", email: "", pwd: "" })
const companyName = ref("")
const logoFile = ref(null)

const showDialog = ref(false)
const dialogMode = ref("loading")   // "loading" | "success" | "error"
const dialogText = ref("Creating account…")
const submitting = ref(false)

// verification state
const showVerification = ref(false)
const userUid = ref("")
const userEmail = ref("")
const verificationDevCode = ref("")

function goBack(){ router.back() }
function onFileChange(e){ logoFile.value = e.target.files?.[0] ?? null }

onMounted(() => {
  const cached = sessionStorage.getItem("founderReg")
  if (!cached) return router.replace({ name: "FounderAccount" })
  base.value = JSON.parse(cached)
})

async function registerFounder(){
  if (submitting.value) return
  if (!companyName.value.trim()) {
    dialogMode.value = "error"
    dialogText.value = "Please enter company name (you can change later)."
    showDialog.value = true
    return
  }

  submitting.value = true
  showDialog.value = true
  dialogMode.value = "loading"
  dialogText.value = "Creating account…"

  try {
    const auth = getAuth()
    const cred = await createUserWithEmailAndPassword(auth, base.value.email, base.value.pwd)
    await updateProfile(cred.user, { displayName: base.value.name })

    const data = [companyName.value, "Logo", "UEN", "linkedin"]
    await createUser([cred.user.uid, base.value.name, data, true])

    // Create verification code
    const createVerificationCode = httpsCallable(functions, 'createVerificationCode')
    const result = await createVerificationCode({
      email: base.value.email,
      uid: cred.user.uid
    })

    // Sign out the user (they must verify email before logging in)
    await signOut(auth)

    // Store user info for verification screen
    userUid.value = cred.user.uid
    userEmail.value = base.value.email

    // If in development mode, store the code
    if (result.data.devCode) {
      verificationDevCode.value = result.data.devCode
    }

    // Close registration modal and show verification screen
    showDialog.value = false
    showVerification.value = true
    sessionStorage.removeItem("founderReg")
    submitting.value = false

  } catch (e) {
    dialogMode.value = "error"
    if (e?.code === 'auth/email-already-in-use') {
      dialogText.value = "This email is already registered. Please check your email to continue your registration, or use a different email address."
    } else {
      dialogText.value = e?.message || "Registration failed."
    }
    submitting.value = false
  }
}
</script>

<template>
  <!-- Show verification screen if account created -->
  <EmailVerification
    v-if="showVerification"
    :email="userEmail"
    :uid="userUid"
    :devCode="verificationDevCode"
    userRole="Founder"
  />

  <!-- Registration form -->
  <div v-else class="page">
    <div class="card">
      <!-- modal -->
      <RegistrationModal
        :show="showDialog"
        :mode="dialogMode"
        :message="dialogText"
        @close="showDialog = false"
      />

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
        <h1 class="title">Company Details</h1>
        <form class="form" @submit.prevent="registerFounder">

          <label class="field">
            <span class="label">Company Name</span>
            <input v-model="companyName" type="text" placeholder="Your company" required />
          </label>

          <label class="field">
            <span class="label">Upload Company Logo (optional)</span>
            <input type="file" accept="image/*" @change="onFileChange" />
          </label>

          <button class="btn" type="submit" :disabled="submitting">
            {{ submitting ? "Registering…" : "Register" }}
          </button>
        </form>
      </section>

      <img :src="bananaUrl" class="banana" alt="" />
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
:global(html), :global(body) { font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, "Helvetica Neue", sans-serif; }

.page{ min-height:100vh; display:grid; place-items:center; padding:36px 16px;
    background: linear-gradient(to bottom, #0f4d26 7%, #F97A02 26%, #FC9D05 54%, #FDC955 77%, #ABD453 90%); }

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

.right{ position:relative; display:grid; align-content:center; justify-items:start; padding-left:12px }
.title{ font-size:40px; font-weight:800; text-align:center; margin:6px 0 24px; text-shadow:0 2px 4px rgba(0,0,0,.25) }

.form{ display:grid; gap:16px; max-width:720px; width:100%; margin:0 }
.field{ display:grid; gap:8px }
.label{ color:#1f4e1d; font-weight:800 }
.field input[type="text"] {
  width:100%; 
  height:48px; 
  border-radius:12px; 
  border:none; 
  padding:0 16px; 
  background:#fff; 
  color:#2b2b2b;
  box-shadow: 0 3px 0 rgba(0,0,0,0.25), 0 8px 18px rgba(0,0,0,0.18); 
  outline:none;
}
.field input[type="file"] {
  width:100%; 
  height:48px; 
  border-radius:12px; 
  border:none; 
  padding: 10px 16px;
  background:#fff; 
  color:#2b2b2b;
  box-shadow: 0 3px 0 rgba(0,0,0,0.25), 0 8px 18px rgba(0,0,0,0.18); 
  outline:none;
}
.field input[type="text"]:focus{ 
    box-shadow: 0 3px 0 rgba(0,0,0,.30), 0 10px 22px rgba(0,0,0,.22), 0 0 0 3px rgba(35,77,34,.25) 
}

/* Button */
.btn{ margin-top:6px; height:46px; border:none; border-radius:10px; color:#fff; font-weight:800; font-size:16px;
  background: linear-gradient(180deg, #2e7d32 0%, #1b5e20 100%);
  box-shadow: 0 6px 0 rgba(0,0,0,.25), 0 10px 24px rgba(0,0,0,.25); width:220px; justify-self:center;
  transition:transform .1s ease, box-shadow .15s ease; }
.btn:hover{ transform:translateY(-1px); box-shadow:0 6px 0 rgba(0,0,0,.25), 0 16px 30px rgba(0,0,0,.25) }
.btn:disabled{ opacity:.7; transform:none }

/* Banana */
.banana{ position:absolute; right:calc(-1 * var(--card-border)); bottom:calc(-1 * var(--card-border));
  width:86px; height:auto; opacity:.95; pointer-events:none; transform: rotate(-3deg) }

@media (max-width: 900px){ .card{ grid-template-columns:1fr; padding:28px 20px 36px } .divider{ display:none } .banana{ width:66px } }
</style>
