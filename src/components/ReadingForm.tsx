import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { MeterReading, Station } from '../types/reading'

interface ReadingFormProps {
  readings: MeterReading[]
  onSaved: () => void
}

function getLastReading(readings: MeterReading[], station: Station): number | null {
  const stationReadings = readings.filter(r => r.station === station)
  if (stationReadings.length === 0) return null

  return Math.max(...stationReadings.map(r => Number(r.reading_kwh)))
}

export default function ReadingForm({ readings, onSaved }: ReadingFormProps) {
  const [station, setStation] = useState<Station>('dan')
  const [reading, setReading] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastReading = useMemo(
    () => getLastReading(readings, station),
    [readings, station]
  )

  const handleStationChange = (s: Station) => {
    setStation(s)
    setError(null)
    setReading('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const value = parseInt(reading, 10)
    if (isNaN(value) || value < 0) {
      setError('יש להזין מספר שלם חיובי')
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
            min={lastReading !== null ? lastReading + 1 : 0}
            step="1"
            inputMode="numeric"
            pattern="[0-9]*"
            value={reading}
            onChange={e => setReading(e.target.value.replace(/\D/g, ''))}
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
