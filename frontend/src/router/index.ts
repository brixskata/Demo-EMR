import { createRouter, createWebHistory } from 'vue-router'
import PatientsView from '../views/PatientsView.vue'
import PatientDetailsView from '../views/PatientDetailsView.vue'
import AdmissionView from '../views/AdmissionView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/patients' },
    { path: '/patients', component: PatientsView },
    { path: '/patients/:patientId', component: PatientDetailsView },
    { path: '/admissions/:admissionId', component: AdmissionView },
  ],
})
