import { createApp, provide } from 'vue'
import App from './App.vue'

//VueJS Router
import { createMemoryHistory, createRouter } from 'vue-router'

import Welcome from './Welcome.vue'
import Login from './Login.vue'
import Register from './Register.vue'
import Home from './Home.vue'

const routes = [
  { path: '/', component: Welcome },
  { path: '/home', component: Home },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
]

const router = createRouter({
  history: createMemoryHistory(),
  routes,
})

//Firebase
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth'

const firebaseConfig = {

  apiKey: import.meta.env.VITE_FIREBASE_KEY,

  authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN,

  projectId: import.meta.env.VITE_FIREBASE_PROJECTID,

  storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET,

  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGE_SENDER_ID,

  appId: import.meta.env.VITE_FIREBSSE_APPID,

  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,

};


// Initialize Firebase

initializeApp(firebaseConfig); //Firebase app
// const auth = getAuth(firebaseApp) //Firebase Authentication

//const analytics = getAnalytics(app);
const app = createApp(App)

app.use(router)
// app.provide('auth', auth)
app.mount('#app')
