// router.js
import { createWebHistory, createRouter } from 'vue-router'

// Pages
import Welcome from '../Welcome.vue'
import Login from '../Login.vue'
import TesterDashboard from '../Home/TesterDashboard.vue'
import Create_Mission from '../CreateMission/Create_Mission.vue'
import FounderDashboard from '../FounderDashboard.vue'
import Mission_Feedback from '../mission_feedback.vue'
import Gambling from '@/Gambling/Gambling.vue'
import VoucherInventory from '@/Gambling/VoucherInventory.vue'
import MissionReportView from '../MissionReportView.vue'

// ✅ NEW: Import the new full-report view (kept old imports too)
import MissionFullReportView from '../MissionReport/views/MissionFullReportView.vue'

// Registration flow
import UserType from '@/composables/register/UserType.vue'
import RegisterTester from "@/composables/register/RegisterTester.vue"
import RegisterFounderAccount from "@/composables/register/founder/RegisterFounderAccount.vue"
import RegisterFounderCompany from "@/composables/register/founder/RegisterFounderCompany.vue"

// Firebase auth
import { auth } from './api_services'
import { getUserRole } from '../Database/Monkey_Store'

// For showing alerts from router
let showAlertFromRouter = null

export function setRouterAlertFunction(fn) {
  showAlertFromRouter = fn
}

const routes = [
  { path: '/', component: Welcome },

  // ✅ NEW: Add the Full Mission Report route EARLY so it matches before generic /dashboard
  {
    path: '/dashboard/:missionId',
    name: 'MissionFullReport',
    component: MissionFullReportView,
    props: true,
    meta: { requiresAuth: true }
  },

  // Auth-protected pages
  { path: '/home', component: TesterDashboard, meta: { requiresAuth: true } },
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

  // Gambling and voucher routes
  { path: '/gambling', component: Gambling, meta: { requiresAuth: true } },
  { path: '/voucher-inventory', component: VoucherInventory, meta: { requiresAuth: true } },

  // Fallback
  { path: '/:pathMatch(.*)*', redirect: '/' },

  // (Existing routes kept as-is — these remain but will be shadowed by the earlier, new route)
  {
    path: '/dashboard/:missionId',
    name: 'missionReport',
    component: MissionReportView,
    props: true, // This passes the :missionId from the URL as a prop
    meta: { requiresAuth: true }
  },

  {
    path: '/dashboard/:missionId',
    name: 'missionReport',
    component: MissionReportView, // Make sure to import this component
    props: true,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  // Check authentication first
  if (to.meta.requiresAuth && !auth.currentUser) {
    next('/login')
    return
  }

  // Check role-based access for authenticated users
  if (auth.currentUser) {
    try {
      const userRole = await getUserRole(auth.currentUser.uid)

      // Prevent Founders from accessing Tester-only pages
      if (userRole === 'Founder') {
        if (to.path === '/home') {
          // Redirect Founders trying to access /home to their dashboard
          next('/dashboard')
          return
        }
        if (to.path === '/gambling' || to.path === '/voucher-inventory') {
          // Founders cannot access gambling/vouchers
          if (showAlertFromRouter) {
            showAlertFromRouter('Gambling and vouchers are only available for Test Monkeys. As a Founder, you can use bananas to create missions.', { type: 'info', title: 'Access Restricted' })
          }
          next('/dashboard')
          return
        }
      }

      // Prevent Testers from accessing Founder-only pages
      if (userRole !== 'Founder') {
        if (to.path === '/dashboard' || to.path === '/createMission' || to.path.startsWith('/dashboard/')) {
          // Redirect Testers trying to access founder pages to their missions
          if (showAlertFromRouter) {
            showAlertFromRouter('This page is only available for Founders.', { type: 'info', title: 'Access Restricted' })
          }
          next('/home')
          return
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error)
    }
  }

  next()
})

export default router
