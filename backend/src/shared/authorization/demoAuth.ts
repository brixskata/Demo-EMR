import type { Request, Response, NextFunction } from 'express'
import { HttpError } from '../http.ts'
import { findSession, type AuthRole, type AuthUser } from '../../modules/auth/repository.ts'

export type DemoRole = AuthRole

declare global {
  namespace Express {
    interface Request { demoRole?: DemoRole; authUser?: AuthUser | undefined }
  }
}

const roles = new Set<DemoRole>(['ADMIN', 'AUDITOR', 'RECORDS_VIEWER'])

export function demoAuth(req: Request, _res: Response, next: NextFunction): void {
  const cookie = req.headers?.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith('smartehr_session='))?.slice('smartehr_session='.length)
  if (cookie) {
    void findSession(cookie, process.env.AUTH_IDLE_MINUTES ? Number(process.env.AUTH_IDLE_MINUTES) : null).then(user => { req.authUser = user; next() }).catch(next)
    return
  }
  const demoModeEnabled = process.env.NODE_ENV !== 'production' && (process.env.AUTH_DEMO_MODE ?? 'false').toLowerCase() === 'true'
  if (demoModeEnabled) {
    const candidate = req.header('x-demo-role') ?? process.env.DEMO_ROLE ?? 'ADMIN'
    req.demoRole = roles.has(candidate as DemoRole) ? candidate as DemoRole : 'ADMIN'
  }
  next()
}

export function requireRole(...allowed: DemoRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.authUser?.role ?? req.demoRole
    if (!role || !allowed.includes(role)) {
      next(new HttpError(403, 'This demo role cannot perform that action'))
      return
    }
    next()
  }
}

export function requireAuthenticated(req: Request, _res: Response, next: NextFunction): void {
  if (!req.authUser && !req.demoRole) {
    next(new HttpError(401, 'Authentication required'))
    return
  }
  next()
}
