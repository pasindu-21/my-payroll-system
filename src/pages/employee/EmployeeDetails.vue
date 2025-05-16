<template>
  <q-avatar size="56px" class="q-mr-md">
    <img :src="user?.photoURL || 'https://cdn.quasar.dev/img/avatar.png'" />
  </q-avatar>
  <q-avatar size="80px" class="q-mb-sm" v-if="employee.photoUrl">
    <img :src="employee.photoUrl" alt="Employee Photo" />
  </q-avatar>

  <q-avatar size="80px" class="q-mb-sm" v-if="user && user.photoURL">
    <img :src="user.photoURL" alt="User Profile" />
  </q-avatar>

  <q-page class="q-pa-md">
    <!-- User Profile Section -->
    <div v-if="user" class="profile-container q-mb-lg">
      <q-avatar size="80px" class="q-mb-sm" v-if="user.photoURL">
        <img :src="user.photoURL" alt="User Profile" />
      </q-avatar>
      <div class="text-h6">{{ user.displayName || 'User' }}</div>
      <div class="text-subtitle2">{{ user.email }}</div>
    </div>
    <div v-else class="text-caption q-mb-lg">No user logged in.</div>

    <q-card flat bordered class="q-pa-md">
      <div class="text-h6 q-mb-md">👤 Employee Details</div>

      <!-- Loading Skeleton -->
      <q-skeleton v-if="loading" type="QCard" height="180px" />

      <div v-else>
        <q-item>
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white" size="56px">
              {{ initials }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-h6">{{ employee.name || 'N/A' }}</q-item-label>
            <q-item-label caption>{{ employee.position || 'N/A' }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator spaced />

        <q-list bordered padding>
          <q-item>
            <q-item-section>📧 Email</q-item-section>
            <q-item-section>{{ employee.email || 'N/A' }}</q-item-section>
          </q-item>

          <q-item>
            <q-item-section>📱 Phone</q-item-section>
            <q-item-section>{{ employee.phone || 'N/A' }}</q-item-section>
          </q-item>

          <q-item>
            <q-item-section>📅 Joined On</q-item-section>
            <q-item-section>{{ formatDate(employee.joinDate) }}</q-item-section>
          </q-item>

          <q-item>
            <q-item-section>💼 Position</q-item-section>
            <q-item-section>{{ employee.position || 'N/A' }}</q-item-section>
          </q-item>

          <q-item>
            <q-item-section>💰 Salary</q-item-section>
            <q-item-section>${{ employee.salary?.toFixed(2) || 'N/A' }}</q-item-section>
          </q-item>
        </q-list>

        <div class="q-mt-md q-gutter-sm">
          <q-btn flat label="⬅ Back" @click="$router.back()" />
          <q-btn icon="picture_as_pdf" label="Export PDF" color="secondary" @click="exportToPDF" />
        </div>
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { format } from 'date-fns'
import jsPDF from 'jspdf'

import { getAuth, onAuthStateChanged } from 'firebase/auth'

// Reactive refs
const user = ref(null)
const employee = ref({})
const loading = ref(true)

const route = useRoute()
const router = useRouter()

// Fetch current logged-in user info
onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
  })
})

// Fetch employee details by ID from route params
onMounted(async () => {
  const id = route.params.id
  if (!id) {
    // No ID - redirect back
    router.back()
    return
  }

  try {
    const docRef = doc(db, 'employees', id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      employee.value = { id, ...docSnap.data() }
    } else {
      // No such employee, go back or handle error
      router.back()
    }
  } catch (error) {
    console.error('Error fetching employee:', error)
  } finally {
    loading.value = false
  }
})

// Compute initials from employee name
const initials = computed(() => {
  if (!employee.value.name) return 'E'
  return employee.value.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
})

// Format Firestore Timestamp to readable date
function formatDate(timestamp) {
  if (!timestamp) return 'N/A'
  try {
    const date = timestamp.toDate()
    return format(date, 'PPP') // e.g. Jan 10, 2024
  } catch {
    return 'Invalid date'
  }
}

// Export displayed data to PDF
function exportToPDF() {
  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.text('Employee Details', 10, 10)

  const lineHeight = 10
  let y = 20

  doc.setFontSize(12)
  doc.text(`Name: ${employee.value.name || 'N/A'}`, 10, y)
  y += lineHeight
  doc.text(`Position: ${employee.value.position || 'N/A'}`, 10, y)
  y += lineHeight
  doc.text(`Email: ${employee.value.email || 'N/A'}`, 10, y)
  y += lineHeight
  doc.text(`Phone: ${employee.value.phone || 'N/A'}`, 10, y)
  y += lineHeight
  doc.text(`Joined On: ${formatDate(employee.value.joinDate)}`, 10, y)
  y += lineHeight
  doc.text(`Salary: $${employee.value.salary?.toFixed(2) || 'N/A'}`, 10, y)

  doc.save(`${employee.value.name || 'employee'}_details.pdf`)
}
</script>

<style scoped>
.profile-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
