<template>
  <div class="verification-container">
    <div class="verification-card card-modern">
      <div class="verification-header">
        <h2>Verify Your Email</h2>
        <p class="text-muted">
          We've sent a 6-digit verification code to<br>
          <strong>{{ email }}</strong>
        </p>

        <!-- Dev mode: Display the code -->
        <div v-if="props.devCode" class="dev-code-display">
          <p class="dev-label">Development Mode - Your Code:</p>
          <p class="dev-code">{{ props.devCode }}</p>
        </div>
      </div>

      <div class="verification-body">
        <form @submit.prevent="handleVerify">
          <div class="code-input-group">
            <input
              v-for="(digit, index) in codeDigits"
              :key="index"
              :ref="el => { if (el) inputRefs[index] = el }"
              v-model="codeDigits[index]"
              type="text"
              inputmode="numeric"
              maxlength="1"
              class="code-input"
              :class="{ 'has-error': error }"
              @input="handleInput(index, $event)"
              @keydown="handleKeydown(index, $event)"
              @paste="handlePaste"
            />
          </div>

          <div v-if="error" class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            {{ error }}
          </div>

          <div v-if="successMessage" class="success-message">
            <i class="fas fa-check-circle"></i>
            {{ successMessage }}
          </div>

          <button
            type="submit"
            class="btn-modern btn-primary btn-lg verify-button"
            :disabled="isVerifying || !isCodeComplete"
          >
            <span v-if="!isVerifying">Verify Email</span>
            <span v-else>
              <span class="spinner"></span>
              Verifying...
            </span>
          </button>
        </form>

        <div class="resend-section">
          <p class="text-muted">Didn't receive the code?</p>
          <button
            type="button"
            class="btn-modern btn-ghost"
            :disabled="resendCooldown > 0 || isResending"
            @click="handleResend"
          >
            <span v-if="!isResending">
              {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code' }}
            </span>
            <span v-else>
              <span class="spinner"></span>
              Sending...
            </span>
          </button>
        </div>

        <div class="timer-section">
          <p class="text-muted timer-text">
            <i class="fas fa-clock"></i>
            Code expires in: <strong>{{ formatTime(timeRemaining) }}</strong>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { useRouter } from 'vue-router'

const props = defineProps({
  email: {
    type: String,
    required: true
  },
  uid: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  devCode: {
    type: String,
    default: ''
  }
})

const router = useRouter()
const functions = getFunctions()

// Reactive data
const codeDigits = ref(['', '', '', '', '', ''])
const inputRefs = ref([])
const error = ref('')
const successMessage = ref('')
const isVerifying = ref(false)
const isResending = ref(false)
const resendCooldown = ref(0)
const timeRemaining = ref(3600) // 1 hour in seconds

// Computed
const isCodeComplete = computed(() => {
  return codeDigits.value.every(digit => digit !== '')
})

const verificationCode = computed(() => {
  return codeDigits.value.join('')
})

// Timer for expiration
let expirationTimer = null
let resendTimer = null

onMounted(() => {
  // Focus first input
  if (inputRefs.value[0]) {
    inputRefs.value[0].focus()
  }

  // Start expiration countdown
  expirationTimer = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--
    } else {
      clearInterval(expirationTimer)
      error.value = 'Verification code has expired. Please request a new one.'
    }
  }, 1000)
})

onUnmounted(() => {
  if (expirationTimer) {
    clearInterval(expirationTimer)
  }
  if (resendTimer) {
    clearInterval(resendTimer)
  }
})

// Methods
function handleInput(index, event) {
  const value = event.target.value

  // Only allow digits
  if (!/^\d*$/.test(value)) {
    codeDigits.value[index] = ''
    return
  }

  // Move to next input if digit entered
  if (value && index < 5) {
    inputRefs.value[index + 1]?.focus()
  }

  // Clear error when user starts typing
  if (error.value) {
    error.value = ''
  }
}

function handleKeydown(index, event) {
  // Handle backspace
  if (event.key === 'Backspace' && !codeDigits.value[index] && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }

  // Handle arrow keys
  if (event.key === 'ArrowLeft' && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }
  if (event.key === 'ArrowRight' && index < 5) {
    inputRefs.value[index + 1]?.focus()
  }
}

