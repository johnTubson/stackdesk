import { createDb, type Db } from './index'

let db: Db | null = null

export function getDb(): Db {
  if (!db) {
    db = createDb()
  }
  return db
}

export function resetDb(connection?: Db) {
  db = connection ?? null
}
