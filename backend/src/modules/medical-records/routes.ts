import { Router } from 'express'
import type { Request } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../../shared/http.ts'
import { getDocument, listDocumentsPage, createDocument, getPatientNumberForAdmission } from './repository.ts'
import { getCodeChartPermissionForUser, recordDocumentActivity, type ClinicalRole } from '../admissions/repository.ts'
import { requireAuthenticated, requireRole } from '../../shared/authorization/demoAuth.ts'
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
const createSchema = z.object({ admissionId: z.coerce.number().int().positive(), documentType: z.string().min(1).max(80), fileName: z.string().min(1).max(255), documentDate: z.coerce.date(), uploadedBy: z.string().min(1).max(120), contentBase64: z.string().max(8_000_000).optional() })
const allowedTypes = new Set(['Medical Certificate', 'Laboratory Result', 'Imaging Result', 'Discharge Summary', 'Clinical Notes', 'Prescription', 'Consolidated Medical Record', 'Other'])
const workflowRoles = new Set<ClinicalRole>(['ADMIN', 'AUDITOR', 'RECORDS_VIEWER'])
async function ensureDocumentAccess(req: Request, admissionId: number, required: 'VIEW_ONLY' | 'FULL_ACCESS'): Promise<void> {
  const role = req.authUser?.role ?? req.demoRole
  if (role === 'ADMIN' || (required === 'FULL_ACCESS' && role === 'AUDITOR')) return
  if (role === 'AUDITOR' && required === 'VIEW_ONLY') return
  if (role === 'RECORDS_VIEWER' && req.authUser) {
    const permission = await getCodeChartPermissionForUser(admissionId, req.authUser.userId)
    if (permission === 'VIEW_ONLY' || permission === 'FULL_ACCESS') {
      if (required === 'VIEW_ONLY' || permission === 'FULL_ACCESS') return
    }
  }
  if (!role || !workflowRoles.has(role as ClinicalRole)) throw new HttpError(403, 'This role cannot access admission documents')
  throw new HttpError(403, 'This role does not have permission to perform this document action')
}
export const documentRouter = Router()
documentRouter.use(requireAuthenticated)
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
  const role = req.authUser?.role ?? req.demoRole
  if (role && workflowRoles.has(role as ClinicalRole)) await recordDocumentActivity(document.admissionId, role as ClinicalRole, 'VIEWED_DOCUMENT', req.authUser?.userId ?? null, req.authUser?.demoAccountId ?? null, document.documentId)
  res.sendFile(filePath)
}))
documentRouter.post('/', requireRole('ADMIN', 'AUDITOR'), asyncHandler(async (req, res) => {
  const input = createSchema.parse(req.body)
  if (!allowedTypes.has(input.documentType)) throw new HttpError(400, 'Unsupported document type')
  await ensureDocumentAccess(req, input.admissionId, 'FULL_ACCESS')
  const patientNumber = await getPatientNumberForAdmission(input.admissionId)
  if (!patientNumber) throw new HttpError(404, 'Admission patient not found')
  const safePatientNumber = patientNumber.replace(/[^a-zA-Z0-9_-]/g, '_')
  const extension = path.extname(input.fileName).toLowerCase().replace(/[^a-z0-9.]/g, '')
  const storedName = `${safePatientNumber}_${crypto.randomBytes(6).toString('hex')}${extension}`
  const uploadDir = path.resolve(process.cwd(), 'uploads', 'demo')
  await mkdir(uploadDir, { recursive: true })
  if (input.contentBase64) await writeFile(path.join(uploadDir, storedName), Buffer.from(input.contentBase64, 'base64'))
  const document = await createDocument({ ...input, documentDate: input.documentDate.toISOString(), storagePath: `uploads/demo/${storedName}` })
  const role = req.authUser?.role ?? req.demoRole
  if (role && workflowRoles.has(role as ClinicalRole)) await recordDocumentActivity(input.admissionId, role as ClinicalRole, 'UPLOADED_DOCUMENT', req.authUser?.userId ?? null, req.authUser?.demoAccountId ?? null, document.documentId)
  res.status(201).json({ ok: true, data: document })
}))
