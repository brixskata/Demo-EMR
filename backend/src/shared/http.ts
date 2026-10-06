import type { Request, Response, NextFunction } from 'express'
import pino from 'pino'

export const logger = pino({ name: 'smartehr-demo' })

export class HttpError extends Error {
  public readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function asyncHandler(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next)
  }
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const status = error instanceof HttpError ? error.status : 500
  const message = error instanceof Error ? error.message : 'Unexpected server error'
  if (status === 500) logger.error({ error }, 'request failed')
  res.status(status).json({ ok: false, error: { message } })
}
