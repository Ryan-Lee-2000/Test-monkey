<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { ref } from "vue"
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from "firebase/auth"
import { useRouter, useRoute } from 'vue-router'

import { createUser } from "./Database/Monkey_Store"

const username = ref("")
const email = ref("")
const pwd = ref("")
const c_pwd = ref("")
const router = useRouter()

function register(){
    if(pwd.value == c_pwd.value){
        finalize_register() //Super basic check done
    }else{
        console.log("Error: password not the same.")
    }
}

function finalize_register(){
    //Now we create user using Email and Password
    createUserWithEmailAndPassword(getAuth(), email.value, pwd.value).then((userCredential) =>{
        //console.log("sucesss") //User has been created
        updateProfile(userCredential.user, {
            displayName: username.value
            }).then(() => {
            // console.log("profile updated!")
            createUser([userCredential.user.uid,username.value,['24','Sports,Movies','Poly','M','SG']])
            router.push({path: '/Home'}) //Going Home page
            }).catch((error) => {
            // An error occurred
            // ...
            console.log(error.code)
            alert(error.message)
        });
    }).catch((error) => {
        //There's an error when creating user
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
    
    <div class="container w-75 pe-5 mx-auto rounded-4 bg-dark bg-gradient bg-opacity-75">
        <div class="row">
            <div class="col-5 col-sm-5 col-md-3 bg-primary me-2 placeholder "> </div>
            <div class="col my-5">
                <h1 class="text-light mb-3">Register</h1>
                <div class="mb-3 mx-auto">
                    <label for="Username" class="form-label text-light float-start px-1">Username</label>
                    <input
                        type="text"
                        class="form-control"
                        name="Username"
                        id="Username"
                        aria-describedby="Username"
                        placeholder="Username"
                        v-model="username"
                    />
                </div>
                <div class="mb-3 mx-auto">
                    <label for="email_address" class="form-label text-light float-start px-1">Email</label>
                    <input
                        type="email"
                        class="form-control"
                        name="email_address"
                        id="email_address"
                        aria-describedby="email"
                        placeholder="Email"
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
                <div class="mb-3 mx-auto">
                    <label for="c_pwd" class="form-label text-light float-start px-1">Confirm Password</label>
                    <input
                        type="password"
                        class="form-control"
                        name="c_pwd"
                        id="c_pwd"
                        placeholder="Confirm Password"
                        v-model="c_pwd"
                    />
                </div>
                <div class="mt-5 mx-auto text-center">
                    <button
                        type="submit"
                        class="btn btn-primary mx-auto"
                        @click="register"
                    >
                        Register
                    </button>
                </div>
            </div>
        </div>
        
        
        
    </div>
  </div>
</template>
