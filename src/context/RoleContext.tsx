import { createContext, useContext, useState } from 'react'

type Role = 'admin' | 'user'

interface RoleContextValue {
  role: Role
  toggleRole: () => void
}

const RoleContext = createContext<RoleContextValue | null>(null)

function getInitialRole(): Role {
  const stored = localStorage.getItem('dashboard_role')
  return stored === 'admin' ? 'admin' : 'user'
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(getInitialRole)

  const toggleRole = () => {
    setRole(prev => {
      const next: Role = prev === 'admin' ? 'user' : 'admin'
      localStorage.setItem('dashboard_role', next)
      return next
    })
  }

  return (
    <RoleContext.Provider value={{ role, toggleRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used inside RoleProvider')
  return ctx
}
