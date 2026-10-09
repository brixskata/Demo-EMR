import crypto from 'node:crypto'
import { getPool, sql } from '../../database/connection.ts'

export type AuthRole = 'ADMIN' | 'AUDITOR' | 'RECORDS_VIEWER'
export type AuthUser = { userId: number; username: string; displayName: string; role: AuthRole }

function tokenHash(token: string): string { return crypto.createHash('sha256').update(token).digest('hex') }

export async function findUser(username: string): Promise<(AuthUser & { passwordHash: string; isEnabled: boolean }) | undefined> {
  const pool = await getPool()
  const result = await pool.request().input('username', sql.VarChar(120), username).query<AuthUser & { passwordHash: string; isEnabled: boolean }>(`
    SELECT UserId AS userId, Username AS username, DisplayName AS displayName, Role AS role, PasswordHash AS passwordHash, IsEnabled AS isEnabled
    FROM dbo.AppUser WHERE Username = @username`)
  return result.recordset[0]
}

export async function createUser(username: string, displayName: string, role: AuthRole, passwordHash: string): Promise<void> {
  const pool = await getPool()
  await pool.request().input('username', sql.VarChar(120), username).input('displayName', sql.NVarChar(120), displayName).input('role', sql.VarChar(20), role).input('passwordHash', sql.NVarChar(255), passwordHash).query('INSERT dbo.AppUser (Username, DisplayName, PasswordHash, Role) VALUES (@username, @displayName, @passwordHash, @role)')
}

export async function createSession(userId: number, absoluteHours: number, idleMinutes: number | null): Promise<{ token: string; expiresAt: string }> {
  const token = crypto.randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + absoluteHours * 60 * 60 * 1000)
  const pool = await getPool()
  await pool.request().input('sessionId', sql.UniqueIdentifier, crypto.randomUUID()).input('userId', sql.Int, userId).input('tokenHash', sql.VarChar(64), tokenHash(token)).input('expiresAt', sql.DateTime2(3), expiresAt).input('lastSeenAt', sql.DateTime2(3), new Date()).query('INSERT dbo.AuthSession (SessionId, UserId, TokenHash, ExpiresAt, LastSeenAt) VALUES (@sessionId, @userId, @tokenHash, @expiresAt, @lastSeenAt)')
  return { token, expiresAt: expiresAt.toISOString() }
}

export async function findSession(token: string, idleMinutes: number | null): Promise<AuthUser | undefined> {
  const pool = await getPool()
  const result = await pool.request().input('tokenHash', sql.VarChar(64), tokenHash(token)).input('idleMinutes', sql.Int, idleMinutes).query<AuthUser>(`
    SELECT u.UserId AS userId, u.Username AS username, u.DisplayName AS displayName, u.Role AS role
    FROM dbo.AuthSession s INNER JOIN dbo.AppUser u ON u.UserId = s.UserId
    WHERE s.TokenHash = @tokenHash AND s.RevokedAt IS NULL AND s.ExpiresAt > SYSUTCDATETIME() AND u.IsEnabled = 1
      AND (@idleMinutes IS NULL OR s.LastSeenAt > DATEADD(minute, -@idleMinutes, SYSUTCDATETIME()))`)
  if (!result.recordset[0]) return undefined
  await pool.request().input('tokenHash', sql.VarChar(64), tokenHash(token)).query('UPDATE dbo.AuthSession SET LastSeenAt = SYSUTCDATETIME() WHERE TokenHash = @tokenHash')
  return result.recordset[0]
}

export async function revokeSession(token: string): Promise<void> {
  const pool = await getPool()
  await pool.request().input('tokenHash', sql.VarChar(64), tokenHash(token)).query('UPDATE dbo.AuthSession SET RevokedAt = SYSUTCDATETIME() WHERE TokenHash = @tokenHash')
}
