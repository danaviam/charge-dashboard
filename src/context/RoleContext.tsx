import { createContext, useContext, useState, type ReactNode } from 'react'

type Role = 'admin' | 'user'

interface RoleContextValue {
  role: Role
  switchToUser: () => void
  loginAsAdmin: (password: string) => boolean
}

const RoleContext = createContext<RoleContextValue | null>(null)

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined

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

  const loginAsAdmin = (password: string): boolean => {
    if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) return false
    setRole('admin')
    localStorage.setItem('dashboard_role', 'admin')
    return true
  }

  return (
    <RoleContext.Provider value={{ role, switchToUser, loginAsAdmin }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used inside RoleProvider')
  return ctx
}
