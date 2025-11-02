<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { getAuth, signOut } from "firebase/auth";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";

import { getUserRole, getBananaBalance } from "./Database/Monkey_Store";
import BananaTopUp from "./Bananas/BananaTopUp.vue";
import AlertModal from "./components/AlertModal.vue";
import UserDropdown from "./components/UserDropdown.vue";
import NavbarSkeleton from "./components/NavbarSkeleton.vue";
import { useBananaTopUp } from "./composables/useBananaTopUp";
import { useUserData } from "./composables/useUserData";
import { useAlert } from "./composables/useAlert";

const { showTopUpModal, openTopUp, closeTopUp } = useBananaTopUp()
const { showAlert, alertConfig, closeAlert, handleConfirm, handleCancel, showError } = useAlert()

const show_navbar = ref(true)
const auth = getAuth();
const router = useRouter()
const isMobileMenuOpen = ref(false)
const { userRole, bananaBalance, isLoaded, loadUserData, refreshBalance, resetUserData } = useUserData()
const role = computed(() => userRole.value === 'Founder')

// Get current user's display name from Firebase Auth
const userName = computed(() => {
  return auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'User'
})

function go(path) {
  router.push({ path })
}

// Close sidebar when viewport goes past lg breakpoint
function handleResize() {
  if (window.innerWidth >= 992) { // lg breakpoint is 992px
    isMobileMenuOpen.value = false
  }
}

onMounted(async () => {
  await loadUserData() // This now loads everything
  window.addEventListener('resize', handleResize)
})


onUnmounted(() => {
  // Clean up resize event listener
  window.removeEventListener('resize', handleResize)
})


function logout(){
    signOut(auth).then(() => {
        resetUserData() // Add this to clear the cached data
        router.push({path: '/'})
    }).catch((error) => {
    // An error happened.
        showError(error.message, 'Logout Error')
    });
}

// function logout(){
//     signOut(auth).then(() => {
//         // Sign-out successful.
//         router.push({path: '/'})
//     }).catch((error) => {
//     // An error happened.
//         alert(error.message)
//     });
// }

</script>

