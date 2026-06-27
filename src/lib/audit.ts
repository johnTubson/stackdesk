import { getDb } from '#/db/client'
import { auditLogs } from '#/db/schema'

type AuditLogInput = {
  entityType: string
  entityId: string
  action: string
  actorId: string
  metadata?: Record<string, unknown>
}

export function writeAuditLog(input: AuditLogInput) {
  const db = getDb()
  db.insert(auditLogs)
    .values({
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actorId: input.actorId,
      metadata: input.metadata,
    })
    .run()
}
