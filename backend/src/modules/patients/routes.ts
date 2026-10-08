import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../../shared/http.ts'
import { getPatient, listPatients } from './repository.ts'
import { listAdmissions } from '../admissions/repository.ts'

const idSchema = z.coerce.number().int().positive()
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(5),
  search: z.string().trim().max(120).default(''),
  type: z.enum(['', 'Inpatient', 'Outpatient', 'ER']).default(''),
  sort: z.enum(['name_asc', 'name_desc']).default('name_asc'),
})
export const patientRouter = Router()
patientRouter.get('/', asyncHandler(async (req, res) => {
  const query = listQuerySchema.parse(req.query)
  res.json({ ok: true, data: await listPatients(query) })
}))
patientRouter.get('/:patientId', asyncHandler(async (req, res) => {
  const patientId = idSchema.parse(req.params.patientId)
  const patient = await getPatient(patientId)
  if (!patient) throw new HttpError(404, 'Patient not found')
  res.json({ ok: true, data: { ...patient, admissions: await listAdmissions(patientId) } })
}))
