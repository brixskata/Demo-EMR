import { Router } from 'express'
import type { Request } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../../shared/http.ts'
import { getDocument, listDocumentsPage, createDocument } from './repository.ts'
import { getCodeChartPermission, recordDocumentActivity, type ClinicalRole } from '../admissions/repository.ts'
import { requireRole } from '../../shared/authorization/demoAuth.ts'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const idSchema = z.coerce.number().int().positive()
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(5),
  search: z.string().trim().max(120).default(''),
})
const createSchema = z.object({ admissionId: z.coerce.number().int().positive(), documentType: z.string().min(1).max(80), documentName: z.string().trim().min(1).max(255), fileName: z.string().min(1).max(255), documentDate: z.coerce.date(), uploadedBy: z.string().min(1).max(120), contentBase64: z.string().max(8_000_000).optional() })
const allowedTypes = new Set(['Medical Certificate', 'Laboratory Result', 'Imaging Result', 'Discharge Summary', 'Clinical Notes', 'Prescription', 'Consolidated Medical Record', 'Other'])
const clinicalRoles = new Set<ClinicalRole>(['PHYSICIAN', 'CONSULTANT', 'RESIDENT', 'INTERN', 'NURSE'])
async function ensureDocumentAccess(req: Request, admissionId: number, required: 'VIEW_ONLY' | 'FULL_ACCESS'): Promise<void> {
  if (req.demoRole === 'ADMIN' || req.demoRole === 'RECORDS_STAFF') return
  if (!req.demoRole || !clinicalRoles.has(req.demoRole as ClinicalRole)) throw new HttpError(403, 'This role cannot access admission documents')
  const permission = await getCodeChartPermission(admissionId, req.demoRole as ClinicalRole)
  if (!permission || (required === 'FULL_ACCESS' && permission !== 'FULL_ACCESS')) throw new HttpError(403, 'This role does not have permission to perform this document action')
}
export const documentRouter = Router()
documentRouter.get('/admissions/:admissionId/documents', asyncHandler(async (req, res) => {
  const admissionId = idSchema.parse(req.params.admissionId)
  const query = listQuerySchema.parse(req.query)
  await ensureDocumentAccess(req, admissionId, 'VIEW_ONLY')
  res.json({ ok: true, data: await listDocumentsPage(admissionId, query) })
}))
documentRouter.get('/:documentId', asyncHandler(async (req, res) => {
  const document = await getDocument(idSchema.parse(req.params.documentId))
  if (!document) throw new HttpError(404, 'Document not found')
  await ensureDocumentAccess(req, document.admissionId, 'VIEW_ONLY')
  res.json({ ok: true, data: document })
}))
documentRouter.get('/:documentId/file', asyncHandler(async (req, res) => {
  const document = await getDocument(idSchema.parse(req.params.documentId))
  if (!document) throw new HttpError(404, 'Document not found')
  await ensureDocumentAccess(req, document.admissionId, 'VIEW_ONLY')
  if (!document.storagePath.startsWith('uploads/demo/')) {
    throw new HttpError(404, 'No stored demo file is available for this document')
  }
  const uploadDir = path.resolve(process.cwd(), 'uploads', 'demo')
  const filePath = path.resolve(uploadDir, path.basename(document.storagePath))
  try {
    await access(filePath, constants.R_OK)
  } catch {
    throw new HttpError(404, 'The stored demo file could not be found')
  }
  res.setHeader('Content-Disposition', 'inline')
  if (req.demoRole && clinicalRoles.has(req.demoRole as ClinicalRole)) await recordDocumentActivity(document.admissionId, req.demoRole as ClinicalRole, 'VIEWED_DOCUMENT')
  res.sendFile(filePath)
}))
documentRouter.post('/', requireRole('ADMIN', 'RECORDS_STAFF', 'PHYSICIAN', 'CONSULTANT', 'RESIDENT', 'INTERN', 'NURSE'), asyncHandler(async (req, res) => {
  const input = createSchema.parse(req.body)
  if (!allowedTypes.has(input.documentType)) throw new HttpError(400, 'Unsupported document type')
  await ensureDocumentAccess(req, input.admissionId, 'FULL_ACCESS')
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-180)
  const storedName = `${crypto.randomUUID()}-${safeName}`
  const uploadDir = path.resolve(process.cwd(), 'uploads', 'demo')
  await mkdir(uploadDir, { recursive: true })
  if (input.contentBase64) await writeFile(path.join(uploadDir, storedName), Buffer.from(input.contentBase64, 'base64'))
  const document = await createDocument({ ...input, documentDate: input.documentDate.toISOString().slice(0, 10), storagePath: `uploads/demo/${storedName}` })
  if (req.demoRole && clinicalRoles.has(req.demoRole as ClinicalRole)) await recordDocumentActivity(input.admissionId, req.demoRole as ClinicalRole, 'UPLOADED_DOCUMENT')
  res.status(201).json({ ok: true, data: document })
}))
