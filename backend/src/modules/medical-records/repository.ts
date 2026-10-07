import { getPool, sql } from '../../database/connection.ts'

export type MedicalDocument = {
  documentId: number; admissionId: number; documentType: string; documentName: string; fileName: string
  documentDate: string; uploadedBy: string; uploadedAt: string; status: string; storagePath: string
}
export type DocumentListQuery = { page: number; pageSize: number; search: string }
export type DocumentListResult = { items: MedicalDocument[]; page: number; pageSize: number; total: number; totalPages: number }

export async function listDocuments(admissionId: number): Promise<MedicalDocument[]> {
  const pool = await getPool()
  const result = await pool.request().input('admissionId', sql.Int, admissionId).query<MedicalDocument>(`
    SELECT DocumentId AS documentId, AdmissionId AS admissionId, DocumentType AS documentType, COALESCE(DocumentName, FileName) AS documentName, FileName AS fileName,
      CONVERT(char(10), DocumentDate, 23) AS documentDate, UploadedBy AS uploadedBy,
      CONVERT(varchar(33), UploadedAt, 127) AS uploadedAt, Status AS status, StoragePath AS storagePath
    FROM dbo.MedicalDocument WHERE AdmissionId = @admissionId ORDER BY DocumentDate DESC, UploadedAt DESC`)
  return result.recordset
}

export async function listDocumentsPage(admissionId: number, query: DocumentListQuery): Promise<DocumentListResult> {
  const pool = await getPool()
  const offset = (query.page - 1) * query.pageSize
  const result = await pool.request()
    .input('admissionId', sql.Int, admissionId)
    .input('search', sql.NVarChar(120), query.search ? `%${query.search}%` : null)
    .input('offset', sql.Int, offset)
    .input('pageSize', sql.Int, query.pageSize)
    .query<MedicalDocument & { total?: number }>(`
      SELECT DocumentId AS documentId, AdmissionId AS admissionId, DocumentType AS documentType, COALESCE(DocumentName, FileName) AS documentName, FileName AS fileName,
        CONVERT(char(10), DocumentDate, 23) AS documentDate, UploadedBy AS uploadedBy,
        CONVERT(varchar(33), UploadedAt, 127) AS uploadedAt, Status AS status, StoragePath AS storagePath
      FROM dbo.MedicalDocument
      WHERE AdmissionId = @admissionId
        AND (@search IS NULL OR DocumentType LIKE @search OR FileName LIKE @search OR UploadedBy LIKE @search)
      ORDER BY DocumentDate DESC, UploadedAt DESC, DocumentId DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;

      SELECT COUNT(*) AS total
      FROM dbo.MedicalDocument
      WHERE AdmissionId = @admissionId
        AND (@search IS NULL OR DocumentType LIKE @search OR FileName LIKE @search OR UploadedBy LIKE @search);`)
  const total = Number(result.recordsets[1]?.[0]?.total ?? 0)
  return { items: result.recordset, page: query.page, pageSize: query.pageSize, total, totalPages: total ? Math.ceil(total / query.pageSize) : 0 }
}

export async function getDocument(documentId: number): Promise<MedicalDocument | undefined> {
  const pool = await getPool()
  const result = await pool.request().input('documentId', sql.Int, documentId).query<MedicalDocument>(`
    SELECT DocumentId AS documentId, AdmissionId AS admissionId, DocumentType AS documentType, COALESCE(DocumentName, FileName) AS documentName, FileName AS fileName,
      CONVERT(char(10), DocumentDate, 23) AS documentDate, UploadedBy AS uploadedBy,
      CONVERT(varchar(33), UploadedAt, 127) AS uploadedAt, Status AS status, StoragePath AS storagePath
    FROM dbo.MedicalDocument WHERE DocumentId = @documentId`)
  return result.recordset[0]
}

export async function createDocument(input: { admissionId: number; documentType: string; documentName: string; fileName: string; documentDate: string; uploadedBy: string; storagePath: string }): Promise<MedicalDocument> {
  const pool = await getPool()
  const result = await pool.request()
    .input('admissionId', sql.Int, input.admissionId).input('documentType', sql.NVarChar(80), input.documentType)
    .input('documentName', sql.NVarChar(255), input.documentName).input('fileName', sql.NVarChar(255), input.fileName).input('documentDate', sql.Date, input.documentDate)
    .input('uploadedBy', sql.NVarChar(120), input.uploadedBy).input('storagePath', sql.NVarChar(500), input.storagePath)
    .query<MedicalDocument>(`INSERT dbo.MedicalDocument (AdmissionId, DocumentType, DocumentName, FileName, DocumentDate, UploadedBy, Status, StoragePath)
      OUTPUT INSERTED.DocumentId AS documentId, INSERTED.AdmissionId AS admissionId, INSERTED.DocumentType AS documentType,
      COALESCE(INSERTED.DocumentName, INSERTED.FileName) AS documentName, INSERTED.FileName AS fileName, CONVERT(char(10), INSERTED.DocumentDate, 23) AS documentDate,
      INSERTED.UploadedBy AS uploadedBy, CONVERT(varchar(33), INSERTED.UploadedAt, 127) AS uploadedAt,
      INSERTED.Status AS status, INSERTED.StoragePath AS storagePath
      VALUES (@admissionId, @documentType, @documentName, @fileName, @documentDate, @uploadedBy, 'ACTIVE', @storagePath)`)
  return result.recordset[0]!
}