function handlePaste(event) {
  event.preventDefault()
  const pastedData = event.clipboardData.getData('text').trim()

  // Only accept 6-digit numbers
  if (/^\d{6}$/.test(pastedData)) {
    codeDigits.value = pastedData.split('')
    inputRefs.value[5]?.focus()
  }
}

async function handleVerify() {
  if (!isCodeComplete.value) return

  isVerifying.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const verifyEmailCode = httpsCallable(functions, 'verifyEmailCode')
    const result = await verifyEmailCode({
      uid: props.uid,
      code: verificationCode.value
    })

    if (result.data.error) {
      error.value = result.data.error
      // Clear the code inputs
      codeDigits.value = ['', '', '', '', '', '']
      inputRefs.value[0]?.focus()
    } else {
      successMessage.value = 'Email verified successfully! Redirecting...'

      // Redirect to appropriate dashboard after a short delay
      setTimeout(() => {
        if (props.userRole === 'Founder') {
          router.replace('/dashboard')
        } else {
          router.replace('/home')
        }
      }, 1500)
    }
  } catch (err) {
    console.error('Verification error:', err)
    error.value = 'Failed to verify email. Please try again.'
  } finally {
    isVerifying.value = false
  }
}

async function handleResend() {
  if (resendCooldown.value > 0) return

  isResending.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const resendVerificationCode = httpsCallable(functions, 'resendVerificationCode')
    const result = await resendVerificationCode({
      uid: props.uid,
      email: props.email
    })

    if (result.data.error) {
      error.value = result.data.error
    } else {
      successMessage.value = 'Verification code resent! Please check your email.'

      // Reset timer
      timeRemaining.value = 3600

      // Start resend cooldown (60 seconds)
      resendCooldown.value = 60
      resendTimer = setInterval(() => {
        resendCooldown.value--
        if (resendCooldown.value <= 0) {
          clearInterval(resendTimer)
        }
      }, 1000)
    }
  } catch (err) {
    console.error('Resend error:', err)
    error.value = 'Failed to resend code. Please try again.'
  } finally {
    isResending.value = false
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.verification-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, var(--color-secondary-light) 0%, var(--color-secondary) 100%);
}

.verification-card {
  max-width: 500px;
  width: 100%;
  padding: var(--spacing-2xl);
  background: var(--color-white);
}

.verification-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.verification-header h2 {
  margin-bottom: var(--spacing-md);
  color: var(--color-gray-900);
}

.verification-header p {
  font-size: var(--font-size-base);
  color: var(--color-gray-600);
  line-height: var(--line-height-relaxed);
}

.verification-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.code-input-group {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
}

.code-input {
  width: 60px;
  height: 70px;
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  text-align: center;
  border: 2px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  background: var(--color-white);
}

.code-input:focus {
  outline: none;
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px var(--color-secondary-bg);
}

.code-input.has-error {
  border-color: var(--color-error);
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: var(--color-error-bg);
  color: var(--color-error-dark);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.success-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: var(--color-success-bg);
  color: var(--color-success-dark);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.verify-button {
  width: 100%;
  margin-top: var(--spacing-md);
}

.resend-section {
  text-align: center;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-gray-200);
}

.resend-section p {
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.timer-section {
  text-align: center;
  padding: var(--spacing-md);
  background-color: var(--color-gray-50);
  border-radius: var(--radius-md);
}

.timer-text {
  margin: 0;
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.dev-code-display {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-warning-bg);
  border: 2px dashed var(--color-warning);
  border-radius: var(--radius-md);
  text-align: center;
}

.dev-label {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-warning-dark);
}

.dev-code {
  margin: 0;
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--color-gray-900);
  letter-spacing: 0.3em;
}

@media (max-width: 768px) {
  .verification-card {
    padding: var(--spacing-xl);
  }

  .code-input {
    width: 50px;
    height: 60px;
    font-size: var(--font-size-2xl);
  }

  .code-input-group {
    gap: var(--spacing-xs);
  }
}
</style>
