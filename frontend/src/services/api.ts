const base = import.meta.env.VITE_API_BASE_URL ?? '/api'

export type Patient = { patientId: number; patientNumber: string; firstName: string; lastName: string; dateOfBirth: string; sex: string; admissionCount?: number }
export type Admission = { admissionId: number; patientId: number; admissionNumber: string; admissionDate: string; dischargeDate: string | null; ward: string; status: string; documentCount?: number }
export type MedicalDocument = { documentId: number; admissionId: number; documentType: string; documentName: string; fileName: string; documentDate: string; uploadedBy: string; uploadedAt: string; status: string; storagePath: string }
export type PatientListResult = { items: Patient[]; page: number; pageSize: number; total: number; totalPages: number }
export type DocumentListResult = { items: MedicalDocument[]; page: number; pageSize: number; total: number; totalPages: number }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${base}${path}`, { ...init, headers: { 'Content-Type': 'application/json', 'x-demo-role': localStorage.getItem('demo-role') ?? 'RECORDS_STAFF', ...init?.headers } })
  const body = await response.json() as { ok: boolean; data: T; error?: { message: string } }
  if (!response.ok || !body.ok) throw new Error(body.error?.message ?? 'Request failed')
  return body.data
}
export const api = {
  patients: (params: { page?: number; pageSize?: number; search?: string } = {}) => {
    const query = new URLSearchParams({ page: String(params.page ?? 1), pageSize: String(params.pageSize ?? 5) })
    if (params.search) query.set('search', params.search)
    return request<PatientListResult>(`/patients?${query.toString()}`)
  },
  patient: (id: number) => request<Patient & { admissions: Admission[] }>(`/patients/${id}`),
  admission: (id: number) => request<Admission & { documents: MedicalDocument[] }>(`/admissions/${id}`),
  documents: (admissionId: number, params: { page?: number; pageSize?: number; search?: string } = {}) => {
    const query = new URLSearchParams({ page: String(params.page ?? 1), pageSize: String(params.pageSize ?? 5) })
    if (params.search) query.set('search', params.search)
    return request<DocumentListResult>(`/documents/admissions/${admissionId}/documents?${query.toString()}`)
  },
  documentFileUrl: (documentId: number) => `${base}/documents/${documentId}/file`,
  createDocument: (payload: { admissionId: number; documentType: string; documentName: string; fileName: string; documentDate: string; uploadedBy: string; contentBase64?: string }) => request<MedicalDocument>('/documents', { method: 'POST', body: JSON.stringify(payload) }),
}
