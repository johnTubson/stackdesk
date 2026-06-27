import {
  clearSession,
  updateSession,
} from '@tanstack/react-start/server'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'

import { getDb } from '#/db/client'
import { users } from '#/db/schema'
import { type AppSessionData, sessionConfig } from '#/lib/session'

export async function loginUser(data: {
  email: string
  password: string
}): Promise<AppSessionData> {
  const db = getDb()
  const user = db
    .select()
    .from(users)
    .where(eq(users.email, data.email.toLowerCase()))
    .get()

  if (!user || !bcrypt.compareSync(data.password, user.passwordHash)) {
    throw new Error('Invalid email or password')
  }

  const sessionData: AppSessionData = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }

  await updateSession(sessionConfig, sessionData)

  return sessionData
}

export async function logoutUser() {
  await clearSession(sessionConfig)
}
