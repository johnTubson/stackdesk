import { and, count, desc, eq } from 'drizzle-orm'

import { getDb } from '#/db/client'
import {
  auditLogs,
  merchantDocuments,
  merchants,
  users,
} from '#/db/schema'
import { requireReviewer } from '#/lib/session'
import type {
  merchantIdSchema,
  merchantListSearchSchema,
  merchantReviewSchema,
} from '#/lib/validators'
import { readAppSession } from '#/server/session.server'
import type { z } from 'zod'

const PAGE_SIZE = 10

type AuditMetadata = {
  note?: string
  previousStatus?: string
  nextStatus?: string
}

type ListInput = z.infer<typeof merchantListSearchSchema>
type MerchantIdInput = z.infer<typeof merchantIdSchema>
type ReviewInput = z.infer<typeof merchantReviewSchema>

export async function listMerchantsImpl(data: ListInput) {
  requireReviewer(await readAppSession())
  const db = getDb()

  const whereClause =
    data.status === 'all' ? undefined : eq(merchants.status, data.status)

  const items = db
    .select({
      id: merchants.id,
      businessName: merchants.businessName,
      status: merchants.status,
      category: merchants.category,
      submittedAt: merchants.submittedAt,
      createdAt: merchants.createdAt,
    })
    .from(merchants)
    .where(whereClause)
    .orderBy(desc(merchants.createdAt))
    .limit(PAGE_SIZE)
    .offset((data.page - 1) * PAGE_SIZE)
    .all()

  const totalRow = db
    .select({ value: count() })
    .from(merchants)
    .where(whereClause)
    .get()

  const total = totalRow?.value ?? 0

  return {
    items,
    page: data.page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  }
}

export async function getMerchantImpl(data: MerchantIdInput) {
  requireReviewer(await readAppSession())
  const db = getDb()

  const merchant = db
    .select()
    .from(merchants)
    .where(eq(merchants.id, data.merchantId))
    .get()

  if (!merchant) {
    throw new Error('Merchant not found')
  }

  const documents = db
    .select()
    .from(merchantDocuments)
    .where(eq(merchantDocuments.merchantId, merchant.id))
    .orderBy(desc(merchantDocuments.uploadedAt))
    .all()

  const activity = db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorName: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .where(
      and(
        eq(auditLogs.entityType, 'merchant'),
        eq(auditLogs.entityId, merchant.id),
      ),
    )
    .orderBy(desc(auditLogs.createdAt))
    .all()
    .map((entry) => ({
      ...entry,
      metadata: entry.metadata as AuditMetadata | null,
    }))

  return { merchant, documents, activity }
}

function reviewMerchant(
  merchantId: string,
  nextStatus: 'approved' | 'rejected',
  action: 'merchant.approved' | 'merchant.rejected',
  note: string,
  actorId: string,
) {
  const db = getDb()

  db.transaction((tx) => {
    const merchant = tx
      .select()
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .get()

    if (!merchant) {
      throw new Error('Merchant not found')
    }

    if (merchant.status !== 'pending') {
      throw new Error('Only pending merchants can be reviewed')
    }

    tx.update(merchants)
      .set({
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, merchantId))
      .run()

    tx.insert(auditLogs)
      .values({
        entityType: 'merchant',
        entityId: merchantId,
        action,
        actorId,
        metadata: {
          note,
          previousStatus: merchant.status,
          nextStatus,
        },
      })
      .run()
  })
}

export async function approveMerchantImpl(data: ReviewInput) {
  const session = requireReviewer(await readAppSession())
  reviewMerchant(
    data.merchantId,
    'approved',
    'merchant.approved',
    data.note,
    session.userId,
  )
  return { success: true as const }
}

export async function rejectMerchantImpl(data: ReviewInput) {
  const session = requireReviewer(await readAppSession())
  reviewMerchant(
    data.merchantId,
    'rejected',
    'merchant.rejected',
    data.note,
    session.userId,
  )
  return { success: true as const }
}
