<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card style="width: 400px; max-width: 90vw" class="q-pa-md">
      <q-card-section>
        <div class="text-h6">Register</div>
      </q-card-section>

      <q-card-section class="q-gutter-md">
        <q-input
          v-model="name"
          label="Full Name"
          outlined
          :rules="[(val) => !!val || 'Name is required']"
        />

        <q-input
          v-model="email"
          label="Email"
          type="email"
          outlined
          :rules="[
            (val) => !!val || 'Email is required',
            (val) => /.+@.+\..+/.test(val) || 'Invalid email',
          ]"
        />

        <q-input
          v-model="password"
          :type="isPwd ? 'password' : 'text'"
          label="Password"
          outlined
          hint="Min 8 characters, use letters, numbers, and symbols"
          :rules="[
            (val) => !!val || 'Password is required',
            (val) => val.length >= 8 || 'Password too short',
          ]"
        >
          <template #append>
            <q-icon
              :name="isPwd ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="isPwd = !isPwd"
            />
          </template>
        </q-input>

        <div
          class="text-caption"
          :class="{
            'text-negative': passwordStrength === 'weak',
            'text-warning': passwordStrength === 'medium',
            'text-positive': passwordStrength === 'strong',
          }"
        >
          Password strength: {{ passwordStrength }}
        </div>

        <q-checkbox v-model="agree" label="I agree to the Terms and Conditions" />
      </q-card-section>

      <q-card-actions align="right" class="q-gutter-sm">
        <q-btn label="Login" flat @click="$router.push('/login')" />
        <q-btn
          label="Register"
          color="primary"
          :disable="!isFormValid || isLoading"
          :loading="isLoading"
          @click="register"
        />
      </q-card-actions>

      <q-inner-loading :showing="isLoading" color="primary" />
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { auth } from 'src/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'vue-router'
import { doc, setDoc } from 'firebase/firestore'
import { db } from 'src/firebase'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()

const name = ref('')
const email = ref('')
const password = ref('')
const isPwd = ref(true)
const isLoading = ref(false)
const agree = ref(false)

// Password strength checker
const passwordStrength = computed(() => {
  const val = password.value
  if (val.length < 8) return 'weak'
  if (/[A-Z]/.test(val) && /\d/.test(val) && /\W/.test(val)) return 'strong'
  return 'medium'
})

// Enable register only when form is valid
const isFormValid = computed(
  () => name.value && /.+@.+\..+/.test(email.value) && password.value.length >= 8 && agree.value,
)

const register = async () => {
  if (!isFormValid.value) return

  isLoading.value = true
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
    const user = userCredential.user

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      name: name.value,
      createdAt: new Date(),
    })

    $q.notify({ type: 'positive', message: 'Registration successful!' })
    router.push('/dashboard')
  } catch (error) {
    console.error('Registration error:', error)
    let msg = 'Something went wrong'
    if (error.code === 'auth/email-already-in-use') {
      msg = 'Email already registered'
    } else if (error.code === 'auth/invalid-email') {
      msg = 'Invalid email format'
    } else if (error.code === 'auth/weak-password') {
      msg = 'Password is too weak'
    }

    $q.notify({ type: 'negative', message: msg })
  } finally {
    isLoading.value = false
  }
}
</script>
