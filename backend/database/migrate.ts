import { readFile } from 'node:fs/promises'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { getPool, openPool, sql, closePool } from '../src/database/connection.ts'

const migrationDir = path.resolve(process.cwd(), 'database', 'migrations')
const files = (await readdir(migrationDir)).filter(file => file.endsWith('.sql')).sort()
const master = await openPool('master')
await master.request().batch("IF DB_ID(N'SmartEHR_Demo') IS NULL CREATE DATABASE SmartEHR_Demo")
await master.close()
const pool = await getPool()
for (const file of files) {
  const migrationId = file.replace(/\.sql$/, '')
  const migrationTable = await pool.request().query("SELECT 1 AS found FROM SmartEHR_Demo.sys.tables WHERE name = N'SchemaMigration' AND schema_id = SCHEMA_ID(N'dbo')")
  if (migrationTable.recordset.length) {
    const exists = await pool.request().input('migrationId', sql.VarChar(120), migrationId).query('SELECT 1 AS found FROM SmartEHR_Demo.dbo.SchemaMigration WHERE MigrationId = @migrationId')
    if (exists.recordset.length) continue
  }
  const content = await readFile(path.join(migrationDir, file), 'utf8')
  const batches = content.split(/^GO\s*$/gim).map(batch => batch.trim()).filter(Boolean)
  for (const batch of batches) await pool.request().batch(batch)
  await pool.request().input('migrationId', sql.VarChar(120), migrationId).query('INSERT SmartEHR_Demo.dbo.SchemaMigration (MigrationId) VALUES (@migrationId)')
  console.log(`Applied ${file}`)
}
await closePool()
