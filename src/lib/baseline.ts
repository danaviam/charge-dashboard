import type { MeterReading, Station } from '../types/reading'

const STORAGE_KEY = 'dashboard_last_baseline'

export interface LastBaseline {
  dan: number | null
  rothschild: number | null
}

export function getLastBaseline(): LastBaseline {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { dan: null, rothschild: null }
    const parsed = JSON.parse(raw)
    // support old single-station format
    if (typeof parsed.reading_kwh === 'number' && parsed.station) {
      return { dan: null, rothschild: null, [parsed.station]: parsed.reading_kwh }
    }
    return parsed as LastBaseline
  } catch {
    return { dan: null, rothschild: null }
  }
}

export function setLastBaseline(baseline: LastBaseline | null) {
  if (baseline === null) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(baseline))
}

export function captureLastBaselineFromReadings(
  readings: MeterReading[]
): LastBaseline {
  const sorted = [...readings].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const latestDan = sorted.find(r => r.station === 'dan')
  const latestRothschild = sorted.find(r => r.station === 'rothschild')
  return {
    dan: latestDan ? Number(latestDan.reading_kwh) : null,
    rothschild: latestRothschild ? Number(latestRothschild.reading_kwh) : null,
  }
}

export function getLastReading(readings: MeterReading[], station: Station): number | null {
  const latest = [...readings]
    .filter(r => r.station === station)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  if (latest) return Number(latest.reading_kwh)
  return getLastBaseline()[station] ?? null
}
