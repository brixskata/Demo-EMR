import { getPool, sql } from '../../database/connection.ts'

export type Admission = {
  admissionId: number; patientId: number; admissionNumber: string; encounterNumber: string; admissionDate: string
  dischargeDate: string | null; ward: string; status: string; documentCount?: number
}
export type ClinicalRole = 'PHYSICIAN' | 'CONSULTANT' | 'RESIDENT' | 'INTERN' | 'NURSE'
export type ChartPermission = 'VIEW_ONLY' | 'FULL_ACCESS'
export type CodeChartAccess = { clinicalRole: ClinicalRole; permission: ChartPermission; updatedAt: string }
export type CodeChartActivity = { clinicalRole: ClinicalRole; action: 'GRANTED_ACCESS' | 'CHANGED_PERMISSION' | 'REVOKED_ACCESS' | 'VIEWED_DOCUMENT' | 'UPLOADED_DOCUMENT'; permission: ChartPermission | null; createdAt: string }

export async function listAdmissions(patientId: number): Promise<Admission[]> {
  const pool = await getPool()
  const result = await pool.request().input('patientId', sql.Int, patientId).query<Admission>(`
    SELECT a.AdmissionId AS admissionId, a.PatientId AS patientId, a.AdmissionNumber AS admissionNumber, a.EncounterNumber AS encounterNumber,
      CONVERT(varchar(33), a.AdmissionDate, 127) AS admissionDate,
      CONVERT(varchar(33), a.DischargeDate, 127) AS dischargeDate, a.Ward AS ward, a.Status AS status,
      COUNT(d.DocumentId) AS documentCount
    FROM dbo.Admission a LEFT JOIN dbo.MedicalDocument d ON d.AdmissionId = a.AdmissionId
    WHERE a.PatientId = @patientId
    GROUP BY a.AdmissionId, a.PatientId, a.AdmissionNumber, a.EncounterNumber, a.AdmissionDate, a.DischargeDate, a.Ward, a.Status
    ORDER BY a.AdmissionDate DESC`)
  return result.recordset
}

export async function getAdmission(admissionId: number): Promise<Admission | undefined> {
  const pool = await getPool()
  const result = await pool.request().input('admissionId', sql.Int, admissionId).query<Admission>(`
    SELECT AdmissionId AS admissionId, PatientId AS patientId, AdmissionNumber AS admissionNumber, EncounterNumber AS encounterNumber,
      CONVERT(varchar(33), AdmissionDate, 127) AS admissionDate,
      CONVERT(varchar(33), DischargeDate, 127) AS dischargeDate, Ward AS ward, Status AS status
    FROM dbo.Admission WHERE AdmissionId = @admissionId`)
  return result.recordset[0]
}

export async function getCodeChartAccess(admissionId: number): Promise<{ access: CodeChartAccess[]; activity: CodeChartActivity[] }> {
  const pool = await getPool()
  const result = await pool.request().input('admissionId', sql.Int, admissionId).query<CodeChartAccess & CodeChartActivity>(`
    SELECT ClinicalRole AS clinicalRole, Permission AS permission, CONVERT(varchar(33), UpdatedAt, 127) AS updatedAt
    FROM dbo.CodeChartRoleAccess WHERE AdmissionId = @admissionId ORDER BY ClinicalRole;
    SELECT ClinicalRole AS clinicalRole, Action AS action, Permission AS permission, CONVERT(varchar(33), CreatedAt, 127) AS createdAt
    FROM dbo.CodeChartAccessActivity WHERE AdmissionId = @admissionId ORDER BY CreatedAt DESC;`)
  return { access: result.recordsets[0] as CodeChartAccess[], activity: result.recordsets[1] as CodeChartActivity[] }
}

export async function setCodeChartAccess(admissionId: number, clinicalRole: ClinicalRole, permission: ChartPermission): Promise<CodeChartAccess> {
  const pool = await getPool()
  const result = await pool.request().input('admissionId', sql.Int, admissionId).input('clinicalRole', sql.VarChar(20), clinicalRole).input('permission', sql.VarChar(20), permission).query<CodeChartAccess>(`
    IF EXISTS (SELECT 1 FROM dbo.CodeChartRoleAccess WHERE AdmissionId = @admissionId AND ClinicalRole = @clinicalRole)
    BEGIN
      UPDATE dbo.CodeChartRoleAccess SET Permission = @permission, UpdatedAt = SYSUTCDATETIME() WHERE AdmissionId = @admissionId AND ClinicalRole = @clinicalRole;
      INSERT dbo.CodeChartAccessActivity (AdmissionId, ClinicalRole, Action, Permission) VALUES (@admissionId, @clinicalRole, 'CHANGED_PERMISSION', @permission);
    END
    ELSE
    BEGIN
      INSERT dbo.CodeChartRoleAccess (AdmissionId, ClinicalRole, Permission) VALUES (@admissionId, @clinicalRole, @permission);
      INSERT dbo.CodeChartAccessActivity (AdmissionId, ClinicalRole, Action, Permission) VALUES (@admissionId, @clinicalRole, 'GRANTED_ACCESS', @permission);
    END;
    SELECT ClinicalRole AS clinicalRole, Permission AS permission, CONVERT(varchar(33), UpdatedAt, 127) AS updatedAt FROM dbo.CodeChartRoleAccess WHERE AdmissionId = @admissionId AND ClinicalRole = @clinicalRole;`)
  return result.recordset[0]!
}

export async function revokeCodeChartAccess(admissionId: number, clinicalRole: ClinicalRole): Promise<void> {
  const pool = await getPool()
  await pool.request().input('admissionId', sql.Int, admissionId).input('clinicalRole', sql.VarChar(20), clinicalRole).query(`DELETE FROM dbo.CodeChartRoleAccess WHERE AdmissionId = @admissionId AND ClinicalRole = @clinicalRole; IF @@ROWCOUNT > 0 INSERT dbo.CodeChartAccessActivity (AdmissionId, ClinicalRole, Action) VALUES (@admissionId, @clinicalRole, 'REVOKED_ACCESS');`)
}

export async function getCodeChartPermission(admissionId: number, clinicalRole: ClinicalRole): Promise<ChartPermission | undefined> {
  const pool = await getPool()
  const result = await pool.request().input('admissionId', sql.Int, admissionId).input('clinicalRole', sql.VarChar(20), clinicalRole).query<{ permission: ChartPermission }>('SELECT Permission AS permission FROM dbo.CodeChartRoleAccess WHERE AdmissionId = @admissionId AND ClinicalRole = @clinicalRole')
  return result.recordset[0]?.permission
}

export async function recordDocumentActivity(admissionId: number, clinicalRole: ClinicalRole, action: 'VIEWED_DOCUMENT' | 'UPLOADED_DOCUMENT'): Promise<void> {
  const pool = await getPool()
  await pool.request().input('admissionId', sql.Int, admissionId).input('clinicalRole', sql.VarChar(20), clinicalRole).input('action', sql.VarChar(30), action).query('INSERT dbo.CodeChartAccessActivity (AdmissionId, ClinicalRole, Action) VALUES (@admissionId, @clinicalRole, @action)')
}
