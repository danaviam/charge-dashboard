import { useState } from 'react'
import { useRole } from '../context/RoleContext'

export default function Header() {
  const { role, switchToUser, loginAsAdmin } = useRole()
  const isAdmin = role === 'admin'
  const [showLogin, setShowLogin] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)

  const handleRoleClick = () => {
    if (isAdmin) {
      switchToUser()
      return
    }
    setPassword('')
    setLoginError(null)
    setShowLogin(true)
  }

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (loginAsAdmin(password)) {
      setShowLogin(false)
      setPassword('')
      setLoginError(null)
      return
    }
    setLoginError('סיסמה שגויה')
  }

  const closeLogin = () => {
    setShowLogin(false)
    setPassword('')
    setLoginError(null)
  }

  return (
    <>
      <header className="bg-white shadow-sm mb-4 sm:mb-6">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-start justify-between gap-2 sm:relative sm:block">
            <button
              onClick={handleRoleClick}
              title={isAdmin ? 'החלף למשתמש' : 'כניסת מנהל'}
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 sm:absolute sm:top-1/2 sm:-translate-y-1/2 sm:start-4 rounded-full text-xs font-medium transition-colors cursor-pointer border min-h-[36px] ${
                isAdmin
                  ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-[10px]">{isAdmin ? '🔑' : '👤'}</span>
              <span>{isAdmin ? 'מנהל' : 'משתמש'}</span>
            </button>

            <div className="flex-1 text-center px-1 sm:px-14">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 leading-tight">
                לוח בקרה — מונה טעינה חשמלית
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-snug">
                מעקב אחר צריכת מונה - טעינת רכבים חשמליים
              </p>
            </div>

            <div className="w-[72px] shrink-0 sm:hidden" aria-hidden />
          </div>
        </div>
      </header>

      {showLogin && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-3 sm:px-4 pb-[env(safe-area-inset-bottom)]"
          onClick={closeLogin}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg p-5 sm:p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-800 text-right mb-1">
              כניסת מנהל
            </h2>
            <p className="text-sm text-gray-500 text-right mb-4">
              הזן סיסמת מנהל
            </p>
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-3 sm:py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="סיסמה"
              />
              {loginError && (
                <p className="text-sm text-red-600 text-right">{loginError}</p>
              )}
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={closeLogin}
                  className="px-4 py-2.5 sm:py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 sm:py-2 rounded-lg text-sm min-h-[44px]"
                >
                  כניסה
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
