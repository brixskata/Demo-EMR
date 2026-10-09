import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'node:path'
import { patientRouter } from './modules/patients/routes.ts'
import { admissionRouter } from './modules/admissions/routes.ts'
import { documentRouter } from './modules/medical-records/routes.ts'
import { demoAuth } from './shared/authorization/demoAuth.ts'
import { errorHandler } from './shared/http.ts'
import { authRouter } from './modules/auth/routes.ts'

const app = express()
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: true, credentials: false }))
app.use(express.json({ limit: '8mb' }))
app.use(demoAuth)
app.use('/api/auth', authRouter)
app.get('/api/health', (_req, res) => res.json({ ok: true, data: { service: 'SmartEHR demo API', syntheticDataOnly: true } }))
app.use('/api/patients', patientRouter)
app.use('/api/admissions', admissionRouter)
app.use('/api/documents', documentRouter)
app.use('/uploads/demo', express.static(path.resolve(process.cwd(), 'uploads', 'demo')))
app.use(errorHandler)

const port = Number(process.env.PORT ?? 3001)
app.listen(port, () => console.log(`SmartEHR demo API listening on http://localhost:${port}`))
