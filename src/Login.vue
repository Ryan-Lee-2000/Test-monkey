<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { ref } from "vue"
import { getAuth, signInWithEmailAndPassword , updateProfile} from "firebase/auth"
import { useRouter, useRoute } from 'vue-router'

const email = ref("")
const pwd = ref("")

const router = useRouter()


function login(){
    signInWithEmailAndPassword(getAuth(), email.value,pwd.value).then((userCredential) =>{
        // console.log("User Login")
        router.push({path: '/Home'})
        //router.push({path: '/Home'})
    }).catch((error) =>{
        console.log(error.code)
        alert(error.message)
    })
}


</script>

<style>
    .cool-bg{
        background-image: linear-gradient(#0F2027, #203A43,#2C5364);

    }
</style>

<template >
  <div class="w-100 justify-content-center p-5 mx-auto cool-bg" style="height: 100vh;">
    
    <div class="container w-75 p-5 mx-auto border rounded-4 bg-dark bg-gradient bg-opacity-75">
        <div class="row">
            <div class="col-4 bg-primary me-2 placeholder"> </div>
            <div class="col">
                <h1 class="text-light mb-3">Login</h1>
                <div class="mb-3 mx-auto">
                    <label for="email_address" class="form-label text-light float-start px-1">Email</label>
                    <input
                        type="Email"
                        class="form-control"
                        name="email_address"
                        id="email_address"
                        aria-describedby="email"
                        placeholder="email"
                        v-model="email"
                    />
                </div>
                <div class="mb-3 mx-auto">
                    <label for="pwd" class="form-label text-light float-start px-1">Password</label>
                    <input
                        type="password"
                        class="form-control"
                        name="pwd"
                        id="pwd"
                        placeholder="Password"
                        v-model="pwd"
                    />
                </div>
                <div class="mt-5 mx-auto text-center">
                    <button
                        type="submit"
                        class="btn btn-primary mx-auto"
                        @click="login"
                    >
                        Login
                    </button>
                </div>
            </div>
        </div>
        
        
        
    </div>
  </div>
</template>
