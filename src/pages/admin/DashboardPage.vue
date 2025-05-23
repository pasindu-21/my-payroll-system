<template>
  <q-page class="q-pa-md">
    <!-- Sticky Header with Profile Dropdown -->
    <q-header elevated class="bg-white text-primary q-pa-sm" reveal>
      <q-toolbar>
        <q-toolbar-title>Dashboard</q-toolbar-title>
        <q-space />
        <q-btn round flat icon="account_circle">
          <q-menu>
            <q-list style="min-width: 150px">
              <q-item clickable @click="router.push('/profile')">
                <q-item-section>Profile</q-item-section>
              </q-item>
              <q-item clickable @click="logout">
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Loader -->
    <q-inner-loading :showing="loading">
      <q-spinner size="50px" color="primary" />
    </q-inner-loading>

    <transition name="fade">
      <div v-if="!loading">
        <!-- Greeting and User Info -->
        <div class="row items-center q-mb-md">
          <q-avatar size="56px" class="q-mr-md">
            <img :src="user?.photoURL || 'https://cdn.quasar.dev/img/avatar.png'" />
          </q-avatar>
          <div>
            <div class="text-h6">{{ getGreeting() }}, {{ user?.name || 'User' }} 👋</div>
            <div class="text-caption text-grey">Logged in as: {{ user?.email }}</div>
            <div v-if="isAdmin" class="text-caption text-red">Admin Access</div>
          </div>
        </div>

        <!-- Quick Actions -->
        <q-btn-group push class="q-mb-md">
          <q-btn label="Go to Employees" color="primary" icon="person_add" to="/employees" />
          <q-btn label="Salary Management" color="primary" icon="attach_money" to="/salaries" />
        </q-btn-group>

        <!-- Stat Cards -->
        <div class="row q-col-gutter-md q-mb-md">
          <q-card class="col-6 col-sm-3 q-pa-md text-center bg-blue-1 shadow-1">
            <q-icon name="groups" size="36px" class="text-primary q-mb-sm" />
            <div class="text-subtitle2">Employees</div>
            <div class="text-h6">{{ employeeCount }}</div>
          </q-card>
          <q-card class="col-6 col-sm-3 q-pa-md text-center bg-green-1 shadow-1">
            <q-icon name="business" size="36px" class="text-positive q-mb-sm" />
            <div class="text-subtitle2">Departments</div>
            <div class="text-h6">{{ departmentCount }}</div>
          </q-card>
          <q-card class="col-6 col-sm-3 q-pa-md text-center bg-yellow-1 shadow-1">
            <q-icon name="trending_up" size="36px" class="text-warning q-mb-sm" />
            <div class="text-subtitle2">Growth</div>
            <div class="text-h6">{{ (growthRate * 100).toFixed(0) }}%</div>
          </q-card>
          <q-card class="col-6 col-sm-3 q-pa-md text-center bg-grey-1 shadow-1">
            <q-icon name="dark_mode" size="36px" class="text-grey-8 q-mb-sm" />
            <q-toggle v-model="darkMode" />
            <div class="text-caption">Dark Mode</div>
          </q-card>
        </div>

        <!-- Chart Section Placeholder -->
        <q-card class="q-pa-md q-mb-md shadow-1">
          <div class="text-subtitle1 q-mb-md">📊 Employee Distribution</div>
          <div class="text-caption">(Chart Placeholder - connect chart library like Chart.js)</div>
        </q-card>

        <!-- Notifications -->
        <q-card flat bordered class="shadow-2 q-pa-md q-mt-md">
          <div class="text-subtitle1 q-mb-sm font-medium">🔔 Notifications</div>
          <q-list dense separator bordered>
            <q-item v-for="note in notifications" :key="note.id">
              <q-item-section>
                <div>{{ note.message }}</div>
                <div class="text-caption text-grey-6">{{ formatDate(note.timestamp) }}</div>
              </q-item-section>
            </q-item>
            <q-item v-if="notifications.length === 0">
              <q-item-section class="text-grey-6">No new notifications 📭</q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Recent Activity Placeholder -->
        <q-card class="q-pa-md q-mt-md shadow-1">
          <div class="text-subtitle1 q-mb-sm">📝 Recent Activity</div>
          <div class="text-caption">(Feature coming soon...)</div>
        </q-card>
      </div>
    </transition>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from 'src/firebase'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { db } from 'src/firebase'
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore'
import { Dark } from 'quasar'

const router = useRouter()
const loading = ref(true)
const user = ref(null)
const isAdmin = ref(false)
const employeeCount = ref(0)
const departmentCount = ref(4) // placeholder
const notifications = ref([])
const growthRate = ref(0.12)

// Initialize dark mode with current Quasar setting
const darkMode = ref(Dark.isActive)

// Watch darkMode and toggle Quasar dark mode
watch(darkMode, (val) => {
  Dark.set(val)
})

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString()
}

const fetchUserData = async (uid) => {
  const docRef = doc(db, 'users', uid)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    user.value = docSnap.data()
    isAdmin.value = user.value.role === 'admin'
  }
}

const fetchEmployeesData = async () => {
  const snapshot = await getDocs(collection(db, 'employees'))
  employeeCount.value = snapshot.size
}

const listenNotifications = () => {
  const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(5))
  onSnapshot(q, (snapshot) => {
    notifications.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  })
}

const logout = async () => {
  await signOut(auth)
  router.push('/login')
}

onMounted(() => {
  onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      // Await all async calls before removing loading spinner
      await fetchUserData(currentUser.uid)
      await fetchEmployeesData()
      listenNotifications()
      loading.value = false
    } else {
      router.push('/login')
    }
  })
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
