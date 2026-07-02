import type { MeterReading, Station } from '../types/reading'
import { getLastBaseline, type LastBaseline } from './baseline'

function sortByDateAsc(readings: MeterReading[]) {
  return [...readings].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
}

function isInMonth(iso: string, month: number, year: number) {
  const d = new Date(iso)
  return d.getMonth() === month && d.getFullYear() === year
}

export function stationConsumption(
  readings: MeterReading[],
  station: Station,
  month?: { month: number; year: number }
): number {
  const sorted = sortByDateAsc(readings)
  const diffById = readingDiffById(sorted)
  let atStation = sorted.filter(r => r.station === station)

  if (month) {
    atStation = atStation.filter(r => isInMonth(r.created_at, month.month, month.year))
  }

  return atStation.reduce((sum, row) => sum + (diffById[row.id] ?? 0), 0)
}

export function consumptionTotals(
  readings: MeterReading[],
  month?: { month: number; year: number }
) {
  return {
    totalDan: stationConsumption(readings, 'dan', month),
    totalRothschild: stationConsumption(readings, 'rothschild', month),
  }
}

export function readingDiffById(
  readings: MeterReading[],
  baseline: LastBaseline = getLastBaseline()
): Record<string, number> {
  const sorted = [...readings].sort(
    (a, b) =>
      Number(a.reading_kwh) - Number(b.reading_kwh) ||
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const diffs: Record<string, number> = {}

  sorted.forEach((current, idx) => {
    if (idx === 0) {
      const base = baseline[current.station]
      const value = Number(current.reading_kwh)
      diffs[current.id] = base != null && value >= base ? value - base : 0
      return
    }
    const previous = Number(sorted[idx - 1].reading_kwh)
    diffs[current.id] = Number(current.reading_kwh) - previous
  })

  return diffs
}
