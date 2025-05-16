<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">👥 Employee Management</div>

    <div class="row q-col-gutter-md">
      <!-- Employee Table -->
      <div class="col-12 col-md-8">
        <q-card flat bordered class="q-pa-md">
          <div class="text-subtitle1 q-mb-md">📋 Employee List</div>

          <!-- Search Bar -->
          <q-input
            dense
            outlined
            debounce="300"
            v-model="search"
            placeholder="Search by name or position"
            class="q-mb-sm"
            clearable
            prefix-icon="search"
          />

          <q-table
            :rows="filteredEmployees"
            :columns="columns"
            row-key="id"
            flat
            bordered
            dense
            :rows-per-page-options="[5, 10, 15]"
          >
            <template v-slot:body-cell-actions="props">
              <q-td align="right">
                <q-btn icon="edit" size="sm" flat @click="editEmployee(props.row)" />
                <q-btn
                  icon="visibility"
                  size="sm"
                  flat
                  color="primary"
                  @click="$router.push(`/employee/${props.row.id}`)"
                />

                <q-btn
                  icon="delete"
                  size="sm"
                  color="negative"
                  flat
                  @click="deleteEmployee(props.row.id)"
                />
              </q-td>
            </template>
          </q-table>
        </q-card>
      </div>

      <!-- Add / Edit Employee Form -->
      <div class="col-12 col-md-4">
        <q-card class="q-pa-md">
          <div class="text-subtitle1">
            {{ editingId ? '✏️ Edit Employee' : '➕ Add New Employee' }}
          </div>
          <q-separator class="q-my-sm" />

          <q-input v-model="name" label="Name" outlined dense class="q-mb-sm" />
          <q-input v-model="position" label="Position" outlined dense class="q-mb-sm" />
          <q-input v-model="salary" label="Salary" type="number" outlined dense class="q-mb-md" />

          <q-btn
            :label="editingId ? 'Update Employee' : 'Add Employee'"
            :icon="editingId ? 'save' : 'add'"
            color="primary"
            @click="editingId ? updateEmployee() : addEmployee()"
          />

          <q-btn
            v-if="editingId"
            label="Cancel"
            flat
            class="q-ml-sm"
            color="grey-7"
            @click="clearForm"
          />
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '../../firebase'
import { collection, addDoc, onSnapshot, deleteDoc, updateDoc, doc } from 'firebase/firestore'
import { Notify } from 'quasar'

// Form state
const name = ref('')
const position = ref('')
const salary = ref('')
const employees = ref([])
const editingId = ref(null)
const search = ref('')

// Columns
const columns = [
  { name: 'name', label: 'Name', field: 'name', align: 'left' },
  { name: 'position', label: 'Position', field: 'position', align: 'left' },
  { name: 'salary', label: 'Salary', field: 'salary', align: 'right', format: (val) => `$${val}` },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
]

// Real-time listener
onMounted(() => {
  const employeesRef = collection(db, 'employees')
  onSnapshot(employeesRef, (snapshot) => {
    employees.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  })
})

// Computed search filter
const filteredEmployees = computed(() => {
  if (!search.value) return employees.value
  const term = search.value.toLowerCase()
  return employees.value.filter(
    (emp) => emp.name.toLowerCase().includes(term) || emp.position.toLowerCase().includes(term),
  )
})

// Add new employee
const addEmployee = async () => {
  if (!name.value || !position.value || !salary.value) {
    Notify.create({ type: 'negative', message: 'Fill all fields!' })
    return
  }

  await addDoc(collection(db, 'employees'), {
    name: name.value,
    position: position.value,
    salary: parseFloat(salary.value),
  })

  Notify.create({ type: 'positive', message: 'Employee added!' })
  clearForm()
}

// Set form for edit
const editEmployee = (employee) => {
  name.value = employee.name
  position.value = employee.position
  salary.value = employee.salary
  editingId.value = employee.id
}

// Update employee
const updateEmployee = async () => {
  if (!editingId.value) return
  await updateDoc(doc(db, 'employees', editingId.value), {
    name: name.value,
    position: position.value,
    salary: parseFloat(salary.value),
  })
  Notify.create({ type: 'positive', message: 'Employee updated!' })
  clearForm()
}

// Delete employee
const deleteEmployee = async (id) => {
  await deleteDoc(doc(db, 'employees', id))
  Notify.create({ type: 'warning', message: 'Employee deleted' })
}

// Reset form
const clearForm = () => {
  name.value = ''
  position.value = ''
  salary.value = ''
  editingId.value = null
}
</script>
