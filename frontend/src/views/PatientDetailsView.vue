<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api, type Admission, type Patient } from '../services/api'

const route = useRoute()
const patient = ref<Patient & { admissions: Admission[] }>()
const loading = ref(true)
const error = ref('')
const admissionPage = ref(1)
const admissionPageSize = 10
const admissionTotal = ref(0)
const admissionTotalPages = ref(0)
async function loadAdmissions(nextPage = admissionPage.value) {
  const result = await api.patientAdmissions(Number(route.params.patientId), { page: nextPage, pageSize: admissionPageSize })
  if (patient.value) patient.value.admissions = result.items
  admissionPage.value = result.page
  admissionTotal.value = result.total
  admissionTotalPages.value = result.totalPages
}

onMounted(async () => {
  try { patient.value = await api.patient(Number(route.params.patientId)); await loadAdmissions(1) } catch (e) { error.value = e instanceof Error ? e.message : 'Could not load patient' } finally { loading.value = false }
})

function age(dateOfBirth: string) {
  const birth = new Date(dateOfBirth)
  if (Number.isNaN(birth.getTime())) return '—'
  const today = new Date()
  let years = today.getFullYear() - birth.getFullYear()
  const birthdayPassed = today.getMonth() > birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate())
  if (!birthdayPassed) years -= 1
  return years
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}
</script>

<template>
  <section v-if="patient">
    <div class="mb-7 flex items-center gap-2 text-sm text-[#8491a3]"><RouterLink to="/patients" class="hover:text-[#1c9f8d]">Patients</RouterLink><span class="material-symbols-rounded text-base">chevron_right</span><span class="font-semibold text-[#263650]">{{ patient.lastName }}, {{ patient.firstName }}</span></div>

    <div class="mb-8 rounded-2xl border border-[#e5ebf2] bg-white p-6">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-4"><div class="grid h-16 w-16 place-items-center rounded-2xl bg-[#d8f5ef] text-xl font-bold text-[#167e72]">{{ patient.firstName[0] }}{{ patient.lastName[0] }}</div><div><div class="mb-1 text-xs font-bold uppercase tracking-[.15em] text-[#1b9e8c]">Patient profile</div><h2 class="display text-2xl font-bold">{{ patient.lastName.toUpperCase() }}, {{ patient.firstName.toUpperCase() }}</h2></div></div>
        <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-[minmax(190px,1.5fr)_minmax(150px,1fr)_minmax(80px,.6fr)] sm:gap-x-10"><div class="min-w-0"><div class="text-xs text-[#8996a8]">Patient Number</div><div class="mt-1 whitespace-nowrap font-semibold">{{ patient.patientNumber }}</div></div><div class="min-w-0"><div class="text-xs text-[#8996a8]">Age</div><div class="mt-1 whitespace-nowrap font-semibold">{{ age(patient.dateOfBirth) }} years old</div></div><div><div class="text-xs text-[#8996a8]">Gender</div><div class="mt-1 flex h-7 items-center"><span class="material-symbols-rounded text-2xl" :style="{ color: patient.sex.toLowerCase() === 'female' ? '#e58bb2' : patient.sex.toLowerCase() === 'male' ? '#4f9bd6' : '#8491a3' }">{{ patient.sex.toLowerCase() === 'female' ? 'female' : patient.sex.toLowerCase() === 'male' ? 'male' : 'person' }}</span></div></div></div>
      </div>
    </div>

    <div class="mb-4 flex items-end justify-between"><div><h3 class="display text-xl font-bold">Admissions</h3><p class="mt-1 text-sm text-[#8491a3]">Documents are organized within each admission.</p></div><span class="rounded-full bg-[#edf8f6] px-3 py-1 text-xs font-bold text-[#198e7e]">{{ admissionTotal }} admissions</span></div>
    <div class="overflow-hidden rounded-2xl border border-[#e5ebf2] bg-white shadow-sm"><div class="overflow-x-auto"><table class="w-full min-w-[900px] text-left text-sm"><thead class="bg-[#fafbfd] text-[11px] font-bold uppercase tracking-wider text-[#91a0b2]"><tr><th class="px-5 py-4">Admission Number</th><th class="px-5 py-4">Encounter Number</th><th class="px-5 py-4">Date Admitted</th><th class="px-5 py-4">Date Discharged</th><th class="px-5 py-4">Ward</th><th class="px-5 py-4">Status</th><th class="px-5 py-4 text-right">Action</th></tr></thead><tbody><tr v-for="admission in patient.admissions" :key="admission.admissionId" class="border-t border-[#edf1f5]"><td class="px-5 py-4 font-bold">{{ admission.admissionNumber }}</td><td class="px-5 py-4 text-[#536b88]">{{ admission.encounterNumber }}</td><td class="px-5 py-4">{{ formatDate(admission.admissionDate) }}</td><td class="px-5 py-4">{{ formatDate(admission.dischargeDate) }}</td><td class="px-5 py-4">{{ admission.ward }}</td><td class="px-5 py-4"><span class="rounded-full px-3 py-1 text-[11px] font-bold" :class="admission.status === 'Active' ? 'bg-[#fff5d9] text-[#b88308]' : 'bg-[#edf8f6] text-[#198e7e]'">{{ admission.status }}</span></td><td class="px-5 py-4 text-right"><RouterLink :to="`/admissions/${admission.admissionId}`" class="inline-flex items-center gap-1 text-xs font-bold text-[#1c9f8d]">View admission <span class="material-symbols-rounded text-base">arrow_forward</span></RouterLink></td></tr></tbody></table></div><div class="flex flex-col gap-3 border-t border-[#edf1f5] px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"><span class="text-[#8491a3]">Showing {{ admissionTotal ? (admissionPage - 1) * admissionPageSize + 1 : 0 }}–{{ Math.min(admissionPage * admissionPageSize, admissionTotal) }} of {{ admissionTotal }} admissions</span><div class="flex items-center gap-1"><button class="rounded-lg px-3 py-2 font-semibold text-[#53637a] disabled:cursor-not-allowed disabled:opacity-40" :disabled="admissionPage <= 1" @click="loadAdmissions(admissionPage - 1)">Previous</button><button v-for="pageNumber in admissionTotalPages" :key="pageNumber" class="grid h-9 min-w-9 place-items-center rounded-lg px-2 font-semibold" :class="pageNumber === admissionPage ? 'bg-[#e8f1f5] text-[#36586b]' : 'text-[#53637a]'" @click="loadAdmissions(pageNumber)">{{ pageNumber }}</button><button class="rounded-lg px-3 py-2 font-semibold text-[#53637a] disabled:cursor-not-allowed disabled:opacity-40" :disabled="admissionPage >= admissionTotalPages" @click="loadAdmissions(admissionPage + 1)">Next</button></div></div></div>
  </section>
  <div v-else-if="loading" class="p-12 text-center text-sm text-[#8491a3]">Loading patient record…</div>
  <div v-else class="rounded-xl bg-red-50 p-5 text-red-700">{{ error }}</div>
</template>
