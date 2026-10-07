<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { RouterLink } from "vue-router";
import { api, type Admission, type MedicalDocument } from "../services/api";
import UploadDocumentDialog from "../components/medical-records/UploadDocumentDialog.vue";
import { useDemoStore } from "../stores/demo";
const route = useRoute();
const demo = useDemoStore();
const admission = ref<Admission & { documents: MedicalDocument[] }>();
const loading = ref(true);
const error = ref("");
const showUpload = ref(false);
const search = ref("");
const docs = ref<MedicalDocument[]>([]);
const documentPage = ref(1);
const documentPageSize = 5;
const documentTotal = ref(0);
const documentTotalPages = ref(0);
async function load() {
  loading.value = true;
  try {
    admission.value = await api.admission(Number(route.params.admissionId));
    await loadDocuments(1);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Could not load admission";
  } finally {
    loading.value = false;
  }
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
          ><span class="text-xs text-[#91a0b2]">Synthetic record</span>
        </div>
        <h2 class="display text-3xl font-bold">
          {{ admission.admissionNumber }}
        </h2>
        <p class="mt-2 text-sm text-[#7b8799]">
          {{ admission.ward }} · Admitted
          {{ formatDate(admission.admissionDate)
          }}<span v-if="admission.dischargeDate">
            · Discharged {{ formatDate(admission.dischargeDate) }}</span
          >
        </p>
      </div>
      <button
        v-if="demo.canUpload"
        class="flex items-center justify-center gap-2 rounded-xl bg-[#1c9f8d] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#1c9f8d]/20"
        @click="showUpload = true"
      >
        <span class="material-symbols-rounded">add</span>Add document
      </button>
    </div>
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
          Add a synthetic document to this admission to see it here.
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
                {{ formatDate(doc.documentDate) }}
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
    <UploadDocumentDialog
      v-if="showUpload"
      :admission-id="admission.admissionId"
      patient-name="synthetic patient"
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
