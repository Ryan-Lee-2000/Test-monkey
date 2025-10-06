import { createApp, provide } from 'vue'
import App from './App.vue'

//Firebase
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserSessionPersistence, onAuthStateChanged  } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage, ref } from "firebase/storage";

//VueJS Router
import { createMemoryHistory, createRouter } from 'vue-router'

import Welcome from './Welcome.vue'
import Login from './Login.vue'
import Register from './Register.vue'
import Home from './Home/Home.vue'
import Create_Mission from './CreateMission/Create_Mission.vue';
import Mission_List from './Mission_List.vue';


//testing
if (import.meta.hot) {
   import.meta.hot.on('vite:beforeFullReload', () => {
      throw '(skipping full reload)';
   });
}

const firebaseConfig = {

  apiKey: import.meta.env.VITE_FIREBASE_KEY,

  authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN,

  projectId: import.meta.env.VITE_FIREBASE_PROJECTID,

  storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET,

  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGE_SENDER_ID,

  appId: import.meta.env.VITE_FIREBSSE_APPID,

  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,

};


const routes = [
  { path: '/', component: Welcome },
  { path: '/home', component: Home, meta:{requiresAuth: true} },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/createMission', component: Create_Mission },
  { path: '/missionList', component: Mission_List },
]

const router = createRouter({
  history: createMemoryHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const auth = getAuth()

  if (to.meta.requiresAuth) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        next()
      } else {
        next('/login')
      }
    })
  } else {
    next()
  }
})



// Initialize Firebase

const firebase_app = initializeApp(firebaseConfig); //Firebase app
// const auth = getAuth(firebaseApp) //Firebase Authentication

//const analytics = getAnalytics(app);
const app = createApp(App)
const db = getFirestore(firebase_app);

const auth = getAuth(firebase_app)

const storage = getStorage(firebase_app);
setPersistence(auth, browserSessionPersistence)
export { db, storage };

app.use(router)
// app.provide('auth', auth)
app.mount('#app')
