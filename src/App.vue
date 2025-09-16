<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const show_navbar = ref(false)
const auth = getAuth();
const router = useRouter()
onMounted(() => {
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user
      show_navbar.value = true
      
      // ...
    } else {
      // User is signed ou
      show_navbar.value = false
    }
  });
})

function logout(){
    signOut(auth).then(() => {
        // Sign-out successful.
        console.log("Logging out")
        router.push({path: '/'})
    }).catch((error) => {
    // An error happened.
        console.log(error.code)
        alert(error.message)
    });
}

</script>

<style>
</style>

<template>
    <main >
      <nav
        class="navbar navbar-expand-sm fixed-top navbar-light bg-transparent"
        v-if="show_navbar"
      >
        <div class="container">
          <a class="navbar-brand" href="#">Navbar</a>
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
                <a class="nav-link active" href="#" aria-current="page"
                  >Home
                  <span class="visually-hidden">(current)</span></a
                >
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#">Link</a>
              </li>
              <li class="nav-item dropdown">
                <a
                  class="nav-link dropdown-toggle"
                  href="#"
                  id="dropdownId"
                  data-bs-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                  >Dropdown</a
                >
                <div
                  class="dropdown-menu"
                  aria-labelledby="dropdownId"
                >
                  <a class="dropdown-item" href="#"
                    >Action 1</a
                  >
                  <a class="dropdown-item" href="#"
                    >Action 2</a
                  >
                </div>
              </li>
            </ul>
            <button id="logout_btn" class="btn my-2 my-lg-0" @click="logout">
              Logout
            </button>
          </div>
        </div>
      </nav>
      
      <RouterView />
    </main>
</template>

<style>
.navbar{
  background-color: rgba(255, 255, 255, 0.5); /* Semi-transparent white background */
        backdrop-filter: blur(8px); /* Adjust blur amount as needed */
        -webkit-backdrop-filter: blur(8px); /* For Webkit browsers */
}
#logout_btn:hover{
  border: 1px black solid;
}

</style>