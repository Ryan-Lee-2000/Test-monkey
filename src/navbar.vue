<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { getAuth, signOut } from "firebase/auth";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import { getUserRole } from "./Database/Monkey_Store";


const show_navbar = ref(true)
const auth = getAuth();
const router = useRouter()
const role = ref(false) //true == 'testMonkey', false == 'Founder'
onMounted(() => {
  if(auth.currentUser){
    //show_navbar.value = true
    getUserRole(auth.currentUser.uid).then(Response =>{
    if(Response == 'Founder'){
        role.value = true
    } else{
        role.value = false
    }
    })
  }
})

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
              <li class="nav-item">
                <a class="nav-link " v-if="role" @click="router.push({path: '/dashboard'})"><div class="link_text">Dashboard</div></a>
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
            <button id="logout_btn" class="btn my-2 my-lg-0" @click="logout">
            Logout
            </button>
          </div>
        </div>
      </nav>
</template>

<style>

.navbar{
  background-color: #386641;
  width: 100%;
  margin-inline: auto;
  padding-inline: 20px;
  height: 9%;
  
}

#navbar-brand-style {
  color: white;
  font-weight: bold;
  font-size: 34px;
}

#logout_btn{
  background-color: #EF8C37;
  color: white;
  box-shadow: 0 6px 0 rgba(0,0,0,.25), 0 10px 24px rgba(0,0,0,.25);
  border-radius: 10px;
  font-weight: bold;
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
  font-size: 18px;
  margin-left: 100px;
  padding-top: 5px;
}

.active_link {
  font-weight: bold;
}

.link_text:hover{
  transform: scale(1.1);
  transition: transform 0.3s ease-out;
  
}

</style>