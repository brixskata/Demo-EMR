<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api, type Patient } from "../services/api";
const patients = ref<Patient[]>([]);
const search = ref("");
const page = ref(1);
const pageSize = 5;
const total = ref(0);
const totalPages = ref(0);
const loading = ref(true);
const error = ref("");
let searchTimer: ReturnType<typeof setTimeout> | undefined;
async function load(nextPage = page.value) {
  loading.value = true;
  try {
    const result = await api.patients({ page: nextPage, pageSize, search: search.value });
    patients.value = result.items;
    page.value = result.page;
    total.value = result.total;
    totalPages.value = result.totalPages;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Could not load patients";
  } finally {
    loading.value = false;
  }
}
function searchPatients() {
  if (searchTimer) clearTimeout(searchTimer);
  page.value = 1;
  searchTimer = setTimeout(() => { void load(1); }, 300);
}
function goToPage(nextPage: number) { if (nextPage >= 1 && nextPage <= totalPages.value && nextPage !== page.value) void load(nextPage); }
onMounted(load);
onBeforeUnmount(() => { if (searchTimer) clearTimeout(searchTimer); });
</script>
<template>
  <section>
    <div
      class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"
    >
      <div>
        <p class="mb-2 text-sm text-[#7b8799]">
          A synthetic workspace for demo and development
        </p>
        <h2 class="display text-3xl font-bold">Patient directory</h2>
      </div>
    </div>
    <div class="mb-6 grid gap-4 sm:grid-cols-3">
      <div class="rounded-2xl border border-[#e5ebf2] bg-white p-5">
        <div
          class="mb-2 text-xs font-bold uppercase tracking-widest text-[#94a1b2]"
        >
          Total patients
        </div>
        <div class="display text-3xl font-bold">
          {{ patients.length || "—" }}
        </div>
      </div>
      <div class="rounded-2xl border border-[#e5ebf2] bg-white p-5">
        <div
          class="mb-2 text-xs font-bold uppercase tracking-widest text-[#94a1b2]"
        >
          Active admissions
        </div>
        <div class="text-lg font-bold text-[#1c9f8d]">1 current</div>
      </div>
      <div class="rounded-2xl border border-[#e5ebf2] bg-white p-5">
        <div
          class="mb-2 text-xs font-bold uppercase tracking-widest text-[#94a1b2]"
        >
          Documents on file
        </div>
        <div class="text-lg font-bold">10 records</div>
      </div>
    </div>
    <div
      class="overflow-hidden rounded-2xl border border-[#e5ebf2] bg-white shadow-sm"
    >
      <div
        class="flex flex-col gap-3 border-b border-[#edf1f5] p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h3 class="font-bold">All patients</h3>
          <p class="mt-1 text-xs text-[#8b98ab]">
            Select a patient to view admissions and documents
          </p>
        </div>
        <label
          class="flex items-center gap-2 rounded-xl border border-[#e1e8f0] px-3 py-2 text-sm text-[#8491a3] sm:w-72"
          ><span class="material-symbols-rounded text-base">search</span
          ><input
            v-model="search"
            class="w-full outline-none"
            placeholder="Search by name or ID"
            @input="searchPatients"
        /></label>
      </div>
      <div v-if="loading" class="p-10 text-center text-sm text-[#8290a4]">
        Loading synthetic patients…
      </div>
      <div
        v-else-if="error"
        class="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
      >
        {{ error }}
        <button class="font-bold underline" @click="load()">Retry</button>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[680px] text-left text-sm">
          <thead
            class="bg-[#fafbfd] text-[11px] font-bold uppercase tracking-wider text-[#91a0b2]"
          >
            <tr>
              <th class="px-6 py-4">Patient</th>
              <th class="px-6 py-4">Patient number</th>
              <th class="px-6 py-4">Date of birth</th>
              <th class="px-6 py-4">Sex</th>
              <th class="px-6 py-4">Admissions</th>
              <th></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#edf1f5]">
            <tr
              v-for="patient in patients"
              :key="patient.patientId"
              class="transition hover:bg-[#f8fbfc]"
            >
              <td class="px-6 py-5">
                <RouterLink
                  :to="`/patients/${patient.patientId}`"
                  class="flex items-center gap-3"
                  ><div
                    class="grid h-10 w-10 place-items-center rounded-full bg-[#d8f5ef] text-xs font-bold text-[#167e72]"
                  >
                    {{ patient.firstName[0] }}{{ patient.lastName[0] }}
                  </div>
                  <div>
                    <div class="font-bold text-[#263650]">
                      {{ patient.lastName.toUpperCase() }},
                      {{ patient.firstName.toUpperCase() }}
                    </div>
                    <div class="mt-1 text-xs text-[#8a98aa]">
                      Synthetic patient
                    </div>
                  </div></RouterLink
                >
              </td>
              <td class="px-6 py-5 font-semibold text-[#53637a]">
                {{ patient.patientNumber }}
              </td>
              <td class="px-6 py-5 text-[#53637a]">
                {{ patient.dateOfBirth }}
              </td>
              <td class="px-6 py-5 text-[#53637a]">{{ patient.sex }}</td>
              <td class="px-6 py-5">
                <span
                  class="rounded-full bg-[#edf8f6] px-3 py-1 text-xs font-bold text-[#198e7e]"
                  >{{ patient.admissionCount }} records</span
                >
              </td>
              <td class="px-6 py-5 text-right">
                <RouterLink
                  :to="`/patients/${patient.patientId}`"
                  class="material-symbols-rounded text-[#91a0b2]"
                  >chevron_right</RouterLink
                >
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="!patients.length && !loading"
          class="p-10 text-center text-sm text-[#8290a4]"
        >
          No patients found.
        </div>
        <div class="flex flex-col gap-3 border-t border-[#edf1f5] px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span class="text-[#8491a3]">Showing {{ total ? (page - 1) * pageSize + 1 : 0 }}–{{ Math.min(page * pageSize, total) }} of {{ total }} patients</span>
          <div class="flex items-center gap-1">
            <button class="rounded-lg px-3 py-2 font-semibold text-[#53637a] hover:bg-[#f2f6f8] disabled:cursor-not-allowed disabled:opacity-40" :disabled="page <= 1 || loading" @click="goToPage(page - 1)">Previous</button>
            <button v-for="pageNumber in totalPages" :key="pageNumber" class="grid h-9 min-w-9 place-items-center rounded-lg px-2 font-semibold" :class="pageNumber === page ? 'bg-[#e8f1f5] text-[#36586b]' : 'text-[#53637a] hover:bg-[#f2f6f8]'" :disabled="loading" @click="goToPage(pageNumber)">{{ pageNumber }}</button>
            <button class="rounded-lg px-3 py-2 font-semibold text-[#53637a] hover:bg-[#f2f6f8] disabled:cursor-not-allowed disabled:opacity-40" :disabled="page >= totalPages || loading" @click="goToPage(page + 1)">Next</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
