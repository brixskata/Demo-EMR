import type { Request, Response, NextFunction } from 'express'
import { HttpError } from '../http.ts'

export type DemoRole = 'ADMIN' | 'RECORDS_STAFF' | 'PHYSICIAN' | 'CONSULTANT' | 'RESIDENT' | 'INTERN' | 'NURSE'

declare global {
  namespace Express {
    interface Request { demoRole?: DemoRole }
  }
}

const roles = new Set<DemoRole>(['ADMIN', 'RECORDS_STAFF', 'PHYSICIAN', 'CONSULTANT', 'RESIDENT', 'INTERN', 'NURSE'])

export function demoAuth(req: Request, _res: Response, next: NextFunction): void {
  const candidate = req.header('x-demo-role') ?? process.env.DEMO_ROLE ?? 'RECORDS_STAFF'
  req.demoRole = roles.has(candidate as DemoRole) ? candidate as DemoRole : 'RECORDS_STAFF'
  next()
}

export function requireRole(...allowed: DemoRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.demoRole || !allowed.includes(req.demoRole)) {
      next(new HttpError(403, 'This demo role cannot perform that action'))
      return
    }
    next()
  }
}
