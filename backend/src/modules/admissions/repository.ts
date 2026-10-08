import { getPool, sql } from '../../database/connection.ts'

export type Admission = {
  admissionId: number; patientId: number; admissionNumber: string; encounterNumber: string; admissionDate: string
  dischargeDate: string | null; ward: string; status: string; documentCount?: number
}
export type AdmissionListResult = { items: Admission[]; page: number; pageSize: number; total: number; totalPages: number }
export type ClinicalRole = 'ADMIN' | 'AUDITOR' | 'RECORDS_VIEWER'
export type ChartPermission = 'VIEW_ONLY' | 'FULL_ACCESS'
export type DemoAccount = { demoAccountId: number; displayName: string; clinicalRole: ClinicalRole }
export type CodeChartAccess = { demoAccountId: number; displayName: string; clinicalRole: ClinicalRole; permission: ChartPermission; expiresAt: string | null; reason: string; updatedAt: string }
export type CodeChartActivity = { displayName: string; clinicalRole: ClinicalRole; action: 'GRANTED_ACCESS' | 'CHANGED_PERMISSION' | 'REVOKED_ACCESS' | 'EXPIRED_ACCESS' | 'VIEWED_DOCUMENT' | 'UPLOADED_DOCUMENT'; permission: ChartPermission | null; expiresAt: string | null; reason: string | null; createdAt: string }

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

