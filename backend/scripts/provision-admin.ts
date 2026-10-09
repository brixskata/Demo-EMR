import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import argon2 from 'argon2'
import { closePool } from '../src/database/connection.ts'
import { createAdmin, findUser } from '../src/modules/auth/repository.ts'

const rl = createInterface({ input, output })
try {
  const username = (await rl.question('Admin username: ')).trim()
  const displayName = (await rl.question('Admin display name: ')).trim()
  const password = await rl.question('Admin password (input is visible in this local terminal): ')
  if (!username || !displayName || password.length < 12) throw new Error('Username and display name are required; password must be at least 12 characters.')
  if (await findUser(username)) throw new Error('An account with that username already exists.')
  const confirmation = await rl.question(`Create ADMIN account "${username}"? Type CREATE to confirm: `)
  if (confirmation !== 'CREATE') throw new Error('Provisioning cancelled.')
  await createAdmin(username, displayName, await argon2.hash(password))
  console.log('Administrator account created.')
} finally {
  rl.close()
  await closePool()
}
