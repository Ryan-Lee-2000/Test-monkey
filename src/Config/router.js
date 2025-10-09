// router.js
import { createWebHistory, createRouter } from 'vue-router'
import Welcome from '../Welcome.vue'
import Login from '../Login.vue'
import Register from '../Register.vue'
import Home from '../Home/Home.vue'
import Create_Mission from '../CreateMission/Create_Mission.vue'
import Mission_List from '../Mission_List.vue'
import { auth } from './api_services'

const routes = [
  { path: '/', component: Welcome },
  { path: '/home', component: Home, meta: { requiresAuth: true } },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/createMission', component: Create_Mission },
  { path: '/missionList', component: Mission_List },
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