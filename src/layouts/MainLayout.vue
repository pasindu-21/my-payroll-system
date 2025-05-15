<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>Payroll System</q-toolbar-title>
        <q-btn flat label="Dashboard" to="/dashboard" />
        <q-btn flat label="Employees" to="/employees" />
        <q-btn flat label="Logout" @click="logout" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { auth } from 'src/firebase'
import { signOut } from 'firebase/auth'
import { useUserStore } from 'src/stores/userStore'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const logout = async () => {
  await signOut(auth)
  userStore.logout()
  router.push('/login')
}
</script>
