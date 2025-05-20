import { defineStore } from 'pinia'
import { doc, getDoc } from 'firebase/firestore'
import { db } from 'src/firebase'
import { auth } from 'src/firebase'

export const useUserStore = defineStore('user', {
  state: () => ({
    userData: null,
    user: null, // අලුතින් එකතු කළ state එක
  }),
  actions: {
    setUser(newUser) {
      this.user = newUser // setUser action එක
    },
    async fetchUserData() {
      const uid = auth.currentUser?.uid
      if (!uid) {
        this.userData = null // Clear user data if no user is logged in
        return
      }

      const docRef = doc(db, 'users', uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        this.userData = docSnap.data()
      } else {
        console.log('No user document found')
        this.userData = null // Clear user data if document doesn't exist
      }
    },
    clearUserData() {
      this.userData = null
      this.user = null
    },
  },
})
