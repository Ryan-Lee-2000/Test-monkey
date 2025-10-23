<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { getAuth, signOut } from "firebase/auth";
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";

import { getUserRole, getBananaBalance } from "./Database/Monkey_Store";
import BananaTopUp from "./Bananas/BananaTopUp.vue";
import { useBananaTopUp } from "./composables/useBananaTopUp";

const { showTopUpModal, openTopUp, closeTopUp } = useBananaTopUp()

const show_navbar = ref(true)
const auth = getAuth();
const router = useRouter()
const role = ref(false) //true == 'Founder', false == 'TestMonkey'
const userRole = ref('')
const bananaBalance = ref(0)
const isMobileMenuOpen = ref(false)

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
  if(auth.currentUser){
    //show_navbar.value = true
    const roleResponse = await getUserRole(auth.currentUser.uid)
    userRole.value = roleResponse

    if(roleResponse == 'Founder'){
        role.value = true
        // Load banana balance for founders
        bananaBalance.value = await getBananaBalance(auth.currentUser.uid, 'Founder')
    } else{
        role.value = false
        // Load banana balance for testers
        bananaBalance.value = await getBananaBalance(auth.currentUser.uid, 'TestMonkey')
    }
  }

  // Add resize event listener
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // Clean up resize event listener
  window.removeEventListener('resize', handleResize)
})

async function refreshBalance() {
  if (auth.currentUser) {
    if (userRole.value === 'Founder') {
      bananaBalance.value = await getBananaBalance(auth.currentUser.uid, 'Founder')
    } else {
      bananaBalance.value = await getBananaBalance(auth.currentUser.uid, 'TestMonkey')
    }
  }
}

function logout(){
    signOut(auth).then(() => {
        // Sign-out successful.
        router.push({path: '/'})
    }).catch((error) => {
    // An error happened.
        alert(error.message)
    });
}

</script>

<template>
    <nav
        class="navbar navbar-expand-sm fixed-top navbar-light"
        style="height: 8vh; "
        v-if="show_navbar"
      >
        <div class="container h-100 py-2" 
        style="display: flex; justify-content: center; align-items: center;">
          <button
            class="menu-toggle d-lg-none order-last mt-lg-0 mt-2"
            style="background-color: transparent; border: 0;"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            aria-label="Toggle menu"
          >
            <i class="fas fa-bars fa-2xl"></i>
          </button>

          <a class="navbar-brand" id="navbar-brand-style" href="#">Test Monkey</a>

          <div class="collapse navbar-collapse" id="collapsibleNavId">
            <ul class="navbar-nav me-auto mt-2 mt-lg-0">
              <li class="nav-item">
                <a class="nav-link"
                  :class="{ active_link: $route.path === '/Home' || $route.path === '/' }" 
                  @click="router.push({ path: '/Home' })" aria-current="page">
                  <div class="link_text">Home</div>
                  <span class="visually-hidden">(current)</span></a
                >
              </li>
              <li class="nav-item">
                <a class="nav-link" id="createMission" v-if="role"
                :class="{ active_link: $route.path === '/createMission' }"
                @click="router.push({ path: '/createMission' })">
                <div class="link_text">Create Mission</div></a>

                <a class="nav-link" id="createMission" v-else
                :class="{ active_link: $route.path === '/missionList' }"
                @click="router.push({ path: '/missionList' })">
                <div class="link_text">My Missions</div></a>
              </li>
              <li class="nav-item" v-if="role">
                <a class="nav-link "  @click="router.push({path: '/dashboard'})"><div class="link_text">Dashboard</div></a>
              </li>
              <li class="nav-item" v-else>
                <a class="nav-link " @click="router.push({path: '/gambling'})"><div class="link_text">Gambling</div></a>
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

          <!-- Banana Balance Display -->
          <div class="right-actions">
            <div class="banana-balance-container">
              <!-- Founder: Clickable with top-up -->
              <button v-if="role" class="banana-balance clickable" @click="openTopUp">
                <span class="banana-icon">🍌</span>
                <span class="balance-amount">{{ bananaBalance.toLocaleString() }}</span>
                <i class="fas fa-plus-circle add-icon"></i>
              </button>

              <!-- TestMonkey: Display only -->
              <div v-else class="banana-balance readonly">
                <span class="banana-icon">🍌</span>
                <span class="balance-amount">{{ bananaBalance.toLocaleString() }}</span>
              </div>
            </div>
          </div>

            <button id="logout_btn" class="btn my-2 my-lg-0" @click="logout">
            Logout
            </button>
            
        </div>

        <!-- Mobile Sidebar -->
        <transition name="slide" class="d-lg-none">
          <div v-if="isMobileMenuOpen" class="mobile-sidebar w-50" style="min-width: 200px;">
          <!-- Sidebar Header -->
            <div class="mobile-sidebar-header d-flex justify-content-between align-items-center px-4 py-3 border-bottom">
              <h2 class="sidebar-title mb-0">Test Monkey</h2>
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
              <li class="py-3 px-4 border-bottom" @click="go('/Home'); isMobileMenuOpen = false">Home</li>
              <li class="py-3 px-4 border-bottom" v-if="role" @click="go('/createMission'); isMobileMenuOpen = false">Create Mission</li>
              <li class="py-3 px-4 border-bottom" v-else @click="go('/missionList'); isMobileMenuOpen = false">My Missions</li>
              <li class="py-3 px-4 border-bottom" @click="go(role ? '/dashboard' : '/gambling'); isMobileMenuOpen = false">
                {{ role ? 'Dashboard' : 'Gambling' }}
              </li>
            </ul>
            <ul class="list-unstyled m-0 p-0 fixed-bottom" >
              <li class="py-3 px-4 border-bottom border-top w-50" style="min-width: 200px;">
                <button v-if="role" class="banana-balance clickable" @click="openTopUp">
                  <span class="banana-icon">🍌</span>
                  <span class="balance-amount">{{ bananaBalance.toLocaleString() }}</span>
                  <i class="fas fa-plus-circle add-icon"></i>
                </button>
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
</template>

