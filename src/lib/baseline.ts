import type { MeterReading, Station } from '../types/reading'

const STORAGE_KEY = 'dashboard_last_baseline'

export interface LastBaseline {
  reading_kwh: number
  station: Station
}

export function getLastBaseline(): LastBaseline | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as LastBaseline
  } catch {
    return null
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
): LastBaseline | null {
  const latest = [...readings].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0]
  if (!latest) return null
  return { reading_kwh: Number(latest.reading_kwh), station: latest.station }
}

export function getLastReading(readings: MeterReading[]): number | null {
  const latest = [...readings].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0]
  if (latest) return Number(latest.reading_kwh)
  return getLastBaseline()?.reading_kwh ?? null
}
