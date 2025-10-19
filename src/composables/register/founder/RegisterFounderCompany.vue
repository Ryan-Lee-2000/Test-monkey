<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { createUser } from "@/Database/Monkey_Store"

import monkeyUrl from "@/assets/welcome/monkey.png"
import bananaUrl from "@/assets/welcome/banana.png"
import loadingImg from "@/assets/welcome/loading.png"
import successImg from "@/assets/welcome/green-tick.png"

const router = useRouter()

const base = ref({ name: "", email: "", pwd: "" })
const companyName = ref("")
const logoFile = ref(null)

const showDialog = ref(false)
const dialogMode = ref("loading")   // "loading" | "success"
const dialogText = ref("Creating account…")
const submitting = ref(false)

function goBack(){ router.back() }
function onFileChange(e){ logoFile.value = e.target.files?.[0] ?? null }

onMounted(() => {
  const cached = sessionStorage.getItem("founderReg")
  if (!cached) return router.replace({ name: "FounderAccount" })
  base.value = JSON.parse(cached)
})

async function registerFounder(){
  if (submitting.value) return
  if (!companyName.value.trim()) return alert("Please enter company name (you can change later).")

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

    dialogMode.value = "success"
    dialogText.value = "Account Created!"
    sessionStorage.removeItem("founderReg")
    setTimeout(() => router.replace("/dashboard"), 1000)
  } catch (e) {
    showDialog.value = false
    console.error(e?.code || e)
    alert(e?.message || "Registration failed.")
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="card">
        <!-- modal-->
          <transition name="fade">
            <div v-if="showDialog" class="modal-mask" role="dialog" aria-modal="true">
              <div class="modal-card" role="status" aria-live="assertive">
                <img :src="dialogMode === 'loading' ? loadingImg : successImg" class="modal-img" alt="" />
                <p class="modal-text">{{ dialogText }}</p>
              </div>
            </div>
          </transition>
          
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

/* ===== Modal ===== */
.modal-mask {
  position: absolute;
  inset: 0; /* full size of parent */
  background: rgba(0, 0, 0, 0.35);
  display: grid;
  place-items: center;
  z-index: 10; 
  border-radius: inherit; /* match .card border radius */
  backdrop-filter: blur(2px);
  pointer-events: all;
}

.modal-card{
  min-width:220px;max-width:340px;padding:18px 20px; border-radius:12px; background:#fff;
  box-shadow:0 14px 32px rgba(0,0,0,.25); display:grid; justify-items:center; gap:12px;
}
.modal-img{ width:40px; height:40px; object-fit:contain }
.modal-text{ color:#2b2b2b; font-weight:600 }
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 900px){ .card{ grid-template-columns:1fr; padding:28px 20px 36px } .divider{ display:none } .banana{ width:66px } }
</style>
