import { getPool, sql } from '../../database/connection.ts'

export type Admission = {
  admissionId: number; patientId: number; admissionNumber: string; admissionDate: string
  dischargeDate: string | null; ward: string; status: string; documentCount?: number
}

export async function listAdmissions(patientId: number): Promise<Admission[]> {
  const pool = await getPool()
  const result = await pool.request().input('patientId', sql.Int, patientId).query<Admission>(`
    SELECT a.AdmissionId AS admissionId, a.PatientId AS patientId, a.AdmissionNumber AS admissionNumber,
      CONVERT(varchar(33), a.AdmissionDate, 127) AS admissionDate,
      CONVERT(varchar(33), a.DischargeDate, 127) AS dischargeDate, a.Ward AS ward, a.Status AS status,
      COUNT(d.DocumentId) AS documentCount
    FROM dbo.Admission a LEFT JOIN dbo.MedicalDocument d ON d.AdmissionId = a.AdmissionId
    WHERE a.PatientId = @patientId
    GROUP BY a.AdmissionId, a.PatientId, a.AdmissionNumber, a.AdmissionDate, a.DischargeDate, a.Ward, a.Status
    ORDER BY a.AdmissionDate DESC`)
  return result.recordset
}

export async function getAdmission(admissionId: number): Promise<Admission | undefined> {
  const pool = await getPool()
  const result = await pool.request().input('admissionId', sql.Int, admissionId).query<Admission>(`
    SELECT AdmissionId AS admissionId, PatientId AS patientId, AdmissionNumber AS admissionNumber,
      CONVERT(varchar(33), AdmissionDate, 127) AS admissionDate,
      CONVERT(varchar(33), DischargeDate, 127) AS dischargeDate, Ward AS ward, Status AS status
    FROM dbo.Admission WHERE AdmissionId = @admissionId`)
  return result.recordset[0]
}
