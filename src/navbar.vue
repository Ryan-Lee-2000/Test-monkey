<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { getAuth, signOut } from "firebase/auth";
import { onMounted, ref } from "vue";
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
        v-if="show_navbar"
      >
        <div class="container-fluid">
          <a class="navbar-brand" id="navbar-brand-style" href="#">Test Monkey</a>
          <button
            class="navbar-toggler d-lg-none"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapsibleNavId"
            aria-controls="collapsibleNavId"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span class="navbar-toggler-icon"></span>
          </button>
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
            <!-- Banana Balance Display -->
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

            <button id="logout_btn" class="btn my-2 my-lg-0" @click="logout">
            Logout
            </button>
          </div>
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

</style>