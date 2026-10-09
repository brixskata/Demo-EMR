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
export type CodeChartActivity = { displayName: string | null; performedByDisplayName: string | null; targetDisplayName: string | null; clinicalRole: ClinicalRole; action: 'GRANTED_ACCESS' | 'CHANGED_PERMISSION' | 'REVOKED_ACCESS' | 'EXPIRED_ACCESS' | 'VIEWED_DOCUMENT' | 'UPLOADED_DOCUMENT'; permission: ChartPermission | null; permissionBefore: ChartPermission | null; permissionAfter: ChartPermission | null; expiresAt: string | null; reason: string | null; documentId: number | null; createdAt: string }

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
    INSERT dbo.CodeChartAccessActivity (AdmissionId, ClinicalRole, Action, PermissionAfter, ExpiresAt, Reason, TargetDemoAccountId)
    SELECT x.AdmissionId, u.ClinicalRole, 'EXPIRED_ACCESS', x.Permission, x.ExpiresAt, x.Reason, x.DemoAccountId
    FROM dbo.CodeChartUserAccess x INNER JOIN dbo.DemoAccount u ON u.DemoAccountId = x.DemoAccountId
    WHERE x.AdmissionId = @admissionId AND x.ExpiresAt IS NOT NULL AND x.ExpiresAt <= SYSUTCDATETIME()
      AND NOT EXISTS (SELECT 1 FROM dbo.CodeChartAccessActivity a WHERE a.AdmissionId = x.AdmissionId AND a.TargetDemoAccountId = x.DemoAccountId AND a.Action = 'EXPIRED_ACCESS' AND a.CreatedAt >= x.UpdatedAt);
    SELECT u.DemoAccountId AS demoAccountId, u.DisplayName AS displayName, u.ClinicalRole AS clinicalRole, x.Permission AS permission,
      CONVERT(varchar(33), x.ExpiresAt, 127) AS expiresAt, x.Reason AS reason, CONVERT(varchar(33), x.UpdatedAt, 127) AS updatedAt
    FROM dbo.CodeChartUserAccess x INNER JOIN dbo.DemoAccount u ON u.DemoAccountId = x.DemoAccountId
    WHERE x.AdmissionId = @admissionId AND (x.ExpiresAt IS NULL OR x.ExpiresAt > SYSUTCDATETIME()) ORDER BY u.DisplayName;
    SELECT target.DisplayName AS displayName, actor.DisplayName AS performedByDisplayName, target.DisplayName AS targetDisplayName,
      a.ClinicalRole AS clinicalRole, a.Action AS action, COALESCE(a.PermissionAfter, a.Permission) AS permission,
      a.PermissionBefore AS permissionBefore, a.PermissionAfter AS permissionAfter, CONVERT(varchar(33), a.ExpiresAt, 127) AS expiresAt,
      a.Reason AS reason, a.DocumentId AS documentId, CONVERT(varchar(33), a.CreatedAt, 127) AS createdAt
    FROM dbo.CodeChartAccessActivity a LEFT JOIN dbo.DemoAccount target ON target.DemoAccountId = a.TargetDemoAccountId
      LEFT JOIN dbo.AppUser actor ON actor.UserId = a.PerformedByUserId
    WHERE a.AdmissionId = @admissionId ORDER BY a.CreatedAt DESC;`)
  return { access: result.recordsets[0] as CodeChartAccess[], activity: result.recordsets[1] as CodeChartActivity[] }
}

export async function setCodeChartAccess(admissionId: number, demoAccountId: number, permission: ChartPermission, expiresAt: string | null, reason: string, performedByUserId: number): Promise<CodeChartAccess> {
  const pool = await getPool()
  const result = await pool.request().input('admissionId', sql.Int, admissionId).input('demoAccountId', sql.Int, demoAccountId).input('permission', sql.VarChar(20), permission).input('expiresAt', sql.DateTime2(3), expiresAt ? new Date(expiresAt) : null).input('reason', sql.VarChar(30), reason).input('performedByUserId', sql.Int, performedByUserId).query<CodeChartAccess>(`
    DECLARE @role varchar(20) = (SELECT ClinicalRole FROM dbo.DemoAccount WHERE DemoAccountId = @demoAccountId);
    DECLARE @previousPermission varchar(20) = (SELECT Permission FROM dbo.CodeChartUserAccess WHERE AdmissionId = @admissionId AND DemoAccountId = @demoAccountId);
    IF EXISTS (SELECT 1 FROM dbo.CodeChartUserAccess WHERE AdmissionId = @admissionId AND DemoAccountId = @demoAccountId)
    BEGIN
      UPDATE dbo.CodeChartUserAccess SET Permission = @permission, ExpiresAt = @expiresAt, Reason = @reason, UpdatedAt = SYSUTCDATETIME() WHERE AdmissionId = @admissionId AND DemoAccountId = @demoAccountId;
      INSERT dbo.CodeChartAccessActivity (AdmissionId, ClinicalRole, Action, Permission, PermissionBefore, PermissionAfter, ExpiresAt, Reason, PerformedByUserId, TargetDemoAccountId) VALUES (@admissionId, @role, 'CHANGED_PERMISSION', @permission, @previousPermission, @permission, @expiresAt, @reason, @performedByUserId, @demoAccountId);
    END
    ELSE
    BEGIN
      INSERT dbo.CodeChartUserAccess (AdmissionId, DemoAccountId, Permission, ExpiresAt, Reason) VALUES (@admissionId, @demoAccountId, @permission, @expiresAt, @reason);
      INSERT dbo.CodeChartAccessActivity (AdmissionId, ClinicalRole, Action, Permission, PermissionAfter, ExpiresAt, Reason, PerformedByUserId, TargetDemoAccountId) VALUES (@admissionId, @role, 'GRANTED_ACCESS', @permission, @permission, @expiresAt, @reason, @performedByUserId, @demoAccountId);
    END;
    SELECT u.DemoAccountId AS demoAccountId, u.DisplayName AS displayName, u.ClinicalRole AS clinicalRole, x.Permission AS permission, CONVERT(varchar(33), x.ExpiresAt, 127) AS expiresAt, x.Reason AS reason, CONVERT(varchar(33), x.UpdatedAt, 127) AS updatedAt FROM dbo.CodeChartUserAccess x INNER JOIN dbo.DemoAccount u ON u.DemoAccountId = x.DemoAccountId WHERE x.AdmissionId = @admissionId AND x.DemoAccountId = @demoAccountId;`)
  return result.recordset[0]!
}

export async function revokeCodeChartAccess(admissionId: number, demoAccountId: number, performedByUserId: number): Promise<void> {
  const pool = await getPool()
  await pool.request().input('admissionId', sql.Int, admissionId).input('demoAccountId', sql.Int, demoAccountId).input('performedByUserId', sql.Int, performedByUserId).query(`DECLARE @role varchar(20) = (SELECT ClinicalRole FROM dbo.DemoAccount WHERE DemoAccountId = @demoAccountId); DECLARE @permission varchar(20) = (SELECT Permission FROM dbo.CodeChartUserAccess WHERE AdmissionId = @admissionId AND DemoAccountId = @demoAccountId); DELETE FROM dbo.CodeChartUserAccess WHERE AdmissionId = @admissionId AND DemoAccountId = @demoAccountId; IF @@ROWCOUNT > 0 INSERT dbo.CodeChartAccessActivity (AdmissionId, ClinicalRole, Action, PermissionBefore, PerformedByUserId, TargetDemoAccountId) VALUES (@admissionId, @role, 'REVOKED_ACCESS', @permission, @performedByUserId, @demoAccountId);`)
}

export async function getCodeChartPermission(admissionId: number, clinicalRole: ClinicalRole): Promise<ChartPermission | undefined> {
  const pool = await getPool()
  const result = await pool.request().input('admissionId', sql.Int, admissionId).input('clinicalRole', sql.VarChar(20), clinicalRole).query<{ permission: ChartPermission }>('SELECT x.Permission AS permission FROM dbo.CodeChartUserAccess x INNER JOIN dbo.DemoAccount a ON a.DemoAccountId = x.DemoAccountId WHERE x.AdmissionId = @admissionId AND a.ClinicalRole = @clinicalRole AND (x.ExpiresAt IS NULL OR x.ExpiresAt > SYSUTCDATETIME())')
  return result.recordset[0]?.permission
}

export async function getCodeChartPermissionForUser(admissionId: number, userId: number): Promise<ChartPermission | undefined> {
  const pool = await getPool()
  const result = await pool.request().input('admissionId', sql.Int, admissionId).input('userId', sql.Int, userId).query<{ permission: ChartPermission }>('SELECT x.Permission AS permission FROM dbo.CodeChartUserAccess x INNER JOIN dbo.AppUser au ON au.DemoAccountId = x.DemoAccountId WHERE x.AdmissionId = @admissionId AND au.UserId = @userId AND (x.ExpiresAt IS NULL OR x.ExpiresAt > SYSUTCDATETIME())')
  return result.recordset[0]?.permission
}

export async function recordDocumentActivity(admissionId: number, clinicalRole: ClinicalRole, action: 'VIEWED_DOCUMENT' | 'UPLOADED_DOCUMENT', performedByUserId: number | null, targetDemoAccountId: number | null, documentId: number | null): Promise<void> {
  const pool = await getPool()
  await pool.request().input('admissionId', sql.Int, admissionId).input('clinicalRole', sql.VarChar(20), clinicalRole).input('action', sql.VarChar(30), action).input('performedByUserId', sql.Int, performedByUserId).input('targetDemoAccountId', sql.Int, targetDemoAccountId).input('documentId', sql.Int, documentId).query('INSERT dbo.CodeChartAccessActivity (AdmissionId, ClinicalRole, Action, PerformedByUserId, TargetDemoAccountId, DocumentId) VALUES (@admissionId, @clinicalRole, @action, @performedByUserId, @targetDemoAccountId, @documentId)')
}
