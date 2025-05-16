<template>
  <!-- Edit Salary Dialog -->
  <q-dialog v-model="editDialog">
    <q-card class="q-pa-md" style="min-width: 350px">
      <div class="text-h6">✏️ Edit Salary</div>
      <q-separator class="q-my-sm" />
      <q-input v-model="editRecord.employee" label="Employee Name" outlined dense class="q-mb-sm" />
      <q-input
        v-model.number="editRecord.basicSalary"
        label="Basic Salary"
        outlined
        dense
        class="q-mb-sm"
      />
      <q-input
        v-model.number="editRecord.allowances"
        label="Allowances"
        outlined
        dense
        class="q-mb-sm"
      />
      <q-input
        v-model.number="editRecord.deductions"
        label="Deductions"
        outlined
        dense
        class="q-mb-md"
      />
      <div class="row justify-end q-gutter-sm">
        <q-btn label="Cancel" flat @click="editDialog = false" />
        <q-btn label="Update" color="primary" @click="updateSalaryRecord" />
      </div>
    </q-card>
  </q-dialog>
  <!-- Summary Cards -->
  <q-card class="q-pa-md q-mt-md">
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle2">💰 Total Net Salary</div>
            <div class="text-h6">${{ totalNetSalary.toFixed(2) }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle2">👤 Highest Paid</div>
            <div class="text-h6">{{ highestPaid?.employee || '-' }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle2">📊 Average Net Salary</div>
            <div class="text-h6">${{ averageNetSalary.toFixed(2) }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-card>

  <!-- Payslip Dialog -->
  <q-dialog v-model="payslipDialog">
    <q-card class="q-pa-md" style="min-width: 350px">
      <div class="text-h6">🧾 Payslip</div>
      <q-separator class="q-my-sm" />
      <q-list dense>
        <q-item
          ><q-item-section>Name: {{ payslipData.employee }}</q-item-section></q-item
        >
        <q-item
          ><q-item-section>Basic Salary: ${{ payslipData.basicSalary }}</q-item-section></q-item
        >
        <q-item
          ><q-item-section>Allowances: ${{ payslipData.allowances }}</q-item-section></q-item
        >
        <q-item
          ><q-item-section>Deductions: ${{ payslipData.deductions }}</q-item-section></q-item
        >
        <q-item
          ><q-item-section
            ><b>Net Salary: ${{ payslipData.total.toFixed(2) }}</b></q-item-section
          ></q-item
        >
      </q-list>
      <q-btn label="Close" color="primary" class="q-mt-md" @click="payslipDialog = false" />
    </q-card>
  </q-dialog>

  <!-- Main Page -->
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">💰 Salary Management</div>

    <!-- Form -->
    <q-card flat bordered class="q-pa-md">
      <div class="text-subtitle1 q-mb-md">📅 Generate Salaries</div>
      <q-select
        outlined
        dense
        v-model="selectedEmployee"
        :options="employeeOptions"
        label="Select Employee"
        class="q-mb-sm"
        emit-value
        map-options
      />
      <q-select
        v-model="selectedMonth"
        :options="months"
        label="Month"
        outlined
        dense
        class="q-mb-sm"
      />
      <q-select
        v-model="selectedYear"
        :options="years"
        label="Year"
        outlined
        dense
        class="q-mb-md"
      />
      <q-input
        v-model="basicSalary"
        type="number"
        label="Basic Salary"
        outlined
        dense
        class="q-mb-sm"
      />
      <q-input
        v-model="allowances"
        type="number"
        label="Allowances"
        outlined
        dense
        class="q-mb-sm"
      />
      <q-input
        v-model="deductions"
        type="number"
        label="Deductions"
        outlined
        dense
        class="q-mb-md"
      />
      <q-btn label="💾 Save Salary Record" color="primary" @click="saveSalaryRecord" />
    </q-card>

    <!-- Table -->
    <q-separator class="q-my-md" />
    <q-card flat bordered class="q-pa-md">
      <div class="text-subtitle1 q-mb-md">🗂️ Salary Records</div>
      <q-table :rows="filteredSalaryRecords" :columns="columns" row-key="id" flat bordered dense>
        <template v-slot:body-cell-actions="props">
          <q-td align="right">
            <q-btn
              icon="visibility"
              flat
              size="sm"
              color="primary"
              @click="viewPayslip(props.row)"
            />
            <q-btn icon="print" flat size="sm" color="secondary" @click="printPayslip(props.row)" />
            <q-btn
              icon="edit"
              flat
              size="sm"
              color="warning"
              @click="editSalaryRecord(props.row)"
            />
          </q-td>
        </template>
      </q-table>
      <q-btn
        label="Export to CSV"
        icon="download"
        color="primary"
        class="q-mt-md"
        @click="exportToCSV"
      />
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { db } from '../../firebase'
import { collection, addDoc, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { Notify } from 'quasar'
import Papa from 'papaparse'

// States
const selectedMonth = ref(null)
const selectedYear = ref(null)
const selectedEmployee = ref(null)
const employeeOptions = ref([])
const basicSalary = ref('')
const allowances = ref('')
const deductions = ref('')
const salaryRecords = ref([])
const payslipDialog = ref(false)
const payslipData = ref({})
const editDialog = ref(false)
const editRecord = ref({})

// Options
const months = [...Array(12)].map((_, i) =>
  new Date(0, i).toLocaleString('default', { month: 'long' }),
)
const years = Array.from({ length: 10 }, (_, i) => `${2020 + i}`)

// Computed Filters
const filteredSalaryRecords = computed(() => {
  return salaryRecords.value.filter((record) => {
    const date = new Date(record.createdAt?.seconds * 1000 || record.createdAt)
    const monthMatch =
      !selectedMonth.value ||
      date.toLocaleString('default', { month: 'long' }) === selectedMonth.value
    const yearMatch = !selectedYear.value || date.getFullYear().toString() === selectedYear.value
    return monthMatch && yearMatch
  })
})

const totalNetSalary = computed(() =>
  filteredSalaryRecords.value.reduce((sum, r) => sum + r.total, 0),
)
const averageNetSalary = computed(() =>
  filteredSalaryRecords.value.length === 0
    ? 0
    : totalNetSalary.value / filteredSalaryRecords.value.length,
)
const highestPaid = computed(() =>
  filteredSalaryRecords.value.reduce((max, r) => (r.total > (max?.total || 0) ? r : max), null),
)

// Methods
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
      <tr><th>Basic Salary</th><td>$${record.basicSalary.toFixed(2)}</td></tr>
      <tr><th>Allowances</th><td>$${record.allowances.toFixed(2)}</td></tr>
      <tr><th>Deductions</th><td>$${record.deductions.toFixed(2)}</td></tr>
      <tr class="total"><th>Net Salary</th><td>$${record.total.toFixed(2)}</td></tr>
    </table>
    <div style="text-align:center;margin-top:30px;"><button onclick="window.print()">Print</button></div>
    </body></html>
  `
  popup.document.open()
  popup.document.write(payslipHTML)
  popup.document.close()
}

const editSalaryRecord = (record) => {
  editRecord.value = { ...record }
  editDialog.value = true
}

const updateSalaryRecord = async () => {
  if (!editRecord.value.id) return
  const docRef = doc(db, 'salaries', editRecord.value.id)
  await updateDoc(docRef, {
    employee: editRecord.value.employee,
    basicSalary: parseFloat(editRecord.value.basicSalary),
    allowances: parseFloat(editRecord.value.allowances),
    deductions: parseFloat(editRecord.value.deductions),
  })
  Notify.create({ type: 'positive', message: 'Record updated successfully!' })
  editDialog.value = false
}

const saveSalaryRecord = async () => {
  if (!selectedEmployee.value || !basicSalary.value) {
    Notify.create({ type: 'negative', message: 'Fill required fields!' })
    return
  }

  const empName = employeeOptions.value.find((opt) => opt.value === selectedEmployee.value)?.label
  await addDoc(collection(db, 'salaries'), {
    employee: empName,
    employeeId: selectedEmployee.value,
    basicSalary: parseFloat(basicSalary.value),
    allowances: parseFloat(allowances.value || 0),
    deductions: parseFloat(deductions.value || 0),
    createdAt: new Date(),
  })

  Notify.create({ type: 'positive', message: 'Salary saved!' })
  clearForm()
}

const clearForm = () => {
  selectedEmployee.value = null
  basicSalary.value = ''
  allowances.value = ''
  deductions.value = ''
}

const exportToCSV = () => {
  if (salaryRecords.value.length === 0) {
    Notify.create({ type: 'warning', message: 'No salary records to export!' })
    return
  }

  const csv = Papa.unparse(
    salaryRecords.value.map((s) => ({
      Employee: s.employee,
      BasicSalary: s.basicSalary,
      Allowances: s.allowances,
      Deductions: s.deductions,
      NetSalary: s.total.toFixed(2),
    })),
  )

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'salary-records.csv'
  link.click()
}

// Load Data
onMounted(() => {
  onSnapshot(collection(db, 'employees'), (snapshot) => {
    employeeOptions.value = snapshot.docs.map((doc) => ({
      label: doc.data().name,
      value: doc.id,
    }))
  })

  onSnapshot(collection(db, 'salaries'), (snapshot) => {
    salaryRecords.value = snapshot.docs.map((doc) => {
      const data = doc.data()
      const total =
        parseFloat(data.basicSalary || 0) +
        parseFloat(data.allowances || 0) -
        parseFloat(data.deductions || 0)
      return { id: doc.id, ...data, total }
    })
  })
})

// Table Columns
const columns = [
  { name: 'employee', label: 'Employee', field: 'employee', align: 'left' },
  { name: 'basic', label: 'Basic Salary', field: 'basicSalary', align: 'right' },
  { name: 'allowances', label: 'Allowances', field: 'allowances', align: 'right' },
  { name: 'deductions', label: 'Deductions', field: 'deductions', align: 'right' },
  { name: 'total', label: 'Net Salary', field: (row) => row.total.toFixed(2), align: 'right' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]
</script>
