<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { ref, onMounted } from "vue"
import { getAuth, onAuthStateChanged, signOut  } from "firebase/auth";
import { useRouter } from 'vue-router'
import Missions from "./User_Missions.vue";

const user_name = ref("")
const auth = getAuth();
const router = useRouter()
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/auth.user
    user_name.value = user.providerData[0].displayName
    // ...
  } else {
    // User is signed out
    console.log("User has been signed out")
  }
});

</script>

<template>
  <missions :user_name="user_name"/>
</template>

