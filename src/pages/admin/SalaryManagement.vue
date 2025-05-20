<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">💰 Salary Management</div>

    <q-card flat bordered class="q-pa-md">
      <div class="text-subtitle1 q-mb-md">💸 Generate Salary</div>
      <q-select
        outlined
        dense
        v-model="selectedEmployeeId"
        :options="employeeOptions"
        label="Select Employee"
        class="q-mb-sm"
        emit-value
        map-options
        @update:model-value="fetchAttendanceData"
      />
      <div v-if="selectedEmployeeData" class="q-mb-md">
        <div><b>Employee Name:</b> {{ selectedEmployeeData.label }}</div>
        <div><b>Position:</b> {{ selectedEmployeeData.position }}</div>
        <div><b>Working Hours/Day:</b> {{ workingHoursPerDay }}</div>
      </div>

      <div v-if="employeeAttendance.length > 0" class="q-mb-md">
        <div class="text-subtitle2">Attendance Summary</div>
        <div><b>Total Working Days:</b> {{ totalWorkingDays }}</div>
        <div><b>Half Days:</b> {{ halfDays }}</div>
        <div><b>Absent Days (Calculated):</b> {{ absentDays }}</div>
      </div>

      <q-input
        v-model.number="basicSalary"
        type="number"
        label="Basic Salary"
        outlined
        dense
        class="q-mb-sm"
        :disable="!selectedEmployeeId"
      />
      <q-input
        v-model.number="additionalEarnings"
        type="number"
        label="Additional Earnings"
        outlined
        dense
        class="q-mb-sm"
        :disable="!selectedEmployeeId"
      />
      <q-input
        v-model.number="deductions"
        type="number"
        label="Deductions"
        outlined
        dense
        class="q-mb-md"
        :disable="!selectedEmployeeId"
      />

      <div class="text-h6 q-mt-md" v-if="finalSalary !== null">
        Final Salary: ${{ finalSalary?.toFixed(2) }}
      </div>

      <q-btn
        label="💾 Save Salary Record"
        color="primary"
        @click="saveSalaryRecord"
        :disable="!selectedEmployeeId || basicSalary === ''"
        :loading="isSavingSalary"
        class="q-mt-md"
      />
      <div v-if="salarySaveError" class="text-negative q-mt-sm">{{ salarySaveError }}</div>
    </q-card>

    <q-separator class="q-my-md" />

    <q-card flat bordered class="q-pa-md">
      <div class="text-subtitle1 q-mb-md">🗂️ Salary Records</div>
      <q-table
        :rows="isAdmin ? allSalaryRecords : userSalaryRecords"
        :columns="salaryColumnsWithPrintAndView"
        row-key="id"
        flat
        bordered
        dense
      >
        <template v-slot:body-cell-actions="props">
          <q-td align="right">
            <div class="row items-center q-gutter-sm">
              <q-btn
                icon="print"
                flat
                size="sm"
                color="secondary"
                @click="printPayslip(props.row)"
              />
              <q-btn
                icon="visibility"
                flat
                size="sm"
                color="primary"
                @click="viewPayslip(props.row)"
              />
            </div>
          </q-td>
        </template>
      </q-table>
      <q-btn
        label="Export My Payslip to CSV"
        icon="download"
        color="primary"
        class="q-mt-md"
        @click="exportMyPayslipToCSV"
        :disable="!userSalaryRecords.length || isAdmin"
        :loading="isExportingSalary"
      />
    </q-card>

    <q-dialog v-model="payslipDialog">
      <q-card class="q-pa-md" style="min-width: 350px">
        <div class="text-h6">🧾 Payslip</div>
        <q-separator class="q-my-sm" />
        <q-list dense>
          <q-item
            ><q-item-section>Name: {{ payslipData.employee }}</q-item-section></q-item
          >
          <q-item
            ><q-item-section>Position: {{ payslipData.position }}</q-item-section></q-item
          >
          <q-item
            ><q-item-section>Basic Salary: ${{ payslipData.basicSalary }}</q-item-section></q-item
          >
          <q-item
            ><q-item-section
              >Additional Earnings: ${{ payslipData.additionalEarnings }}</q-item-section
            ></q-item
          >
          <q-item
            ><q-item-section>Deductions: ${{ payslipData.deductions }}</q-item-section></q-item
          >
          <q-item>
            <q-item-section
              ><b>Net Salary: ${{ payslipData.total?.toFixed(2) }}</b></q-item-section
            >
          </q-item>
        </q-list>
        <q-btn label="Close" color="primary" class="q-mt-md" @click="payslipDialog = false" />
      </q-card>
    </q-dialog>

    <div v-if="loading" class="loading-indicator">
      <q-spinner-dots color="primary" size="40px" />
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { db } from '../../firebase'
import {
  collection,
  addDoc,
  onSnapshot,
  where,
  query,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore'
import { Notify } from 'quasar'
import Papa from 'papaparse'
import { useUserStore } from 'src/stores/userStore'
import { storeToRefs } from 'pinia'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const auth = getAuth()
const userStore = useUserStore()
const { user, userData } = storeToRefs(userStore)

// States
const isAdmin = ref(false)
const employeeOptions = ref([])
const selectedEmployeeId = ref(null)
const selectedEmployeeData = ref(null)
const workingHoursPerDay = ref(8)
const basicSalary = ref('')
const additionalEarnings = ref(0)
const deductions = ref(0)
const salaryRecords = ref([])
const allSalaryRecords = ref([])
const userSalaryRecords = computed(() =>
  salaryRecords.value.filter((record) => record.employeeId === user.value?.uid),
)
const payslipDialog = ref(false)
const payslipData = ref({})
const isExportingSalary = ref(false)
const loading = ref(true)
const isSavingSalary = ref(false)
const salarySaveError = ref(null)
const employeeAttendance = ref([]) // තෝරාගත් සේවකයාගේ Attendance Data

// Computed Properties
const totalWorkingDays = computed(() => {
  return employeeAttendance.value.filter(
    (item) => !item.isHalfDay && item.checkInTime && item.checkOutTime,
  ).length
})

const halfDays = computed(() => employeeAttendance.value.filter((item) => item.isHalfDay).length)

const absentDays = computed(() => {
  if (!selectedEmployeeData.value || !workingHoursPerDay.value) return 0
  const expectedWorkingDays = 20 // Example
  const workedDays = totalWorkingDays.value + halfDays.value / 2
  return Math.max(0, expectedWorkingDays - workedDays)
})

const finalSalary = computed(() => {
  if (!basicSalary.value || basicSalary.value === '') return null
  const dailySalary = parseFloat(basicSalary.value) / 20 // Assuming 20 working days
  const deductedSalary = dailySalary * absentDays.value
  return (
    parseFloat(basicSalary.value) +
    parseFloat(additionalEarnings.value || 0) -
    parseFloat(deductions.value || 0) -
    deductedSalary
  )
})

// Methods
const fetchEmployeeDetails = async (employeeId) => {
  if (employeeId) {
    const employeeDocRef = doc(db, 'employees', employeeId)
    const docSnap = await getDoc(employeeDocRef)
    if (docSnap.exists()) {
      selectedEmployeeData.value = { value: docSnap.id, ...docSnap.data() }
      workingHoursPerDay.value = selectedEmployeeData.value?.workingHoursPerDay || 8
    } else {
      selectedEmployeeData.value = null
      workingHoursPerDay.value = 8
    }
  } else {
    selectedEmployeeData.value = null
    workingHoursPerDay.value = 8
  }
}

const fetchAttendanceData = async (employeeId) => {
  employeeAttendance.value = []
  await fetchEmployeeDetails(employeeId) // සේවක විස්තර ලබාගන්න
  if (employeeId) {
    const q = query(collection(db, 'attendance'), where('employeeId', '==', employeeId))
    const snapshot = await getDocs(q)
    employeeAttendance.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }
}

const saveSalaryRecord = async () => {
  if (!selectedEmployeeId.value || basicSalary.value === '') {
    salarySaveError.value = 'Please select an employee and enter basic salary.'
    return
  }
  salarySaveError.value = null
  isSavingSalary.value = true
  try {
    const selectedEmployee = employeeOptions.value.find(
      (emp) => emp.value === selectedEmployeeId.value,
    )
    await addDoc(collection(db, 'salaries'), {
      employee: selectedEmployee?.label,
      employeeId: selectedEmployeeId.value,
      position: selectedEmployee?.position,
      basicSalary: parseFloat(basicSalary.value),
      additionalEarnings: parseFloat(additionalEarnings.value || 0),
      deductions: parseFloat(deductions.value || 0),
      total: finalSalary.value,
      createdAt: new Date(),
    })
    Notify.create({ type: 'positive', message: 'Salary record saved!' })
    selectedEmployeeId.value = null
    basicSalary.value = ''
    additionalEarnings.value = 0
    deductions.value = 0
    employeeAttendance.value = []
    selectedEmployeeData.value = null
  } catch (error) {
    Notify.create({ type: 'negative', message: `Error saving salary: ${error.message}` })
    salarySaveError.value = error.message
  } finally {
    isSavingSalary.value = false
  }
}

const viewPayslip = (record) => {
  payslipData.value = record
  payslipDialog.value = true
}

const printPayslip = (record) => {
  const popup = window.open('', '_blank', 'width=600,height=800')
  if (!popup) {
    Notify.create({
      type: 'negative',
      message: 'Popup blocked. Please allow popups for this site.',
    })
    return
  }

  const payslipHTML = `
      <html><head><title>Payslip</title>
      <style>
        body { font-family: Arial; padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; border: 1px solid #ccc; }
        .total { font-weight: bold; }
      </style>
      </head><body>
      <h2 style="text-align:center;">Payslip</h2>
      <table>
        <tr><th>Employee</th><td>${record.employee}</td></tr>
        <tr><th>Position</th><td>${record.position || '-'}</td></tr>
        <tr><th>Basic Salary</th><td>$${record.basicSalary?.toFixed(2) || '0.00'}</td></tr>
        <tr><th>Additional Earnings</th><td>$${record.additionalEarnings?.toFixed(2) || '0.00'}</td></tr>
        <tr><th>Deductions</th><td>$${record.deductions?.toFixed(2) || '0.00'}</td></tr>
        <tr class="total"><th>Net Salary</th><td>$${record.total?.toFixed(2) || '0.00'}</td></tr>
      </table>
      <div style="text-align:center;margin-top:30px;"><button onclick="window.print()">Print</button></div>
      </body></html>
    `
  popup.document.open()
  popup.document.write(payslipHTML)
  popup.document.close()
}

const exportMyPayslipToCSV = async () => {
  if (!user.value?.uid) {
    Notify.create({ type: 'warning', message: 'Please log in to download your payslip.' })
    return
  }
  isExportingSalary.value = true
  try {
    const q = query(collection(db, 'salaries'), where('employeeId', '==', user.value.uid))
    const querySnapshot = await getDocs(q)
    const mySalaryRecords = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    if (mySalaryRecords.length === 0) {
      Notify.create({ type: 'warning', message: 'No salary records found for you.' })
      return
    }

    const csv = Papa.unparse(
      mySalaryRecords.map((s) => ({
        Employee: s.employee,
        Position: s.position || '-',
        BasicSalary: s.basicSalary || '0.00',
        AdditionalEarnings: s.additionalEarnings || '0.00',
        Deductions: s.deductions || '0.00',
        'Net Salary': s.total?.toFixed(2) || '0.00',
      })),
    )

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'my-payslip.csv'
    link.click()
  } catch (error) {
    Notify.create({ type: 'negative', message: `Error exporting payslip: ${error.message}` })
  } finally {
    isExportingSalary.value = false
  }
}

onMounted(async () => {
  loading.value = true

  onAuthStateChanged(auth, async (currentUser) => {
    userStore.setUser(currentUser)
    await userStore.fetchUserData()
    isAdmin.value = userData.value?.isAdmin || false

    onSnapshot(collection(db, 'employees'), (snapshot) => {
      employeeOptions.value = snapshot.docs.map((doc) => ({
        label: doc.data()?.name,
        value: doc.id,
        position: doc.data()?.position,
        workingHoursPerDay: doc.data()?.workingHoursPerDay,
        basicSalary: doc.data()?.basicSalary, // Basic Salary එකත් ගන්නවා
      }))
    })

    onSnapshot(collection(db, 'salaries'), (snapshot) => {
      const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      salaryRecords.value = records
      if (isAdmin.value) {
        allSalaryRecords.value = records
      } else {
        allSalaryRecords.value = records.filter((record) => record.employeeId === user.value?.uid)
      }
    })
    loading.value = false
  })
})

const salaryColumnsWithPrintAndView = computed(() => {
  const baseColumns = [
    { name: 'employee', label: 'Employee', field: 'employee' },
    { name: 'position', label: 'Position', field: 'position' },
    { name: 'basicSalary', label: 'Basic Salary', field: 'basicSalary', align: 'right' },
    { name: 'additionalEarnings', label: 'Earnings', field: 'additionalEarnings', align: 'right' },
    { name: 'deductions', label: 'Deductions', field: 'deductions', align: 'right' },
    { name: 'total', label: 'Net Salary', field: (row) => row.total?.toFixed(2), align: 'right' },
  ]

  return [...baseColumns, { name: 'actions', label: 'Actions', align: 'right' }]
})
</script>

<style scoped>
.loading-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}
</style>