<template>
    <nav
        class="navbar navbar-expand-sm fixed-top navbar-light"
        v-if="show_navbar"
      >
        <div class="container-fluid navbar-container">
          <!-- Navbar Brand -->
          <a class="navbar-brand" id="navbar-brand-style" @click="router.push({path: role ? '/dashboard' : '/home'})">
            Test Monkey
          </a>

          <!-- Desktop Navigation Links -->
          <div class="collapse navbar-collapse d-none d-lg-flex">
            <ul class="navbar-nav me-auto">
              <li class="nav-item" v-if="!role">
                <a class="nav-link"
                :class="{ active_link: $route.path === '/home' }"
                @click="router.push({path: '/home'})"><div class="link_text">My Missions</div>
                  <span class="visually-hidden">(current)</span></a>
              </li>
              <li class="nav-item" v-if="role">
                <a class="nav-link "
                :class="{ active_link: $route.path === '/dashboard' }"
                @click="router.push({path: '/dashboard'})"><div class="link_text">Dashboard</div></a>
              </li>
              <li class="nav-item" v-if="role">
                <a class="nav-link" id="createMission"
                :class="{ active_link: $route.path === '/createMission' }"
                @click="router.push({ path: '/createMission' })">
                <div class="link_text">Create Mission</div></a>
              </li>
              <li class="nav-item" v-else>
                <a class="nav-link "
                :class="{ active_link: $route.path === '/gambling' }"
                @click="router.push({path: '/gambling'})"><div class="link_text">Gacha</div></a>
              </li>
              <!-- <li class="nav-item dropdown ">
                <a
                  class="nav-link dropdown-toggle"
                  d-flex
                  href="#"
                  id="dropdownId"
                  data-bs-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                  ><div class="link_text" style="display: inline;">Dropdown</div></a>
                <div
                  class="dropdown-menu"
                  aria-labelledby="dropdownId"
                >
                  <a class="dropdown-item" href="#"
                    ><div class="link_text">Action 1</div></a
                  >
                  <a class="dropdown-item" href="#"
                    ><div class="link_text">Action 2</div></a
                  >
                </div>
              </li> -->
            </ul>
          </div>

          <!-- User Dropdown (Desktop) -->
          <div class="d-none d-lg-flex align-items-center">
            <NavbarSkeleton v-if="!isLoaded" />
            <UserDropdown
              v-else
              :user-name="userName"
              :user-role="userRole"
              :banana-balance="bananaBalance"
              :is-founder="role"
              @logout="logout"
              @top-up="openTopUp"
            />
          </div>

          <!-- Mobile Menu Toggle -->
          <button
            class="menu-toggle d-lg-none"
            style="background-color: transparent; border: 0;"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            aria-label="Toggle menu"
          >
            <i class="fas fa-bars fa-2xl"></i>
          </button>
            
        </div>

        <!-- Mobile Sidebar -->
        <transition name="slide" class="d-lg-none">
          <div v-if="isMobileMenuOpen" class="mobile-sidebar w-50" style="min-width: 200px;">
          <!-- Sidebar Header -->
            <div class="mobile-sidebar-header d-flex justify-content-between align-items-center px-4 py-3 border-bottom">
              <h2 class="sidebar-title mb-0" style="color: white;">Test Monkey</h2>
              <button class="close-btn"
              style="background-color: transparent; border: 1px white solid; 
              width: 40px; height: 40px; text-align: center; background-color: white;
              display: flex; justify-content: center;
              color: #386641; font-weight: 900; font-size: x-large; border-radius: 100%;"
              @click="isMobileMenuOpen = false" aria-label="Close menu">
                &times;
              </button>
            </div>

            <!-- Sidebar Navigation -->
            <ul class="list-unstyled m-0 p-0">
              <li class="py-3 px-4 border-bottom" v-if="!role" @click="go('/home'); isMobileMenuOpen = false">My Missions</li>
              <li class="py-3 px-4 border-bottom" @click="go(role ? '/dashboard' : '/gambling'); isMobileMenuOpen = false">
                {{ role ? 'Dashboard' : 'Gambling' }}
              </li>
              <li class="py-3 px-4 border-bottom" v-if="role" @click="go('/createMission'); isMobileMenuOpen = false">Create Mission</li>
            </ul>
            <ul class="list-unstyled m-0 p-0 fixed-bottom" >
              <li class="py-3 px-4 border-bottom border-top w-50" style="min-width: 200px;">
                <button v-if="role" class="banana-balance clickable" @click="openTopUp">
                  <span class="banana-icon">🍌</span>
                  <span class="balance-amount">{{ bananaBalance.toLocaleString() }}</span>
                  <i class="fas fa-plus-circle add-icon"></i>
                </button>
                <!-- Banana balance display for testers-->
                <div v-else class="banana-balance readonly" style="display: inline-flex;">
                  <span class="banana-icon">🍌</span>
                  <span class="balance-amount">{{ bananaBalance.toLocaleString() }}</span>
                </div>
              </li>
              <li class="py-3 px-4  w-50" style="min-width: 200px;">
                <button class="banana-balance clickable" @click="logout">
                  <span style="color: white;">Logout</span></button>
              </li>
            </ul>
          
        </div>

        </transition>
        

        <!-- Background overlay (must be outside transition) -->
        <div
          v-if="isMobileMenuOpen"
          class="mobile-overlay"
          @click="isMobileMenuOpen = false">
        </div>


      </nav>

      <!-- Banana Top-Up Modal -->
      <BananaTopUp
        :show="showTopUpModal"
        :currentBalance="bananaBalance"
        @close="closeTopUp"
        @success="refreshBalance"
      />

      <!-- Alert Modal -->
      <AlertModal
        :show="showAlert"
        :title="alertConfig.title"
        :message="alertConfig.message"
        :type="alertConfig.type"
        :confirmText="alertConfig.confirmText"
        :showCancel="alertConfig.showCancel"
        :cancelText="alertConfig.cancelText"
        @close="closeAlert"
        @confirm="handleConfirm"
        @cancel="handleCancel"
      />
</template>

<style>

.navbar {
  background-color: var(--color-brand-green-light);
  width: 100%;
  max-width: 100vw;
  left: 0;
  right: 0;
  margin-inline: auto;
  padding-inline: var(--spacing-lg);
  padding-block: 0;
  height: 80px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: visible;
}

.navbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  gap: var(--spacing-xl);
  padding: 0;
  overflow: visible;
}

