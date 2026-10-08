import { getPool, sql } from '../../database/connection.ts'

export type Patient = {
  patientId: number; patientNumber: string; firstName: string; lastName: string
  dateOfBirth: string; sex: string; patientType?: 'Inpatient' | 'Outpatient' | 'ER'; createdAt: string; updatedAt: string; admissionCount?: number
}

export type PatientListQuery = { page: number; pageSize: number; search: string; type: '' | 'Inpatient' | 'Outpatient' | 'ER'; sort: 'name_asc' | 'name_desc' }
export type PatientListResult = { items: Patient[]; page: number; pageSize: number; total: number; totalPages: number }

export async function listPatients(query: PatientListQuery): Promise<PatientListResult> {
  const pool = await getPool()
  const offset = (query.page - 1) * query.pageSize
  const result = await pool.request()
    .input('search', sql.NVarChar(120), query.search ? `%${query.search}%` : null)
    .input('type', sql.VarChar(20), query.type || null)
    .input('sort', sql.VarChar(20), query.sort || 'name_asc')
    .input('offset', sql.Int, offset)
    .input('pageSize', sql.Int, query.pageSize)
    .query<Patient & { total?: number }>(`
    WITH PatientResults AS (
      SELECT p.PatientId AS patientId, p.PatientNumber AS patientNumber, p.FirstName AS firstName,
      p.LastName AS lastName, CONVERT(char(10), p.DateOfBirth, 23) AS dateOfBirth, p.Sex AS sex,
      CONVERT(varchar(33), p.CreatedAt, 127) AS createdAt, CONVERT(varchar(33), p.UpdatedAt, 127) AS updatedAt,
      COUNT(a.AdmissionId) AS admissionCount,
      CASE WHEN MAX(CASE WHEN UPPER(a.Ward) LIKE '%ER%' OR UPPER(a.Ward) LIKE '%EMERGENCY%' THEN 1 ELSE 0 END) = 1 THEN 'ER'
        WHEN MAX(CASE WHEN UPPER(a.Status) = 'ACTIVE' THEN 1 ELSE 0 END) = 1 THEN 'Inpatient' ELSE 'Outpatient' END AS patientType
      FROM dbo.Patient p LEFT JOIN dbo.Admission a ON a.PatientId = p.PatientId
      WHERE @search IS NULL OR p.PatientNumber LIKE @search OR p.FirstName LIKE @search OR p.LastName LIKE @search
      GROUP BY p.PatientId, p.PatientNumber, p.FirstName, p.LastName, p.DateOfBirth, p.Sex, p.CreatedAt, p.UpdatedAt
    )
    SELECT * FROM PatientResults
    WHERE @type IS NULL OR patientType = @type
    ORDER BY CASE WHEN @sort = 'name_desc' THEN lastName END DESC, CASE WHEN @sort = 'name_desc' THEN firstName END DESC,
      CASE WHEN @sort <> 'name_desc' THEN lastName END ASC, CASE WHEN @sort <> 'name_desc' THEN firstName END ASC,
      patientId ASC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;

    ;WITH PatientResults AS (
      SELECT p.PatientId,
        CASE WHEN MAX(CASE WHEN UPPER(a.Ward) LIKE '%ER%' OR UPPER(a.Ward) LIKE '%EMERGENCY%' THEN 1 ELSE 0 END) = 1 THEN 'ER'
          WHEN MAX(CASE WHEN UPPER(a.Status) = 'ACTIVE' THEN 1 ELSE 0 END) = 1 THEN 'Inpatient' ELSE 'Outpatient' END AS patientType
      FROM dbo.Patient p LEFT JOIN dbo.Admission a ON a.PatientId = p.PatientId
      WHERE @search IS NULL OR p.PatientNumber LIKE @search OR p.FirstName LIKE @search OR p.LastName LIKE @search
      GROUP BY p.PatientId, p.PatientNumber, p.FirstName, p.LastName, p.DateOfBirth, p.Sex, p.CreatedAt, p.UpdatedAt
    )
    SELECT COUNT(*) AS total FROM PatientResults WHERE @type IS NULL OR patientType = @type;`)
  const total = Number(result.recordsets[1]?.[0]?.total ?? 0)
  return { items: result.recordset, page: query.page, pageSize: query.pageSize, total, totalPages: total ? Math.ceil(total / query.pageSize) : 0 }
}

export async function getPatient(patientId: number): Promise<Patient | undefined> {
  const pool = await getPool()
  const result = await pool.request().input('patientId', sql.Int, patientId).query<Patient>(`
    SELECT PatientId AS patientId, PatientNumber AS patientNumber, FirstName AS firstName, LastName AS lastName,
      CONVERT(char(10), DateOfBirth, 23) AS dateOfBirth, Sex AS sex,
      CONVERT(varchar(33), CreatedAt, 127) AS createdAt, CONVERT(varchar(33), UpdatedAt, 127) AS updatedAt
    FROM dbo.Patient WHERE PatientId = @patientId`)
  return result.recordset[0]
}
