<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  userName: String,
  userRole: String,
  bananaBalance: Number,
  isFounder: Boolean
})

const emit = defineEmits(['logout', 'topUp'])

const isOpen = ref(false)
const balancePulse = ref(false)
const previousBalance = ref(props.bananaBalance)

const userInitials = computed(() => {
  if (!props.userName) return '?'
  return props.userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const roleLabel = computed(() => {
  return props.isFounder ? 'Founder' : 'Tester'
})

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function handleLogout() {
  closeDropdown()
  emit('logout')
}

function handleTopUp() {
  closeDropdown()
  emit('topUp')
}

// Close dropdown when clicking outside
function handleClickOutside(event) {
  const dropdown = document.querySelector('.user-dropdown')
  if (dropdown && !dropdown.contains(event.target)) {
    closeDropdown()
  }
}

// Add/remove click listener
import { onMounted, onUnmounted, watch } from 'vue'

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Watch for balance changes and trigger pulse animation
watch(() => props.bananaBalance, (newBalance, oldBalance) => {
  if (newBalance !== oldBalance && oldBalance !== undefined) {
    balancePulse.value = true
    setTimeout(() => {
      balancePulse.value = false
    }, 600)
  }
  previousBalance.value = newBalance
})
</script>

<template>
  <div class="user-dropdown" @click.stop>
    <button
      class="user-dropdown-trigger"
      @click="toggleDropdown"
      :aria-expanded="isOpen"
      aria-haspopup="true"
    >
      <div class="user-avatar" :class="{ pulse: balancePulse }">
        <span>{{ userInitials }}</span>
      </div>
      <i class="fas fa-chevron-down dropdown-icon" :class="{ open: isOpen }"></i>
    </button>

    <transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu" role="menu">
        <!-- User Info Header -->
        <div class="dropdown-header">
          <p class="user-name">{{ userName || 'User' }}</p>
          <span class="user-role-badge" :class="isFounder ? 'founder' : 'tester'">
            {{ roleLabel }}
          </span>
        </div>

        <!-- Banana Balance -->
        <div class="dropdown-item banana-display" :class="{ pulse: balancePulse }" @click="isFounder && handleTopUp()">
          <span class="banana-icon">🍌</span>
          <span class="banana-amount">{{ bananaBalance?.toLocaleString() || '0' }}</span>
          <i v-if="isFounder" class="fas fa-plus-circle add-icon"></i>
        </div>

        <div class="dropdown-divider"></div>

        <!-- Menu Items -->
        <!-- <button class="dropdown-item" @click="closeDropdown" role="menuitem">
          <i class="fas fa-user me-2"></i>Profile
        </button>

        <button class="dropdown-item" @click="closeDropdown" role="menuitem">
          <i class="fas fa-cog me-2"></i>Settings
        </button>

        <div class="dropdown-divider"></div> -->

        <button class="dropdown-item logout-item" @click="handleLogout" role="menuitem">
          <i class="fas fa-sign-out-alt me-2"></i>Logout
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.user-dropdown {
  position: relative;
}

.user-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-full);
  padding: 4px 12px 4px 4px;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 44px;
  color: var(--color-white);
}

.user-dropdown-trigger:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-brand-yellow) 0%, var(--color-brand-orange-accent) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  color: var(--color-gray-900);
}

.dropdown-icon {
  font-size: var(--font-size-xs);
  transition: transform var(--transition-fast);
}

.dropdown-icon.open {
  transform: rotate(180deg);
}

.user-dropdown .dropdown-menu {
  position: absolute !important;
  top: calc(100% + 8px) !important;
  right: 0 !important;
  left: auto !important;
  min-width: 220px;
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2xl);
  padding: var(--spacing-sm) 0;
  z-index: var(--z-dropdown);
  display: block;
  transform: none !important;
}

.dropdown-header {
  padding: var(--spacing-md) var(--spacing-lg);
}

.user-name {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
}

.user-role-badge {
  display: inline-block;
  margin-top: var(--spacing-xs);
  padding: 2px var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-role-badge.founder {
  background: var(--color-brand-orange-accent);
  color: var(--color-white);
}

.user-role-badge.tester {
  background: var(--color-brand-green);
  color: var(--color-white);
}

.banana-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-gray-50);
  border: none;
  width: 100%;
  text-align: left;
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
}

.banana-display:hover {
  background: var(--color-gray-100);
}

.banana-icon {
  font-size: var(--font-size-lg);
}

.banana-amount {
  flex: 1;
  font-size: var(--font-size-base);
}

.add-icon {
  color: var(--color-brand-orange-accent);
  font-size: var(--font-size-sm);
}

.dropdown-divider {
  height: 1px;
  background: var(--color-gray-200);
  margin: var(--spacing-xs) 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  background: transparent;
  color: var(--color-gray-700);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
  min-height: 40px;
}

.dropdown-item:hover {
  background: var(--color-gray-50);
  color: var(--color-gray-900);
}

.logout-item {
  color: var(--color-error);
}

.logout-item:hover {
  background: var(--color-error-bg);
  color: var(--color-error-dark);
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .dropdown-menu {
    right: auto;
    left: 50%;
    transform: translateX(-50%);
  }
}

/* Pulse animation for balance updates */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.pulse {
  animation: pulse 0.6s ease-in-out;
}

.user-avatar.pulse {
  animation: pulse 0.6s ease-in-out;
}

.banana-display.pulse {
  background: linear-gradient(135deg, var(--color-brand-yellow-light) 0%, var(--color-brand-yellow) 100%);
  animation: pulse 0.6s ease-in-out;
}
</style>