/* Keep Test Monkey fixed to the left edge on small screens */
@media (max-width: 576px) {
  .navbar {
    padding-inline: var(--spacing-sm);
  }

  #navbar-brand-style {
    position: absolute;
    left: var(--spacing-md);
    top: var(--spacing-sm);
    transform: none;
  }

  .menu-toggle {
    position: absolute;
    right: var(--spacing-md);
    top: 14px;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}


#navbar-brand-style {
  color: var(--color-white);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-2xl);
  line-height: 1.2;
  cursor: pointer;
  transition: opacity var(--transition-fast);
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
}

#navbar-brand-style:hover {
  opacity: 0.9;
  text-decoration: none;
}

.navbar-collapse {
  flex: 1;
  display: flex;
  align-items: center;
}

/* User Dropdown container spacing */
.d-none.d-lg-flex.align-items-center {
  margin-left: auto;
  position: relative;
}

a:hover{
  cursor: pointer;
}

.nav-link {
  position: relative;
  text-decoration: none;
  border-radius: var(--radius-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  transition: background-color var(--transition-fast);
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.link_text {
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-white);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
  letter-spacing: 0.01em;
  padding-right: var(--spacing-md);
  padding-bottom: var(--spacing-xs);
  transition: opacity var(--transition-fast);
  min-height: 44px;
  display: flex;
  align-items: center;
  position: relative;
}

/* Animated underline */
.link_text::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--color-brand-yellow);
  transition: width 200ms ease-out;
}

.active_link .link_text {
  font-weight: var(--font-weight-semibold);
}

.active_link .link_text::after,
.link_text:hover::after {
  width: calc(100% - var(--spacing-md));
}

.link_text:hover{
  opacity: 0.95;
}

.navbar-nav .nav-item {
  margin-left: var(--spacing-lg);
}

.navbar-nav .nav-item:first-child {
  margin-left: 0;
}

.banana-balance {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background-color: var(--color-brand-orange-accent);
  border: none;
  border-radius: var(--radius-xl);
  padding: var(--spacing-sm) var(--spacing-md);
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
  min-height: 44px;
}

.banana-balance.clickable {
  cursor: pointer;
}

.banana-balance.clickable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  background: linear-gradient(135deg, var(--color-brand-yellow) 0%, var(--color-brand-yellow-light) 100%);
}

.banana-balance.readonly {
  cursor: default;
  background-color: var(--color-brand-green);
}

.banana-icon {
  font-size: var(--font-size-xl);
}

.balance-amount {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-white);
  min-width: 50px;
  text-align: right;
}

.add-icon {
  color: var(--color-white);
  font-size: var(--font-size-base);
  opacity: 0.8;
  transition: opacity var(--transition-fast);
}

.banana-balance:hover .add-icon {
  opacity: 1;
}

/* Hide desktop nav on mobile, show mobile menu toggle */
@media (max-width: 992px) {
  .navbar-collapse {
    display: none !important;
  }

  .menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    min-width: 44px;
    min-height: 44px;
  }
}

/* On desktop (≥992px), hide the mobile menu toggle */
@media (min-width: 993px) {
  .menu-toggle {
    display: none;
  }
}

/* ===== Mobile Sidebar ===== */
.mobile-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100dvh;
  width: 240px;
  background-color: var(--color-brand-green-light);
  color: var(--color-white);
  z-index: var(--z-modal);
  padding-top: 0;
  box-shadow: var(--shadow-2xl);
  transition: transform var(--transition-base);
}

.mobile-sidebar ul li {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  line-height: 1.5;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 44px;
  display: flex;
  align-items: center;
  position: relative;
}

.mobile-sidebar ul li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: var(--color-brand-yellow);
  transform: scaleY(0);
  transition: transform var(--transition-fast);
}

.mobile-sidebar ul li:hover {
  background-color: rgba(255, 255, 255, 0.1);
  padding-left: calc(var(--spacing-lg) + 4px);
}

.mobile-sidebar ul li:hover::before {
  transform: scaleY(1);
}

/* Slide-in / slide-out animation */
.slide-enter-active,
.slide-leave-active {
  transition: transform var(--transition-base);
}
.slide-enter-from {
  transform: translateX(-100%);
}
.slide-leave-to {
  transform: translateX(-100%);
}

/* ===== Overlay behind mobile sidebar ===== */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100dvh;
  background: rgba(0, 0, 0, 0.45);
  z-index: var(--z-modal-backdrop);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}


</style>