import SalaryManagement from 'pages/payroll/SalaryManagement.vue'
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/register' },
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'dashboard', component: () => import('src/pages/dashboard/DashboardPage.vue') },
      { path: 'employees', component: () => import('src/pages/employee/EmployeesPage.vue') },
      { path: 'register', component: () => import('pages/RegisterPage.vue') }, // 🔴 Register Page here!
      { path: 'login', component: () => import('pages/LoginPage.vue') },
      { path: 'salaries', component: SalaryManagement }, // salary page
      {
        path: '/employee/:id',
        name: 'employee-details',
        component: () => import('pages/employee/EmployeeDetails.vue'),
      },
    ],
  },
]

export default routes
