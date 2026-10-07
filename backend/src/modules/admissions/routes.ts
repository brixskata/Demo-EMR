import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../../shared/http.ts'
import { getAdmission, getCodeChartAccess, revokeCodeChartAccess, setCodeChartAccess } from './repository.ts'
import { listDocuments } from '../medical-records/repository.ts'
export const admissionRouter = Router()
const idSchema = z.coerce.number().int().positive()
const roleSchema = z.enum(['PHYSICIAN', 'CONSULTANT', 'RESIDENT', 'INTERN', 'NURSE'])
const permissionSchema = z.enum(['VIEW_ONLY', 'FULL_ACCESS'])
const accessSchema = z.object({ permission: permissionSchema })
admissionRouter.get('/:admissionId/code-chart-access', asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await getCodeChartAccess(idSchema.parse(req.params.admissionId)) })
}))
admissionRouter.put('/:admissionId/code-chart-access/:clinicalRole', asyncHandler(async (req, res) => {
  const role = roleSchema.parse(req.params.clinicalRole)
  const input = accessSchema.parse(req.body)
  res.json({ ok: true, data: await setCodeChartAccess(idSchema.parse(req.params.admissionId), role, input.permission) })
}))
admissionRouter.delete('/:admissionId/code-chart-access/:clinicalRole', asyncHandler(async (req, res) => {
  await revokeCodeChartAccess(idSchema.parse(req.params.admissionId), roleSchema.parse(req.params.clinicalRole))
  res.json({ ok: true, data: null })
}))
admissionRouter.get('/:admissionId', asyncHandler(async (req, res) => {
  const admissionId = idSchema.parse(req.params.admissionId)
  const admission = await getAdmission(admissionId)
  if (!admission) throw new HttpError(404, 'Admission not found')
  res.json({ ok: true, data: { ...admission, documents: await listDocuments(admissionId) } })
}))
