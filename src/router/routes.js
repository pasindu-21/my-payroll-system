const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/register' },
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'dashboard', component: () => import('pages/DashboardPage.vue') },
      { path: 'employees', component: () => import('pages/EmployeesPage.vue') },
      { path: 'register', component: () => import('pages/RegisterPage.vue') }, // 🔴 Register Page here!
      { path: 'login', component: () => import('pages/LoginPage.vue') },
    ],
  },
]

export default routes
