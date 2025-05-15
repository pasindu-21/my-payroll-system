import { onAuthStateChanged } from 'firebase/auth'
import { auth } from 'src/firebase'
import { useUserStore } from 'src/stores/userStore'

export default async ({ router }) => {
  const store = useUserStore()

  onAuthStateChanged(auth, (user) => {
    store.setUser(user)

    // Logged in: redirect to dashboard if coming from login/register
    if (
      user &&
      (router.currentRoute.value.path === '/login' ||
        router.currentRoute.value.path === '/register')
    ) {
      router.push('/dashboard')
    }

    // Not logged in: restrict dashboard/employees
    if (!user && ['/dashboard', '/employees'].includes(router.currentRoute.value.path)) {
      router.push('/login')
    }
  })
}
