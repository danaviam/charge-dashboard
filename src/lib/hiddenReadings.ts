import type { MeterReading } from '../types/reading'

const HIDDEN_IDS_KEY = 'dashboard_hidden_reading_ids'

export function getHiddenReadingIds(): Set<string> {
  try {
    const ids = JSON.parse(localStorage.getItem(HIDDEN_IDS_KEY) ?? '[]') as string[]
    return new Set(ids)
  } catch {
    return new Set()
  }
}

export function hideReadingIds(ids: string[]) {
  if (ids.length === 0) return
  const hidden = getHiddenReadingIds()
  ids.forEach(id => hidden.add(id))
  localStorage.setItem(HIDDEN_IDS_KEY, JSON.stringify([...hidden]))
}

export function filterVisibleReadings(readings: MeterReading[]): MeterReading[] {
  const hidden = getHiddenReadingIds()
  return readings.filter(r => !hidden.has(r.id))
}
