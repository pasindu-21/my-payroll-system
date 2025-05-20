<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">👤 My Attendance & Salary</div>

    <q-card flat bordered class="q-pa-md q-mb-md">
      <div class="text-subtitle1 q-mb-md">⏳ Attendance Marking</div>
      <div class="row q-gutter-md">
        <q-btn
          color="primary"
          label="Check In"
          @click="showCheckInDialog"
          :disable="isCheckedIn"
          :loading="isCheckingIn"
        />
        <q-btn
          color="secondary"
          label="Check Out"
          @click="checkOut"
          :disable="!isCheckedIn"
          :loading="isCheckingOut"
        />
      </div>
      <div class="q-mt-sm" v-if="attendanceMessage">{{ attendanceMessage }}</div>
    </q-card>

    <q-card flat bordered class="q-pa-md q-mb-md">
      <div class="text-subtitle1 q-mb-md">📅 Attendance History</div>
      <q-table
        flat
        bordered
        dense
        :rows="attendanceHistory"
        :columns="attendanceColumns"
        row-key="id"
        v-if="attendanceHistory.length > 0"
      />
      <div v-else class="text-caption text-grey-8">No attendance records yet.</div>
    </q-card>

    <q-card flat bordered class="q-pa-md">
      <div class="text-subtitle1 q-mb-md">💰 Salary Details</div>

      <div><b>Daily Salary:</b> ($1000)</div>
      <div><b>Total Working Days:</b> {{ totalWorkingDays }}</div>
      <div><b>Half Days:</b> {{ halfDaysCount }} (Payment per half day: $500.00)</div>
      <div><b>OT Hours:</b> {{ otHours }} (Payment per OT hour: $100.00)</div>
      <q-separator class="q-my-sm" />
      <div class="text-subtitle1 q-mb-md">Salary Calculation</div>
      <div>
        <b>Salary for Full Days:</b>
        ${{ (minimumDailyWage * (totalWorkingDays || 0)).toFixed(2) }}
      </div>
      <div><b>Payment for Half Days:</b> ${{ halfDayPayment.toFixed(2) }}</div>
      <div><b>Payment for OT:</b> ${{ otPayment.toFixed(2) }}</div>
      <q-separator class="q-my-sm" />
      <div class="text-h6"><b>Net Salary:</b> ${{ netSalaryEmployee.toFixed(2) }}</div>
    </q-card>

    <q-dialog v-model="checkInDialog">
      <q-card>
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="info" color="primary" size="24px" />
          <span class="text-h6">Check In Type</span>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-radio v-model="checkInType" val="fullDay" label="Full Day" />
          <q-radio v-model="checkInType" val="halfDay" label="Half Day" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn color="secondary" label="Cancel" @click="checkInDialog = false" />
          <q-btn
            color="primary"
            label="Confirm"
            @click="confirmCheckIn"
            :loading="isCheckingIn"
            :disable="!checkInType"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
  orderBy,
  limit,
} from 'firebase/firestore'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useUserStore } from 'src/stores/userStore'
import { storeToRefs } from 'pinia'
import { Notify } from 'quasar'

const db = getFirestore()
const auth = getAuth()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

// States
const attendanceData = ref([])
const attendanceHistory = ref([])
const workingHoursPerDay = ref(8)
const halfDayWorkingHours = ref(4)
const basicSalary = ref(0)
const isCheckingIn = ref(false)
const isCheckingOut = ref(false)
const isCheckedIn = ref(false)
const attendanceMessage = ref('')
const checkInDialog = ref(false)
const checkInType = ref(null)
const minimumDailyWage = ref(1000) // දවසකට අවම වැටුප රුපියල් 1000යි
const minimumHalfDayWage = ref(500) // අර්ධ දවසකට අවම වැටුප රුපියල් 500යි

// Table columns
const attendanceColumns = [
  {
    name: 'checkInTime',
    align: 'left',
    label: 'Check In Time',
    field: (row) =>
      row.checkInTime?.seconds ? new Date(row.checkInTime.seconds * 1000).toLocaleString() : '-',
  },
  {
    name: 'checkOutTime',
    align: 'left',
    label: 'Check Out Time',
    field: (row) =>
      row.checkOutTime?.seconds ? new Date(row.checkOutTime.seconds * 1000).toLocaleString() : '-',
  },
  { name: 'isHalfDay', align: 'left', label: 'Half Day', field: 'isHalfDay' },
]

// Computed
const totalWorkingDays = computed(
  () =>
    attendanceData.value.filter(
      (record) => record.checkInTime && record.checkOutTime && !record.isHalfDay,
    ).length,
)

const halfDaysCount = computed(
  () => attendanceData.value.filter((record) => record.isHalfDay).length,
)

const halfDayPayment = computed(() => {
  return (halfDaysCount.value || 0) * 500 // අර්ධ දවසකට රුපියල් 500යි
})

const otHours = computed(() => {
  let totalOt = 0
  attendanceData.value.forEach((record) => {
    if (record.checkInTime && record.checkOutTime && !record.isHalfDay) {
      const checkIn = new Date(record.checkInTime.seconds * 1000)
      const checkOut = new Date(record.checkOutTime.seconds * 1000)
      const workedHours = (checkOut - checkIn) / (1000 * 60 * 60)
      if (workedHours > workingHoursPerDay.value) {
        totalOt += Math.floor(workedHours - workingHoursPerDay.value) // දශම ගණන් ඉවත් කරන්න
      }
    }
  })
  return totalOt
})

