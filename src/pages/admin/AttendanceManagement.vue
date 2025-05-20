<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">⏱️ Attendance Management</div>

    <q-card class="q-pa-md">
      <div class="text-h6 q-mb-md">Mark Attendance</div>
      <q-select
        v-model="attendanceRecord.employeeId"
        :options="employeeOptions"
        label="Employee"
        option-label="name"
        option-value="value"
      />
      <q-input v-model="attendanceRecord.date" label="Date" type="date" />
      <q-input v-model="attendanceRecord.checkInTime" label="Check-In Time" type="time" />
      <q-input v-model="attendanceRecord.checkOutTime" label="Check-Out Time" type="time" />
      <q-checkbox v-model="attendanceRecord.isHalfDay" label="Half Day" />
      <q-btn
        color="primary"
        label="Mark Attendance"
        @click="markNewAttendance"
        :loading="isMarkingAttendance"
      />
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore'
import { useQuasar } from 'quasar'

const db = getFirestore()
const { $q } = useQuasar()

// Mark Attendance
const attendanceRecord = ref({
  employeeId: null,
  date: '',
  checkInTime: '',
  checkOutTime: '',
  isHalfDay: false,
})
const isMarkingAttendance = ref(false)
const employeeOptions = ref([])

onMounted(() => {
  fetchEmployeeOptions()
})

async function fetchEmployeeOptions() {
  try {
    const snapshot = await getDocs(collection(db, 'employees'))
    employeeOptions.value = snapshot.docs.map((doc) => ({
      label: doc.data().name,
      value: doc.id,
    }))
  } catch (error) {
    console.error('Error fetching employees:', error)
    $q.notify({
      message: 'Could not fetch employee list!',
      color: 'negative',
    })
  }
}

async function markNewAttendance() {
  isMarkingAttendance.value = true
  try {
    const checkInTimeString =
      attendanceRecord.value.date + 'T' + attendanceRecord.value.checkInTime + ':00.000Z'
    const checkOutTimeString =
      attendanceRecord.value.date + 'T' + attendanceRecord.value.checkOutTime + ':00.000Z'
    const checkInTime = new Date(checkInTimeString)
    const checkOutTime = attendanceRecord.value.checkOutTime ? new Date(checkOutTimeString) : null

    await addDoc(collection(db, 'attendance'), {
      employeeId: attendanceRecord.value.employeeId,
      date: attendanceRecord.value.date,
      checkInTime: checkInTime,
      checkOutTime: checkOutTime,
      isHalfDay: attendanceRecord.value.isHalfDay,
      timestamp: new Date(),
    })
    $q.notify({
      message: 'Attendance marked successfully!',
      color: 'positive',
    })
    attendanceRecord.value = {
      employeeId: null,
      date: '',
      checkInTime: '',
      checkOutTime: '',
      isHalfDay: false,
    }
  } catch (error) {
    console.error('Error marking attendance:', error)
    $q.notify({
      message: 'Could not mark attendance!',
      color: 'negative',
    })
  } finally {
    isMarkingAttendance.value = false
  }
}
</script>
