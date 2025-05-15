<template>
  <q-page class="q-pa-md">
    <!-- User Info -->
    <div class="row items-center q-mb-md">
      <q-avatar size="56px" class="q-mr-md">
        <img :src="user?.photoURL || 'https://cdn.quasar.dev/img/avatar.png'" />
      </q-avatar>
      <div>
        <div class="text-h6">Welcome, {{ user?.name || 'User' }} 👋</div>
        <div class="text-caption text-grey">Logged in as: {{ user?.email }}</div>
      </div>
    </div>

    <!-- Stats -->
    <div class="row q-col-gutter-md q-mb-md">
      <q-card class="col-12 col-sm-6" flat bordered>
        <q-card-section>
          <div class="text-subtitle2">📊 Total Employees</div>
          <div class="text-h6 text-primary">{{ employeeCount }}</div>
        </q-card-section>
      </q-card>
      <q-card class="col-12 col-sm-6" flat bordered>
        <q-card-section>
          <div class="text-subtitle2">🌗 Dark Mode</div>
          <q-toggle
            v-model="darkMode"
            checked-icon="dark_mode"
            unchecked-icon="light_mode"
            color="grey-8"
            @update:model-value="toggleDark"
          />
        </q-card-section>
      </q-card>
    </div>

    <!-- Chart -->
    <q-card class="q-mb-md" flat bordered>
      <q-card-section>
        <div class="text-subtitle2 q-mb-sm">📈 Employee Overview</div>
        <EmployeeChart :chartData="chartData" />
      </q-card-section>
    </q-card>

    <!-- Controls -->
    <div class="q-mt-md">
      <q-btn label="Go to Employee List" to="/employees" color="primary" class="q-mr-sm" />
      <q-btn label="Logout" color="negative" @click="logout" />
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from 'src/firebase'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from 'src/firebase'
import { Notify, Dark } from 'quasar'
import EmployeeChart from 'src/components/Nav/EmployeeChart.vue'

// router
const router = useRouter()

// states
const user = ref(null)
const employeeCount = ref(0)
const darkMode = ref(Dark.isActive)
const chartData = ref({
  labels: ['HR', 'Tech', 'Finance', 'Admin'],
  datasets: [
    {
      label: 'Employees',
      backgroundColor: '#1976D2',
      data: [4, 8, 5, 3], // Dummy data, replace with Firestore counts if needed
    },
  ],
})

// 🔁 Toggle Dark Mode
const toggleDark = () => {
  Dark.toggle()
}

// Fetch user data from Firestore
const fetchUserData = async (uid) => {
  const docRef = doc(db, 'users', uid)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    user.value = docSnap.data()
  }
}

// 🔔 On Mount: check auth, load data
onMounted(() => {
  onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      await fetchUserData(currentUser.uid)

      Notify.create({
        message: `Welcome, ${user.value?.name || currentUser.email}!`,
        color: 'positive',
        position: 'top',
        timeout: 3000,
        icon: 'emoji_emotions',
      })

      const snapshot = await getDocs(collection(db, 'employees'))
      employeeCount.value = snapshot.size
    } else {
      router.push('/login')
    }
  })
})

// 🚪 Logout
const logout = async () => {
  await signOut(auth)
  router.push('/login')
}
</script>
