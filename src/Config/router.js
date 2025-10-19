// router.js
import { createWebHistory, createRouter } from 'vue-router'

// Pages
import Welcome from '../Welcome.vue'
import Login from '../Login.vue'
import Home from '../Home/Home.vue'
import Create_Mission from '../CreateMission/Create_Mission.vue'
import Mission_List from '../Mission_List.vue'
import FounderDashboard from '../FounderDashboard.vue'
import Mission_Feedback from '../mission_feedback.vue'
import Gambling from '@/Gambling.vue'

// Registration flow
import UserType from '@/composables/register/UserType.vue'
import RegisterTester from "@/composables/register/RegisterTester.vue"
import RegisterFounderAccount from "@/composables/register/founder/RegisterFounderAccount.vue"
import RegisterFounderCompany from "@/composables/register/founder/RegisterFounderCompany.vue"



// Firebase auth
import { auth } from './api_services'

const routes = [
  { path: '/', component: Welcome },

  // Auth-protected pages
  { path: '/home', component: Home, meta: { requiresAuth: true } },
  { path: '/mission/feedback/:missionId', component: Mission_Feedback, meta: { requiresAuth: true } },
  { path: '/dashboard', component: FounderDashboard, meta: { requiresAuth: true } },

  // Auth pages
  { path: '/login', component: Login },

  // Registration entry -> ALWAYS redirect to user type
  { path: '/register', redirect: '/register/type' },        
  { path: '/register/type', component: UserType, name: 'UserType' },
  
  { path: "/register/tester", component: RegisterTester, name: "RegisterTester" },
  { path: "/register/founder/account", component: RegisterFounderAccount, name: "RegisterFounderAccount" },
  { path: "/register/founder/company", component: RegisterFounderCompany, name: "RegisterFounderCompany" },

  {
    path: "/register/founder/account",
    component: () => import("@/composables/register/founder/RegisterFounderAccount.vue"),
    name: "FounderAccount"
  },
  {
    path: "/register/founder/company",
    component: () => import("@/composables/register/founder/RegisterFounderCompany.vue"),
    name: "FounderCompany"
  },

  // Other pages
  { path: '/createMission', component: Create_Mission , meta: { requiresAuth: true }},
  { path: '/missionList', component: Mission_List , meta: { requiresAuth: true }},

  // Fallback
  { path: '/:pathMatch(.*)*', redirect: '/' },
  { path: '/gambling', component: Gambling, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !auth.currentUser) {
    next('/login')
  } else {
    next()
  }
})

export default router
