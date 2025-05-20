import { onAuthStateChanged } from 'firebase/auth'
import { auth } from 'src/firebase'
import { useUserStore } from 'src/stores/userStore'

export default async ({ router }) => {
  const store = useUserStore()

  onAuthStateChanged(auth, async (user) => {
    await store.setUser(user)

    const path = router.currentRoute.value.path
    const isAdmin = store.role === 'admin'

    if (user) {
      if (['/login', '/register'].includes(path)) {
        router.push('/dashboard')
      }
      if (path === '/salaries' && !isAdmin) {
        router.push('/dashboard')
      }
    } else {
      if (['/dashboard', '/employees', '/salaries'].includes(path)) {
        router.push('/login')
      }
    }
  })
}
