import SalaryManagement from 'pages/admin/SalaryManagement.vue'
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/register' },
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'dashboard', component: () => import('src/pages/admin/DashboardPage.vue') },
      { path: 'employees', component: () => import('src/pages/admin/EmployeesPage.vue') },
      { path: 'register', component: () => import('pages/auth/RegisterPage.vue') }, // 🔴 Register Page here!
      { path: 'login', component: () => import('pages/auth/LoginPage.vue') },
      { path: 'salaries', component: SalaryManagement }, // salary page
    ],
  },
]

export default routes
