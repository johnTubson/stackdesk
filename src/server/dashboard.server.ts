import { count, eq } from 'drizzle-orm'

import { getDb } from '#/db/client'
import { merchants, payoutBatches } from '#/db/schema'
import { requireAuth } from '#/lib/session'
import { readAppSession } from '#/server/session.server'

export async function getDashboardStatsImpl() {
  requireAuth(await readAppSession())
  const db = getDb()

  const pendingRow = db
    .select({ value: count() })
    .from(merchants)
    .where(eq(merchants.status, 'pending'))
    .get()

  const approvedRow = db
    .select({ value: count() })
    .from(merchants)
    .where(eq(merchants.status, 'approved'))
    .get()

  const openBatchesRow = db
    .select({ value: count() })
    .from(payoutBatches)
    .where(eq(payoutBatches.status, 'open'))
    .get()

  const discrepancyRow = db
    .select({ value: count() })
    .from(payoutBatches)
    .where(eq(payoutBatches.status, 'discrepancy'))
    .get()

  return {
    pendingMerchants: pendingRow?.value ?? 0,
    approvedMerchants: approvedRow?.value ?? 0,
    openBatches: openBatchesRow?.value ?? 0,
    discrepancyBatches: discrepancyRow?.value ?? 0,
  }
}
