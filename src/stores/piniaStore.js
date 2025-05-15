// src/stores/userStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)

  function setUser(u) {
    user.value = u
  }

  function logout() {
    user.value = null
  }

  return { user, setUser, logout }
})
