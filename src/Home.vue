<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { getAuth, onAuthStateChanged, signOut  } from "firebase/auth";
import { useRouter, useRoute } from 'vue-router'
import { ref } from "vue";


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
<style lang="">
    
</style>

<template>
    <div class="p-2">
        <div>
            <h1>Hello, {{user_name}}!</h1>
        </div>
        <button @click="logout" class="btn btn-primary">Logout</button>
    </div>
</template>
