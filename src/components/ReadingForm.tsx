import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Station } from '../types/reading'

interface ReadingFormProps {
  onSaved: () => void
}

export default function ReadingForm({ onSaved }: ReadingFormProps) {
  const [station, setStation] = useState<Station>('dan')
  const [reading, setReading] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastReading, setLastReading] = useState<number | null>(null)

  useEffect(() => {
    setLastReading(null)
    const fetchLast = async () => {
      const { data } = await supabase
        .from('meter_readings')
        .select('reading_kwh')
        .eq('station', station)
        .order('reading_kwh', { ascending: false })
        .limit(1)
        .maybeSingle()

      setLastReading(data ? data.reading_kwh : null)
    }
    fetchLast()
  }, [station])

  const handleStationChange = (s: Station) => {
    setStation(s)
    setError(null)
    setReading('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const value = parseFloat(reading)
    if (isNaN(value) || value < 0) {
      setError('יש להזין ערך מספרי חיובי')
      return
    }

    if (lastReading !== null && value <= lastReading) {
      setError(
        `הקריאה חייבת להיות גבוהה מהקריאה הקודמת (${lastReading.toLocaleString()} קוט"ש)`
      )
      return
    }

    setSaving(true)
    const { error: dbError } = await supabase.from('meter_readings').insert({
      station,
      reading_kwh: value,
    })
    setSaving(false)

    if (dbError) {
      setError(`שגיאה בשמירה: ${dbError.message}`)
      return
    }

    setReading('')
    setLastReading(value)
    onSaved()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 text-right">
        הזנת קריאת מונה
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end justify-end">
        <div className="flex flex-col gap-1 items-end min-w-[100px]">
          <label className="text-sm text-gray-600">עמדה</label>
          <select
            value={station}
            onChange={e => handleStationChange(e.target.value as Station)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="dan">דן</option>
            <option value="rothschild">רוטשילד</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 items-end min-w-[180px]">
          <label className="text-sm text-gray-600">
            קריאת מונה (קוט&quot;ש)
            {lastReading !== null && (
              <span className="text-gray-400 font-normal text-xs me-1">
                {' '}— קודמת: {lastReading.toLocaleString()}
              </span>
            )}
          </label>
          <input
            type="number"
            min={lastReading !== null ? lastReading + 0.001 : 0}
            step="any"
            value={reading}
            onChange={e => setReading(e.target.value)}
            placeholder="0"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
        >
          {saving ? 'שומר...' : 'שמור'}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-600 text-right">{error}</p>
      )}
    </div>
  )
}
