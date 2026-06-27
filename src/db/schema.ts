import { relations } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const merchantStatuses = [
  'draft',
  'pending',
  'approved',
  'rejected',
] as const
export type MerchantStatus = (typeof merchantStatuses)[number]

export const batchStatuses = [
  'open',
  'matched',
  'discrepancy',
  'resolved',
] as const
export type BatchStatus = (typeof batchStatuses)[number]

export const userRoles = ['admin', 'reviewer'] as const
export type UserRole = (typeof userRoles)[number]

export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: userRoles }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const merchants = sqliteTable('merchants', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  businessName: text('business_name').notNull(),
  category: text('category'),
  contactEmail: text('contact_email'),
  status: text('status', { enum: merchantStatuses }).notNull(),
  submittedAt: integer('submitted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const merchantDocuments = sqliteTable('merchant_documents', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  fileName: text('file_name').notNull(),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const payoutBatches = sqliteTable('payout_batches', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  reference: text('reference').notNull().unique(),
  totalAmount: integer('total_amount').notNull(),
  status: text('status', { enum: batchStatuses }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const transactions = sqliteTable('transactions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  reference: text('reference').notNull(),
  amount: integer('amount').notNull(),
  batchId: text('batch_id').references(() => payoutBatches.id, {
    onDelete: 'set null',
  }),
  status: text('status', { enum: ['pending', 'settled', 'failed'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  action: text('action').notNull(),
  actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const usersRelations = relations(users, ({ many }) => ({
  auditLogs: many(auditLogs),
}))

export const merchantsRelations = relations(merchants, ({ many }) => ({
  documents: many(merchantDocuments),
  auditLogs: many(auditLogs),
}))

export const merchantDocumentsRelations = relations(
  merchantDocuments,
  ({ one }) => ({
    merchant: one(merchants, {
      fields: [merchantDocuments.merchantId],
      references: [merchants.id],
    }),
  }),
)

export const payoutBatchesRelations = relations(payoutBatches, ({ many }) => ({
  transactions: many(transactions),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  batch: one(payoutBatches, {
    fields: [transactions.batchId],
    references: [payoutBatches.id],
  }),
}))
