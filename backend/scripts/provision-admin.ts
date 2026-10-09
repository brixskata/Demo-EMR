import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import argon2 from 'argon2'
import { closePool } from '../src/database/connection.ts'
import { createUser, findDemoAccountId, findUser, type AuthRole } from '../src/modules/auth/repository.ts'

const rl = createInterface({ input, output })
try {
  const username = (await rl.question('Username: ')).trim()
  const displayName = (await rl.question('Display name: ')).trim()
  const role = (await rl.question('Role (ADMIN, AUDITOR, RECORDS_VIEWER): ')).trim().toUpperCase() as AuthRole
  const demoAccountName = (await rl.question('Linked DemoAccount display name (optional): ')).trim()
  const password = await rl.question('Password (input is visible in this local terminal): ')
  if (!['ADMIN', 'AUDITOR', 'RECORDS_VIEWER'].includes(role)) throw new Error('Role must be ADMIN, AUDITOR, or RECORDS_VIEWER.')
  if (!username || !displayName || !password) throw new Error('Username, display name, and a non-empty password are required.')
  if (await findUser(username)) throw new Error('An account with that username already exists.')
  const confirmation = await rl.question(`Create ${role} account "${username}"? Type CREATE to confirm: `)
  if (confirmation !== 'CREATE') throw new Error('Provisioning cancelled.')
  const demoAccountId = demoAccountName ? await findDemoAccountId(demoAccountName) : null
  if (demoAccountName && !demoAccountId) throw new Error('No DemoAccount matched that display name.')
  await createUser(username, displayName, role, await argon2.hash(password), demoAccountId ?? null)
  console.log(`${role} account created.`)
} finally {
  rl.close()
  await closePool()
}
