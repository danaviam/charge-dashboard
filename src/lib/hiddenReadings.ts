import type { MeterReading } from '../types/reading'

export function filterVisibleReadings(readings: MeterReading[]): MeterReading[] {
  return readings.filter(r => !r.hidden)
}

export async function hideReadings(ids: string[]): Promise<{ error: string | null }> {
  if (ids.length === 0) return { error: null }
  try {
    const res = await fetch('/api/db/hide-readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { error: body?.error ?? 'שגיאה לא ידועה' }
    }
    return { error: null }
  } catch {
    return { error: 'שגיאת רשת' }
  }
}
