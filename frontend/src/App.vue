<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { api } from './services/api'
const route = useRoute()
const router = useRouter()
const showLogoutConfirm = ref(false)
const isLoginRoute = computed(() => route.path === '/login')
const title = computed(() => route.path.startsWith('/admissions') ? 'Admission documents' : route.path === '/patients' ? 'Patients' : 'Patient details')
const patientsWorkflowActive = computed(() => route.path === '/patients' || route.path.startsWith('/patients/') || route.path.startsWith('/admissions/'))
async function signOut() {
  showLogoutConfirm.value = false
  await api.logout().catch(() => undefined)
  await router.push('/login')
}
</script>
<template>
  <RouterView v-if="isLoginRoute" />
  <div v-else class="min-h-screen bg-[#f7f9fc] text-[#17233a]">
    <aside class="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col bg-[#111d34] text-white lg:flex">
      <div class="flex h-[84px] items-center gap-3 border-b border-white/10 px-7"><div class="grid h-10 w-10 place-items-center rounded-xl bg-[#36c5ae] text-[#0c2632]"><span class="material-symbols-rounded">health_and_safety</span></div><div><div class="display text-lg font-bold tracking-tight">SmartEHR</div><div class="text-[10px] uppercase tracking-[.18em] text-slate-400">Medical records</div></div></div>
      <nav class="flex-1 space-y-1 px-4 py-7"><div class="px-3 pb-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Workspace</div><RouterLink to="/patients" class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10" :class="{ 'bg-[#243653] active-nav-link': patientsWorkflowActive }"><span class="material-symbols-rounded">group</span> Patients</RouterLink></nav>
      <div class="m-4 mt-auto"><button class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10" @click="showLogoutConfirm = true"><span class="material-symbols-rounded">logout</span> Logout</button></div>
    </aside>
    <div class="lg:pl-[248px]"><header class="flex h-[84px] items-center justify-between border-b border-[#e6ebf2] bg-white px-5 sm:px-9"><div><div class="mb-1 text-xs font-semibold uppercase tracking-[.16em] text-[#8b98ab]">Medical records / {{ title }}</div><h1 class="display text-2xl font-bold tracking-tight">{{ title }}</h1></div><div class="flex items-center gap-3"><div class="grid h-10 w-10 place-items-center rounded-full bg-[#d8f5ef] text-sm font-bold text-[#167e72]">DR</div></div></header><main class="mx-auto max-w-[1440px] p-5 sm:p-9"><RouterView /></main></div>
  </div>
  <div v-if="showLogoutConfirm" class="fixed inset-0 z-50 grid place-items-center bg-[#0b1425]/60 p-4 backdrop-blur-sm" role="presentation" @click.self="showLogoutConfirm = false">
    <section class="w-full max-w-[400px] rounded-2xl border border-[#dce6eb] bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="logout-title">
      <div class="flex items-start gap-3"><div class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#edf3f6] text-[#527f99]"><span class="material-symbols-rounded">logout</span></div><div><h2 id="logout-title" class="display text-xl font-bold text-[#263650]">Logout</h2><p class="mt-2 text-sm text-[#69778d]">Are you sure you want to Logout?</p></div></div>
      <div class="mt-6 flex justify-end gap-3"><button class="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#69778d] hover:bg-[#f2f6f8]" @click="showLogoutConfirm = false">Cancel</button><button class="rounded-xl bg-[#709db6] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#527f99]" @click="signOut">Logout</button></div>
    </section>
  </div>
</template>
