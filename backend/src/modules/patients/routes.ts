import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../../shared/http.ts'
import { getPatient, listPatients } from './repository.ts'
import { listAdmissions } from '../admissions/repository.ts'

const idSchema = z.coerce.number().int().positive()
export const patientRouter = Router()
patientRouter.get('/', asyncHandler(async (req, res) => {
  const search = z.string().max(120).optional().parse(req.query.search)
  res.json({ ok: true, data: await listPatients(search) })
}))
patientRouter.get('/:patientId', asyncHandler(async (req, res) => {
  const patientId = idSchema.parse(req.params.patientId)
  const patient = await getPatient(patientId)
  if (!patient) throw new HttpError(404, 'Patient not found')
  res.json({ ok: true, data: { ...patient, admissions: await listAdmissions(patientId) } })
}))
