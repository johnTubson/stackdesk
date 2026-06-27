import { getSession } from '@tanstack/react-start/server'

import {
  type AppSessionData,
  sessionConfig,
} from '#/lib/session'

export async function readAppSession(): Promise<AppSessionData | null> {
  const session = await getSession<AppSessionData>(sessionConfig)
  const data = session.data

  if (!data?.userId || !data.email || !data.name || !data.role) {
    return null
  }

  return {
    userId: data.userId,
    email: data.email,
    name: data.name,
    role: data.role,
  }
}
