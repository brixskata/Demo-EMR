<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api, type Patient } from "../services/api";
const patients = ref<Patient[]>([]);
const search = ref("");
const patientType = ref("");
const gender = ref("");
const dateOfBirthFrom = ref("");
const dateOfBirthTo = ref("");
const sort = ref<"name_asc" | "name_desc">("name_asc");
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
    const result = await api.patients({ page: nextPage, pageSize, search: search.value, type: patientType.value, gender: gender.value, dateOfBirthFrom: dateOfBirthFrom.value, dateOfBirthTo: dateOfBirthTo.value, sort: sort.value });
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
function filtersChanged() { page.value = 1; void load(1); }
function clearFilters() { search.value = ""; patientType.value = ""; gender.value = ""; dateOfBirthFrom.value = ""; dateOfBirthTo.value = ""; sort.value = "name_asc"; page.value = 1; void load(1); }
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
          Medical records workspace
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
      <div class="border-b border-[#edf1f5] p-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="font-bold">All patients</h3>
            <p class="mt-1 text-xs text-[#8b98ab]">Select a patient to view admissions and documents</p>
          </div>
          <span class="text-xs font-semibold text-[#8491a3]">{{ total }} patients</span>
        </div>
        <label class="mt-4 flex w-full items-center gap-2 rounded-xl border border-[#e1e8f0] px-3 py-2 text-sm text-[#8491a3]"><span class="material-symbols-rounded text-base">search</span><input v-model="search" class="w-full outline-none" placeholder="Search by name or patient ID" @input="searchPatients" /></label>
        <div class="mt-4 flex flex-wrap items-end gap-2">
          <span class="mr-1 pb-2 text-xs font-bold text-[#69778d]">Filters</span>
          <label class="flex items-center whitespace-nowrap text-xs font-bold text-[#69778d]">Patient Type<select v-model="patientType" class="ml-2 rounded-xl border border-[#e1e8f0] bg-white px-3 py-2 text-sm font-normal text-[#53637a]" @change="filtersChanged"><option value="">All Types</option><option value="Inpatient">Inpatient</option><option value="Outpatient">Outpatient</option><option value="ER">ER</option></select></label>
          <label class="flex items-center whitespace-nowrap text-xs font-bold text-[#69778d]">Gender<select v-model="gender" class="ml-2 rounded-xl border border-[#e1e8f0] bg-white px-3 py-2 text-sm font-normal text-[#53637a]" @change="filtersChanged"><option value="">All Genders</option><option value="Male">Male</option><option value="Female">Female</option></select></label>
          <label class="flex items-center whitespace-nowrap text-xs font-bold text-[#69778d]">Birth From<input v-model="dateOfBirthFrom" type="date" class="ml-2 w-36 rounded-xl border border-[#e1e8f0] bg-white px-3 py-2 text-sm font-normal text-[#53637a]" @change="filtersChanged" /></label>
          <label class="flex items-center whitespace-nowrap text-xs font-bold text-[#69778d]">Birth To<input v-model="dateOfBirthTo" type="date" class="ml-2 w-36 rounded-xl border border-[#e1e8f0] bg-white px-3 py-2 text-sm font-normal text-[#53637a]" @change="filtersChanged" /></label>
          <label class="flex items-center whitespace-nowrap text-xs font-bold text-[#69778d]">Sort<select v-model="sort" class="ml-2 rounded-xl border border-[#e1e8f0] bg-white px-3 py-2 text-sm font-normal text-[#53637a]" @change="filtersChanged"><option value="name_asc">Name A–Z</option><option value="name_desc">Name Z–A</option></select></label>
          <button class="whitespace-nowrap px-2 py-2 text-xs font-bold text-[#36586b] hover:underline" @click="clearFilters">Clear filters</button>
        </div>
      </div>
      <div v-if="loading" class="p-10 text-center text-sm text-[#8290a4]">
        Loading patients…
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
              <th class="px-6 py-4">Gender</th>
              <th class="px-6 py-4">Type</th>
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
                      Patient record
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
              <td class="px-6 py-5"><span class="material-symbols-rounded text-2xl" :style="{ color: patient.sex.toLowerCase() === 'female' ? '#e58bb2' : patient.sex.toLowerCase() === 'male' ? '#4f9bd6' : '#8491a3' }">{{ patient.sex.toLowerCase() === 'female' ? 'female' : patient.sex.toLowerCase() === 'male' ? 'male' : 'person' }}</span></td>
              <td class="px-6 py-5"><span class="rounded-full bg-[#edf8f6] px-3 py-1 text-xs font-bold text-[#198e7e]">{{ patient.patientType }}</span></td>
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
