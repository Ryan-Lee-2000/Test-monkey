// main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './Config/router'
import { auth, db, storage } from './Config/api_services'
import "@/styles/global.css"

import { Roulette } from 'vue3-roulette'

const app = createApp(App)

app.provide('auth', auth)
app.provide('db', db)
app.provide('storage', storage)

app.component("roulette", Roulette)

app.use(router)
app.mount('#app')