import { createServerFn } from '@tanstack/react-start'

export const getDashboardStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getDashboardStatsImpl } = await import('#/server/dashboard.server')
    return getDashboardStatsImpl()
  },
)
