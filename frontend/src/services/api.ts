const base = import.meta.env.VITE_API_BASE_URL ?? '/api'

export type Patient = { patientId: number; patientNumber: string; firstName: string; lastName: string; dateOfBirth: string; sex: string; patientType?: 'Inpatient' | 'Outpatient' | 'ER'; admissionCount?: number }
export type Admission = { admissionId: number; patientId: number; admissionNumber: string; encounterNumber: string; admissionDate: string; dischargeDate: string | null; ward: string; status: string; documentCount?: number }
export type MedicalDocument = { documentId: number; admissionId: number; documentType: string; fileName: string; documentDate: string; uploadedBy: string; uploadedAt: string; status: string; storagePath: string }
export type PatientListResult = { items: Patient[]; page: number; pageSize: number; total: number; totalPages: number }
export type DocumentListResult = { items: MedicalDocument[]; page: number; pageSize: number; total: number; totalPages: number }
export type AdmissionListResult = { items: Admission[]; page: number; pageSize: number; total: number; totalPages: number }
export type ClinicalRole = 'PHYSICIAN' | 'CONSULTANT' | 'RESIDENT' | 'INTERN' | 'NURSE'
export type ChartPermission = 'VIEW_ONLY' | 'FULL_ACCESS'
export type DemoAccount = { demoAccountId: number; displayName: string; clinicalRole: ClinicalRole }
export type CodeChartAccess = { demoAccountId: number; displayName: string; clinicalRole: ClinicalRole; permission: ChartPermission; expiresAt: string | null; reason: string; updatedAt: string }
export type CodeChartActivity = { displayName: string; clinicalRole: ClinicalRole; action: 'GRANTED_ACCESS' | 'CHANGED_PERMISSION' | 'REVOKED_ACCESS' | 'EXPIRED_ACCESS' | 'VIEWED_DOCUMENT' | 'UPLOADED_DOCUMENT'; permission: ChartPermission | null; expiresAt: string | null; reason: string | null; createdAt: string }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${base}${path}`, { ...init, headers: { 'Content-Type': 'application/json', 'x-demo-role': localStorage.getItem('demo-role') ?? 'ADMIN', ...init?.headers } })
  const body = await response.json() as { ok: boolean; data: T; error?: { message: string } }
  if (!response.ok || !body.ok) throw new Error(body.error?.message ?? 'Request failed')
  return body.data
}
export const api = {
  patients: (params: { page?: number; pageSize?: number; search?: string; type?: string; gender?: string; dateOfBirthFrom?: string; dateOfBirthTo?: string; sort?: 'name_asc' | 'name_desc' } = {}) => {
    const query = new URLSearchParams({ page: String(params.page ?? 1), pageSize: String(params.pageSize ?? 5) })
    if (params.search) query.set('search', params.search)
    if (params.type) query.set('type', params.type)
    if (params.gender) query.set('gender', params.gender)
    if (params.dateOfBirthFrom) query.set('dateOfBirthFrom', params.dateOfBirthFrom)
    if (params.dateOfBirthTo) query.set('dateOfBirthTo', params.dateOfBirthTo)
    if (params.sort) query.set('sort', params.sort)
    return request<PatientListResult>(`/patients?${query.toString()}`)
  },
  patient: (id: number) => request<Patient & { admissions: Admission[] }>(`/patients/${id}`),
  patientAdmissions: (id: number, params: { page?: number; pageSize?: number } = {}) => request<AdmissionListResult>(`/patients/${id}/admissions?page=${params.page ?? 1}&pageSize=${params.pageSize ?? 10}`),
  admission: (id: number) => request<Admission & { documents: MedicalDocument[] }>(`/admissions/${id}`),
  codeChartAccess: (admissionId: number) => request<{ access: CodeChartAccess[]; activity: CodeChartActivity[]; accounts: DemoAccount[] }>(`/admissions/${admissionId}/code-chart-access`),
  setCodeChartAccess: (admissionId: number, demoAccountId: number, permission: ChartPermission, expiresAt: string | null, reason: string) => request<CodeChartAccess>(`/admissions/${admissionId}/code-chart-access/${demoAccountId}`, { method: 'PUT', body: JSON.stringify({ demoAccountId, permission, expiresAt, reason }) }),
  revokeCodeChartAccess: (admissionId: number, demoAccountId: number) => request<null>(`/admissions/${admissionId}/code-chart-access/${demoAccountId}`, { method: 'DELETE' }),
  recordChartViewed: (admissionId: number, clinicalRole: ClinicalRole) => request<null>(`/admissions/${admissionId}/code-chart-access/viewed`, { method: 'POST', body: JSON.stringify({ clinicalRole }) }),
  documents: (admissionId: number, params: { page?: number; pageSize?: number; search?: string } = {}) => {
    const query = new URLSearchParams({ page: String(params.page ?? 1), pageSize: String(params.pageSize ?? 5) })
    if (params.search) query.set('search', params.search)
    return request<DocumentListResult>(`/documents/admissions/${admissionId}/documents?${query.toString()}`)
  },
  documentFileUrl: (documentId: number) => `${base}/documents/${documentId}/file`,
  createDocument: (payload: { admissionId: number; documentType: string; fileName: string; documentDate: string; uploadedBy: string; contentBase64?: string }) => request<MedicalDocument>('/documents', { method: 'POST', body: JSON.stringify(payload) }),
}
