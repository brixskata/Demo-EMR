import { Router } from 'express'
import { z } from 'zod'
import argon2 from 'argon2'
import { asyncHandler, HttpError } from '../../shared/http.ts'
import { createSession, findUser, revokeSession } from './repository.ts'

export const authRouter = Router()
const credentialsSchema = z.object({ username: z.string().trim().min(1).max(120), password: z.string().min(1).max(200) })
const sessionCookie = 'smartehr_session'
const cookieOptions = `HttpOnly; Path=/; SameSite=${process.env.AUTH_COOKIE_SAMESITE ?? 'Lax'}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
const absoluteHours = Number(process.env.AUTH_SESSION_HOURS ?? 8)
const idleMinutes = process.env.AUTH_IDLE_MINUTES ? Number(process.env.AUTH_IDLE_MINUTES) : null

function clearCookie(res: { setHeader(name: string, value: string): void }) { res.setHeader('Set-Cookie', `${sessionCookie}=; ${cookieOptions}; Max-Age=0`) }
function readCookie(value: string | undefined): string | undefined { return value?.split(';').map(part => part.trim()).find(part => part.startsWith(`${sessionCookie}=`))?.slice(sessionCookie.length + 1) }

authRouter.post('/login', asyncHandler(async (req, res) => {
  const input = credentialsSchema.parse(req.body)
  const user = await findUser(input.username)
  if (!user || !user.isEnabled || !(await argon2.verify(user.passwordHash, input.password))) throw new HttpError(401, 'Invalid username or password')
  const session = await createSession(user.userId, absoluteHours, idleMinutes)
  res.setHeader('Set-Cookie', `${sessionCookie}=${session.token}; ${cookieOptions}; Max-Age=${absoluteHours * 60 * 60}`)
  res.json({ ok: true, data: { userId: user.userId, username: user.username, displayName: user.displayName, role: user.role, expiresAt: session.expiresAt } })
}))

authRouter.get('/me', asyncHandler(async (req, res) => {
  if (!req.authUser) throw new HttpError(401, 'Authentication required')
  res.json({ ok: true, data: req.authUser })
}))

authRouter.post('/logout', asyncHandler(async (req, res) => {
  const token = readCookie(req.headers.cookie)
  if (token) await revokeSession(token)
  clearCookie(res)
  res.json({ ok: true, data: null })
}))
