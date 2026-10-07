<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useDemoStore } from './stores/demo'
const route = useRoute(); const demo = useDemoStore()
const title = computed(() => route.path.startsWith('/admissions') ? 'Admission documents' : route.path === '/patients' ? 'Patients' : 'Patient details')
const patientsWorkflowActive = computed(() => route.path === '/patients' || route.path.startsWith('/patients/') || route.path.startsWith('/admissions/'))
</script>
<template>
  <div class="min-h-screen bg-[#f7f9fc] text-[#17233a]">
    <aside class="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col bg-[#111d34] text-white lg:flex">
      <div class="flex h-[84px] items-center gap-3 border-b border-white/10 px-7"><div class="grid h-10 w-10 place-items-center rounded-xl bg-[#36c5ae] text-[#0c2632]"><span class="material-symbols-rounded">health_and_safety</span></div><div><div class="display text-lg font-bold tracking-tight">SmartEHR</div><div class="text-[10px] uppercase tracking-[.18em] text-slate-400">Medical records</div></div></div>
      <nav class="flex-1 space-y-1 px-4 py-7"><div class="px-3 pb-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Workspace</div><RouterLink to="/patients" class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10" :class="{ 'bg-[#243653] active-nav-link': patientsWorkflowActive }"><span class="material-symbols-rounded">group</span> Patients</RouterLink></nav>
      <div class="m-4 rounded-2xl border border-white/10 bg-white/5 p-4"><div class="mb-2 flex items-center gap-2 text-xs font-bold text-[#86e4d1]"><span class="material-symbols-rounded text-base">science</span> DEVELOPMENT ENVIRONMENT</div><p class="text-[11px] leading-5 text-slate-400">Development records only. No production or HIS connection.</p></div>
    </aside>
    <div class="lg:pl-[248px]"><header class="flex h-[84px] items-center justify-between border-b border-[#e6ebf2] bg-white px-5 sm:px-9"><div><div class="mb-1 text-xs font-semibold uppercase tracking-[.16em] text-[#8b98ab]">Medical records / {{ title }}</div><h1 class="display text-2xl font-bold tracking-tight">{{ title }}</h1></div><div class="flex items-center gap-3"><label class="hidden items-center gap-2 rounded-xl border border-[#e3e9f1] bg-[#fafbfd] px-3 py-2 text-xs text-[#718096] sm:flex"><span class="material-symbols-rounded text-base">badge</span><select :value="demo.role" class="bg-transparent font-semibold outline-none" @change="demo.setRole(($event.target as HTMLSelectElement).value)"><option v-for="role in demo.roles" :key="role">{{ role }}</option></select></label><div class="grid h-10 w-10 place-items-center rounded-full bg-[#d8f5ef] text-sm font-bold text-[#167e72]">DR</div></div></header><main class="mx-auto max-w-[1440px] p-5 sm:p-9"><RouterView /></main></div>
  </div>
</template>
