import { getPool, sql } from '../../database/connection.ts'

export type Patient = {
  patientId: number; patientNumber: string; firstName: string; lastName: string
  dateOfBirth: string; sex: string; createdAt: string; updatedAt: string; admissionCount?: number
}

export type PatientListQuery = { page: number; pageSize: number; search: string }
export type PatientListResult = { items: Patient[]; page: number; pageSize: number; total: number; totalPages: number }

export async function listPatients(query: PatientListQuery): Promise<PatientListResult> {
  const pool = await getPool()
  const offset = (query.page - 1) * query.pageSize
  const result = await pool.request()
    .input('search', sql.NVarChar(120), query.search ? `%${query.search}%` : null)
    .input('offset', sql.Int, offset)
    .input('pageSize', sql.Int, query.pageSize)
    .query<Patient & { total?: number }>(`
    SELECT p.PatientId AS patientId, p.PatientNumber AS patientNumber, p.FirstName AS firstName,
      p.LastName AS lastName, CONVERT(char(10), p.DateOfBirth, 23) AS dateOfBirth, p.Sex AS sex,
      CONVERT(varchar(33), p.CreatedAt, 127) AS createdAt, CONVERT(varchar(33), p.UpdatedAt, 127) AS updatedAt,
      COUNT(a.AdmissionId) AS admissionCount
    FROM dbo.Patient p LEFT JOIN dbo.Admission a ON a.PatientId = p.PatientId
    WHERE @search IS NULL OR p.PatientNumber LIKE @search OR p.FirstName LIKE @search OR p.LastName LIKE @search
    GROUP BY p.PatientId, p.PatientNumber, p.FirstName, p.LastName, p.DateOfBirth, p.Sex, p.CreatedAt, p.UpdatedAt
    ORDER BY p.LastName, p.FirstName
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;

    SELECT COUNT(DISTINCT p.PatientId) AS total
    FROM dbo.Patient p
    WHERE @search IS NULL OR p.PatientNumber LIKE @search OR p.FirstName LIKE @search OR p.LastName LIKE @search;`)
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
