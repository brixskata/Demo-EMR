import { createRouter, createWebHistory } from 'vue-router'
import PatientsView from '../views/PatientsView.vue'
import PatientDetailsView from '../views/PatientDetailsView.vue'
import AdmissionView from '../views/AdmissionView.vue'
import LoginView from '../views/LoginView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/patients' },
    { path: '/login', component: LoginView },
    { path: '/patients', component: PatientsView },
    { path: '/patients/:patientId', component: PatientDetailsView },
    { path: '/admissions/:admissionId', component: AdmissionView },
  ],
})