export async function listAdmissionsPage(patientId: number, page: number, pageSize: number): Promise<AdmissionListResult> {
  const pool = await getPool()
  const offset = (page - 1) * pageSize
  const result = await pool.request().input('patientId', sql.Int, patientId).input('offset', sql.Int, offset).input('pageSize', sql.Int, pageSize).query<Admission & { total?: number }>(`
    SELECT a.AdmissionId AS admissionId, a.PatientId AS patientId, a.AdmissionNumber AS admissionNumber, a.EncounterNumber AS encounterNumber,
      CONVERT(varchar(33), a.AdmissionDate, 127) AS admissionDate, CONVERT(varchar(33), a.DischargeDate, 127) AS dischargeDate,
      a.Ward AS ward, a.Status AS status, COUNT(d.DocumentId) AS documentCount
    FROM dbo.Admission a LEFT JOIN dbo.MedicalDocument d ON d.AdmissionId = a.AdmissionId
    WHERE a.PatientId = @patientId
    GROUP BY a.AdmissionId, a.PatientId, a.AdmissionNumber, a.EncounterNumber, a.AdmissionDate, a.DischargeDate, a.Ward, a.Status
    ORDER BY a.AdmissionDate DESC, a.AdmissionId DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
    SELECT COUNT(*) AS total FROM dbo.Admission WHERE PatientId = @patientId;`)
  const total = Number(result.recordsets[1]?.[0]?.total ?? 0)
  return { items: result.recordset, page, pageSize, total, totalPages: total ? Math.ceil(total / pageSize) : 0 }
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

export async function getDemoAccounts(): Promise<DemoAccount[]> {
  const pool = await getPool()
  const result = await pool.request().query<DemoAccount>('SELECT DemoAccountId AS demoAccountId, DisplayName AS displayName, ClinicalRole AS clinicalRole FROM dbo.DemoAccount ORDER BY DisplayName')
  return result.recordset
}

export async function getCodeChartAccess(admissionId: number): Promise<{ access: CodeChartAccess[]; activity: CodeChartActivity[] }> {
  const pool = await getPool()
  const result = await pool.request().input('admissionId', sql.Int, admissionId).query<CodeChartAccess & CodeChartActivity>(`
    SELECT u.DemoAccountId AS demoAccountId, u.DisplayName AS displayName, u.ClinicalRole AS clinicalRole, x.Permission AS permission,
      CONVERT(varchar(33), x.ExpiresAt, 127) AS expiresAt, x.Reason AS reason, CONVERT(varchar(33), x.UpdatedAt, 127) AS updatedAt
    FROM dbo.CodeChartUserAccess x INNER JOIN dbo.DemoAccount u ON u.DemoAccountId = x.DemoAccountId
    WHERE x.AdmissionId = @admissionId AND (x.ExpiresAt IS NULL OR x.ExpiresAt > SYSUTCDATETIME()) ORDER BY u.DisplayName;
    SELECT u.DisplayName AS displayName, u.ClinicalRole AS clinicalRole, a.Action AS action, a.Permission AS permission,
      CONVERT(varchar(33), a.ExpiresAt, 127) AS expiresAt, a.Reason AS reason, CONVERT(varchar(33), a.CreatedAt, 127) AS createdAt
    FROM dbo.CodeChartAccessActivity a INNER JOIN dbo.DemoAccount u ON u.ClinicalRole = a.ClinicalRole
    WHERE a.AdmissionId = @admissionId ORDER BY a.CreatedAt DESC;`)
  return { access: result.recordsets[0] as CodeChartAccess[], activity: result.recordsets[1] as CodeChartActivity[] }
}

export async function setCodeChartAccess(admissionId: number, demoAccountId: number, permission: ChartPermission, expiresAt: string | null, reason: string): Promise<CodeChartAccess> {
  const pool = await getPool()
  const result = await pool.request().input('admissionId', sql.Int, admissionId).input('demoAccountId', sql.Int, demoAccountId).input('permission', sql.VarChar(20), permission).input('expiresAt', sql.DateTime2(3), expiresAt ? new Date(expiresAt) : null).input('reason', sql.VarChar(30), reason).query<CodeChartAccess>(`
    DECLARE @role varchar(20) = (SELECT ClinicalRole FROM dbo.DemoAccount WHERE DemoAccountId = @demoAccountId);
    IF EXISTS (SELECT 1 FROM dbo.CodeChartUserAccess WHERE AdmissionId = @admissionId AND DemoAccountId = @demoAccountId)
    BEGIN
      UPDATE dbo.CodeChartUserAccess SET Permission = @permission, ExpiresAt = @expiresAt, Reason = @reason, UpdatedAt = SYSUTCDATETIME() WHERE AdmissionId = @admissionId AND DemoAccountId = @demoAccountId;
      INSERT dbo.CodeChartAccessActivity (AdmissionId, ClinicalRole, Action, Permission) VALUES (@admissionId, @role, 'CHANGED_PERMISSION', @permission);
    END
    ELSE
    BEGIN
      INSERT dbo.CodeChartUserAccess (AdmissionId, DemoAccountId, Permission, ExpiresAt, Reason) VALUES (@admissionId, @demoAccountId, @permission, @expiresAt, @reason);
      INSERT dbo.CodeChartAccessActivity (AdmissionId, ClinicalRole, Action, Permission) VALUES (@admissionId, @role, 'GRANTED_ACCESS', @permission);
    END;
    SELECT u.DemoAccountId AS demoAccountId, u.DisplayName AS displayName, u.ClinicalRole AS clinicalRole, x.Permission AS permission, CONVERT(varchar(33), x.ExpiresAt, 127) AS expiresAt, x.Reason AS reason, CONVERT(varchar(33), x.UpdatedAt, 127) AS updatedAt FROM dbo.CodeChartUserAccess x INNER JOIN dbo.DemoAccount u ON u.DemoAccountId = x.DemoAccountId WHERE x.AdmissionId = @admissionId AND x.DemoAccountId = @demoAccountId;`)
  return result.recordset[0]!
}

export async function revokeCodeChartAccess(admissionId: number, demoAccountId: number): Promise<void> {
  const pool = await getPool()
  await pool.request().input('admissionId', sql.Int, admissionId).input('demoAccountId', sql.Int, demoAccountId).query(`DECLARE @role varchar(20) = (SELECT ClinicalRole FROM dbo.DemoAccount WHERE DemoAccountId = @demoAccountId); DELETE FROM dbo.CodeChartUserAccess WHERE AdmissionId = @admissionId AND DemoAccountId = @demoAccountId; IF @@ROWCOUNT > 0 INSERT dbo.CodeChartAccessActivity (AdmissionId, ClinicalRole, Action) VALUES (@admissionId, @role, 'REVOKED_ACCESS');`)
}

export async function getCodeChartPermission(admissionId: number, clinicalRole: ClinicalRole): Promise<ChartPermission | undefined> {
  const pool = await getPool()
  const result = await pool.request().input('admissionId', sql.Int, admissionId).input('clinicalRole', sql.VarChar(20), clinicalRole).query<{ permission: ChartPermission }>('SELECT x.Permission AS permission FROM dbo.CodeChartUserAccess x INNER JOIN dbo.DemoAccount a ON a.DemoAccountId = x.DemoAccountId WHERE x.AdmissionId = @admissionId AND a.ClinicalRole = @clinicalRole AND (x.ExpiresAt IS NULL OR x.ExpiresAt > SYSUTCDATETIME())')
  return result.recordset[0]?.permission
}

export async function recordDocumentActivity(admissionId: number, clinicalRole: ClinicalRole, action: 'VIEWED_DOCUMENT' | 'UPLOADED_DOCUMENT'): Promise<void> {
  const pool = await getPool()
  await pool.request().input('admissionId', sql.Int, admissionId).input('clinicalRole', sql.VarChar(20), clinicalRole).input('action', sql.VarChar(30), action).query('INSERT dbo.CodeChartAccessActivity (AdmissionId, ClinicalRole, Action) VALUES (@admissionId, @clinicalRole, @action)')
}
