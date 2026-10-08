<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { RouterLink } from "vue-router";
import { api, type Admission, type ChartPermission, type CodeChartAccess, type CodeChartActivity, type DemoAccount, type MedicalDocument } from "../services/api";
import UploadDocumentDialog from "../components/medical-records/UploadDocumentDialog.vue";
import { useDemoStore } from "../stores/demo";
const route = useRoute();
const demo = useDemoStore();
const admission = ref<Admission & { documents: MedicalDocument[] }>();
const patientName = ref("");
const loading = ref(true);
const error = ref("");
const showUpload = ref(false);
const showAccessDialog = ref(false);
const search = ref("");
const docs = ref<MedicalDocument[]>([]);
const documentPage = ref(1);
const documentPageSize = 5;
const documentTotal = ref(0);
const documentTotalPages = ref(0);
const chartAccess = ref<CodeChartAccess[]>([]);
const chartActivity = ref<CodeChartActivity[]>([]);
const chartAccounts = ref<DemoAccount[]>([]);
const selectedAccountId = ref(0);
const selectedPermission = ref<ChartPermission>("VIEW_ONLY");
const selectedExpiration = ref("");
const selectedReason = ref("CHART_COMPLETION");
const chartLoading = ref(false);
const chartError = ref("");
const canManageAccess = computed(() => demo.role === "ADMIN");
const canUploadDocuments = computed(() => demo.role === "ADMIN" || chartAccess.value.some((item) => item.clinicalRole === demo.role && item.permission === "FULL_ACCESS"));
async function load() {
  loading.value = true;
  try {
    admission.value = await api.admission(Number(route.params.admissionId));
    const patient = await api.patient(admission.value.patientId);
    patientName.value = `${patient.lastName}, ${patient.firstName}`;
    await loadChartAccess();
    await loadDocuments(1);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Could not load admission";
  } finally {
    loading.value = false;
  }
}
async function loadChartAccess() {
  const result = await api.codeChartAccess(Number(route.params.admissionId));
  chartAccess.value = result.access;
  chartActivity.value = result.activity;
  chartAccounts.value = result.accounts;
}
function roleLabel(role: string) { return role.charAt(0) + role.slice(1).toLowerCase() }
function actionLabel(action: CodeChartActivity["action"]) { return action.split("_").map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(" ") }
function formatActivityTime(value: string) {
  const utcValue = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(utcValue))
}
function formatDocumentDate(value: string) {
  const utcValue = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(utcValue))
}
async function saveChartAccess() {
  chartLoading.value = true; chartError.value = ""
  try { await api.setCodeChartAccess(Number(route.params.admissionId), selectedAccountId.value, selectedPermission.value, selectedExpiration.value ? new Date(selectedExpiration.value).toISOString() : null, selectedReason.value); await loadChartAccess(); showAccessDialog.value = false } catch (e) { chartError.value = e instanceof Error ? e.message : "Could not update chart access" } finally { chartLoading.value = false }
}
function openAccess(account?: CodeChartAccess) {
  selectedAccountId.value = account?.demoAccountId ?? chartAccounts.value[0]?.demoAccountId ?? 0
  selectedPermission.value = account?.permission ?? "VIEW_ONLY"
  selectedExpiration.value = account?.expiresAt ? account.expiresAt.slice(0, 16) : ""
  selectedReason.value = account?.reason ?? "CHART_COMPLETION"
  showAccessDialog.value = true
}
async function loadDocuments(nextPage = documentPage.value) {
  const result = await api.documents(Number(route.params.admissionId), {
    page: nextPage,
    pageSize: documentPageSize,
    search: search.value,
  });
  docs.value = result.items;
  documentPage.value = result.page;
  documentTotal.value = result.total;
  documentTotalPages.value = result.totalPages;
}
function searchDocuments() {
  documentPage.value = 1;
  void loadDocuments(1);
}
function goToDocumentPage(nextPage: number) {
  if (
    nextPage >= 1 &&
    nextPage <= documentTotalPages.value &&
    nextPage !== documentPage.value
  ) {
    void loadDocuments(nextPage);
  }
}
onMounted(load);
function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
</script>

