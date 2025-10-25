import { ref } from 'vue'
import { getAuth } from 'firebase/auth'
import { getUserRole, getBananaBalance } from '../Database/Monkey_Store'

const userRole = ref('')
const bananaBalance = ref(0)
const isLoaded = ref(false)

export function useUserData() {
  const auth = getAuth()

  async function loadUserData(forceReload = false) {
    if ((isLoaded.value && !forceReload) || !auth.currentUser) return
    
    const roleResponse = await getUserRole(auth.currentUser.uid)
    userRole.value = roleResponse
    
    if(roleResponse === 'Founder'){
      bananaBalance.value = await getBananaBalance(auth.currentUser.uid, 'Founder')
    } else {
      bananaBalance.value = await getBananaBalance(auth.currentUser.uid, 'TestMonkey')
    }
    
    isLoaded.value = true
  }

  async function refreshBalance() {
    if (!auth.currentUser) return
    
    if (userRole.value === 'Founder') {
      bananaBalance.value = await getBananaBalance(auth.currentUser.uid, 'Founder')
    } else {
      bananaBalance.value = await getBananaBalance(auth.currentUser.uid, 'TestMonkey')
    }
  }

  function resetUserData() {
    userRole.value = ''
    bananaBalance.value = 0
    isLoaded.value = false
  }

  return {
    userRole,
    bananaBalance,
    isLoaded,
    loadUserData,
    refreshBalance,
    resetUserData
  }
}