<style>

.navbar{
  background-color: #386641;
  width: 100%;
  margin-inline: auto;
  padding-inline: 20px;
  padding-block: 12px;

}

/* Keep Test Monkey fixed to the left edge on small screens */
@media (max-width: 576px) {
  .navbar {
    padding-inline: 12px; 
  }

  #navbar-brand-style {
    position: absolute;
    left: 16px;
    top: 12px;
    transform: none;
  }

  .menu-toggle {
    position: absolute;
    right: 16px;
    top: 14px;
  }
}


#navbar-brand-style {
  color: white;
  font-weight: bold;
  font-size: 28px;
}

#logout_btn{
  background-color: #EF8C37;
  color: white;
  box-shadow: 0 4px 0 rgba(0,0,0,.2), 0 6px 16px rgba(0,0,0,.2);
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  padding: 8px 20px;
}

a:hover{
  cursor: pointer;

}
.link_text{
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: transform 0.3s ease-out;
  color: white;
  font-size: 20px;
  font-weight: 500;
}

.active_link {
  font-weight: bold;
}

.link_text:hover{
  transform: scale(1.1);
  transition: transform 0.3s ease-out;

}

.navbar-nav .nav-item {
  margin-left: 1.5rem;
}

.navbar-nav .nav-item:first-child {
  margin-left: 0;
}

.banana-balance-container {
  margin-right: 1rem;
}

.banana-balance {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #EF8C37;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.banana-balance.clickable {
  cursor: pointer;
}

.banana-balance.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  background: linear-gradient(135deg, #FDC955 0%, #FED16A 100%);
}

.banana-balance.readonly {
  cursor: default;
  background-color: #6A994E;
}

.banana-icon {
  font-size: 20px;
}

.balance-amount {
  font-size: 18px;
  font-weight: bold;
  color: white;
  min-width: 50px;
  text-align: right;
}

.add-icon {
  color: white;
  font-size: 16px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.banana-balance:hover .add-icon {
  opacity: 1;
}

/* Hide normal nav links and show hamburger under 992px */
@media (max-width: 992px) {
  .navbar-nav,
  .banana-balance-container,
  #logout_btn {
    display: none !important;
  }

  .menu-toggle {
    display: block;
    color: white;
  }
}

/* On desktop (≥992px), hide the hamburger */
@media (min-width: 992px) {
  .menu-toggle {
    display: none;
  }
}

/* ===== Mobile Sidebar ===== */
.mobile-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 240px;
  background-color: #386641;
  color: white;
  z-index: 999;
  padding-top: 0px;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.4);
  transition: transform 0.3s ease;
}

.mobile-sidebar ul li {
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.mobile-sidebar ul li:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Slide-in / slide-out animation */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
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
  height: 100vh;
  background: rgba(0, 0, 0, 0.45);
  z-index: 998;
  backdrop-filter: blur(1px);
}


</style>