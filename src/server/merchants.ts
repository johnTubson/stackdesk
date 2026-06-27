import { createServerFn } from '@tanstack/react-start'

import {
  merchantIdSchema,
  merchantListSearchSchema,
  merchantReviewSchema,
} from '#/lib/validators'

export const listMerchants = createServerFn({ method: 'GET' })
  .validator(merchantListSearchSchema)
  .handler(async ({ data }) => {
    const { listMerchantsImpl } = await import('#/server/merchants.server')
    return listMerchantsImpl(data)
  })

export const getMerchant = createServerFn({ method: 'GET' })
  .validator(merchantIdSchema)
  .handler(async ({ data }) => {
    const { getMerchantImpl } = await import('#/server/merchants.server')
    return getMerchantImpl(data)
  })

export const approveMerchant = createServerFn({ method: 'POST' })
  .validator(merchantReviewSchema)
  .handler(async ({ data }) => {
    const { approveMerchantImpl } = await import('#/server/merchants.server')
    return approveMerchantImpl(data)
  })

export const rejectMerchant = createServerFn({ method: 'POST' })
  .validator(merchantReviewSchema)
  .handler(async ({ data }) => {
    const { rejectMerchantImpl } = await import('#/server/merchants.server')
    return rejectMerchantImpl(data)
  })
