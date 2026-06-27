import bcrypt from 'bcryptjs'
import { count } from 'drizzle-orm'

import { createDb } from './index'
import {
  auditLogs,
  merchantDocuments,
  merchants,
  payoutBatches,
  transactions,
  users,
} from './schema'

const DEMO_PASSWORD = 'demo1234'

const merchantSeed = [
  {
    businessName: 'Harbor Tea Co.',
    category: 'Retail',
    contactEmail: 'ops@harbortea.demo',
    status: 'pending' as const,
  },
  {
    businessName: 'Northline Software',
    category: 'SaaS',
    contactEmail: 'finance@northline.demo',
    status: 'approved' as const,
  },
  {
    businessName: 'Blue Cart Retail',
    category: 'Marketplace',
    contactEmail: 'hello@bluecart.demo',
    status: 'pending' as const,
  },
  {
    businessName: 'Summit Outdoor Supply',
    category: 'Retail',
    contactEmail: 'accounts@summit.demo',
    status: 'approved' as const,
  },
  {
    businessName: 'Lumen Analytics',
    category: 'SaaS',
    contactEmail: 'billing@lumen.demo',
    status: 'rejected' as const,
  },
  {
    businessName: 'Green Fork Catering',
    category: 'Food & Beverage',
    contactEmail: 'payables@greenfork.demo',
    status: 'pending' as const,
  },
  {
    businessName: 'Atlas Freight Partners',
    category: 'Logistics',
    contactEmail: 'treasury@atlas.demo',
    status: 'approved' as const,
  },
  {
    businessName: 'Pixel Print Studio',
    category: 'Retail',
    contactEmail: 'studio@pixelprint.demo',
    status: 'draft' as const,
  },
  {
    businessName: 'Cedar Health Supplies',
    category: 'Healthcare',
    contactEmail: 'ap@cedarhealth.demo',
    status: 'draft' as const,
  },
  {
    businessName: 'Riverstone Books',
    category: 'Retail',
    contactEmail: 'orders@riverstone.demo',
    status: 'rejected' as const,
  },
]

const batchSeed = [
  { reference: 'BATCH-2026-001', totalAmount: 125_000, status: 'open' as const },
  {
    reference: 'BATCH-2026-002',
    totalAmount: 89_500,
    status: 'matched' as const,
  },
  {
    reference: 'BATCH-2026-003',
    totalAmount: 210_000,
    status: 'discrepancy' as const,
  },
  {
    reference: 'BATCH-2026-004',
    totalAmount: 54_250,
    status: 'resolved' as const,
  },
  {
    reference: 'BATCH-2026-005',
    totalAmount: 176_800,
    status: 'open' as const,
  },
]

function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

async function seed() {
  const db = createDb()
  const existing = db.select({ value: count() }).from(users).get()

  if ((existing?.value ?? 0) > 0) {
    console.log('Seed skipped — data already present.')
    return
  }

  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10)

  const seededUsers = db
    .insert(users)
    .values([
      {
        email: 'admin@stackdesk.demo',
        passwordHash,
        name: 'Demo Admin',
        role: 'admin',
      },
      {
        email: 'reviewer@stackdesk.demo',
        passwordHash,
        name: 'Demo Reviewer',
        role: 'reviewer',
      },
    ])
    .returning()
    .all()

  const admin = seededUsers.find((user) => user.role === 'admin')
  const reviewer = seededUsers.find((user) => user.role === 'reviewer')

  if (!admin || !reviewer) {
    throw new Error('Failed to seed demo users')
  }

  const seededMerchants = merchantSeed.map((merchant, index) => {
    const submittedAt =
      merchant.status === 'draft' ? null : daysAgo(20 - index)

    return db
      .insert(merchants)
      .values({
        businessName: merchant.businessName,
        category: merchant.category,
        contactEmail: merchant.contactEmail,
        status: merchant.status,
        submittedAt,
        createdAt: daysAgo(25 - index),
        updatedAt: daysAgo(5 - (index % 3)),
      })
      .returning()
      .get()
  })

  for (const merchant of seededMerchants) {
    if (merchant.status === 'draft') continue

    db.insert(merchantDocuments)
      .values([
        {
          merchantId: merchant.id,
          type: 'identity',
          fileName: `${merchant.businessName.toLowerCase().replace(/\s+/g, '-')}-id.pdf`,
        },
        {
          merchantId: merchant.id,
          type: 'bank_statement',
          fileName: `${merchant.businessName.toLowerCase().replace(/\s+/g, '-')}-bank.pdf`,
        },
      ])
      .run()
  }

  const seededBatches = batchSeed.map((batch, index) =>
    db
      .insert(payoutBatches)
      .values({
        reference: batch.reference,
        totalAmount: batch.totalAmount,
        status: batch.status,
        createdAt: daysAgo(14 - index),
      })
      .returning()
      .get(),
  )

  let transactionCounter = 1
  for (const [batchIndex, batch] of seededBatches.entries()) {
    const perBatch = batchIndex === 2 ? 8 : 10
    let runningTotal = 0

    for (let index = 0; index < perBatch; index += 1) {
      const isLast = index === perBatch - 1
      let amount = 5_000 + ((transactionCounter * 1_137) % 9_500)

      if (batch.status === 'matched' && isLast) {
        amount = batch.totalAmount - runningTotal
      }

      if (batch.status === 'discrepancy' && isLast) {
        amount = batch.totalAmount - runningTotal - 1_250
      }

      runningTotal += amount

      db.insert(transactions)
        .values({
          reference: `TXN-2026-${String(transactionCounter).padStart(4, '0')}`,
          amount,
          batchId: batch.id,
          status: index % 7 === 0 ? 'failed' : 'settled',
          createdAt: daysAgo(10 - (transactionCounter % 8)),
        })
        .run()

      transactionCounter += 1
    }
  }

  const approvedMerchant = seededMerchants.find(
    (merchant) => merchant.status === 'approved',
  )
  const rejectedMerchant = seededMerchants.find(
    (merchant) => merchant.status === 'rejected',
  )

  if (approvedMerchant) {
    db.insert(auditLogs)
      .values({
        entityType: 'merchant',
        entityId: approvedMerchant.id,
        action: 'merchant.approved',
        actorId: reviewer.id,
        metadata: {
          note: 'Documentation complete. Approved during seed.',
          previousStatus: 'pending',
          nextStatus: 'approved',
        },
        createdAt: daysAgo(3),
      })
      .run()
  }

  if (rejectedMerchant) {
    db.insert(auditLogs)
      .values({
        entityType: 'merchant',
        entityId: rejectedMerchant.id,
        action: 'merchant.rejected',
        actorId: reviewer.id,
        metadata: {
          note: 'Missing bank verification documents.',
          previousStatus: 'pending',
          nextStatus: 'rejected',
        },
        createdAt: daysAgo(2),
      })
      .run()
  }

  console.log('Seeded 2 users, 10 merchants, 5 batches, 48 transactions.')
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
