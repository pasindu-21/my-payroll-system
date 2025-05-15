<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card style="width: 400px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">Login</div>
      </q-card-section>

      <q-card-section class="q-gutter-md">
        <q-input v-model="email" label="Email" type="email" outlined />
        <q-input v-model="password" label="Password" type="password" outlined />
      </q-card-section>

      <q-card-actions align="right" class="q-gutter-sm">
        <q-btn label="Login" color="primary" @click="loginUser" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { auth } from '../firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')

const loginUser = async () => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    console.log('Logged in:', userCredential.user)
    router.push('/dashboard') // success → go to dashboard
  } catch (err) {
    console.error('Login Error:', err.message)
    alert('Login failed: ' + err.message)
  }
}
</script>
