import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { ChevronDown, LogOut, User } from 'lucide-react'

import { Button } from '#/components/ui/button'
import type { UserRole } from '#/lib/session'
import { logout } from '#/server/auth'
import { cn } from '#/lib/cn'

export type UserMenuProps = {
  name: string
  email: string
  role: UserRole
  className?: string
}

export function UserMenu({ name, email, role, className }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const logoutFn = useServerFn(logout)

  async function handleSignOut() {
    await logoutFn()
    setOpen(false)
    await navigate({ to: '/login' })
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="gap-2"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--admin-primary-soft)] text-xs font-bold text-[var(--admin-primary)]">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-[8rem] truncate sm:inline">{name}</span>
        <ChevronDown className="h-4 w-4 text-[var(--admin-foreground-muted)]" />
      </Button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            aria-label="Close user menu"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-56 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-1 shadow-lg"
          >
            <div className="border-b border-[var(--admin-border)] px-3 py-2.5">
              <p className="text-sm font-semibold text-[var(--admin-foreground)]">{name}</p>
              <p className="truncate text-xs text-[var(--admin-foreground-muted)]">{email}</p>
              <p className="mt-1 text-xs font-medium text-[var(--admin-primary)] capitalize">
                {role}
              </p>
            </div>

            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--admin-foreground-muted)] hover:bg-[var(--admin-muted-bg)]"
              onClick={() => setOpen(false)}
            >
              <User className="h-4 w-4" />
              Profile
            </button>

            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--admin-danger)] hover:bg-[var(--admin-danger-bg)]"
              onClick={() => void handleSignOut()}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