<template>
  <section v-if="admission">
    <div class="mb-7 flex flex-wrap items-center gap-2 text-sm text-[#8491a3]">
      <RouterLink to="/patients" class="hover:text-[#1c9f8d]"
        >Patients</RouterLink
      ><span class="material-symbols-rounded text-base">chevron_right</span
      ><RouterLink
        :to="`/patients/${admission.patientId}`"
        class="hover:text-[#1c9f8d]"
        >Patient profile</RouterLink
      ><span class="material-symbols-rounded text-base">chevron_right</span
      ><span class="font-semibold text-[#263650]">{{
        admission.admissionNumber
      }}</span>
    </div>
    <div
      class="mb-8 flex flex-col justify-between gap-5 rounded-2xl border border-[#e5ebf2] bg-white p-6 lg:flex-row lg:items-center"
    >
      <div>
        <div class="mb-2 flex items-center gap-3">
          <span
            class="rounded-full bg-[#edf8f6] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#198e7e]"
            >{{ admission.status }} admission</span
          ><span class="text-xs text-[#91a0b2]">Patient record</span>
        </div>
        <h2 class="display text-3xl font-bold">
          {{ admission.admissionNumber }}
        </h2>
        <p class="mt-1 text-sm font-semibold text-[#5d7592]">
          Encounter Number: {{ admission.encounterNumber }}
        </p>
        <p class="mt-2 text-sm text-[#7b8799]">
          {{ admission.ward }} · Admitted
          {{ formatDate(admission.admissionDate)
          }}<span v-if="admission.dischargeDate">
            · Discharged {{ formatDate(admission.dischargeDate) }}</span
          >
        </p>
      </div>
      <div class="flex items-center gap-3">
      <button
        class="flex items-center justify-center gap-2 rounded-xl bg-[#1c9f8d] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#1c9f8d]/20"
        :disabled="chartLoading"
        v-if="canManageAccess"
        @click="openAccess()"
      >
        <span class="material-symbols-rounded">add</span>Give Access
      </button>
      <button
        v-if="canUploadDocuments"
        class="flex items-center justify-center gap-2 rounded-xl bg-[#1c9f8d] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#1c9f8d]/20"
        @click="showUpload = true"
      >
        <span class="material-symbols-rounded">add</span>Add document
      </button>
      </div>
    </div>
    <section v-if="admission" class="hidden mb-8 rounded-2xl border border-[#e5ebf2] bg-white p-6">
      <div class="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div><h3 class="display text-xl font-bold">Code Chart Access</h3><p class="mt-1 text-sm text-[#8491a3]">{{ patientName }} · Encounter {{ admission.encounterNumber }}</p></div>
      </div>
      <p v-if="chartError" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ chartError }}</p>
      <div class="mb-5 flex items-center justify-between"><h4 class="font-bold">Authorized accounts</h4><span class="rounded-full bg-[#edf8f6] px-3 py-1 text-xs font-bold text-[#198e7e]">{{ chartAccess.length }} authorized accounts</span></div>
      <div class="overflow-x-auto"><table class="w-full min-w-[700px] text-left text-sm"><thead class="text-xs uppercase tracking-wider text-[#91a0b2]"><tr><th class="pb-3">Account</th><th class="pb-3">Role</th><th class="pb-3">Permission</th><th class="pb-3">Expiration</th><th class="pb-3">Action</th></tr></thead><tbody><tr v-for="account in chartAccess" :key="account.demoAccountId" class="border-t border-[#edf1f5]"><td class="py-3 font-semibold">{{ account.displayName }}</td><td class="py-3">{{ roleLabel(account.clinicalRole) }}</td><td class="py-3 text-[#6f8095]">{{ account.permission === 'FULL_ACCESS' ? 'Full Access' : 'View Only' }}</td><td class="py-3 text-[#6f8095]">{{ account.expiresAt ? formatActivityTime(account.expiresAt) : 'No expiration' }}</td><td class="py-3 text-right"><button class="text-xs font-bold text-[#36586b]" :disabled="chartLoading" @click="openAccess(account)">Change Access</button></td></tr></tbody></table></div>
      <div v-if="chartActivity.length" class="mt-6 border-t border-[#edf1f5] pt-5"><h4 class="mb-3 font-bold">Access activity</h4><div class="space-y-2 text-sm"><div v-for="item in chartActivity.slice(0, 5)" :key="`${item.createdAt}-${item.clinicalRole}-${item.action}`" class="flex justify-between gap-4 text-[#6f8095]"><span>{{ actionLabel(item.action) }} · {{ roleLabel(item.clinicalRole) }}</span><span>{{ formatActivityTime(item.createdAt) }}</span></div></div></div>
    </section>
    <div
      class="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
    >
      <div>
        <h3 class="display text-xl font-bold">Admission documents</h3>
        <p class="mt-1 text-sm text-[#8491a3]">
          {{ documentTotal }} metadata records attached to this
          admission
        </p>
      </div>
      <label
        class="flex items-center gap-2 rounded-xl border border-[#e1e8f0] bg-white px-3 py-2 text-sm text-[#8491a3] sm:w-64"
        ><span class="material-symbols-rounded text-base">search</span
        ><input
          v-model="search"
          class="w-full outline-none"
          placeholder="Search documents"
          @input="searchDocuments"
      /></label>
    </div>
    <div
      class="overflow-hidden rounded-2xl border border-[#e5ebf2] bg-white shadow-sm"
    >
      <div v-if="!docs.length" class="p-12 text-center">
        <span class="material-symbols-rounded mb-3 text-4xl text-[#a9b7c6]"
          >folder_off</span
        >
        <h4 class="font-bold">No documents yet</h4>
        <p class="mt-1 text-sm text-[#8491a3]">
          Add a document to this admission to see it here.
        </p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-left text-sm">
          <thead
            class="bg-[#fafbfd] text-[11px] font-bold uppercase tracking-wider text-[#91a0b2]"
          >
            <tr>
              <th class="px-6 py-4">Document</th>
              <th class="px-6 py-4">Category</th>
              <th class="px-6 py-4">Document date</th>
              <th class="px-6 py-4">Uploaded by</th>
              <th class="px-6 py-4">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#edf1f5]">
            <tr
              v-for="doc in docs"
              :key="doc.documentId"
              class="transition hover:bg-[#f8fbfc]"
            >
              <td class="px-6 py-5">
                <div class="flex items-center gap-3">
                  <div
                    class="grid h-10 w-10 place-items-center rounded-xl bg-[#fff1ea] text-[#e17f59]"
                  >
                    <span class="material-symbols-rounded">description</span>
                  </div>
                  <div>
                    <div class="font-bold text-[#263650]">
                      {{ doc.fileName }}
                    </div>
                    <div class="mt-1 text-xs text-[#8a98aa]">
                      Document #{{ String(doc.documentId).padStart(4, "0") }}
                    
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-5">
                <span
                  class="rounded-full bg-[#eef3fa] px-3 py-1 text-xs font-bold text-[#61789c]"
                  >{{ doc.documentType }}</span
                >
              </td>
              <td class="px-6 py-5 text-[#53637a]">
                {{ formatDocumentDate(doc.documentDate) }}
              </td>
              <td class="px-6 py-5 text-[#53637a]">{{ doc.uploadedBy }}</td>
              <td class="px-6 py-5">
                <span
                  class="flex items-center gap-1.5 text-xs font-bold text-[#198e7e]"
                  ><span class="h-1.5 w-1.5 rounded-full bg-[#35b9a4]"></span
                  >{{ doc.status }}</span
                >
              </td>
              <td class="px-6 py-5 text-right">
                <a
                  :href="api.documentFileUrl(doc.documentId)"
                  target="_blank"
                  rel="noopener"
                  class="material-symbols-rounded text-[#91a0b2]"
                  title="View document"
                  >visibility</a
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        class="flex flex-col gap-3 border-t border-[#edf1f5] px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <span class="text-[#8491a3]">
          Showing
          {{ documentTotal ? (documentPage - 1) * documentPageSize + 1 : 0 }}–{{
            Math.min(documentPage * documentPageSize, documentTotal)
          }}
          of {{ documentTotal }} documents
        </span>
        <div class="flex items-center gap-1">
          <button
            class="rounded-lg px-3 py-2 font-semibold text-[#53637a] hover:bg-[#f2f6f8] disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="documentPage <= 1 || loading"
            @click="goToDocumentPage(documentPage - 1)"
          >
            Previous
          </button>
          <button
            v-for="pageNumber in documentTotalPages"
            :key="pageNumber"
            class="grid h-9 min-w-9 place-items-center rounded-lg px-2 font-semibold"
            :class="
              pageNumber === documentPage
                ? 'bg-[#e8f1f5] text-[#36586b]'
                : 'text-[#53637a] hover:bg-[#f2f6f8]'
            "
            :disabled="loading"
            @click="goToDocumentPage(pageNumber)"
          >
            {{ pageNumber }}
          </button>
          <button
            class="rounded-lg px-3 py-2 font-semibold text-[#53637a] hover:bg-[#f2f6f8] disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="documentPage >= documentTotalPages || loading"
            @click="goToDocumentPage(documentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>
    <section v-if="admission" class="mt-8 mb-8 rounded-2xl border border-[#e5ebf2] bg-white p-6">
      <div class="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div><h3 class="display text-xl font-bold">Code Chart Access</h3><p class="mt-1 text-sm text-[#8491a3]">{{ patientName }} · Encounter {{ admission.encounterNumber }}</p></div>
      </div>
      <p v-if="chartError" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ chartError }}</p>
      <div class="mb-5 flex items-center justify-between"><h4 class="font-bold">Authorized roles</h4><span class="rounded-full bg-[#edf8f6] px-3 py-1 text-xs font-bold text-[#198e7e]">{{ chartAccess.length }} authorized roles</span></div>
      <div class="overflow-x-auto"><table class="w-full min-w-[700px] text-left text-sm"><thead class="text-xs uppercase tracking-wider text-[#91a0b2]"><tr><th class="pb-3">Account</th><th class="pb-3">Role</th><th class="pb-3">Permission</th><th class="pb-3">Expiration</th><th class="pb-3">Action</th></tr></thead><tbody><tr v-for="account in chartAccess" :key="account.demoAccountId" class="border-t border-[#edf1f5]"><td class="py-3 font-semibold">{{ account.displayName }}</td><td class="py-3">{{ roleLabel(account.clinicalRole) }}</td><td class="py-3 text-[#6f8095]">{{ account.permission === 'FULL_ACCESS' ? 'Full Access' : 'View Only' }}</td><td class="py-3 text-[#6f8095]">{{ account.expiresAt ? formatActivityTime(account.expiresAt) : 'No expiration' }}</td><td class="py-3 text-right"><button class="text-xs font-bold text-[#36586b]" :disabled="chartLoading" @click="openAccess(account)">Change Access</button></td></tr></tbody></table></div>
      <div v-if="chartActivity.length" class="mt-6 border-t border-[#edf1f5] pt-5"><h4 class="mb-3 font-bold">Access activity</h4><div class="space-y-2 text-sm"><div v-for="item in chartActivity.slice(0, 5)" :key="`${item.createdAt}-${item.clinicalRole}-${item.action}`" class="flex justify-between gap-4 text-[#6f8095]"><span>{{ actionLabel(item.action) }} · {{ roleLabel(item.clinicalRole) }}</span><span>{{ formatActivityTime(item.createdAt) }}</span></div></div></div>
    </section>
      <div v-if="showAccessDialog" class="fixed inset-0 z-50 grid place-items-center bg-[#0b1425]/60 p-4 backdrop-blur-sm" @click.self="showAccessDialog = false">
      <div class="w-full max-w-[520px] rounded-3xl bg-white p-7 shadow-2xl"><div class="mb-6 flex items-start justify-between"><div><div class="mb-2 text-xs font-bold uppercase tracking-[.15em] text-[#1b9e8c]">Code Chart Access</div><h2 class="display text-2xl font-bold">Give Access</h2><p class="mt-1 text-sm text-[#7b8799]">{{ patientName }} · Encounter {{ admission?.encounterNumber }}</p></div><button class="grid h-9 w-9 place-items-center rounded-full bg-[#f2f5f8] text-[#718096]" @click="showAccessDialog = false"><span class="material-symbols-rounded">close</span></button></div><div class="space-y-5"><label class="block"><span class="mb-2 block text-xs font-bold uppercase tracking-wider text-[#69778d]">User</span><select v-model="selectedAccountId" class="w-full rounded-xl border border-[#dde5ee] bg-white px-3 py-3 text-sm"><option v-for="account in chartAccounts" :key="account.demoAccountId" :value="account.demoAccountId">{{ account.displayName }} · {{ account.clinicalRole }}</option></select></label><label class="block"><span class="mb-2 block text-xs font-bold uppercase tracking-wider text-[#69778d]">Permission</span><select v-model="selectedPermission" class="w-full rounded-xl border border-[#dde5ee] bg-white px-3 py-3 text-sm"><option value="VIEW_ONLY">View Only</option><option value="FULL_ACCESS">Full Access</option></select></label><label class="block"><span class="mb-2 block text-xs font-bold uppercase tracking-wider text-[#69778d]">Expiration date</span><input v-model="selectedExpiration" type="datetime-local" class="w-full rounded-xl border border-[#dde5ee] bg-white px-3 py-3 text-sm" /></label><label class="block"><span class="mb-2 block text-xs font-bold uppercase tracking-wider text-[#69778d]">Reason</span><select v-model="selectedReason" class="w-full rounded-xl border border-[#dde5ee] bg-white px-3 py-3 text-sm"><option value="CHART_COMPLETION">Chart Completion</option><option value="FOR_REVIEW">For Review</option></select></label><p v-if="chartError" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ chartError }}</p></div><div class="mt-7 flex justify-end gap-3"><button class="rounded-xl px-4 py-3 text-sm font-bold text-[#69778d]" @click="showAccessDialog = false">Cancel</button><button class="flex items-center gap-2 rounded-xl bg-[#1c9f8d] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#1c9f8d]/20 disabled:opacity-50" :disabled="chartLoading" @click="saveChartAccess"><span class="material-symbols-rounded">add</span>Give Access</button></div></div>
    </div>
    <UploadDocumentDialog
      v-if="showUpload"
      :admission-id="admission.admissionId"
      patient-name="patient"
      @close="showUpload = false"
      @saved="
        showUpload = false;
        load();
      "
    />
  </section>
  <div v-else-if="loading" class="p-12 text-center text-sm text-[#8491a3]">
    Loading admission documents…
  </div>
  <div v-else class="rounded-xl bg-red-50 p-5 text-red-700">{{ error }}</div>
</template>
