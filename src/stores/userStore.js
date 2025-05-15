import { defineStore } from 'pinia'
import { doc, getDoc } from 'firebase/firestore'
import { db } from 'src/firebase'
import { auth } from 'src/firebase'

export const useUserStore = defineStore('user', {
  state: () => ({
    userData: null,
  }),
  actions: {
    async fetchUserData() {
      const uid = auth.currentUser?.uid
      if (!uid) return

      const docRef = doc(db, 'users', uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        this.userData = docSnap.data()
      } else {
        console.log('No user document found')
      }
    },
  },
})
