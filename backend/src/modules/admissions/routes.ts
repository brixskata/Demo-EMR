import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../../shared/http.ts'
import { getAdmission } from './repository.ts'
import { listDocuments } from '../medical-records/repository.ts'
export const admissionRouter = Router()
const idSchema = z.coerce.number().int().positive()
admissionRouter.get('/:admissionId', asyncHandler(async (req, res) => {
  const admissionId = idSchema.parse(req.params.admissionId)
  const admission = await getAdmission(admissionId)
  if (!admission) throw new HttpError(404, 'Admission not found')
  res.json({ ok: true, data: { ...admission, documents: await listDocuments(admissionId) } })
}))
