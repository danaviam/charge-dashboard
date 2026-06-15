import { useRole } from '../context/RoleContext'

export default function Header() {
  const { role, toggleRole } = useRole()
  const isAdmin = role === 'admin'

  return (
    <header className="bg-white shadow-sm mb-6">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <button
          onClick={toggleRole}
          title={`מצב נוכחי: ${isAdmin ? 'מנהל' : 'משתמש'} — לחץ להחלפה`}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer border ${
            isAdmin
              ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <span>{isAdmin ? '🔑' : '👤'}</span>
          <span>{isAdmin ? 'מנהל' : 'משתמש'}</span>
        </button>

        <div className="text-right">
          <h1 className="text-2xl font-bold text-gray-800">
            לוח בקרה — מונה טעינה חשמלית
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            מעקב אחר צריכת החשמל בעמדות דן ורוטשילד
          </p>
        </div>
      </div>
    </header>
  )
}
