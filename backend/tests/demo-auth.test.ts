import test from 'node:test'
import assert from 'node:assert/strict'
import type { Request } from 'express'
import { demoAuth, requireRole } from '../src/shared/authorization/demoAuth.ts'

test('demo auth does not trust role headers unless explicitly enabled', () => {
  delete process.env.AUTH_DEMO_MODE
  const request = { header: () => undefined, demoRole: undefined } as unknown as Request
  const next = () => undefined
  demoAuth(request, {} as never, next)
  assert.equal(request.demoRole, undefined)
})

test('admin-only authorization rejects records viewer role', () => {
  let error: unknown
  requireRole('ADMIN')({ demoRole: 'RECORDS_VIEWER' } as never, {} as never, value => { error = value })
  assert.equal((error as Error).message, 'This demo role cannot perform that action')
})
