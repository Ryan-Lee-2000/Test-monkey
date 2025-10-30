<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { ref, onMounted } from "vue"
import { getAuth, onAuthStateChanged, signOut  } from "firebase/auth";
import { useRouter } from 'vue-router'
import Missions from "./Available_Missions.vue";
import navbar from "@/navbar.vue";

const user_name = ref("")
const auth = getAuth();
const router = useRouter()

</script>

<template>
  <navbar/>
  <missions/>
</template>
