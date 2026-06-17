import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, supabaseReady } from './lib/supabase'
import { filterVisibleReadings } from './lib/hiddenReadings'
import { RoleProvider } from './context/RoleContext'
import Header from './components/Header'
import ReadingForm from './components/ReadingForm'
import ConsumptionChart from './components/ConsumptionChart'
import HistoryTable from './components/HistoryTable'
import type { MeterReading } from './types/reading'

function Dashboard() {
  const [readings, setReadings] = useState<MeterReading[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [displayVersion, setDisplayVersion] = useState(0)

  const visibleReadings = useMemo(
    () => filterVisibleReadings(readings),
    [readings, displayVersion]
  )

  const refreshDisplay = useCallback(() => {
    setDisplayVersion(v => v + 1)
  }, [])

  const fetchReadings = useCallback(async () => {
    setFetchError(null)
    const { data, error } = await supabase
      .from('meter_readings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setFetchError(`שגיאה בטעינת נתונים: ${error.message}`)
    } else {
      setReadings(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchReadings()
  }, [fetchReadings])

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="max-w-5xl mx-auto px-3 sm:px-4 pb-6 sm:pb-10 space-y-4 sm:space-y-6">
        {!supabaseReady && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-800 text-sm text-right">
            <strong>הגדרת Supabase נדרשת:</strong> ערוך את קובץ{' '}
            <code className="bg-amber-100 px-1 rounded">.env</code> והזן את{' '}
            <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> ו‑
            <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>{' '}
            מפרוייקט Supabase שלך.
          </div>
        )}

        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm text-right">
            {fetchError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <ReadingForm readings={visibleReadings} onSaved={fetchReadings} />
          <ConsumptionChart readings={visibleReadings} />
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-400">
            טוען נתונים...
          </div>
        ) : (
          <HistoryTable
            readings={visibleReadings}
            onDeleted={fetchReadings}
            onUpdated={fetchReadings}
            onHistoryHidden={refreshDisplay}
          />
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <RoleProvider>
      <Dashboard />
    </RoleProvider>
  )
}
