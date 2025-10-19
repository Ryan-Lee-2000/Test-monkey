// main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './Config/router'
import { auth, db, storage, claude } from './Config/api_services'
import "@/styles/global.css"

const app = createApp(App)

app.provide('auth', auth)
app.provide('db', db)
app.provide('storage', storage)
app.provide('claude', claude)

app.use(router)
app.mount('#app')