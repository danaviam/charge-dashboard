import { createContext, useContext, useState, type ReactNode } from 'react'

type Role = 'admin' | 'user'
export type AdminLoginResult = 'success' | 'missing-config' | 'wrong-password'

interface RoleContextValue {
  role: Role
  adminPasswordConfigured: boolean
  switchToUser: () => void
  loginAsAdmin: (password: string) => AdminLoginResult
}

const RoleContext = createContext<RoleContextValue | null>(null)

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD?.trim() || undefined

function getInitialRole(): Role {
  const stored = localStorage.getItem('dashboard_role')
  return stored === 'admin' ? 'admin' : 'user'
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(getInitialRole)

  const switchToUser = () => {
    setRole('user')
    localStorage.setItem('dashboard_role', 'user')
  }

  const loginAsAdmin = (password: string): AdminLoginResult => {
    const trimmed = password.trim()

    if (!ADMIN_PASSWORD) return 'missing-config'
    if (trimmed !== ADMIN_PASSWORD) return 'wrong-password'

    setRole('admin')
    localStorage.setItem('dashboard_role', 'admin')
    return 'success'
  }

  return (
    <RoleContext.Provider
      value={{
        role,
        adminPasswordConfigured: Boolean(ADMIN_PASSWORD),
        switchToUser,
        loginAsAdmin,
      }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used inside RoleProvider')
  return ctx
}
