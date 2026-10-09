import { createRouter, createWebHistory } from 'vue-router'
import PatientsView from '../views/PatientsView.vue'
import PatientDetailsView from '../views/PatientDetailsView.vue'
import AdmissionView from '../views/AdmissionView.vue'
import LoginView from '../views/LoginView.vue'
import { api } from '../services/api'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/patients' },
    { path: '/login', component: LoginView },
    { path: '/patients', component: PatientsView },
    { path: '/patients/:patientId', component: PatientDetailsView },
    { path: '/admissions/:admissionId', component: AdmissionView },
  ],
})

router.beforeEach(async (to) => {
  if (to.path === '/login') return true
  try {
    await api.me()
    return true
  } catch {
    if (import.meta.env.VITE_AUTH_DEMO_MODE === 'true' && localStorage.getItem('demo-role')) return true
    return '/login'
  }
})

export default router
