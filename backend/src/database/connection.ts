import mssql from 'mssql'
import type { config as SqlConfig, ConnectionPool } from 'mssql'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const sql = require('mssql/msnodesqlv8') as typeof mssql

const useWindowsAuth = (process.env.DB_AUTH ?? 'windows').toLowerCase() === 'windows'

function odbcBoolean(value: string | undefined, fallback: boolean): 'Yes' | 'No' {
  return (value === undefined ? fallback : value === 'true') ? 'Yes' : 'No'
}

function odbcConnectionString(database: string): string {
  const server = process.env.DB_SERVER ?? 'localhost'
  const port = process.env.DB_PORT
  const serverAddress = port ? `${server},${port}` : server
  const driver = process.env.DB_ODBC_DRIVER ?? 'ODBC Driver 18 for SQL Server'
  const encrypt = odbcBoolean(process.env.DB_ENCRYPT, true)
  const trustServerCertificate = odbcBoolean(
    process.env.DB_TRUST_SERVER_CERT,
    false,
  )

  if (useWindowsAuth) {
    return [
      `Driver={${driver}}`,
      `Server=${serverAddress}`,
      `Database=${database}`,
      'Trusted_Connection=Yes',
      `Encrypt=${encrypt}`,
      `TrustServerCertificate=${trustServerCertificate}`,
    ].join(';')
  }

  return [
    `Driver={${driver}}`,
    `Server=${serverAddress}`,
    `Database=${database}`,
    `UID=${process.env.DB_USER ?? ''}`,
    `PWD=${process.env.DB_PASSWORD ?? ''}`,
    `Encrypt=${encrypt}`,
    `TrustServerCertificate=${trustServerCertificate}`,
  ].join(';')
}

function makeConfig(
  database = process.env.DB_DATABASE ?? 'SmartEHR_Demo'
): SqlConfig {
  return { connectionString: odbcConnectionString(database) } as unknown as SqlConfig
}
let poolPromise: Promise<ConnectionPool> | undefined

export function getPool(): Promise<ConnectionPool> {
  poolPromise ??= sql.connect(makeConfig())
  return poolPromise!
}

export function openPool(database: string): Promise<ConnectionPool> {
  return sql.connect(makeConfig(database))
}

export async function closePool(): Promise<void> {
  if (poolPromise) {
    const pool = await poolPromise
    await pool.close()
    poolPromise = undefined
  }
}

export { sql }
