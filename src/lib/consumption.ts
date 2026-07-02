import type { MeterReading, Station } from '../types/reading'

export function readingDiffById(readings: MeterReading[]): Record<string, number> {
  const sorted = [...readings].sort(
    (a, b) =>
      Number(a.reading_kwh) - Number(b.reading_kwh) ||
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const diffs: Record<string, number> = {}

  sorted.forEach((current, idx) => {
    if (idx === 0) {
      diffs[current.id] = 0
      return
    }
    const previous = Number(sorted[idx - 1].reading_kwh)
    diffs[current.id] = Number(current.reading_kwh) - previous
  })

  return diffs
}

export function stationConsumption(
  diffById: Record<string, number>,
  selection: MeterReading[],
  station: Station
): number {
  return selection
    .filter(r => r.station === station)
    .reduce((sum, row) => sum + (diffById[row.id] ?? 0), 0)
}

export function consumptionTotals(
  diffById: Record<string, number>,
  selection: MeterReading[]
) {
  return {
    totalDan: stationConsumption(diffById, selection, 'dan'),
    totalRothschild: stationConsumption(diffById, selection, 'rothschild'),
  }
}
