import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../../shared/http.ts'
import { getAdmission, getCodeChartAccess, getDemoAccounts, revokeCodeChartAccess, setCodeChartAccess } from './repository.ts'
import { listDocuments } from '../medical-records/repository.ts'
import { requireAuthenticated, requireRole } from '../../shared/authorization/demoAuth.ts'
export const admissionRouter = Router()
admissionRouter.use(requireAuthenticated)
const idSchema = z.coerce.number().int().positive()
const permissionSchema = z.enum(['VIEW_ONLY', 'FULL_ACCESS'])
const reasonSchema = z.enum(['CHART_COMPLETION', 'FOR_REVIEW'])
const accessSchema = z.object({ demoAccountId: z.coerce.number().int().positive(), permission: permissionSchema, expiresAt: z.coerce.date().nullable().optional(), reason: reasonSchema })
admissionRouter.get('/:admissionId/code-chart-access', asyncHandler(async (req, res) => {
  res.json({ ok: true, data: { ...(await getCodeChartAccess(idSchema.parse(req.params.admissionId))), accounts: await getDemoAccounts() } })
}))
admissionRouter.put('/:admissionId/code-chart-access/:demoAccountId', requireRole('ADMIN', 'AUDITOR'), asyncHandler(async (req, res) => {
  const input = accessSchema.parse(req.body)
  res.json({ ok: true, data: await setCodeChartAccess(idSchema.parse(req.params.admissionId), input.demoAccountId, input.permission, input.expiresAt?.toISOString() ?? null, input.reason) })
}))
admissionRouter.delete('/:admissionId/code-chart-access/:demoAccountId', requireRole('ADMIN', 'AUDITOR'), asyncHandler(async (req, res) => {
  await revokeCodeChartAccess(idSchema.parse(req.params.admissionId), Number(req.params.demoAccountId))
  res.json({ ok: true, data: null })
}))
admissionRouter.get('/:admissionId', asyncHandler(async (req, res) => {
  const admissionId = idSchema.parse(req.params.admissionId)
  const admission = await getAdmission(admissionId)
  if (!admission) throw new HttpError(404, 'Admission not found')
  res.json({ ok: true, data: { ...admission, documents: await listDocuments(admissionId) } })
}))
