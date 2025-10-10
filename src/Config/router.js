// router.js
import { createWebHistory, createRouter } from 'vue-router'
import Welcome from '../Welcome.vue'
import Login from '../Login.vue'
import Register from '../Register.vue'
import Home from '../Home/Home.vue'
import Create_Mission from '../CreateMission/Create_Mission.vue'
import Mission_List from '../Mission_List.vue'
import { auth } from './api_services'
import FounderDashboard from '../FounderDashboard.vue';
import Mission_Feedback from '../mission_feedback.vue'

const routes = [
  { path: '/', component: Welcome },
  { path: '/home', component: Home, meta: { requiresAuth: true } },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/createMission', component: Create_Mission },
  { path: '/missionList', component: Mission_List },
  { path: '/mission/feedback/:missionId', component: Mission_Feedback, meta: { requiresAuth: true }},
  { path: '/dashboard', component: FounderDashboard, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !auth.currentUser) {
    next('/login');
  } else {
    next();
  }
});

export default router;