const otPayment = computed(() => otHours.value * 100)

const dailySalary = computed(() => {
  return basicSalary.value / 20
})

const netSalaryEmployee = computed(() => {
  const fullDaySalaryCalculated = (totalWorkingDays.value || 0) * dailySalary.value
  const halfDayPaymentCalculated = (halfDaysCount.value || 0) * 500
  const otPaymentCalculated = otPayment.value

  let finalSalary = fullDaySalaryCalculated + halfDayPaymentCalculated + otPaymentCalculated

  const minimumSalaryForFullDays = (totalWorkingDays.value || 0) * minimumDailyWage.value
  const minimumSalaryForHalfDays = (halfDaysCount.value || 0) * minimumHalfDayWage.value
  const totalMinimumSalary = minimumSalaryForFullDays + minimumSalaryForHalfDays

  if (finalSalary < totalMinimumSalary) {
    finalSalary = totalMinimumSalary + otPaymentCalculated // OT එකත් අනිවාර්යයෙන් එකතු කරන්න
  }

  return finalSalary
})

// Methods
const showCheckInDialog = () => {
  checkInType.value = null
  checkInDialog.value = true
}

const confirmCheckIn = async () => {
  if (!checkInType.value) {
    Notify.create({ type: 'warning', message: 'Please select Check In type.' })
    return
  }
  isCheckingIn.value = true
  attendanceMessage.value = ''
  checkInDialog.value = false
  try {
    await addDoc(collection(db, 'attendance'), {
      employeeId: user.value.uid,
      checkInTime: serverTimestamp(),
      checkOutTime: null,
      isHalfDay: checkInType.value === 'halfDay',
    })
    Notify.create({
      type: 'positive',
      message: `Checked in as ${checkInType.value === 'halfDay' ? 'Half Day' : 'Full Day'}!`,
    })
    await fetchAttendanceData()
    await fetchAttendanceHistory()
  } catch (error) {
    Notify.create({ type: 'negative', message: `Error checking in: ${error.message}` })
    attendanceMessage.value = `Error: ${error.message}`
  } finally {
    isCheckingIn.value = false
  }
}

const checkOut = async () => {
  isCheckingOut.value = true
  attendanceMessage.value = ''
  try {
    const q = query(
      collection(db, 'attendance'),
      where('employeeId', '==', user.value.uid),
      where('checkOutTime', '==', null),
      orderBy('checkInTime', 'desc'),
      limit(1),
    )
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const attendanceDoc = snapshot.docs[0]
      const attendanceDocRef = attendanceDoc.ref
      const data = attendanceDoc.data()
      const checkInTime = data.checkInTime?.seconds
        ? new Date(data.checkInTime.seconds * 1000)
        : null
      const checkOutTime = new Date()

      if (checkInTime) {
        const workedHours = (checkOutTime - checkInTime) / (1000 * 60 * 60)
        const isHalfDay = workedHours < halfDayWorkingHours.value

        await updateDoc(attendanceDocRef, {
          checkOutTime: serverTimestamp(),
          isHalfDay: isHalfDay,
        })

        Notify.create({
          type: 'positive',
          message: `Checked out successfully! Worked: ${workedHours.toFixed(2)} hrs (${
            isHalfDay ? 'Half Day' : 'Full Day'
          })`,
        })
      }
      await fetchAttendanceData()
      await fetchAttendanceHistory()
    } else {
      Notify.create({ type: 'warning', message: 'No active check-in found.' })
      attendanceMessage.value = 'No active check-in found.'
    }
  } catch (error) {
    Notify.create({ type: 'negative', message: `Error checking out: ${error.message}` })
    attendanceMessage.value = `Error: ${error.message}`
  } finally {
    isCheckingOut.value = false
  }
}

const fetchAttendanceData = async () => {
  if (user.value?.uid) {
    const q = query(
      collection(db, 'attendance'),
      where('employeeId', '==', user.value.uid),
      where('checkOutTime', '==', null),
    )
    const snapshot = await getDocs(q)
    isCheckedIn.value = !snapshot.empty
  }
}

const fetchAttendanceHistory = async () => {
  if (user.value?.uid) {
    const q = query(
      collection(db, 'attendance'),
      where('employeeId', '==', user.value.uid),
      orderBy('checkInTime', 'desc'),
    )
    const snapshot = await getDocs(q)
    attendanceHistory.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    const allQ = query(collection(db, 'attendance'), where('employeeId', '==', user.value.uid))
    const allSnapshot = await getDocs(allQ)
    attendanceData.value = allSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }
}

const fetchEmployeeData = async () => {
  if (user.value?.uid) {
    const q = query(collection(db, 'salary'), where('employeeId', '==', user.value.uid), limit(1))
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const salaryData = snapshot.docs[0].data()
      basicSalary.value = salaryData?.salary || 0
      workingHoursPerDay.value = salaryData?.workingHoursPerDay || 8
      halfDayWorkingHours.value = salaryData?.halfDayWorkingHours || 4
    } else {
      basicSalary.value = 0
      workingHoursPerDay.value = 8
      halfDayWorkingHours.value = 4
    }
  } else {
    basicSalary.value = 0
    workingHoursPerDay.value = 8
    halfDayWorkingHours.value = 4
  }
}

onMounted(() => {
  onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      await fetchEmployeeData()
      await fetchAttendanceData()
      await fetchAttendanceHistory()
    }
  })
})
</script>
