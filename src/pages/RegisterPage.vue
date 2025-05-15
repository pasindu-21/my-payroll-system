<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card style="width: 400px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">Register</div>
      </q-card-section>

      <q-card-section class="q-gutter-md">
        <q-input v-model="name" label="Full Name" type="text" outlined />
        <q-input v-model="email" label="Email" type="email" outlined />

        <q-input
          v-model="password"
          label="Password"
          type="password"
          outlined
          hint="Min 8 chars, include letters, numbers, special characters"
        />
        <q-input v-model="photoURL" label="Photo URL (optional)" type="text" outlined />
      </q-card-section>

      <q-card-actions align="right" class="q-gutter-sm">
        <q-btn label="Login" flat @click="$router.push('/login')" />
        <q-btn label="Register" color="primary" @click="register" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { auth } from 'src/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'vue-router'
import { doc, setDoc } from 'firebase/firestore'
import { db } from 'src/firebase'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')

const photoURL = ref('')

const register = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
    const user = userCredential.user

    // Firestore වලට save කිරීම
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      name: name.value,
      photoURL: photoURL.value || '', // optional
      createdAt: new Date(),
    })

    router.push('/dashboard')
  } catch (error) {
    console.error('Registration error:', error)
    alert('Registration failed: ' + error.message)
  }
}
</script>
