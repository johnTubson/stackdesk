import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { fetchSession } from '#/server/auth'

export const Route = createFileRoute('/_admin')({
  beforeLoad: async ({ location }) => {
    const session = await fetchSession()

    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }

    return { session }
  },
  component: AdminRouteLayout,
})

function AdminRouteLayout() {
  return <Outlet />
}
