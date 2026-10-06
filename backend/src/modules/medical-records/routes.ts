import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../../shared/http.ts'
import { getDocument, listDocuments, createDocument } from './repository.ts'
import { requireRole } from '../../shared/authorization/demoAuth.ts'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

const idSchema = z.coerce.number().int().positive()
const createSchema = z.object({ admissionId: z.coerce.number().int().positive(), documentType: z.string().min(1).max(80), fileName: z.string().min(1).max(255), documentDate: z.coerce.date(), uploadedBy: z.string().min(1).max(120), contentBase64: z.string().max(8_000_000).optional() })
const allowedTypes = new Set(['Medical Certificate', 'Laboratory Result', 'Imaging Result', 'Discharge Summary', 'Clinical Notes', 'Prescription', 'Other'])
export const documentRouter = Router()
documentRouter.get('/admissions/:admissionId/documents', asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await listDocuments(idSchema.parse(req.params.admissionId)) })
}))
documentRouter.get('/:documentId', asyncHandler(async (req, res) => {
  const document = await getDocument(idSchema.parse(req.params.documentId))
  if (!document) throw new HttpError(404, 'Document not found')
  res.json({ ok: true, data: document })
}))
documentRouter.post('/', requireRole('ADMIN', 'RECORDS_STAFF', 'NURSE'), asyncHandler(async (req, res) => {
  const input = createSchema.parse(req.body)
  if (!allowedTypes.has(input.documentType)) throw new HttpError(400, 'Unsupported document type')
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-180)
  const storedName = `${crypto.randomUUID()}-${safeName}`
  const uploadDir = path.resolve(process.cwd(), 'uploads', 'demo')
  await mkdir(uploadDir, { recursive: true })
  if (input.contentBase64) await writeFile(path.join(uploadDir, storedName), Buffer.from(input.contentBase64, 'base64'))
  const document = await createDocument({ ...input, documentDate: input.documentDate.toISOString().slice(0, 10), storagePath: `uploads/demo/${storedName}` })
  res.status(201).json({ ok: true, data: document })
}))
