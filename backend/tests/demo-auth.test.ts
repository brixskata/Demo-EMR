import test from 'node:test'
import assert from 'node:assert/strict'
import type { Request } from 'express'
import { demoAuth, requireRole } from '../src/shared/authorization/demoAuth.ts'

test('demo auth defaults to records staff and accepts supported roles', () => {
  const request = { header: () => undefined, demoRole: undefined } as unknown as Request
  const next = () => undefined
  demoAuth(request, {} as never, next)
  assert.equal(request.demoRole, 'RECORDS_STAFF')
  const privileged = { header: () => 'PHYSICIAN', demoRole: undefined } as unknown as Request
  demoAuth(privileged, {} as never, next)
  assert.equal(privileged.demoRole, 'PHYSICIAN')
})

test('upload authorization rejects physician role', () => {
  let error: unknown
  requireRole('ADMIN', 'RECORDS_STAFF')({ demoRole: 'PHYSICIAN' } as never, {} as never, value => { error = value })
  assert.equal((error as Error).message, 'This demo role cannot perform that action')
})
