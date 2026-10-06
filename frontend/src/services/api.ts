const base = import.meta.env.VITE_API_BASE_URL ?? '/api'

export type Patient = { patientId: number; patientNumber: string; firstName: string; lastName: string; dateOfBirth: string; sex: string; admissionCount?: number }
export type Admission = { admissionId: number; patientId: number; admissionNumber: string; admissionDate: string; dischargeDate: string | null; ward: string; status: string; documentCount?: number }
export type MedicalDocument = { documentId: number; admissionId: number; documentType: string; fileName: string; documentDate: string; uploadedBy: string; uploadedAt: string; status: string; storagePath: string }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${base}${path}`, { ...init, headers: { 'Content-Type': 'application/json', 'x-demo-role': localStorage.getItem('demo-role') ?? 'RECORDS_STAFF', ...init?.headers } })
  const body = await response.json() as { ok: boolean; data: T; error?: { message: string } }
  if (!response.ok || !body.ok) throw new Error(body.error?.message ?? 'Request failed')
  return body.data
}
export const api = {
  patients: (search = '') => request<Patient[]>(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  patient: (id: number) => request<Patient & { admissions: Admission[] }>(`/patients/${id}`),
  admission: (id: number) => request<Admission & { documents: MedicalDocument[] }>(`/admissions/${id}`),
  documents: (admissionId: number) => request<MedicalDocument[]>(`/documents/admissions/${admissionId}/documents`),
  documentFileUrl: (documentId: number) => `${base}/documents/${documentId}/file`,
  createDocument: (payload: { admissionId: number; documentType: string; fileName: string; documentDate: string; uploadedBy: string; contentBase64?: string }) => request<MedicalDocument>('/documents', { method: 'POST', body: JSON.stringify(payload) }),
}
